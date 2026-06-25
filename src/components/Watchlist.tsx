/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Trash2,
  Trash,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Plus,
  Compass,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  Check,
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

interface WatchlistProps {
  watchlist: WatchlistItem[];
  onUpdateWatchlist: (list: WatchlistItem[]) => void;
  lastCalcTotal: number;
  lastCalcUSD: number;
  lastCalcFx: number;
  onActivated: () => void;
}

export default function Watchlist({
  watchlist,
  onUpdateWatchlist,
  lastCalcTotal,
  lastCalcUSD,
  lastCalcFx,
  onActivated,
}: WatchlistProps) {
  // Form visibility
  const [formOpen, setFormOpen] = useState(true);

  // Form State
  const [desc, setDesc] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'ZAR'>('USD');
  const [price, setPrice] = useState<number | ''>('');
  const [fob, setFob] = useState<number | ''>('');
  const [source, setSource] = useState('');
  const [url, setUrl] = useState('');
  const [dcUrl, setDcUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [duty, setDuty] = useState<number | ''>('');
  const [fx, setFx] = useState<number | ''>('');
  const [formError, setFormError] = useState('');
  const [dcIdMessage, setDcIdMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Success flash feedback for adding
  const [addFlash, setAddFlash] = useState(false);

  // Track cards which have their inline calculators toggled open
  const [openInlineCalcs, setOpenInlineCalcs] = useState<Record<number, boolean>>({});

  // Inline calculator state per watchlist entry (keyed by entry ID)
  const [inlineStates, setInlineStates] = useState<Record<number, CalculatorState>>({});

  const extractDCId = (urlStr: string): string => {
    // Matches 5 or 6 digits in DreamCars listing URL segments
    const m = urlStr.match(/-(\d{5,6})(?:[/?#].*)?$/);
    return m ? m[1] : '';
  };

  const handleDCUrlChange = (val: string) => {
    setDcUrl(val);
    if (!val.trim()) {
      setDcIdMessage(null);
      return;
    }
    const id = extractDCId(val);
    if (id) {
      setDcIdMessage({ text: `✓ DreamCars ID detected: #${id}`, isError: false });
    } else {
      setDcIdMessage({ text: 'ID not detected — paste the full DreamCars listing URL', isError: true });
    }
  };

  const handleCurrencyChange = (cur: 'USD' | 'ZAR') => {
    setCurrency(cur);
  };

  const fillDutyFromCalculator = () => {
    if (lastCalcTotal > 0) {
      setDuty(Number(lastCalcTotal.toFixed(2)));
    } else {
      alert('No calculator result yet. Please run a calculation on the Calculator tab first.');
    }
  };

  const fillFXFromCalculator = () => {
    if (lastCalcFx > 0) {
      setFx(lastCalcFx);
    } else {
      alert('No FX rate found. Complete the CIF inputs on the Calculator tab first.');
    }
  };

  // Submit to Watchlist
  const handleAddToWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) {
      setFormError('Please enter a vehicle description.');
      return;
    }
    setFormError('');

    const detectedId = dcUrl ? extractDCId(dcUrl) : '';

    const newItem: WatchlistItem = {
      id: Date.now(),
      desc: desc.trim(),
      currency,
      price: price === '' ? 0 : Number(price),
      fob: fob === '' ? 0 : Number(fob),
      source,
      url: url.trim(),
      dcId: detectedId,
      dcUrl: dcUrl.trim(),
      notes: notes.trim(),
      duty: duty === '' ? 0 : Number(duty),
      fx: fx === '' ? 0 : Number(fx),
      savedAt: new Date().toISOString(),
    };

    onUpdateWatchlist([newItem, ...watchlist]);

    // Reset Form fields
    setDesc('');
    setCurrency('USD');
    setPrice('');
    setFob('');
    setSource('');
    setUrl('');
    setDcUrl('');
    setNotes('');
    setDuty('');
    setFx('');
    setDcIdMessage(null);

    // Flash success
    setAddFlash(true);
    setTimeout(() => setAddFlash(false), 2000);
  };

  const handleClearForm = () => {
    setDesc('');
    setCurrency('USD');
    setPrice('');
    setFob('');
    setSource('');
    setUrl('');
    setDcUrl('');
    setNotes('');
    setDuty('');
    setFx('');
    setDcIdMessage(null);
    setFormError('');
  };

  const handleRemove = (id: number) => {
    if (confirm('Are you sure you want to remove this vehicle from your watchlist?')) {
      onUpdateWatchlist(watchlist.filter((item) => item.id !== id));
    }
  };

  const handleClearAll = () => {
    if (confirm('Remove all saved vehicles from your watchlist? This cannot be undone.')) {
      onUpdateWatchlist([]);
    }
  };

  const markChecked = (id: number) => {
    onUpdateWatchlist(
      watchlist.map((item) => {
        if (item.id === id) {
          return { ...item, lastChecked: new Date().toISOString() };
        }
        return item;
      })
    );
  };

  // Inline Calculator Helpers per Entry
  const toggleInlineCalc = (id: number) => {
    setOpenInlineCalcs((prev) => ({ ...prev, [id]: !prev[id] }));

    // Initialize state if not loaded
    if (!inlineStates[id]) {
      const parentItem = watchlist.find((item) => item.id === id);
      setInlineStates((prev) => ({
        ...prev,
        [id]: {
          age: '',
          cat: '',
          type: '',
          fuel: '',
          busFuel: '',
          engine: '',
          cifEngine: '',
          weight: '',
          seats: '',
          vdp: '',
          cifUSD: parentItem?.currency === 'USD' ? (parentItem?.fob || parentItem?.price || 0) : 0,
          fx: parentItem?.fx || 0,
        },
      }));
    }
  };

  const updateInlineState = (id: number, fields: Partial<CalculatorState>) => {
    setInlineStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...fields,
      },
    }));
  };

  const saveInlineDuty = (id: number, finalTotal: number, finalFx: number) => {
    onUpdateWatchlist(
      watchlist.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            duty: finalTotal,
            fx: finalFx || item.fx,
          };
        }
        return item;
      })
    );

    alert('Estimated duty successfully updated for this entry!');
    // Close calculator panel
    setOpenInlineCalcs((prev) => ({ ...prev, [id]: false }));
  };

  // Check if saved entry exchange rate is more than 7 days old
  const isStale = (savedAtIso: string): boolean => {
    const diff = (Date.now() - new Date(savedAtIso).getTime()) / (1000 * 60 * 60 * 24);
    return diff > 7;
  };

  const formatDate = (isoStr: string): string => {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getSourceBadgeClass = (src: string) => {
    const maps: Record<string, string> = {
      SBT: 'bg-slate-100 text-slate-800 border border-slate-200',
      BeForward: 'bg-slate-100 text-slate-800 border border-slate-200',
      'TC-V': 'bg-slate-100 text-slate-800 border border-slate-200',
      SBI: 'bg-slate-100 text-slate-800 border border-slate-200',
      'Cars.co.za': 'bg-slate-100 text-slate-800 border border-slate-200',
    };
    return maps[src] || 'bg-slate-100 text-slate-800 border border-slate-200';
  };

  return (
    <div id="watchlist-tab-view" className="space-y-6 max-w-4xl mx-auto">
      {/* Informational banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-300 shadow-sm font-medium">
        <Bookmark className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="leading-relaxed">
          The watchlist is cataloged locally inside <strong>your offline browser sandbox</strong>. No cloud databases, trackers, or logins are ever connected. Safe, offline, secure.
        </p>
      </div>

      {/* Add Entry Card Form */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:border-slate-300">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-150 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2.5 text-sm md:text-base">
            <Plus className="w-5 h-5 text-slate-950" />
            {'{Add Vehicle to Watchlist Registry}'}
          </h2>
          <button
            id="watchlist-form-collapse-btn"
            type="button"
            onClick={() => setFormOpen((prev) => !prev)}
            className="text-xs text-slate-600 font-bold uppercase tracking-wider hover:text-slate-900 transition-all cursor-pointer"
          >
            {formOpen ? '[-] Close Panel' : '[+] Open Form'}
          </button>
        </div>

        {formOpen && (
          <form id="watchlist-add-form" onSubmit={handleAddToWatchlist} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5 font-sans">
                  Vehicle Description <span className="text-black font-black">*</span>
                </label>
                <input
                  id="wl-form-desc-input"
                  type="text"
                  required
                  placeholder="e.g. 2018 Toyota Land Cruiser Prado cc 2.7 Petrol"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none text-sm transition-all shadow-inner font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5 font-sans">FOB Listing Currency</label>
                <div id="curr-selection-container" className="grid grid-cols-2 gap-3" style={{ maxWidth: '280px' }}>
                  <button
                    id="cur-usd-btn"
                    type="button"
                    onClick={() => handleCurrencyChange('USD')}
                    className={`p-3 border rounded-xl text-xs font-bold transition-all flex flex-col items-center cursor-pointer ${
                      currency === 'USD'
                        ? 'bw-active'
                        : ''
                    }`}
                  >
                    <span className="font-extrabold text-sm">USD</span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">US Dollar</span>
                  </button>
                  <button
                    id="cur-zar-btn"
                    type="button"
                    onClick={() => handleCurrencyChange('ZAR')}
                    className={`p-3 border rounded-xl text-xs font-bold transition-all flex flex-col items-center cursor-pointer ${
                      currency === 'ZAR'
                        ? 'bw-active'
                        : ''
                    }`}
                  >
                    <span className="font-extrabold text-sm">ZAR</span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">SA Rand</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">
                  Vehicle Total CIF Price ({currency})
                </label>
                <input
                  id="wl-form-price-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 12000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none text-sm transition-all font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">
                  FOB Base Price (Before Freight - {currency})
                </label>
                <input
                  id="wl-form-fob-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 11000"
                  value={fob}
                  onChange={(e) => setFob(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none text-sm transition-all font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Source / Dealership Portal</label>
                <div className="relative">
                  <select
                    id="wl-form-source-select"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none text-sm transition-all appearance-none font-medium"
                  >
                    <option value="">Select source portal</option>
                    <option value="SBT">SBT Japan</option>
                    <option value="BeForward">BeForward</option>
                    <option value="TC-V">Trade Carview (TC-V)</option>
                    <option value="SBI">SBI Motor Japan</option>
                    <option value="Cars.co.za">Cars.co.za</option>
                    <option value="Other">Other Listing Portal</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Original URL Link</label>
                <input
                  id="wl-form-url-input"
                  type="url"
                  placeholder="https://www.sbtjapan.com/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none text-sm transition-all font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">
                  DreamCars Listing Link
                  <span className="font-semibold text-slate-400 ml-1">(Optional Integration)</span>
                </label>
                <input
                  id="wl-form-dcurl-input"
                  type="url"
                  placeholder="https://dreamcars.directory/car/toyota-prado-..."
                  value={dcUrl}
                  onChange={(e) => handleDCUrlChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:ring-2 focus:ring-slate-920 focus:bg-white outline-none text-sm transition-all font-medium"
                />
                {dcIdMessage && (
                  <p id="wl-dc-preview" className={`text-xs mt-1.5 font-bold ${dcIdMessage.isError ? 'text-slate-500 italic' : 'text-black'}`}>
                    {dcIdMessage.text}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Extras or Special Notes</label>
                <input
                  id="wl-form-notes-input"
                  type="text"
                  placeholder="e.g. Needs tires, structural inspection low mileage"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Estimated Duty (ZMW)</label>
                <div className="relative">
                  <input
                    id="wl-form-duty-input"
                    type="number"
                    min="0"
                    placeholder="Enter or capture from left column"
                    value={duty}
                    onChange={(e) => setDuty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 pr-24 text-slate-850 focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none text-sm font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={fillDutyFromCalculator}
                    className="absolute right-2 top-2 bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 text-[10px] font-extrabold rounded uppercase tracking-wider transition-all border border-slate-800 cursor-pointer"
                  >
                    Load Calc
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">
                  FX Conversion Rate (1 {currency} = ZMW)
                </label>
                <div className="relative">
                  <input
                    id="wl-form-fx-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Exchange rate"
                    value={fx}
                    onChange={(e) => setFx(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 pr-24 text-slate-850 focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none text-sm font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={fillFXFromCalculator}
                    className="absolute right-2 top-2 bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 text-[10px] font-extrabold rounded uppercase tracking-wider transition-all border border-slate-800 cursor-pointer"
                  >
                    Load Calc
                  </button>
                </div>
              </div>

            </div>

            {formError && (
              <div id="wl-form-error" className="text-xs font-semibold text-black bg-slate-100 border border-slate-300 rounded-lg p-3">
                ⚠️ {formError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                id="watchlist-submit-btn"
                type="submit"
                className="flex-1 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all shadow hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Bookmark className="w-4 h-4" />
                Commit to Watchlist
              </button>
              <button
                id="watchlist-clear-form-btn"
                type="button"
                onClick={handleClearForm}
                className="px-5 py-3.5 border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                Reset Field Form
              </button>
            </div>
            {addFlash && (
              <div className="text-xs text-black bg-slate-100 border border-slate-300 rounded-xl p-3 text-center font-bold animate-pulse">
                ✓ Vehicle successfully committed to your secure browser registry!
              </div>
            )}
          </form>
        )}
      </div>

      {/* Watchlist Entries Display Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm md:text-base">
            {'{'}Saved Watchlist ({watchlist.length}){'}'}
          </h3>
          {watchlist.length > 0 && (
            <button
              id="watchlist-clear-all-btn"
              onClick={handleClearAll}
              className="text-xs text-slate-600 hover:text-black font-semibold flex items-center gap-1 hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear entire list
            </button>
          )}
        </div>

        {watchlist.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8 text-slate-400">
            <Bookmark className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="font-semibold text-sm">No vehicles saved in your watchlist yet.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Configure parameters on the calculator and tap &quot;Save to Watchlist&quot; or manually input vehicle specs above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {watchlist.map((item) => {
              const stale = item.fx > 0 && isStale(item.savedAt);
              const totalEstCost = item.fob && item.fx ? item.fob * item.fx + item.duty : 0;
              const isItemZAR = item.currency === 'ZAR';

              // Calculate inline duty calculation
              const inlineState = inlineStates[item.id];
              const inlineResult = inlineState ? calculateDuty(inlineState) : null;
              const isInlineCif = inlineState
                ? isCIFMode({
                    age: inlineState.age,
                    cat: inlineState.cat,
                    fuel: inlineState.fuel || ('' as FuelType),
                  })
                : false;

              return (
                <div
                  key={item.id}
                  id={`watchlist-item-${item.id}`}
                  className="bg-white rounded-xl border border-slate-205 shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-400 hover:shadow-md"
                >
                  {/* Item Header */}
                  <div className="px-5 py-4 border-b border-slate-150 flex items-start justify-between gap-3 bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-slate-900 text-sm md:text-base tracking-tight truncate">{item.desc}</p>
                      
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {item.dcId && (
                          <span className="inline-flex items-center gap-1 bg-slate-900 text-slate-100 hover:bg-black font-mono font-bold text-[9px] px-2 py-0.5 rounded tracking-wide uppercase">
                            DreamCars #{item.dcId}
                          </span>
                        )}
                        {item.source && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getSourceBadgeClass(item.source)}`}>
                            {item.source}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-medium font-mono">
                          Saved: {formatDate(item.savedAt)}
                        </span>
                        {stale && (
                          <span className="inline-flex items-center gap-1 font-bold text-[9px] text-black bg-slate-100 px-2 py-0.5 rounded border border-slate-300 uppercase tracking-wider animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5 text-black" />
                            Exchange stale (&gt;7d)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      title="Remove from Watchlist"
                      className="text-slate-400 hover:text-black hover:bg-slate-100 transition-colors p-1.5 rounded-lg cursor-pointer"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white text-xs">
                    {item.price > 0 && (
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold font-sans">Total Port CIF</p>
                        <p className="font-extrabold text-slate-900 mt-0.5 font-mono text-xs md:text-sm">
                          {item.currency} {item.price.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {item.fob > 0 && (
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold font-sans">FOB Base Price</p>
                        <p className="font-extrabold text-slate-900 mt-0.5 font-mono text-xs md:text-sm">
                          {item.currency} {item.fob.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {item.duty > 0 && (
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold font-sans">Saved Est. Duty</p>
                        <p className="font-bold text-slate-900 mt-0.5 text-xs md:text-sm">{zmwFormat(item.duty)}</p>
                        {item.fx > 0 && (
                          <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">
                            @ 1 {item.currency} = {item.fx} ZMW
                          </p>
                        )}
                      </div>
                    )}
                    {totalEstCost > 0 && (
                      <div className="bg-slate-900 shadow-sm rounded-lg p-2.5 border border-slate-800 text-slate-200">
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Total Est. Cost</p>
                        <p className="text-xs md:text-sm font-black text-white mt-0.5 font-mono">{zmwFormat(totalEstCost)}</p>
                        <p className="text-[8.5px] text-slate-400 font-medium">FOB kwacha + duty charges</p>
                      </div>
                    )}
                  </div>

                  {/* Entry Notes & Links footer block */}
                  {(item.notes || item.url || item.dcUrl) && (
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-150 flex items-center justify-between gap-3 flex-wrap">
                      {item.notes ? (
                        <p className="text-xs text-slate-600 italic font-medium flex-1 truncate">
                          📝 {item.notes}
                        </p>
                      ) : (
                        <div className="flex-1" />
                      )}

                      <div className="flex items-center gap-2 text-xs">
                        {item.dcUrl && (
                          <a
                            href={item.dcUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markChecked(item.id)}
                            className="inline-flex items-center gap-1.5 font-bold text-slate-800 hover:text-black bg-white hover:bg-slate-100 border border-slate-250 px-2.5 py-1.5 rounded transition-all cursor-pointer text-[10.5px] shadow-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            DreamCars directory
                          </a>
                        )}
                        {item.url && (
                          <div className="flex items-center gap-1.5">
                            {item.lastChecked && (
                              <span className="text-[9.5px] text-slate-500 font-mono">
                                Checked: {formatDate(item.lastChecked)}
                              </span>
                            )}
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => markChecked(item.id)}
                              className="inline-flex items-center gap-1 font-bold text-slate-800 hover:text-black hover:underline cursor-pointer px-1 py-1 text-[11px]"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Listing Link
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Inline Calculator Toggle Button */}
                  <div className="px-5 py-2 border-t border-slate-150 bg-white">
                    <button
                      onClick={() => toggleInlineCalc(item.id)}
                      className="w-full text-center py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                      <Plus className={`w-3.5 h-3.5 transition-transform ${openInlineCalcs[item.id] ? 'rotate-45' : ''}`} />
                      {item.duty > 0 ? 'Recalculate Entry Duty' : 'Calculate Custom Duty'}
                    </button>
                  </div>

                  {/* Expanded Inline Calculator Panel */}
                  {openInlineCalcs[item.id] && inlineState && (
                    <div className="bg-slate-50/50 p-5 border-t border-slate-100 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        
                        <div>
                          <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Vehicle Age</label>
                          <select
                            value={inlineState.age}
                            onChange={(e) =>
                              updateInlineState(item.id, {
                                age: e.target.value as VehicleAge,
                                type: '',
                                fuel: '',
                                busFuel: '',
                                engine: '',
                                cifEngine: '',
                                weight: '',
                                seats: '',
                                vdp: '',
                              })
                            }
                            className="w-full text-xs bg-white border border-slate-205 hover:border-slate-400 p-2.5 rounded-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all cursor-pointer"
                          >
                            <option value="">Select age</option>
                            <option value="0-2">Under 2 years old</option>
                            <option value="2-5">2 to 5 years old</option>
                            <option value="5+">5+ years old</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                          <select
                            value={inlineState.cat}
                            onChange={(e) =>
                              updateInlineState(item.id, {
                                cat: e.target.value as VehicleCategory,
                                type: '',
                                fuel: '',
                                busFuel: '',
                                engine: '',
                                cifEngine: '',
                                weight: '',
                                seats: '',
                                vdp: '',
                              })
                            }
                            className="w-full text-xs bg-white border border-slate-205 hover:border-slate-400 p-2.5 rounded-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all cursor-pointer"
                          >
                            <option value="">Select category</option>
                            <option value="motor-car">Motor Car</option>
                            <option value="goods-vehicle">Goods Vehicle</option>
                            <option value="bus">Bus / Multiseat</option>
                            <option value="motorcycle">Motorcycle</option>
                          </select>
                        </div>

                      </div>

                      {/* Expanded dynamically based on variables inside inline calculator state */}
                      {inlineState.age && inlineState.cat && (
                        <div className="space-y-4 pt-1 animate-fadeIn">
                          {/* Motor Car / Goods Vehicle specifics */}
                          {(inlineState.cat === 'motor-car' || inlineState.cat === 'goods-vehicle') && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              <div>
                                <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Type</label>
                                <select
                                  value={inlineState.type}
                                  onChange={(e) =>
                                    updateInlineState(item.id, {
                                      type: e.target.value as MotorCarType | GoodsVehicleType,
                                      fuel: '',
                                      engine: '',
                                      cifEngine: '',
                                      weight: '',
                                    })
                                  }
                                  className="w-full text-xs bg-white border border-slate-205 hover:border-slate-400 p-2.5 rounded-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all cursor-pointer"
                                >
                                  <option value="">Select type</option>
                                  {(inlineState.cat === 'motor-car'
                                    ? [
                                        { v: 'sedan', l: 'Sedan' },
                                        { v: 'hatchback', l: 'Hatchback' },
                                        { v: 'station', l: 'Station Wagon' },
                                        { v: 'suv', l: 'SUV / 4x4' },
                                      ]
                                    : [
                                        { v: 'single-cab', l: 'Single Cab' },
                                        { v: 'double-cab', l: 'Double Cab' },
                                        { v: 'panel-van', l: 'Panel Van' },
                                        { v: 'truck', l: 'Truck' },
                                      ]
                                  ).map((o) => (
                                    <option key={o.v} value={o.v}>
                                      {o.l}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Fuel</label>
                                <select
                                  value={inlineState.fuel}
                                  onChange={(e) => updateInlineState(item.id, { fuel: e.target.value as FuelType, engine: '', cifEngine: '', weight: '' })}
                                  className="w-full text-xs bg-white border border-slate-205 hover:border-slate-400 p-2.5 rounded-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all cursor-pointer"
                                >
                                  <option value="">Select fuel</option>
                                  <option value="petrol">Petrol</option>
                                  <option value="diesel">Diesel</option>
                                  <option value="hybrid">Hybrid</option>
                                  <option value="electric">Electric</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Bus Specifics */}
                          {inlineState.cat === 'bus' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              <div>
                                <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Engine Type</label>
                                <select
                                  value={inlineState.busFuel}
                                  onChange={(e) => updateInlineState(item.id, { busFuel: e.target.value as BusFuelType })}
                                  className="w-full text-xs bg-white border border-slate-205 hover:border-slate-400 p-2.5 rounded-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all cursor-pointer"
                                >
                                  <option value="">Select engine type</option>
                                  <option value="diesel">Diesel / Semi-diesel</option>
                                  <option value="other-diesel">Petrol / Other</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Seats (driver incl.)</label>
                                <select
                                  value={inlineState.seats}
                                  onChange={(e) => updateInlineState(item.id, { seats: e.target.value })}
                                  className="w-full text-xs bg-white border border-slate-205 hover:border-slate-400 p-2.5 rounded-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all cursor-pointer"
                                >
                                  <option value="">Select seating capacity</option>
                                  <option value="10">Not exceeding 14 seats</option>
                                  <option value="20">Above 14 but not exceeding 32 seats</option>
                                  <option value="38">Exceeding 33 but not exceeding 44 seats</option>
                                  <option value="50">Exceeding 44 seats</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Motorcycle Specific Range */}
                          {inlineState.cat === 'motorcycle' && inlineState.age !== '0-2' && (
                            <div>
                              <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Valuation (VDP)</label>
                              <select
                                value={inlineState.vdp}
                                onChange={(e) => updateInlineState(item.id, { vdp: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-205 hover:border-slate-400 p-2.5 rounded-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all cursor-pointer"
                              >
                                <option value="">Select VDP range</option>
                                {(inlineState.age === '2-5'
                                  ? [
                                      { v: '2000', l: 'ZMW 2,000' },
                                      { v: '2500', l: 'ZMW 2,500' },
                                      { v: '3000', l: 'ZMW 3,000' },
                                      { v: '3500', l: 'ZMW 3,500' },
                                      { v: '4000', l: 'ZMW 4,000' },
                                      { v: '8000', l: 'ZMW 8,000' },
                                    ]
                                  : [
                                      { v: '1500', l: 'ZMW 1,500' },
                                      { v: '2000', l: 'ZMW 2,000' },
                                      { v: '2500', l: 'ZMW 2,500' },
                                      { v: '3000', l: 'ZMW 3,000' },
                                      { v: '3500', l: 'ZMW 3,500' },
                                      { v: '6000', l: 'ZMW 6,000' },
                                    ]
                                ).map((o) => (
                                  <option key={o.v} value={o.v}>
                                    {o.l}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Mode CIF settings of inline calculator */}
                          {isInlineCif && (
                            <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg space-y-3">
                              <p className="text-[10.5px] font-semibold text-black leading-normal">
                                Ad Valorem Mode Inputs (USD / ZMW Rates)
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">CIF Value ({item.currency})</label>
                                  <input
                                    type="number"
                                    placeholder="e.g. 8500"
                                    value={inlineState.cifUSD || ''}
                                    onChange={(e) => updateInlineState(item.id, { cifUSD: parseFloat(e.target.value) || 0 })}
                                    className="w-full text-xs bg-white border border-slate-205 p-2 rounded font-semibold font-mono text-slate-800 focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">
                                    FX Rate (1 {item.currency} = ZMW)
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="Rate"
                                    value={inlineState.fx || ''}
                                    onChange={(e) => updateInlineState(item.id, { fx: parseFloat(e.target.value) || 0 })}
                                    className="w-full text-xs bg-white border border-slate-205 p-2 rounded font-semibold font-mono text-slate-800 focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                                  />
                                </div>
                              </div>
                              
                              {inlineState.cat === 'motor-car' && inlineState.fuel !== 'electric' && (
                                <div className="pt-1">
                                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Carbon CC Surtax Engine</label>
                                  <select
                                    value={inlineState.cifEngine}
                                    onChange={(e) => updateInlineState(item.id, { cifEngine: e.target.value })}
                                    className="w-full text-xs bg-white border border-slate-205 hover:border-slate-400 p-2.5 rounded-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all cursor-pointer"
                                  >
                                    <option value="">Select engine capacity</option>
                                    <option value="1000">Not exceeding 1,000cc</option>
                                    <option value="1500">1,001cc – 1,500cc</option>
                                    <option value="2500">1,501cc – 2,500cc</option>
                                    <option value="3000">2,501cc – 3,000cc</option>
                                    <option value="3500">Exceeding 3,000cc</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Specific Engine sizes / cargo weight */}
                          {!isInlineCif && inlineState.type && inlineState.fuel && (
                            <div className="pt-1">
                              {inlineState.cat === 'motor-car' && (
                                <div>
                                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Engine Size CC</label>
                                  <select
                                    value={inlineState.engine}
                                    onChange={(e) => updateInlineState(item.id, { engine: e.target.value })}
                                    className="w-full text-xs bg-white border border-slate-205 hover:border-slate-400 p-2.5 rounded-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all cursor-pointer"
                                  >
                                    <option value="">Select engine capacity</option>
                                    <option value="1000">Not exceeding 1,000cc</option>
                                    <option value="1500">1,001cc – 1,500cc</option>
                                    <option value="2500">1,501cc – 2,500cc</option>
                                    <option value="3000">2,501cc – 3,000cc</option>
                                    <option value="3500">Exceeding 3,000cc</option>
                                  </select>
                                </div>
                              )}

                              {inlineState.cat === 'goods-vehicle' && (
                                <div>
                                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Cargo Net Weight Payload</label>
                                  <select
                                    value={inlineState.weight}
                                    onChange={(e) => updateInlineState(item.id, { weight: e.target.value })}
                                    className="w-full text-xs bg-white border border-slate-205 hover:border-slate-400 p-2.5 rounded-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all cursor-pointer"
                                  >
                                    <option value="">Select weight range</option>
                                    {(WEIGHT_OPTIONS_MAP[inlineState.type as GoodsVehicleType] || []).map((o) => (
                                      <option key={o.v} value={o.v}>
                                        {o.l}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Mini result block inside inline calc panel */}
                          {inlineResult ? (
                            <div className="p-4 bg-slate-100 rounded-xl border border-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                              <div>
                                <p className="font-bold text-black text-sm">
                                  Recalculated Duty: <span className="font-black text-black text-base">{zmwFormat(inlineResult.total)}</span>
                                </p>
                                {inlineResult.cd !== undefined && (
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    CD: {zmwFormat(inlineResult.cd)} | ED: {zmwFormat(inlineResult.ed || 0)} | VAT: {zmwFormat(inlineResult.vat || 0)}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => saveInlineDuty(item.id, inlineResult.total, inlineState.fx)}
                                className="bg-black hover:bg-neutral-800 text-white font-bold px-3 py-2 rounded-lg transition-all text-[11px] hover:shadow flex items-center gap-1 cursor-pointer self-start sm:self-center"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Save as saved duty
                              </button>
                            </div>
                          ) : (
                            <p className="text-[10.5px] text-slate-400 italic text-center">
                              Please supply all dynamic configuration fields to calculate updated dues...
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
