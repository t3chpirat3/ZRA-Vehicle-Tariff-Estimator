import React, { useState, useEffect, useCallback } from 'react';
import { Ship, RefreshCw, Anchor, Radio, AlertTriangle, MapPin, Navigation, Wind, ExternalLink } from 'lucide-react';
import { getApiUrl } from '../utils/api';

// ── Types ──────────────────────────────────────────────────────────────────

interface VesselPosition {
  name: string;
  imo: number;
  mmsi: number;
  flag: string;
  status: 'live' | 'silent' | 'error';
  lat: number | null;
  lon: number | null;
  sog: number | null;
  cog: number | null;
  heading: number | null;
  nav_status: number | null;
  destination: string | null;
  eta: string | null;
  last_seen: string | null;
  vessel_name?: string;
}

interface FleetData {
  vessels: VesselPosition[];
  fetched_at: string;
  cache_ttl_s: number;
  summary: { total: number; live: number; silent: number; errors: number };
  attribution: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const NAV_STATUS_LABELS: Record<number, string> = {
  0: 'Underway',
  1: 'At Anchor',
  2: 'Not Under Command',
  3: 'Restricted Maneuverability',
  5: 'Moored',
  6: 'Aground',
  15: 'Unknown',
};

function navStatusLabel(code: number | null): string {
  if (code === null) return '—';
  return NAV_STATUS_LABELS[code] ?? `Status ${code}`;
}

function formatSog(sog: number | null): string {
  if (sog === null) return '—';
  return `${sog.toFixed(1)} kn`;
}

function formatCoord(val: number | null, posChar: string, negChar: string): string {
  if (val === null) return '—';
  const abs = Math.abs(val);
  const deg = Math.floor(abs);
  const min = ((abs - deg) * 60).toFixed(2);
  return `${deg}°${min}'${val >= 0 ? posChar : negChar}`;
}

function formatLastSeen(ts: string | null): string {
  if (!ts) return '—';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatFetchedAt(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return ts;
  }
}

function marineTrafficUrl(mmsi: number): string {
  return `https://www.marinetraffic.com/en/ais/details/ships/mmsi:${mmsi}`;
}

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VesselPosition['status'] }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live
      </span>
    );
  }
  if (status === 'silent') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Anchor className="w-3 h-3" />
        Silent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
      <AlertTriangle className="w-3 h-3" />
      Error
    </span>
  );
}

// ── Flag emoji helper ──────────────────────────────────────────────────────

const FLAG_EMOJIS: Record<string, string> = {
  'Bahamas': '🇧🇸',
  'Singapore': '🇸🇬',
  'Liberia': '🇱🇷',
  'Japan': '🇯🇵',
  'Marshall Islands': '🇲🇭',
  'Norway': '🇳🇴',
  'Italy': '🇮🇹',
  'Panama': '🇵🇦',
  'Cayman Islands': '🇰🇾',
  'South Korea': '🇰🇷',
};

function flagEmoji(flag: string): string {
  return FLAG_EMOJIS[flag] ?? '🚩';
}

// ── Vessel Card ────────────────────────────────────────────────────────────

function VesselCard({ vessel }: { vessel: VesselPosition }) {
  const isLive = vessel.status === 'live';

  return (
    <div className={`bg-[color:var(--surface)] border rounded-2xl p-4 flex flex-col gap-3 transition-all ${
      isLive
        ? 'border-emerald-200 dark:border-emerald-800/60 shadow-sm'
        : 'border-[color:var(--border)] opacity-75'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-[color:var(--text)] truncate">{vessel.name}</span>
            <StatusBadge status={vessel.status} />
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[color:var(--text-muted)]">
            <span>{flagEmoji(vessel.flag)} {vessel.flag}</span>
            <span>·</span>
            <span>IMO {vessel.imo}</span>
            <span>·</span>
            <span>MMSI {vessel.mmsi}</span>
          </div>
        </div>
        <a
          href={marineTrafficUrl(vessel.mmsi)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-1.5 rounded-lg text-[color:var(--text-muted)] hover:text-[color:var(--primary-hover)] hover:bg-[color:var(--primary-soft)] transition-colors"
          title="View on MarineTraffic"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Data grid — only shown when live */}
      {isLive ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[color:var(--text-muted)] font-semibold mb-0.5">Position</p>
            <p className="font-mono text-xs text-[color:var(--text)]">
              {formatCoord(vessel.lat, 'N', 'S')}<br />
              {formatCoord(vessel.lon, 'E', 'W')}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[color:var(--text-muted)] font-semibold mb-0.5">Speed / Course</p>
            <p className="font-semibold text-[color:var(--text)]">
              {formatSog(vessel.sog)}
              {vessel.cog !== null && (
                <span className="text-[color:var(--text-muted)] font-normal"> @ {vessel.cog.toFixed(0)}°</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[color:var(--text-muted)] font-semibold mb-0.5">Nav Status</p>
            <p className="text-[color:var(--text)] text-xs">{navStatusLabel(vessel.nav_status)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[color:var(--text-muted)] font-semibold mb-0.5">Last Signal</p>
            <p className="text-[color:var(--text)] text-xs">{formatLastSeen(vessel.last_seen)}</p>
          </div>
          {vessel.destination && (
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-[color:var(--text-muted)] font-semibold mb-0.5">
                <MapPin className="w-3 h-3 inline mr-0.5" />Destination
              </p>
              <p className="font-semibold text-[color:var(--text)]">
                {vessel.destination}
                {vessel.eta && (
                  <span className="text-[color:var(--text-muted)] font-normal text-xs ml-1.5">ETA {vessel.eta}</span>
                )}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-[color:var(--text-muted)] flex items-center gap-2">
          {vessel.status === 'silent' ? (
            <>
              <Anchor className="w-4 h-4 flex-shrink-0" />
              <span>No AIS signal in the past hour. Vessel may be in port or outside coverage.</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>Could not fetch position. Check back shortly.</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function FleetTracker() {
  const [data, setData] = useState<FleetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'live' | 'silent'>('all');

  const fetchData = useCallback(async (force = false) => {
    try {
      const url = getApiUrl('/api/ais-tracker') + (force ? '?refresh=1' : '');
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json: FleetData = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load fleet data.');
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  // Auto-refresh every 3 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchData(), 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  const filteredVessels = data?.vessels.filter(v => {
    if (filter === 'live') return v.status === 'live';
    if (filter === 'silent') return v.status === 'silent';
    return true;
  }) ?? [];

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-[color:var(--text)] flex items-center gap-2">
            <Ship className="w-6 h-6 text-[color:var(--primary-hover)]" />
            RoRo Fleet Tracker
          </h1>
          <p className="text-sm text-[color:var(--text-muted)] mt-0.5">
            Live AIS positions for {data?.summary.total ?? 17} tracked vehicle carriers
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {data && (
            <span className="text-xs text-[color:var(--text-muted)] hidden sm:block">
              Updated {formatFetchedAt(data.fetched_at)}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-[color:var(--surface)] border border-[color:var(--border)] text-[color:var(--text-muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--surface-soft)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary chips */}
      {data && (
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all',    label: `All (${data.summary.total})`,      color: 'bg-[color:var(--surface-soft)] text-[color:var(--text)]' },
            { key: 'live',   label: `🟢 Live (${data.summary.live})`,   color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
            { key: 'silent', label: `⚫ Silent (${data.summary.silent})`, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
          ].map(chip => (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key as typeof filter)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                filter === chip.key
                  ? chip.color + ' border-transparent ring-2 ring-offset-1 ring-[color:var(--primary)]'
                  : chip.color + ' border-[color:var(--border)] opacity-75 hover:opacity-100'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl p-4 h-40 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-8 text-center bg-[color:var(--surface)] rounded-2xl border border-red-200 dark:border-red-800/60">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="font-semibold text-[color:var(--text)]">Could not load fleet data</p>
          <p className="text-sm text-[color:var(--text-muted)] mt-1">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 rounded-xl bg-[color:var(--primary)] text-white text-sm font-semibold hover:bg-[color:var(--primary-hover)] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Vessel grid */}
      {!loading && !error && data && (
        <>
          {filteredVessels.length === 0 ? (
            <div className="p-8 text-center text-[color:var(--text-muted)]">
              <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No vessels match this filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredVessels.map(v => (
                <VesselCard key={v.mmsi} vessel={v} />
              ))}
            </div>
          )}

          {/* Attribution — required by Pelyr data license */}
          <div className="flex items-center justify-between pt-2 border-t border-[color:var(--border)] text-[11px] text-[color:var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" />
              {data.attribution}
            </span>
            <span>Auto-refreshes every 3 min · {data.cache_ttl_s}s cache</span>
          </div>
        </>
      )}
    </div>
  );
}
