/**
 * PriceComparison.tsx
 * Compare the same vehicle model from multiple international markets.
 * Converts all prices to ZMW, adds per-country import costs (freight,
 * inspection, duty via silent AI spec resolution) and produces a
 * Value-for-Money score for each listing.
 *
 * AI features (all background, user-invisible):
 *  1. Silent spec resolution on description blur → calculates ZRA duty headlessly.
 *  2. AI comparison insight (verdict + tips + flags) triggered once ≥2 listings
 *     have full cost data. Debounced 2 s after the last change.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Settings2, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Info,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Download,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Bookmark,
  Award,
  Save,
  FolderOpen,
  Globe,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import {
  calculateDuty,
  zmwFormat,
  CalculatorState,
  VehicleAge,
  VehicleCategory,
  MotorCarType,
  FuelType,
  WatchlistItem
} from '../types';
import { getApiUrl } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

// ─── Types ─────────────────────────────────────────────────────────────────

type TrimTier = 1 | 2 | 3 | 4; // 1=Base, 2=Mid, 3=High, 4=Luxury
type OriginCountry = 'japan' | 'singapore' | 'uae' | 'southafrica' | 'uk' | 'thailand' | 'korea' | 'other';
type ListingCurrency = 'USD' | 'ZAR' | 'ZMW';

interface SilentSpecs {
  engineCC: number;
  bodyType: 'sedan' | 'hatchback' | 'station' | 'suv' | 'truck' | 'motorcycle' | 'bus';
  fuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric';
  ageBracket: '0-2' | '2-5' | '5+';
  confidence: 'high' | 'medium' | 'low';
}

interface Listing {
  id: string;
  description: string;
  origin: OriginCountry;
  currency: ListingCurrency;
  listingPrice: number | '';
  mileageKm: number | '';
  year: number | '';
  trimTier: TrimTier;
  freightUSD: number | '';
  inspectionUSD: number | '';
  resolvedSpecs: SilentSpecs | null;
  specStatus: 'idle' | 'loading' | 'resolved' | 'error';
  dutyZMW: number | null;
}

interface ComparisonSettings {
  usdToZmw: number;
  zarToZmw: number;
  lastUpdated?: number;
}

/** AI insight returned by /api/compare-insight */
interface AIInsight {
  verdict: string;
  tips: string[];
  flags: string[];
}

const SAVED_COMPARISONS_KEY = 'zra_saved_comparisons_v1';

interface SavedComparison {
  id: string;
  name: string;
  savedAt: string;
  listings: Listing[];
}

// ─── Country defaults ───────────────────────────────────────────────────────

const COUNTRY_META: Record<
  OriginCountry,
  { label: string; flag: string; inspectionUSD: number; freightUSD: number; inspectionNote: string; defaultCurrency: ListingCurrency }
> = {
  japan: {
    label: 'Japan',
    flag: '🇯🇵',
    inspectionUSD: 140,
    freightUSD: 1200,
    inspectionNote: 'JEVIC / ATJ pre-shipment inspection',
    defaultCurrency: 'USD',
  },
  singapore: {
    label: 'Singapore',
    flag: '🇸🇬',
    inspectionUSD: 140,
    freightUSD: 1100,
    inspectionNote: 'ATJ pre-shipment inspection',
    defaultCurrency: 'USD',
  },
  uae: {
    label: 'UAE',
    flag: '🇦🇪',
    inspectionUSD: 140,
    freightUSD: 1000,
    inspectionNote: 'ATJ pre-shipment inspection',
    defaultCurrency: 'USD',
  },
  southafrica: {
    label: 'South Africa',
    flag: '🇿🇦',
    inspectionUSD: 0,
    freightUSD: 350,
    inspectionNote: 'No pre-shipment inspection (road freight)',
    defaultCurrency: 'ZAR',
  },
  uk: {
    label: 'United Kingdom',
    flag: '🇬🇧',
    inspectionUSD: 200,
    freightUSD: 1800,
    inspectionNote: 'EAA pre-shipment inspection',
    defaultCurrency: 'USD',
  },
  thailand: {
    label: 'Thailand',
    flag: '🇹🇭',
    inspectionUSD: 140,
    freightUSD: 1500,
    inspectionNote: 'ATJ pre-shipment inspection',
    defaultCurrency: 'USD',
  },
  korea: {
    label: 'South Korea',
    flag: '🇰🇷',
    inspectionUSD: 140,
    freightUSD: 1400,
    inspectionNote: 'ATJ pre-shipment inspection',
    defaultCurrency: 'USD',
  },
  other: {
    label: 'Other',
    flag: '🌍',
    inspectionUSD: 0,
    freightUSD: 0,
    inspectionNote: 'Enter manually',
    defaultCurrency: 'USD',
  },
};

const TRIM_LABELS: Record<TrimTier, string> = {
  1: 'Base',
  2: 'Mid',
  3: 'High',
  4: 'Luxury',
};

const CURRENCY_SYMBOLS: Record<ListingCurrency, string> = {
  USD: '$',
  ZAR: 'R',
  ZMW: 'K',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function newListing(origin: OriginCountry = 'japan'): Listing {
  if (!COUNTRY_META[origin]) origin = 'other';
  const meta = COUNTRY_META[origin];
  return {
    id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: '',
    origin,
    currency: meta.defaultCurrency,
    listingPrice: '',
    mileageKm: '',
    year: '',
    trimTier: 2,
    freightUSD: meta.freightUSD,
    inspectionUSD: meta.inspectionUSD,
    resolvedSpecs: null,
    specStatus: 'idle',
    dutyZMW: null,
  };
}

function toZMW(price: number, currency: ListingCurrency, s: ComparisonSettings): number {
  switch (currency) {
    case 'USD': return price * s.usdToZmw;
    case 'ZAR': return price * s.zarToZmw;
    case 'ZMW': return price;
    default:    return price;
  }
}

function landedCostZMW(l: Listing, s: ComparisonSettings): number | null {
  if (l.listingPrice === '' || l.listingPrice === 0) return null;
  const priceZMW   = toZMW(Number(l.listingPrice), l.currency, s);
  const freightZMW = (Number(l.freightUSD) || 0) * s.usdToZmw;
  const inspZMW    = (Number(l.inspectionUSD) || 0) * s.usdToZmw;
  const dutyZMW    = l.dutyZMW ?? 0;
  const rtsaZMW    = 890;
  return priceZMW + freightZMW + inspZMW + dutyZMW + rtsaZMW;
}

function buildCalcState(specs: SilentSpecs, cifUSD: number, fx: number): CalculatorState {
  const ccToEngineBucket = (cc: number): string => {
    if (cc <= 1000) return '1000';
    if (cc <= 1500) return '1500';
    if (cc <= 2500) return '2500';
    if (cc <= 3000) return '3000';
    return '3500';
  };
  const cat: VehicleCategory =
    specs.bodyType === 'truck' ? 'goods-vehicle' :
    specs.bodyType === 'bus' ? 'bus' :
    specs.bodyType === 'motorcycle' ? 'motorcycle' : 'motor-car';
  const type: MotorCarType | 'double-cab' | '' =
    specs.bodyType === 'truck' ? 'double-cab' :
    (specs.bodyType === 'motorcycle' || specs.bodyType === 'bus') ? '' :
    specs.bodyType as MotorCarType;
  return {
    age: specs.ageBracket as VehicleAge,
    cat,
    type,
    fuel: specs.fuelType as FuelType,
    busFuel: '',
    engine: ccToEngineBucket(specs.engineCC),
    cifEngine: String(specs.engineCC),
    weight: '',
    seats: '',
    vdp: '',
    cifUSD,
    fx,
    hpCC: '',
    hpHP: '',
    origin: '',
  };
}

function computeScores(listings: Listing[], s: ComparisonSettings): Record<string, number | null> {
  const costs    = listings.map((l) => landedCostZMW(l, s) ?? Infinity);
  const mileages = listings.map((l) => (l.mileageKm !== '' ? Number(l.mileageKm) : Infinity));
  const trims    = listings.map((l) => l.trimTier);

  const validCosts = costs.filter((c) => c !== Infinity);
  const validMiles = mileages.filter((m) => m !== Infinity);

  const minCost = validCosts.length ? Math.min(...validCosts) : 0;
  const maxCost = validCosts.length ? Math.max(...validCosts) : 0;
  const minMile = validMiles.length ? Math.min(...validMiles) : 0;
  const maxMile = validMiles.length ? Math.max(...validMiles) : 0;

  const result: Record<string, number | null> = {};
  listings.forEach((l, i) => {
    const cost = costs[i];
    const mile = mileages[i];
    if (cost === Infinity) { result[l.id] = null; return; }
    const costScore = maxCost === minCost ? 50 : ((maxCost - cost) / (maxCost - minCost)) * 100;
    const mileScore = mile === Infinity ? 50 : maxMile === minMile ? 50 : ((maxMile - mile) / (maxMile - minMile)) * 100;
    const trimScore = ((trims[i] - 1) / 3) * 100;
    result[l.id] = Math.round(costScore * 0.5 + mileScore * 0.3 + trimScore * 0.2);
  });
  return result;
}

// ─── Silent API calls ────────────────────────────────────────────────────────

async function silentResolveSpecs(description: string): Promise<SilentSpecs> {
  const res = await fetch(getApiUrl('/api/resolve-spec'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: description }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return { engineCC: data.engineCC, bodyType: data.bodyType, fuelType: data.fuelType, ageBracket: data.ageBracket, confidence: data.confidence };
}

async function fetchCompareInsight(
  listings: Listing[],
  s: ComparisonSettings,
): Promise<AIInsight | null> {
  const payload = listings
    .filter((l) => landedCostZMW(l, s) !== null)
    .map((l) => ({
      description: l.description || `Listing from ${COUNTRY_META[l.origin].label}`,
      origin: COUNTRY_META[l.origin].label,
      listingPriceZMW: l.listingPrice !== '' ? toZMW(Number(l.listingPrice), l.currency, s) : null,
      freightZMW: (Number(l.freightUSD) || 0) * s.usdToZmw,
      inspectionZMW: (Number(l.inspectionUSD) || 0) * s.usdToZmw,
      dutyZMW: l.dutyZMW,
      totalLandedZMW: landedCostZMW(l, s),
      mileageKm: l.mileageKm !== '' ? Number(l.mileageKm) : null,
      trimTier: l.trimTier,
      trimLabel: TRIM_LABELS[l.trimTier],
    }));

  if (payload.length < 1) return null;

  try {
    const res = await fetch(getApiUrl('/api/compare-insight'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listings: payload }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.verdict) return null;
    return data as AIInsight;
  } catch {
    return null;
  }
}

// ─── Score Badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score, rank }: { score: number | null; rank?: number }) {
  if (score === null) return (
    <span className="text-[10px] font-bold text-[color:var(--text-muted)] bg-[color:var(--surface-soft)] border border-[color:var(--border)] px-2 py-1 rounded-lg">
      Add more to score
    </span>
  );
  const color =
    score >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    score >= 50 ? 'bg-[color:var(--primary-soft)] text-[color:var(--primary-hover)] border-[color:var(--primary-border)]' :
    score >= 30 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200';
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-extrabold text-xs ${color}`}>
      {rank === 1 && <Award className="w-3.5 h-3.5" />}
      <span>{score}</span>
      <span className="opacity-60 font-medium">/100</span>
    </div>
  );
}

// ─── AI Insight Panel ─────────────────────────────────────────────────────────

function AIInsightPanel({ insight, loading }: { insight: AIInsight | null; loading: boolean }) {
  if (!loading && !insight) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-gradient-to-br from-[color:var(--primary-soft)] to-white border border-[color:var(--primary-border)] rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[color:var(--primary-border)] flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[color:var(--primary)]" />
        <p className="text-sm font-extrabold text-[color:var(--primary-hover)]">Analysis</p>
        {loading && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-[color:var(--text-muted)]">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Analysing…
          </span>
        )}
      </div>

      {loading && !insight ? (
        <div className="px-5 py-6 space-y-2">
          {[80, 60, 90].map((w, i) => (
            <div key={i} className={`h-3 bg-[color:var(--primary-soft)] rounded-full animate-pulse`} style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : insight ? (
        <div className="p-5 space-y-4">

          {/* Verdict */}
          <p className="text-sm text-[color:var(--text)] leading-relaxed font-medium">{insight.verdict}</p>

          {/* Tips */}
          {insight.tips.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold text-[color:var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3" /> Import Tips
              </p>
              <ul className="space-y-1.5">
                {insight.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[color:var(--text)] font-medium leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-[color:var(--primary)] text-white text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Flags */}
          {insight.flags.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3" /> Watch Out
              </p>
              <ul className="space-y-1.5">
                {insight.flags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-800 font-medium leading-relaxed bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </motion.div>
  );
}

// ─── Default settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: ComparisonSettings = {
  usdToZmw: 28.5,
  zarToZmw: 1.55,
};

// ─── Main Component ─────────────────────────────────────────────────────────

interface PriceComparisonProps {
  watchlist?: WatchlistItem[];
  importedListing?: WatchlistItem | null;
  onSaveToWatchlist?: (listing: Listing) => void;
  clearImportedListing?: () => void;
}

export default function PriceComparison({
  watchlist = [],
  importedListing,
  onSaveToWatchlist,
  clearImportedListing
}: PriceComparisonProps = {}) {
  const [listings, setListings] = useState<Listing[]>([newListing('japan'), newListing('southafrica')]);
  const [settings, setSettings] = useState<ComparisonSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'cost' | 'mileage'>('score');
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showSavedMenu, setShowSavedMenu] = useState(false);
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_COMPARISONS_KEY);
      if (stored) {
        setSavedComparisons(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse saved comparisons', e);
    }
  }, []);

  const handleSaveComparison = () => {
    const name = window.prompt('Enter a name for this comparison:');
    if (!name) return;
    
    const newSaved: SavedComparison = {
      id: Date.now().toString(),
      name,
      savedAt: new Date().toISOString(),
      listings,
    };
    
    const updated = [newSaved, ...savedComparisons];
    setSavedComparisons(updated);
    localStorage.setItem(SAVED_COMPARISONS_KEY, JSON.stringify(updated));
    toast.success('Comparison saved successfully!');
  };

  const loadComparison = (comp: SavedComparison) => {
    setListings(comp.listings);
    setShowSavedMenu(false);
    toast.success(`Loaded "${comp.name}"`);
  };

  const deleteSavedComparison = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this saved comparison?')) {
      const updated = savedComparisons.filter(c => c.id !== id);
      setSavedComparisons(updated);
      localStorage.setItem(SAVED_COMPARISONS_KEY, JSON.stringify(updated));
      toast.success('Comparison deleted');
    }
  };

  useEffect(() => {
    if (importedListing) {
      const newL = newListing(
        (importedListing.location?.toLowerCase().replace(/\s+/g, '') as OriginCountry) || 'japan'
      );
      newL.description = importedListing.title || importedListing.desc || '';
      newL.listingPrice = Number(importedListing.price?.toString().replace(/[^0-9.]/g, '') || importedListing.fob || '');
      newL.currency = importedListing.currency || 'USD';
      newL.year = importedListing.year || '';
      newL.mileageKm = Number(importedListing.mileage?.toString().replace(/[^0-9]/g, '') || '');
      
      setListings(prev => {
        const emptyIndex = prev.findIndex(l => !l.description.trim() && l.listingPrice === '' && l.mileageKm === '');
        if (emptyIndex !== -1) {
          const next = [...prev];
          next[emptyIndex] = newL;
          return next;
        }
        if (prev.length >= 6) {
          toast.error('Maximum of 6 comparisons allowed.');
          return prev;
        }
        return [...prev, newL];
      });
      
      if (clearImportedListing) {
        clearImportedListing();
      }
    }
  }, [importedListing, clearImportedListing]);

  const handleImportWatchlistItem = (item: WatchlistItem) => {
    const newL = newListing(
      (item.location?.toLowerCase().replace(/\s+/g, '') as OriginCountry) || 'japan'
    );
    newL.description = item.title || item.desc || '';
    newL.listingPrice = Number(item.price?.toString().replace(/[^0-9.]/g, '') || item.fob || '');
    newL.currency = item.currency || 'USD';
    newL.year = item.year || '';
    newL.mileageKm = Number(item.mileage?.toString().replace(/[^0-9]/g, '') || '');
    setListings(prev => {
      const emptyIndex = prev.findIndex(l => !l.description.trim() && l.listingPrice === '' && l.mileageKm === '');
      if (emptyIndex !== -1) {
        const next = [...prev];
        next[emptyIndex] = newL;
        return next;
      }
      if (prev.length >= 6) {
        toast.error('Maximum of 6 comparisons allowed.');
        return prev;
      }
      return [...prev, newL];
    });
    setShowImportMenu(false);
  };

  // AI insight state
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAiPayload = useRef<string>('');

  // Debounce timers for description → silent resolve
  const specDebounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ─── Fetch Live Exchange Rates ────────────────────────────────────────────────
  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch(getApiUrl('/api/exchange-rates'));
        if (!res.ok) return;
        const data = await res.json();
        if (data.rates && data.rates.usdToZmw && data.rates.zarToZmw) {
          setSettings({
            usdToZmw: data.rates.usdToZmw,
            zarToZmw: data.rates.zarToZmw,
            lastUpdated: data.timestamp
          });
        }
      } catch (err) {
        console.error('Failed to fetch live rates:', err);
      }
    }
    fetchRates();
  }, []);

  // ─── AI insight trigger (debounced, runs whenever listings or settings change) ─

  // We only re-call AI if the meaningful data changed (cost figures) to avoid
  // hammering the API on every keystroke.
  useEffect(() => {
    const scored = listings.filter((l) => landedCostZMW(l, settings) !== null);
    if (scored.length < 1) { setAiInsight(null); return; }

    // Build a fingerprint of what the AI would see — only re-call if changed
    const fingerprint = JSON.stringify(
      scored.map((l) => ({
        d: l.description,
        o: l.origin,
        p: l.listingPrice,
        c: l.currency,
        m: l.mileageKm,
        t: l.trimTier,
        f: l.freightUSD,
        i: l.inspectionUSD,
        duty: l.dutyZMW,
      })),
    );
    if (fingerprint === lastAiPayload.current) return;

    if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
    aiDebounceRef.current = setTimeout(async () => {
      lastAiPayload.current = fingerprint;
      setAiLoading(true);
      const result = await fetchCompareInsight(listings, settings);
      setAiLoading(false);
      if (result) setAiInsight(result);
    }, 2200); // 2.2 s debounce — fires only after user stops editing

    return () => { if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current); };
  }, [listings, settings]);

  const updateListing = useCallback((id: string, patch: Partial<Listing>) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const addListing = () => {
    if (listings.length >= 6) return;
    setListings((prev) => [...prev, newListing()]);
  };

  const removeListing = (id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  const handleOriginChange = (id: string, origin: OriginCountry) => {
    const meta = COUNTRY_META[origin];
    updateListing(id, {
      origin,
      currency: meta.defaultCurrency,
      freightUSD: meta.freightUSD,
      inspectionUSD: meta.inspectionUSD,
    });
  };

  // Recompute duty from already-resolved specs (when price/freight/insp changes)
  const recomputeDuty = useCallback(
    (id: string, patchedListings?: Listing[]) => {
      const source = patchedListings ?? listings;
      const l = source.find((ll) => ll.id === id);
      if (!l || !l.resolvedSpecs || l.listingPrice === '') return;
      const priceUSD   = toZMW(Number(l.listingPrice), l.currency, settings) / settings.usdToZmw;
      const freightUSD = Number(l.freightUSD) || 0;
      const inspUSD    = Number(l.inspectionUSD) || 0;
      const cifUSD     = priceUSD + freightUSD + inspUSD;
      const calcState  = buildCalcState(l.resolvedSpecs, cifUSD, settings.usdToZmw);
      const result     = calculateDuty(calcState);
      updateListing(id, { dutyZMW: result?.total ?? null });
    },
    [listings, settings, updateListing],
  );

  // When description blurs, silently resolve specs
  const handleDescriptionBlur = useCallback(
    (id: string, desc: string) => {
      if (!desc.trim() || desc.trim().length < 5) return;
      clearTimeout(specDebounceTimers.current[id]);
      specDebounceTimers.current[id] = setTimeout(async () => {
        updateListing(id, { specStatus: 'loading', resolvedSpecs: null, dutyZMW: null });
        try {
          const specs = await silentResolveSpecs(desc.trim());
          // Compute duty headlessly
          const l = listings.find((ll) => ll.id === id);
          let dutyZMW: number | null = null;
          if (l && l.listingPrice !== '') {
            const priceUSD   = toZMW(Number(l.listingPrice), l.currency, settings) / settings.usdToZmw;
            const freightUSD = Number(l.freightUSD) || 0;
            const inspUSD    = Number(l.inspectionUSD) || 0;
            const cifUSD     = priceUSD + freightUSD + inspUSD;
            const calcState  = buildCalcState(specs, cifUSD, settings.usdToZmw);
            const result     = calculateDuty(calcState);
            dutyZMW = result?.total ?? null;
          }
          updateListing(id, { specStatus: 'resolved', resolvedSpecs: specs, dutyZMW });
        } catch {
          updateListing(id, { specStatus: 'error', resolvedSpecs: null });
        }
      }, 500);
    },
    [listings, settings, updateListing],
  );

  const handleRetryResolve = (id: string) => {
    const l = listings.find((ll) => ll.id === id);
    if (l) handleDescriptionBlur(id, l.description);
  };

  // ─── Ranking & scoring ────────────────────────────────────────────────────

  const scores = computeScores(listings, settings);

  const sortedIds = [...listings]
    .filter((l) => landedCostZMW(l, settings) !== null)
    .sort((a, b) => {
      if (sortBy === 'score')   return (scores[b.id] ?? -1) - (scores[a.id] ?? -1);
      if (sortBy === 'cost')    return (landedCostZMW(a, settings) ?? Infinity) - (landedCostZMW(b, settings) ?? Infinity);
      return (Number(a.mileageKm) || Infinity) - (Number(b.mileageKm) || Infinity);
    })
    .map((l) => l.id);

  const rankedScores: Record<string, number> = {};
  sortedIds.forEach((id, idx) => { rankedScores[id] = idx + 1; });

  const hasAnyResults = listings.some((l) => landedCostZMW(l, settings) !== null);

  // Data mapping for Recharts visualization
  const chartData = React.useMemo(() => {
    return listings.filter(l => landedCostZMW(l, settings) !== null).map((l, idx) => {
      const vehCost = l.listingPrice ? Number(toZMW(Number(l.listingPrice), l.currency, settings)) : 0;
      const freightCost = (Number(l.freightUSD) || 0) * settings.usdToZmw;
      const inspCost = (Number(l.inspectionUSD) || 0) * settings.usdToZmw;
      const dutyCost = l.dutyZMW || 0;
      const inlandCost = 890; // RTSA est.

      return {
        id: l.id,
        name: l.description ? (l.description.length > 15 ? l.description.slice(0, 15) + '...' : l.description) : `Listing ${idx + 1}`,
        'Vehicle Cost': Math.round(vehCost),
        'Logistics & Inspection': Math.round(freightCost + inspCost),
        'ZRA Duties': Math.round(dutyCost),
        'Local Reg (RTSA)': Math.round(inlandCost),
      };
    });
  }, [listings, settings]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-16">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[color:var(--primary)] flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[color:var(--text)]">
              Price Comparison
            </h2>
          </div>
          <p className="text-sm text-[color:var(--text-muted)] ml-0.5 max-w-xl">
            Compare the same model from multiple markets — all costs converted to ZMW, with ZRA duty, freight, and inspection fees factored in.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 relative">
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${settingsOpen ? 'bw-active' : 'btn-ghost'}`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Rates
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowImportMenu((o) => !o)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${showImportMenu ? 'bw-active' : 'btn-secondary'}`}
            >
              <Download className="w-3.5 h-3.5" />
              Import
            </button>
            <AnimatePresence>
              {showImportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-[color:var(--surface)] border border-[color:var(--border-strong)] shadow-xl rounded-xl p-2 z-50 max-h-64 overflow-y-auto"
                >
                  <p className="text-[10px] font-bold text-[color:var(--text-muted)] uppercase px-2 py-1 mb-1">Select from Watchlist</p>
                  {watchlist && watchlist.length > 0 ? (
                    watchlist.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleImportWatchlistItem(item)}
                        className="w-full text-left px-2 py-2 text-xs font-medium text-[color:var(--text)] hover:bg-[color:var(--surface-soft)] rounded-lg flex flex-col gap-0.5"
                      >
                        <span className="font-bold truncate">{item.title || item.desc}</span>
                        <span className="text-[10px] text-[color:var(--text-muted)] truncate">{item.price} • {item.make} {item.model}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-2 py-3 text-xs text-center text-[color:var(--text-muted)]">Watchlist is empty</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowSavedMenu((o) => !o)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${showSavedMenu ? 'bw-active' : 'btn-secondary'}`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Saved
            </button>
            <AnimatePresence>
              {showSavedMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-[color:var(--surface)] border border-[color:var(--border-strong)] shadow-xl rounded-xl p-2 z-50 max-h-64 overflow-y-auto"
                >
                  <p className="text-[10px] font-bold text-[color:var(--text-muted)] uppercase px-2 py-1 mb-1">Load Comparison</p>
                  {savedComparisons && savedComparisons.length > 0 ? (
                    savedComparisons.map(comp => (
                      <div key={comp.id} className="group w-full flex items-center justify-between px-2 py-2 text-xs text-[color:var(--text)] hover:bg-[color:var(--surface-soft)] rounded-lg">
                        <button
                          onClick={() => loadComparison(comp)}
                          className="flex flex-col gap-0.5 flex-grow text-left"
                        >
                          <span className="font-bold truncate">{comp.name}</span>
                          <span className="text-[10px] text-[color:var(--text-muted)] truncate">
                            {new Date(comp.savedAt).toLocaleDateString()} • {comp.listings.length} vehicles
                          </span>
                        </button>
                        <button
                          onClick={(e) => deleteSavedComparison(comp.id, e)}
                          className="p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="px-2 py-3 text-xs text-center text-[color:var(--text-muted)]">No saved comparisons</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={addListing}
            disabled={listings.length >= 6}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Listing
          </button>
        </div>
      </div>

      {/* ── Exchange Rate Settings ── */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-[color:var(--primary)]" />
              <p className="text-sm font-extrabold text-[color:var(--text)]">Exchange Rates</p>
              <div className="ml-auto flex items-center gap-2">
                {settings.lastUpdated && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Live (updated {Math.round((Date.now() - settings.lastUpdated) / 3600000)}h ago)
                  </span>
                )}
                <span className="text-[10px] text-[color:var(--text-muted)] font-medium">All rates: 1 unit → ZMW</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              {(
                [
                  { key: 'usdToZmw' as const, label: 'USD → ZMW', symbol: '$' },
                  { key: 'zarToZmw' as const, label: 'ZAR → ZMW', symbol: 'R' },
                ]
              ).map(({ key, label, symbol }) => (
                <div key={key}>
                  <label className="block text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider mb-1">{label}</label>
                  <div className="flex items-center border border-[color:var(--border-strong)] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[color:var(--primary)]">
                    <span className="px-2 text-xs font-bold text-[color:var(--text-muted)] bg-[color:var(--surface-soft)] border-r border-[color:var(--border-strong)] flex items-center py-2">
                      {symbol}
                    </span>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={settings[key]}
                      onChange={(e) => setSettings((s) => ({ ...s, [key]: parseFloat(e.target.value) || 0 }))}
                      className="flex-1 px-2 py-2 text-xs font-bold text-[color:var(--text)] bg-[color:var(--surface)] outline-none min-w-0"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[color:var(--border)]">
              <p className="text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider mb-2">
                Pre-Shipment Inspection &amp; Freight Defaults (editable per listing)
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(COUNTRY_META) as [OriginCountry, typeof COUNTRY_META[OriginCountry]][]).map(([key, meta]) => (
                  <div key={key} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-lg">
                    <span className="text-sm">{meta.flag}</span>
                    <span className="text-[10px] font-bold text-[color:var(--text)]">{meta.label}</span>
                    <span className="text-[10px] text-[color:var(--text-muted)]">—</span>
                    <span className="text-[10px] font-extrabold text-[color:var(--primary-hover)]">
                      ${meta.inspectionUSD} insp · ${meta.freightUSD} freight
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Listing Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {listings.map((l, idx) => {
            const meta      = COUNTRY_META[l.origin];
            const landed    = landedCostZMW(l, settings);
            const score     = scores[l.id];
            const rank      = rankedScores[l.id];
            const priceZMW  = l.listingPrice !== '' ? toZMW(Number(l.listingPrice), l.currency, settings) : null;
            const isBest    = rank === 1 && hasAnyResults;

            return (
              <motion.div
                key={l.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.22 }}
                className={`bg-[color:var(--surface)] border rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md ${
                  isBest
                    ? 'border-[color:var(--primary-border)] ring-1 ring-[color:var(--primary-border)]'
                    : 'border-[color:var(--border)]'
                }`}
              >
                {/* Card Header */}
                <div className={`px-4 py-3 flex items-center justify-between border-b ${
                  isBest ? 'bg-[color:var(--primary-soft)] border-[color:var(--primary-border)]'
                         : 'bg-[color:var(--surface-soft)] border-[color:var(--border)]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{meta.flag}</span>
                    <span className="text-[11px] font-extrabold text-[color:var(--text)] uppercase tracking-wide">
                      Listing {idx + 1}
                    </span>
                    {isBest && (
                      <span className="text-[9px] font-extrabold text-[color:var(--primary-hover)] bg-[color:var(--surface)] border border-[color:var(--primary-border)] px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                        Best Value
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Silent spec status pill */}
                    {l.specStatus === 'loading' && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-[color:var(--text-muted)] bg-[color:var(--surface-soft)] border border-[color:var(--border)] px-2 py-1 rounded-full">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        Resolving…
                      </span>
                    )}
                    {l.specStatus === 'resolved' && l.resolvedSpecs && (
                      <span
                        title={`${l.resolvedSpecs.bodyType} · ${l.resolvedSpecs.engineCC}cc · ${l.resolvedSpecs.fuelType} · ${l.resolvedSpecs.ageBracket} yrs · Confidence: ${l.resolvedSpecs.confidence}`}
                        className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full cursor-default"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Specs resolved
                      </span>
                    )}
                    {l.specStatus === 'error' && (
                      <button
                        onClick={() => handleRetryResolve(l.id)}
                        title="Could not resolve specs — click to retry"
                        className="flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full cursor-pointer hover:bg-amber-100"
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Retry
                      </button>
                    )}
                    {onSaveToWatchlist && (
                      <button
                        onClick={() => onSaveToWatchlist(l)}
                        className="text-[color:var(--text-muted)] hover:text-[color:var(--primary)] transition-colors p-1 rounded-lg hover:bg-[color:var(--surface-soft)] mr-1"
                        title="Save to Watchlist"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {listings.length > 1 && (
                      <button
                        onClick={() => removeListing(l.id)}
                        className="text-[color:var(--text-muted)] hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50"
                        title="Remove listing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Fields */}
                <div className="p-4 space-y-3">

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider mb-1">
                      Vehicle Description
                    </label>
                    <input
                      type="text"
                      value={l.description}
                      placeholder="e.g. 2014 Toyota RAV4 2.0 GX Petrol"
                      maxLength={120}
                      onChange={(e) => updateListing(l.id, { description: e.target.value, specStatus: 'idle', resolvedSpecs: null, dutyZMW: null })}
                      onBlur={(e) => handleDescriptionBlur(l.id, e.target.value)}
                      className="w-full border border-[color:var(--border-strong)] rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] bg-[color:var(--surface-soft)] placeholder:text-slate-400 text-[color:var(--text)]"
                    />
                    <p className="text-[9.5px] text-[color:var(--text-muted)] mt-0.5 font-medium">
                      Include year, grade &amp; fuel for accurate duty estimation.
                    </p>
                  </div>

                  {/* Origin + Currency */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider mb-1">Origin</label>
                      <select
                        value={l.origin}
                        onChange={(e) => handleOriginChange(l.id, e.target.value as OriginCountry)}
                        className="w-full border border-[color:var(--border-strong)] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[color:var(--primary)] bg-[color:var(--surface-soft)] text-[color:var(--text)] cursor-pointer"
                      >
                        {(Object.entries(COUNTRY_META) as [OriginCountry, typeof COUNTRY_META[OriginCountry]][]).map(([key, m]) => (
                          <option key={key} value={key}>{m.flag} {m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider mb-1">Currency</label>
                      <select
                        value={l.currency}
                        onChange={(e) => {
                          updateListing(l.id, { currency: e.target.value as ListingCurrency });
                          setTimeout(() => recomputeDuty(l.id), 50);
                        }}
                        className="w-full border border-[color:var(--border-strong)] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[color:var(--primary)] bg-[color:var(--surface-soft)] text-[color:var(--text)] cursor-pointer"
                      >
                        {(['USD', 'ZAR', 'ZMW'] as ListingCurrency[]).map((c) => (
                          <option key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Price + Mileage */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="flex items-center justify-between text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider mb-1">
                        <span>Price ({CURRENCY_SYMBOLS[l.currency]})</span>
                        {l.currency !== 'ZMW' && l.listingPrice && (
                          <span className="text-[9px] text-[color:var(--primary)] lowercase ml-1">
                            ≈ {zmwFormat(toZMW(Number(l.listingPrice), l.currency, settings))}
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={l.listingPrice}
                        placeholder="0"
                        onChange={(e) => {
                          updateListing(l.id, { listingPrice: e.target.value === '' ? '' : parseFloat(e.target.value) });
                          setTimeout(() => recomputeDuty(l.id), 50);
                        }}
                        className="w-full border border-[color:var(--border-strong)] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[color:var(--primary)] bg-[color:var(--surface-soft)] text-[color:var(--text)] placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider mb-1">Mileage (km)</label>
                      <input
                        type="number"
                        min="0"
                        value={l.mileageKm}
                        placeholder="0"
                        onChange={(e) => updateListing(l.id, { mileageKm: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                        className="w-full border border-[color:var(--border-strong)] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[color:var(--primary)] bg-[color:var(--surface-soft)] text-[color:var(--text)] placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Year + Trim */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider mb-1">Year</label>
                      <input
                        type="number"
                        min="1990"
                        max={new Date().getFullYear()}
                        value={l.year}
                        placeholder="e.g. 2014"
                        onChange={(e) => updateListing(l.id, { year: e.target.value === '' ? '' : parseInt(e.target.value) })}
                        className="w-full border border-[color:var(--border-strong)] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[color:var(--primary)] bg-[color:var(--surface-soft)] text-[color:var(--text)] placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider mb-1">Trim / Grade</label>
                      <select
                        value={l.trimTier}
                        onChange={(e) => updateListing(l.id, { trimTier: parseInt(e.target.value) as TrimTier })}
                        className="w-full border border-[color:var(--border-strong)] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[color:var(--primary)] bg-[color:var(--surface-soft)] text-[color:var(--text)] cursor-pointer"
                      >
                        <option value={1}>Base (GX, E, S)</option>
                        <option value={2}>Mid (GL, X, SX)</option>
                        <option value={3}>High (VX, Limited, Icon)</option>
                        <option value={4}>Luxury (VX-R, Style, Premier)</option>
                      </select>
                    </div>
                  </div>

                  {/* Freight + Inspection overrides */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider mb-1">Freight (USD)</label>
                      <input
                        type="number"
                        min="0"
                        value={l.freightUSD}
                        placeholder="0"
                        onChange={(e) => {
                          updateListing(l.id, { freightUSD: e.target.value === '' ? '' : parseFloat(e.target.value) });
                          setTimeout(() => recomputeDuty(l.id), 50);
                        }}
                        className="w-full border border-[color:var(--border-strong)] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[color:var(--primary)] bg-[color:var(--surface-soft)] text-[color:var(--text)] placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider mb-1">Inspection (USD)</label>
                      <input
                        type="number"
                        min="0"
                        value={l.inspectionUSD}
                        placeholder="0"
                        onChange={(e) => updateListing(l.id, { inspectionUSD: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                        className="w-full border border-[color:var(--border-strong)] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[color:var(--primary)] bg-[color:var(--surface-soft)] text-[color:var(--text)] placeholder:text-slate-400"
                      />
                      <p className="text-[9px] text-[color:var(--text-muted)] mt-0.5">{meta.inspectionNote}</p>
                    </div>
                  </div>

                  {/* ── Cost Breakdown ── */}
                  {priceZMW !== null && (
                    <div className="bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl p-3 space-y-1.5 mt-1">
                      <p className="text-[10px] font-extrabold text-[color:var(--text-muted)] uppercase tracking-wider mb-2">
                        Cost Breakdown (ZMW)
                      </p>
                      {[
                        { label: `Listing price (${l.currency})`, value: priceZMW, dim: false },
                        { label: `Freight ($${Number(l.freightUSD) || 0})`, value: (Number(l.freightUSD) || 0) * settings.usdToZmw, dim: false },
                        { label: `Inspection ($${Number(l.inspectionUSD) || 0})`, value: (Number(l.inspectionUSD) || 0) * settings.usdToZmw, dim: false },
                        {
                          label:
                            l.specStatus === 'loading' ? 'ZRA Duty (resolving…)' :
                            l.specStatus === 'error'   ? 'ZRA Duty (unresolved)' :
                            l.resolvedSpecs            ? `ZRA Duty (${l.resolvedSpecs.bodyType} · ${l.resolvedSpecs.engineCC}cc)` :
                                                         'ZRA Duty (enter description)',
                          value: l.dutyZMW,
                          dim: !l.dutyZMW,
                        },
                        { label: 'RTSA Naturalization', value: 890, dim: false },
                      ].map(({ label, value, dim }) => (
                        <div key={label} className="flex justify-between gap-2 text-xs">
                          <span className={`font-medium leading-tight ${dim ? 'text-[color:var(--text-muted)] italic' : 'text-[color:var(--text)]'}`}>{label}</span>
                          <span className={`font-bold flex-shrink-0 ${dim ? 'text-[color:var(--text-muted)]' : 'text-[color:var(--text)]'}`}>
                            {value !== null && value !== undefined ? zmwFormat(value) : '—'}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between gap-2 pt-2 mt-1 border-t border-[color:var(--border-strong)]">
                        <span className="text-sm font-extrabold text-[color:var(--text)]">Total Landed</span>
                        <span className="text-sm font-extrabold text-[color:var(--primary-hover)]">
                          {landed !== null ? zmwFormat(landed) : '—'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Value Score */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[color:var(--text-muted)]" />
                      <span className="text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wide">Value Score</span>
                      <div className="relative group">
                        <Info className="w-3 h-3 text-[color:var(--text-muted)] cursor-default" />
                        <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-20 bg-slate-800 text-white text-[10px] font-medium px-3 py-2 rounded-xl whitespace-nowrap shadow-lg max-w-[240px] leading-relaxed">
                          Cost (50%) + Mileage (30%) + Trim (20%).<br />
                          Relative score across all listings.
                        </div>
                      </div>
                    </div>
                    <ScoreBadge score={score} rank={rank} />
                  </div>

                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Placeholder add-card */}
        {listings.length < 6 && (
          <motion.button
            layout
            onClick={addListing}
            className="min-h-[200px] border-2 border-dashed border-[color:var(--border-strong)] rounded-2xl flex flex-col items-center justify-center gap-3 text-[color:var(--text-muted)] hover:border-[color:var(--primary)] hover:text-[color:var(--primary-hover)] hover:bg-[color:var(--primary-soft)] transition-all cursor-pointer"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-bold">Add Listing</span>
            <span className="text-[10px] font-medium opacity-60">{listings.length}/6 used</span>
          </motion.button>
        )}
      </div>

      {/* ── AI Insight Panel ── */}
      <AnimatePresence>
        {(aiLoading || aiInsight) && (
          <AIInsightPanel insight={aiInsight} loading={aiLoading} />
        )}
      </AnimatePresence>

      {/* ── Ranking Bar ── */}
      <AnimatePresence>
        {hasAnyResults && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="px-5 py-3.5 border-b border-[color:var(--border)] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[color:var(--primary)]" />
                <p className="text-sm font-extrabold text-[color:var(--text)]">Ranking</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider">Sort by:</span>
                {(['score', 'cost', 'mileage'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSortBy(opt)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors ${
                      sortBy === opt ? 'bw-active' : 'text-[color:var(--text-muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--surface-soft)]'
                    }`}
                  >
                    {opt === 'score' ? 'Value' : opt === 'cost' ? 'Price' : 'Mileage'}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[color:var(--border)]">
              {sortedIds.map((id, idx) => {
                const l      = listings.find((ll) => ll.id === id)!;
                const meta   = COUNTRY_META[l.origin];
                const landed = landedCostZMW(l, settings)!;
                const score  = scores[id];
                const maxL   = Math.max(...sortedIds.map((sid) => landedCostZMW(listings.find((ll) => ll.id === sid)!, settings) ?? 0));

                return (
                  <div key={id} className={`px-5 py-3.5 flex items-center gap-4 ${idx === 0 ? 'bg-[color:var(--primary-soft)]' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black ${
                      idx === 0 ? 'bg-[color:var(--primary)] text-white' : 'bg-[color:var(--surface-soft)] text-[color:var(--text-muted)] border border-[color:var(--border-strong)]'
                    }`}>{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{meta.flag}</span>
                        <p className="text-xs font-extrabold text-[color:var(--text)] truncate">
                          {l.description || `Listing ${listings.findIndex((ll) => ll.id === id) + 1}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {l.mileageKm !== '' && <span className="text-[10px] text-[color:var(--text-muted)] font-medium">{Number(l.mileageKm).toLocaleString()} km</span>}
                        {l.trimTier && <span className="text-[10px] text-[color:var(--text-muted)] font-medium">{TRIM_LABELS[l.trimTier]} trim</span>}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 hidden sm:block">
                      <div className="h-2 bg-[color:var(--surface-soft)] rounded-full overflow-hidden border border-[color:var(--border)]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(4, (landed / maxL) * 100)}%`,
                            backgroundColor: idx === 0 ? 'var(--primary)' : idx === 1 ? 'var(--accent)' : 'var(--border-strong)',
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-extrabold text-[color:var(--text)]">{zmwFormat(landed)}</p>
                      <p className="text-[10px] text-[color:var(--text-muted)] font-medium">Total landed</p>
                    </div>
                    <ScoreBadge score={score} rank={idx + 1} />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Interactive Cost Visualization ── */}
      <AnimatePresence>
        {hasAnyResults && chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl overflow-hidden shadow-sm p-5 mb-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-[color:var(--primary)]" />
              <h3 className="text-[15px] font-extrabold text-[color:var(--text)]">Cost Breakdown Visualization</h3>
            </div>
            
            <div className="w-full h-[320px] text-xs font-semibold">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => `ZMW ${(value / 1000).toFixed(0)}k`}
                    stroke="var(--text-muted)" 
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120} 
                    stroke="var(--text-muted)" 
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => [`ZMW ${value.toLocaleString()}`, undefined]}
                    contentStyle={{ 
                      backgroundColor: 'var(--surface)', 
                      borderColor: 'var(--border)', 
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-sm)',
                      color: 'var(--text)'
                    }}
                    itemStyle={{ fontWeight: 800 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '16px' }} />
                  <Bar dataKey="Vehicle Cost" stackId="a" fill="var(--text)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Logistics & Inspection" stackId="a" fill="var(--text-muted)" />
                  <Bar dataKey="ZRA Duties" stackId="a" fill="var(--primary)" />
                  <Bar dataKey="Local Reg (RTSA)" stackId="a" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Side-by-side Breakdown Table ── */}
      <AnimatePresence>
        {hasAnyResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl overflow-hidden shadow-sm"
          >
            <button
              onClick={() => setTableOpen((o) => !o)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[color:var(--surface-soft)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-[color:var(--primary)]" />
                <p className="text-sm font-extrabold text-[color:var(--text)]">Detailed Side-by-Side Breakdown</p>
              </div>
              {tableOpen ? <ChevronUp className="w-4 h-4 text-[color:var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[color:var(--text-muted)]" />}
            </button>

            <AnimatePresence>
              {tableOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-x-auto border-t border-[color:var(--border)]"
                >
                  <table className="w-full text-xs min-w-[560px]">
                    <thead>
                      <tr className="bg-[color:var(--surface-soft)]">
                        <th className="text-left px-4 py-3 font-bold text-[color:var(--text-muted)] uppercase tracking-wider text-[10px] w-36">Cost Item</th>
                        {listings.map((l, idx) => (
                          <th key={l.id} className="text-right px-4 py-3 font-extrabold text-[color:var(--text)] text-[11px]">
                            <span className="text-sm">{COUNTRY_META[l.origin].flag}</span>{' '}
                            {l.description ? l.description.slice(0, 22) + (l.description.length > 22 ? '…' : '') : `Listing ${idx + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--border)]">
                      {[
                        {
                          label: 'Listing Price',
                          getValue: (l: Listing) => l.listingPrice !== '' ? toZMW(Number(l.listingPrice), l.currency, settings) : null,
                          sub: (l: Listing) => `(${CURRENCY_SYMBOLS[l.currency]}${Number(l.listingPrice || 0).toLocaleString()})`,
                        },
                        {
                          label: 'Freight',
                          getValue: (l: Listing) => (Number(l.freightUSD) || 0) * settings.usdToZmw,
                          sub: (l: Listing) => `($${l.freightUSD || 0})`,
                        },
                        {
                          label: 'Inspection',
                          getValue: (l: Listing) => (Number(l.inspectionUSD) || 0) * settings.usdToZmw,
                          sub: (l: Listing) => `($${l.inspectionUSD || 0})`,
                        },
                        {
                          label: 'ZRA Duty',
                          getValue: (l: Listing) => l.dutyZMW,
                          sub: (l: Listing) =>
                            l.specStatus === 'loading' ? '(resolving…)' :
                            l.specStatus === 'error'   ? '(failed)' :
                            l.resolvedSpecs            ? `(${l.resolvedSpecs.bodyType})` : '(—)',
                        },
                        {
                          label: 'RTSA Naturalization',
                          getValue: () => 890,
                          sub: () => '(est.)',
                        },
                      ].map(({ label, getValue, sub }) => (
                        <tr key={label} className="hover:bg-[color:var(--surface-soft)] transition-colors">
                          <td className="px-4 py-3 font-bold text-[color:var(--text)]">{label}</td>
                          {listings.map((l) => {
                            const val = getValue(l);
                            return (
                              <td key={l.id} className="px-4 py-3 text-right">
                                <span className="font-bold text-[color:var(--text)]">{val !== null && val !== undefined ? zmwFormat(val) : '—'}</span>
                                <span className="block text-[9px] text-[color:var(--text-muted)] font-medium">{sub(l)}</span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr className="bg-[color:var(--primary-soft)] font-extrabold">
                        <td className="px-4 py-3.5 text-[color:var(--primary-hover)] text-[13px]">Total Landed</td>
                        {listings.map((l) => {
                          const landed = landedCostZMW(l, settings);
                          return (
                            <td key={l.id} className="px-4 py-3.5 text-right text-[color:var(--primary-hover)] text-[13px]">
                              {landed !== null ? zmwFormat(landed) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="hover:bg-[color:var(--surface-soft)] transition-colors">
                        <td className="px-4 py-3 font-bold text-[color:var(--text)]">Mileage</td>
                        {listings.map((l) => (
                          <td key={l.id} className="px-4 py-3 text-right">
                            <span className="font-bold text-[color:var(--text)]">
                              {l.mileageKm !== '' ? `${Number(l.mileageKm).toLocaleString()} km` : '—'}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr className="hover:bg-[color:var(--surface-soft)] transition-colors">
                        <td className="px-4 py-3 font-bold text-[color:var(--text)]">Value Score</td>
                        {listings.map((l) => (
                          <td key={l.id} className="px-4 py-3 text-right">
                            <span className={`font-extrabold ${
                              scores[l.id] !== null && scores[l.id]! >= 70 ? 'text-emerald-600' :
                              scores[l.id] !== null && scores[l.id]! >= 45 ? 'text-[color:var(--primary-hover)]' :
                              'text-[color:var(--text-muted)]'
                            }`}>
                              {scores[l.id] !== null ? `${scores[l.id]}/100` : '—'}
                            </span>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Disclaimer ── */}
      <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800 font-medium pb-24">
        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
        <p>
          <strong>Estimates only.</strong> Freight, inspection, and duty figures are indicative. ZRA duty is auto-estimated from resolved vehicle specs — verify with the <strong>Calculate Duty</strong> tab. RTSA naturalization (ZMW 890) and exchange rates require manual updates.
        </p>
      </div>

      {/* ── Sticky Action Bar ── */}
      <AnimatePresence>
        {listings.length >= 2 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-[color:var(--surface)]/80 backdrop-blur-md border border-[color:var(--border-strong)] rounded-2xl shadow-xl p-3 flex items-center justify-center gap-3 pointer-events-auto">
              <button
                onClick={addListing}
                className="flex items-center gap-2 px-6 py-3 bg-[color:var(--primary)] text-white text-sm font-extrabold rounded-xl hover:bg-[color:var(--primary-hover)] transition-colors active:scale-95 shadow-md shadow-[color:var(--primary)]/30"
              >
                <Plus className="w-4 h-4" />
                Add Another Vehicle
              </button>
              <button
                onClick={handleSaveComparison}
                className="flex items-center gap-2 px-4 py-3 bg-[color:var(--surface-soft)] text-[color:var(--text)] text-sm font-bold rounded-xl hover:bg-[color:var(--surface)] border border-[color:var(--border)] transition-colors active:scale-95"
              >
                <Save className="w-4 h-4" />
                Save Comparison
              </button>
              <button
                onClick={() => {
                  if (confirm('Clear all vehicles and start over?')) {
                    setListings([newListing('japan'), newListing('southafrica')]);
                    toast.success('Cleared all comparisons');
                  }
                }}
                className="flex items-center gap-2 px-4 py-3 bg-[color:var(--surface-soft)] text-[color:var(--text)] text-sm font-bold rounded-xl hover:bg-rose-50 hover:text-rose-600 border border-[color:var(--border)] transition-colors active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
