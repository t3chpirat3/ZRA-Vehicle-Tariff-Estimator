import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Bookmark,
  Plus,
  Trash,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Search,
  RefreshCw,
  Eye,
  Info,
  BarChart3
} from 'lucide-react';
import {
  WatchlistItem,
  CalculatorState,
  calculateDuty,
  zmwFormat,
  isCIFMode,
  VehicleAge,
  VehicleCategory,
  MotorCarType,
  GoodsVehicleType,
  FuelType,
  BusFuelType,
  WEIGHT_OPTIONS_MAP,
} from '../types';
import { getApiUrl } from '../utils/api';
import { WatchlistSkeleton } from './Skeleton';
import './Watchlist.css';

interface WatchlistProps {
  watchlist: WatchlistItem[];
  onUpdateWatchlist: (list: WatchlistItem[]) => void;
  lastCalcTotal: number;
  lastCalcUSD: number;
  lastCalcFx: number;
  lastCalcState?: any;
  onActivated: () => void;
  onSendToCompare?: (item: WatchlistItem) => void;
}

export default function Watchlist({
  watchlist,
  onUpdateWatchlist,
  lastCalcTotal,
  lastCalcUSD,
  lastCalcFx,
  lastCalcState,
  onActivated,
  onSendToCompare,
}: WatchlistProps) {
  // Form State
  const [formOpen, setFormOpen] = useState(true);
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [listingCurrency, setListingCurrency] = useState<'USD' | 'ZAR' | 'ZMW'>('USD');
  const [listingPrice, setListingPrice] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Inline calculator state
  const [openInlineCalcs, setOpenInlineCalcs] = useState<Record<string | number, boolean>>({});
  const [inlineStates, setInlineStates] = useState<Record<string | number, CalculatorState>>({});
  const [inlineCifCurrencies, setInlineCifCurrencies] = useState<Record<string | number, 'USD' | 'ZAR' | 'ZMW'>>({});

  // Modal State
  const [modalItem, setModalItem] = useState<WatchlistItem | null>(null);

  // Status Checking State
  const [checkingIds, setCheckingIds] = useState<Record<string | number, boolean>>({});
  const [resolvingIds, setResolvingIds] = useState<Record<string | number, boolean>>({});

  // Rates State
  const [rates, setRates] = useState<{ usdToZmw: number; zarToZmw: number }>({ usdToZmw: 28.5, zarToZmw: 1.55 });
  
  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch(getApiUrl('/api/exchange-rates'));
        if (!res.ok) return;
        const data = await res.json();
        if (data.rates) {
          setRates({ usdToZmw: data.rates.usdToZmw, zarToZmw: data.rates.zarToZmw });
        }
      } catch (err) {
        // silently fail and use defaults
      }
    }
    fetchRates();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() && !notes.trim()) {
      setFormError('Please enter either a Listing URL or a Vehicle Title/Note.');
      return;
    }
    setFormError('');
    setIsLoading(true);

    try {
      let newItem: WatchlistItem;
      
      if (url.trim()) {
        const res = await fetch('/api/watchlist-scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim(), notes, listingPrice })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to fetch listing data.');
        }

        const data = await res.json();

        newItem = {
          id: Date.now().toString(),
          url: url.trim(),
          notes: notes.trim(),
          savedAt: new Date().toISOString(),
          lastChecked: new Date().toISOString(),
          hasChangedStatus: false,
          title: data.title || 'Unknown Vehicle',
          make: data.make || 'Unknown',
          model: data.model || 'Vehicle',
          year: data.year || new Date().getFullYear(),
          price: listingPrice === '' ? (data.price || 'Unknown') : `${listingCurrency} ${listingPrice}`,
          mileage: data.mileage || 'N/A',
          location: data.location || 'N/A',
          description: data.description || 'Specifications extracted from listing.',
          status: data.status === 'unavailable' ? 'unavailable' : 'available',
          image: data.image || '',
          history: [
            {
              timestamp: new Date().toISOString(),
              status: data.status === 'unavailable' ? 'unavailable' : 'available',
              details: `Bookmark established. ${data.reason || ''}`
            }
          ],
          // Default Duty Boss fields
          fob: listingPrice === '' ? 0 : Number(listingPrice),
          duty: lastCalcState ? lastCalcTotal : 0,
          fx: lastCalcState ? lastCalcFx : 0,
          currency: listingCurrency,
          desc: data.title || 'Unknown Vehicle',
          source: data.make || 'Web Listing',
          calcState: lastCalcState || undefined
        };
      } else {
        // No URL provided, create a manual entry
        const titleText = notes.trim().split('\n')[0] || 'Manual Entry';
        newItem = {
          id: Date.now().toString(),
          url: '',
          notes: notes.trim(),
          savedAt: new Date().toISOString(),
          lastChecked: new Date().toISOString(),
          hasChangedStatus: false,
          title: titleText,
          make: 'Unknown',
          model: 'Vehicle',
          year: new Date().getFullYear(),
          price: listingPrice === '' ? 'Unknown' : `${listingCurrency} ${listingPrice}`,
          mileage: 'N/A',
          location: 'N/A',
          description: notes.trim(),
          status: 'available',
          image: '',
          history: [
            {
              timestamp: new Date().toISOString(),
              status: 'available',
              details: `Manual bookmark established.`
            }
          ],
          fob: listingPrice === '' ? 0 : Number(listingPrice),
          duty: lastCalcState ? lastCalcTotal : 0,
          fx: lastCalcState ? lastCalcFx : 0,
          currency: listingCurrency,
          desc: titleText,
          source: 'Manual Entry',
          calcState: lastCalcState || undefined
        };
      }

      onUpdateWatchlist([newItem, ...watchlist]);
      toast.success('Vehicle added to watchlist!');
      
      setUrl('');
      setNotes('');
      setListingPrice('');
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while adding the listing.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = (id: string | number) => {
    if (confirm('Remove this vehicle from your watchlist?')) {
      onUpdateWatchlist(watchlist.filter((item) => item.id !== id));
      toast.success('Vehicle removed from watchlist');
    }
  };

  const handleVerifyStatus = async (item: WatchlistItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setCheckingIds(prev => ({ ...prev, [item.id]: true }));
    
    try {
      let newStatus = item.status;
      let reason = 'Verification check completed.';

      if (item.url) {
        const res = await fetch('/api/watchlist-scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.url, checkOnly: true })
        });

        if (!res.ok) throw new Error('Check failed');
        const data = await res.json();
        
        newStatus = data.status === 'unavailable' ? 'unavailable' : 'available';
        reason = data.reason || 'Verification check completed.';
      } else {
        reason = 'Manual entry (no URL) - unable to verify online.';
      }
      
      onUpdateWatchlist(watchlist.map(w => {
        if (w.id === item.id) {
          const updatedHistory = [...(w.history || [])];
          updatedHistory.unshift({
            timestamp: new Date().toISOString(),
            status: newStatus,
            details: reason
          });
          
          return {
            ...w,
            status: newStatus,
            hasChangedStatus: w.status !== newStatus,
            lastChecked: new Date().toISOString(),
            history: updatedHistory
          };
        }
        return w;
      }));
    } catch (err) {
      console.error('Failed to verify status', err);
    } finally {
      setCheckingIds(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // Inline Calculator functions
  const toggleInlineCalc = (id: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setOpenInlineCalcs((prev) => ({ ...prev, [id]: !prev[id] }));

    if (!inlineStates[id]) {
      const parentItem = watchlist.find((item) => item.id === id);
      setInlineStates((prev) => ({
        ...prev,
        [id]: parentItem?.calcState || {
          age: '', cat: '', type: '', fuel: '', busFuel: '',
          engine: '', cifEngine: '', weight: '', seats: '', vdp: '',
          cifUSD: 0, fx: 0, hpCC: '', hpHP: ''
        },
      }));
    }
  };

  const handleResolveAndCalculate = async (item: WatchlistItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // If state is already resolved or panel is open, just toggle it
    if (inlineStates[item.id] || item.calcState) {
      toggleInlineCalc(item.id);
      return;
    }

    setResolvingIds(prev => ({ ...prev, [item.id]: true }));
    try {
      const q = `${item.make} ${item.model} ${item.year} ${item.description || ''}`.trim();
      const res = await fetch('/api/resolve-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      if (!res.ok) throw new Error('Spec resolution failed');
      const data = await res.json();
      
      const newState: CalculatorState = {
        age: data.ageBracket || '',
        cat: 'motor-car', // Default to motor-car, user can change if wrong
        type: data.bodyType || '',
        fuel: data.fuelType || '',
        busFuel: '',
        engine: data.engineCC || '',
        origin: '',
        cifEngine: '',
        weight: '',
        seats: '',
        vdp: '',
        cifUSD: item.fob || 0,
        fx: item.fx || 0,
        hpCC: '',
        hpHP: ''
      };
      
      setInlineStates(prev => ({ ...prev, [item.id]: newState }));
      setOpenInlineCalcs(prev => ({ ...prev, [item.id]: true }));
    } catch (err) {
      console.error('Failed to resolve specs', err);
      // Fallback to empty inline calc
      toggleInlineCalc(item.id);
    } finally {
      setResolvingIds(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const updateInlineState = (id: string | number, fields: Partial<CalculatorState>) => {
    setInlineStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...fields },
    }));
  };

  const saveInlineDuty = (id: string | number, finalTotal: number, finalFx: number, state: CalculatorState) => {
    onUpdateWatchlist(
      watchlist.map((item) => {
        if (item.id === id) {
          return { ...item, duty: finalTotal, fx: finalFx || item.fx, calcState: state };
        }
        return item;
      })
    );
    setOpenInlineCalcs((prev) => ({ ...prev, [id]: false }));
  };

  return (
    <div className="wl-container">
      <div className="wl-banner">
        <Info className="wl-banner-icon" />
        <p>The Watchlist automatically monitors vehicle listings for price changes and availability.</p>
      </div>

      <div className="wl-header">
        <div className="wl-title-section">
          <h2 className="wl-title">Vehicle Watchlist</h2>
          <span className="wl-badge wl-badge-active">{watchlist.length} Saved</span>
        </div>
        <div className="wl-actions">
          <button 
            className="wl-btn-secondary" 
            onClick={() => setFormOpen(!formOpen)}
          >
            {formOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {formOpen ? 'Hide Form' : 'Add Vehicle'}
          </button>
        </div>
      </div>

      {formOpen && (
        <div className="wl-card">
          <div className="wl-card-header">
            <h3 className="wl-card-title"><Plus className="w-4 h-4" /> Track a New Listing</h3>
          </div>
          <form onSubmit={handleAddSubmit} className="wl-form-body">
            <div className="wl-input-group">
              <label className="wl-label">Listing URL <span style={{color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500, marginLeft: '0.25rem'}}>(Optional)</span></label>
              <input
                type="url"
                placeholder="https://www.sbtjapan.com/... (Optional)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="wl-input"
              />
            </div>
            
            <div className="wl-input-row">
              <div className="wl-input-group">
                <label className="wl-label">Listing Currency</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setListingCurrency('USD')}
                    style={{ flex: 1, padding: '0.5rem', border: `1px solid ${listingCurrency === 'USD' ? '#0f172a' : '#cbd5e1'}`, borderRadius: '0.5rem', backgroundColor: listingCurrency === 'USD' ? '#f8fafc' : 'white', fontWeight: listingCurrency === 'USD' ? 700 : 500 }}
                  >
                    USD
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingCurrency('ZAR')}
                    style={{ flex: 1, padding: '0.5rem', border: `1px solid ${listingCurrency === 'ZAR' ? '#0f172a' : '#cbd5e1'}`, borderRadius: '0.5rem', backgroundColor: listingCurrency === 'ZAR' ? '#f8fafc' : 'white', fontWeight: listingCurrency === 'ZAR' ? 700 : 500 }}
                  >
                    ZAR
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingCurrency('ZMW')}
                    style={{ flex: 1, padding: '0.5rem', border: `1px solid ${listingCurrency === 'ZMW' ? '#0f172a' : '#cbd5e1'}`, borderRadius: '0.5rem', backgroundColor: listingCurrency === 'ZMW' ? '#f8fafc' : 'white', fontWeight: listingCurrency === 'ZMW' ? 700 : 500 }}
                  >
                    ZMW
                  </button>
                </div>
              </div>
              <div className="wl-input-group">
                <label className="flex items-center justify-between wl-label">
                  <span>Manual Listing Price (Optional)</span>
                  {listingPrice !== '' && listingPrice > 0 && listingCurrency !== 'ZMW' && (
                    <span className="text-[10px] text-emerald-600 font-bold lowercase">
                      ≈ {zmwFormat(Number(listingPrice) * (listingCurrency === 'USD' ? rates.usdToZmw : rates.zarToZmw))}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="wl-input"
                />
              </div>
            </div>

            <div className="wl-input-group">
              <label className="wl-label">Vehicle Title / Notes</label>
              <input
                type="text"
                placeholder="e.g. 2015 Toyota Auris 1.5L"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="wl-input"
              />
            </div>

            {lastCalcState && (
              <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check className="w-4 h-4" />
                <span>Pre-loaded Duty Estimate ({zmwFormat(lastCalcTotal)}) will be attached.</span>
              </div>
            )}

            {formError && <div className="wl-alert-error">{formError}</div>}

            <div style={{ marginTop: '0.5rem' }}>
              <button type="submit" disabled={isLoading} className="wl-btn-primary">
                {isLoading ? <RefreshCw className="w-4 h-4 wl-spinner" /> : <Search className="w-4 h-4" />}
                {isLoading ? 'Analyzing Listing...' : 'Analyze & Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {watchlist.length === 0 ? (
        <div className="wl-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Bookmark className="w-12 h-12" style={{ margin: '0 auto 1rem', color: '#cbd5e1' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Your Watchlist is Empty</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Paste a vehicle listing URL above to start monitoring prices and availability.</p>
        </div>
      ) : (
        <div className="wl-grid">
          {isLoading && <WatchlistSkeleton />}
          {watchlist.map((item) => (
            <div key={item.id} className={`wl-listing-card ${item.hasChangedStatus ? 'wl-changed' : ''}`}>
              <div className="wl-card-image-wrap" onClick={() => setModalItem(item)}>
                {item.image ? (
                  <img src={item.image} alt={item.title || item.desc} className="wl-card-image" referrerPolicy="no-referrer" />
                ) : (
                  <div className="wl-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0' }}>
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <div className="wl-card-status-badge">
                  {item.status === 'unavailable' ? (
                    <span className="wl-badge wl-badge-inactive">Unavailable</span>
                  ) : (
                    <span className="wl-badge wl-badge-active">Available</span>
                  )}
                </div>
              </div>
              
              <div className="wl-card-body" onClick={() => setModalItem(item)}>
                <div className="wl-card-title-row">
                  <h4 className="wl-card-title-text">{item.title || item.desc}</h4>
                  <div className="wl-card-price" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    {item.price && (
                      <>
                        <span>{item.price}</span>
                        {item.currency && item.currency !== 'ZMW' && item.fob && item.fob > 0 && (
                          <span className="text-[10px] text-emerald-600 font-bold opacity-80" style={{ fontSize: '11px', marginTop: '-2px' }}>
                            ≈ {zmwFormat(item.fob * (item.currency === 'USD' ? rates.usdToZmw : rates.zarToZmw))}
                          </span>
                        )}
                      </>
                    )}
                    {(item.duty ?? 0) > 0 && (
                      <div style={{ marginTop: '0.25rem', padding: '0.2rem 0.4rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Duty:</span>
                        <span className="text-[11px] font-black text-emerald-700">{zmwFormat(item.duty!)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="wl-card-desc">{item.description || item.notes}</p>
                
                <div className="wl-card-stats">
                  <div className="wl-stat-item" title={item.location}>
                    <Check className="wl-stat-icon" /> {item.make} {item.model}
                  </div>
                  <div className="wl-stat-item">
                    <AlertTriangle className="wl-stat-icon" /> Year: {item.year}
                  </div>
                </div>

                <div className="wl-card-footer">
                  <span>Checked: {new Date(item.lastChecked || item.savedAt || '').toLocaleDateString()}</span>
                  <div className="wl-card-actions" onClick={e => e.stopPropagation()}>
                    <button className="wl-icon-btn" onClick={() => handleVerifyStatus(item)} title={item.url ? "Verify Availability" : "Manual Check"}>
                      <RefreshCw className={`w-4 h-4 ${checkingIds[item.id] ? 'wl-spinner' : ''}`} />
                    </button>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer" className="wl-icon-btn" title="Open Original Listing">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button className="wl-btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={(e) => handleResolveAndCalculate(item, e)} title="Duty Calculator">
                      {resolvingIds[item.id] ? <RefreshCw className="w-3.5 h-3.5 wl-spinner" /> : ((item.duty ?? 0) > 0 ? 'Recalculate Duty' : 'Calculate Duty')}
                    </button>
                    {onSendToCompare && (
                      <button className="wl-icon-btn" onClick={(e) => { e.stopPropagation(); onSendToCompare(item); }} title="Compare Prices">
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    )}
                    <button className="wl-btn-danger" onClick={() => handleRemove(item.id)} title="Remove">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline Duty Calculator (Adapted from Duty Boss) */}
              {openInlineCalcs[item.id] && inlineStates[item.id] && (
                <div className="wl-inline-calc">
                  <h5 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem', color: '#475569' }}>DUTY CALCULATOR</h5>
                  <div className="wl-inline-calc-grid">
                    <div>
                      <select
                        value={inlineStates[item.id].age}
                        onChange={(e) => updateInlineState(item.id, { age: e.target.value as VehicleAge, type: '', fuel: '', engine: '' })}
                        className="wl-inline-select"
                      >
                        <option value="">Select Age</option>
                        <option value="0-2">Under 2 years old</option>
                        <option value="2-5">2 to 5 years old</option>
                        <option value="5+">5+ years old</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={inlineStates[item.id].cat}
                        onChange={(e) => updateInlineState(item.id, { cat: e.target.value as VehicleCategory, type: '', fuel: '', engine: '' })}
                        className="wl-inline-select"
                      >
                        <option value="">Select Category</option>
                        <option value="motor-car">Motor Car</option>
                        <option value="goods-vehicle">Goods Vehicle</option>
                        <option value="bus">Bus</option>
                      </select>
                    </div>
                  </div>
                  
                  {inlineStates[item.id].age && inlineStates[item.id].cat === 'motor-car' && (
                    <div className="wl-inline-calc-grid" style={{ marginTop: '0.75rem' }}>
                       <div>
                        <select
                          value={inlineStates[item.id].type}
                          onChange={(e) => updateInlineState(item.id, { type: e.target.value as MotorCarType, fuel: '', engine: '' })}
                          className="wl-inline-select"
                        >
                          <option value="">Body Type</option>
                          <option value="sedan">Sedan</option>
                          <option value="hatchback">Hatchback</option>
                          <option value="station">Station Wagon</option>
                          <option value="suv">SUV</option>
                        </select>
                      </div>
                      <div>
                        <select
                          value={inlineStates[item.id].fuel}
                          onChange={(e) => updateInlineState(item.id, { fuel: e.target.value as FuelType, engine: '' })}
                          className="wl-inline-select"
                        >
                          <option value="">Fuel Type</option>
                          <option value="petrol">Petrol</option>
                          <option value="diesel">Diesel</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="electric">Electric</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {inlineStates[item.id].fuel && inlineStates[item.id].fuel !== 'electric' && inlineStates[item.id].cat === 'motor-car' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <select
                        value={inlineStates[item.id].engine}
                        onChange={(e) => updateInlineState(item.id, { engine: e.target.value })}
                        className="wl-inline-select"
                      >
                        <option value="">Engine CC</option>
                        <option value="1000">0 - 1000 cc</option>
                        <option value="1500">1001 - 1500 cc</option>
                        <option value="2500">1501 - 2500 cc</option>
                        <option value="3000">2501 - 3000 cc</option>
                        <option value="3500">3001+ cc</option>
                      </select>
                    </div>
                  )}

                  {inlineStates[item.id].age && inlineStates[item.id].cat === 'goods-vehicle' && (
                    <div className="wl-inline-calc-grid" style={{ marginTop: '0.75rem' }}>
                       <div>
                        <select
                          value={inlineStates[item.id].type}
                          onChange={(e) => updateInlineState(item.id, { type: e.target.value as GoodsVehicleType, fuel: '', weight: '' })}
                          className="wl-inline-select"
                        >
                          <option value="">Body Type</option>
                          <option value="single-cab">Single Cab</option>
                          <option value="double-cab">Double Cab</option>
                          <option value="panel-van">Panel Van</option>
                          <option value="truck">Truck</option>
                        </select>
                      </div>
                      <div>
                        <select
                          value={inlineStates[item.id].fuel}
                          onChange={(e) => updateInlineState(item.id, { fuel: e.target.value as FuelType, weight: '' })}
                          className="wl-inline-select"
                        >
                          <option value="">Fuel Type</option>
                          <option value="petrol">Petrol</option>
                          <option value="diesel">Diesel</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="electric">Electric</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {inlineStates[item.id].type && inlineStates[item.id].fuel && inlineStates[item.id].cat === 'goods-vehicle' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <select
                        value={inlineStates[item.id].weight}
                        onChange={(e) => updateInlineState(item.id, { weight: e.target.value })}
                        className="wl-inline-select"
                      >
                        <option value="">Weight Bracket</option>
                        {WEIGHT_OPTIONS_MAP[inlineStates[item.id].type as GoodsVehicleType]?.map(opt => (
                          <option key={opt.v} value={opt.v}>{opt.l}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {inlineStates[item.id].age && inlineStates[item.id].cat === 'bus' && (
                    <div className="wl-inline-calc-grid" style={{ marginTop: '0.75rem' }}>
                       <div>
                        <select
                          value={inlineStates[item.id].busFuel}
                          onChange={(e) => updateInlineState(item.id, { busFuel: e.target.value as BusFuelType, seats: '' })}
                          className="wl-inline-select"
                        >
                          <option value="">Bus Fuel Type</option>
                          <option value="diesel">Diesel</option>
                          <option value="other-diesel">Other Diesel</option>
                        </select>
                      </div>
                      <div>
                        <select
                          value={inlineStates[item.id].seats}
                          onChange={(e) => updateInlineState(item.id, { seats: e.target.value })}
                          className="wl-inline-select"
                        >
                          <option value="">Seating Capacity</option>
                          <option value="10">14 seats or less</option>
                          <option value="20">15 to 32 seats</option>
                          <option value="38">33 to 44 seats</option>
                          <option value="50">45+ seats</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {isCIFMode(inlineStates[item.id] as any) && (
                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>CIF Invoice Value & FX</p>
                      <div className="wl-inline-calc-grid">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                            {['USD', 'ZAR', 'ZMW'].map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  setInlineCifCurrencies(prev => ({ ...prev, [item.id]: c as any }));
                                  if (c === 'ZMW') updateInlineState(item.id, { fx: 1 });
                                  else if (c === 'USD') updateInlineState(item.id, { fx: rates.usdToZmw });
                                  else updateInlineState(item.id, { fx: rates.zarToZmw });
                                }}
                                style={{ flex: 1, padding: '0.25rem', fontSize: '0.65rem', fontWeight: 700, borderRadius: '0.25rem', border: `1px solid ${inlineCifCurrencies[item.id] === c || (!inlineCifCurrencies[item.id] && c === 'USD') ? '#0f172a' : '#cbd5e1'}`, backgroundColor: inlineCifCurrencies[item.id] === c || (!inlineCifCurrencies[item.id] && c === 'USD') ? '#f8fafc' : 'white' }}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                          <input
                            type="number"
                            placeholder="CIF Value"
                            value={inlineStates[item.id].cifUSD || ''}
                            onChange={(e) => updateInlineState(item.id, { cifUSD: parseFloat(e.target.value) || 0 })}
                            className="wl-inline-select"
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'flex-end' }}>
                          <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>FX Rate</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="FX Rate"
                            value={inlineStates[item.id].fx || ''}
                            disabled={(inlineCifCurrencies[item.id] || 'USD') === 'ZMW'}
                            onChange={(e) => updateInlineState(item.id, { fx: parseFloat(e.target.value) || 0 })}
                            className="wl-inline-select"
                            style={{ opacity: (inlineCifCurrencies[item.id] || 'USD') === 'ZMW' ? 0.5 : 1 }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(() => {
                    const res = calculateDuty(inlineStates[item.id]);
                    if (res && res.mode === 'specific') {
                      return (
                        <div style={{ marginTop: '1rem' }}>
                           <div className="wl-duty-matrix">
                              <div className="wl-duty-box">
                                <p className="wl-duty-label">Base Duty</p>
                                <p className="wl-duty-value">{zmwFormat(res.base || 0)}</p>
                              </div>
                              <div className="wl-duty-box">
                                <p className="wl-duty-label">Carbon Tax</p>
                                <p className="wl-duty-value">{zmwFormat(res.carbon || 0)}</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => saveInlineDuty(item.id, res.total, 0, inlineStates[item.id])} 
                             className="wl-btn-primary" 
                             style={{ width: '100%' }}
                           >
                             Save {zmwFormat(res.total)} to Watchlist
                           </button>
                        </div>
                      );
                    } else if (res && res.mode === 'cif') {
                       return (
                         <div style={{ marginTop: '1rem' }}>
                            <div className="wl-duty-matrix">
                               <div className="wl-duty-box">
                                 <p className="wl-duty-label">Customs</p>
                                 <p className="wl-duty-value">{zmwFormat(res.cd)}</p>
                               </div>
                               <div className="wl-duty-box">
                                 <p className="wl-duty-label">Excise</p>
                                 <p className="wl-duty-value">{zmwFormat(res.ed)}</p>
                               </div>
                               <div className="wl-duty-box">
                                 <p className="wl-duty-label">VAT</p>
                                 <p className="wl-duty-value">{zmwFormat(res.vat)}</p>
                               </div>
                               {res.carbon > 0 && (
                                 <div className="wl-duty-box">
                                   <p className="wl-duty-label">Carbon Tax</p>
                                   <p className="wl-duty-value">{zmwFormat(res.carbon)}</p>
                                 </div>
                               )}
                            </div>
                            <button 
                              onClick={() => saveInlineDuty(item.id, res.total, inlineStates[item.id].cifUSD, inlineStates[item.id])} 
                              className="wl-btn-primary" 
                              style={{ width: '100%', marginTop: '0.5rem' }}
                            >
                              Save {zmwFormat(res.total)} to Watchlist
                            </button>
                         </div>
                       );
                    } else if (isCIFMode(inlineStates[item.id] as any)) {
                       return (
                         <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f8fafc', color: '#64748b', borderRadius: '0.5rem', fontSize: '0.75rem', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                           Enter the CIF Invoice Value and FX Rate above to calculate duty.
                         </div>
                       );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalItem && (
        <div className="wl-modal-overlay" onClick={() => setModalItem(null)}>
          <div className="wl-modal-content" onClick={e => e.stopPropagation()}>
            <div className="wl-modal-header-img">
              {modalItem.image ? (
                <img src={modalItem.image} alt="Vehicle" className="wl-modal-img" referrerPolicy="no-referrer" />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0' }}>
                  <Search className="w-12 h-12 text-slate-400" />
                </div>
              )}
              <div className="wl-modal-title-overlay">
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{modalItem.title || modalItem.desc}</h2>
                  <p style={{ fontSize: '0.875rem', opacity: 0.8, margin: 0 }}>{modalItem.location || modalItem.source}</p>
                </div>
                {modalItem.status === 'unavailable' ? (
                  <span className="wl-badge wl-badge-inactive">Unavailable</span>
                ) : (
                  <span className="wl-badge wl-badge-active">Available</span>
                )}
              </div>
              <button className="wl-modal-close" onClick={() => setModalItem(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="wl-modal-body">
              <div className="wl-spec-grid">
                <div className="wl-spec-item">
                  <span className="wl-spec-label">Make</span>
                  <span className="wl-spec-value">{modalItem.make || '-'}</span>
                </div>
                <div className="wl-spec-item">
                  <span className="wl-spec-label">Model</span>
                  <span className="wl-spec-value">{modalItem.model || '-'}</span>
                </div>
                <div className="wl-spec-item">
                  <span className="wl-spec-label">Year</span>
                  <span className="wl-spec-value">{modalItem.year || '-'}</span>
                </div>
                <div className="wl-spec-item">
                  <span className="wl-spec-label">Price / Duty</span>
                  <span className="wl-spec-value">{modalItem.price || zmwFormat(modalItem.duty || 0)}</span>
                </div>
              </div>

              <div className="wl-layout-split">
                <div className="wl-panel">
                  <h3 className="wl-panel-title">Vehicle Description</h3>
                  <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>{modalItem.description || modalItem.notes || 'No description available.'}</p>
                  
                  {modalItem.notes && (
                     <div style={{ marginTop: '1.5rem' }}>
                       <h3 className="wl-panel-title">Personal Notes</h3>
                       <p style={{ fontSize: '0.875rem', color: '#0f172a', backgroundColor: '#f1f5f9', padding: '0.75rem', borderRadius: '0.5rem' }}>{modalItem.notes}</p>
                     </div>
                  )}
                </div>

                <div className="wl-panel">
                  <h3 className="wl-panel-title">
                    Monitoring History
                    <button onClick={() => handleVerifyStatus(modalItem)} className="wl-icon-btn">
                      <RefreshCw className={`w-3.5 h-3.5 ${checkingIds[modalItem.id] ? 'wl-spinner' : ''}`} />
                    </button>
                  </h3>
                  <div className="wl-timeline">
                    {modalItem.history?.map((hist, idx) => (
                      <div key={idx} className="wl-timeline-item">
                        <div className="wl-timeline-dot" style={{ backgroundColor: hist.status === 'available' ? '#22c55e' : '#ef4444' }}></div>
                        <div className="wl-timeline-time">
                          {new Date(hist.timestamp).toLocaleString()}
                        </div>
                        <div className="wl-timeline-content">
                          {hist.details}
                        </div>
                      </div>
                    ))}
                    {(!modalItem.history || modalItem.history.length === 0) && (
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No history recorded.</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '0.75rem' }}>
                <a href={modalItem.url} target="_blank" rel="noreferrer" className="wl-btn-secondary">
                  <ExternalLink className="w-4 h-4" /> View Original Source
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
