/// <reference types="vite/client" />
/**
 * SpecResolver.tsx
 * Vehicle spec resolver using the DeepSeek API.
 * Designed as an optional in-calculator helper — not a separate tab.
 * Users can type Zambian street names like "Vitz 1KR" or "Allion 1NZ"
 * and get back structured specs that pre-fill the duty calculator.
 */

import React, { useState, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResolvedSpecs {
  make: string;
  model: string;
  engineCode: string;
  engineCC: number;
  bodyType: 'sedan' | 'hatchback' | 'station' | 'suv' | 'truck' | 'motorcycle' | 'bus';
  fuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric';
  ageBracket: '0-2' | '2-5' | '5+';
  productionYears: string;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

interface SpecResolverProps {
  onSpecsResolved: (specs: ResolvedSpecs) => void;
}

// ─── DeepSeek API ─────────────────────────────────────────────────────────────

// The frontend now calls our secure Vercel Serverless Function instead of the DeepSeek API directly.
// This ensures our API key is not exposed to the client.
const LOCAL_API_URL = '/api/resolve-spec';

async function resolveVehicleSpecs(query: string): Promise<ResolvedSpecs> {
  const response = await fetch(LOCAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `API error ${response.status}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);

  return data as ResolvedSpecs;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const confidenceStyle: Record<ResolvedSpecs['confidence'], string> = {
  high:   'text-emerald-700 bg-emerald-50 border-emerald-200',
  medium: 'text-amber-700 bg-amber-50 border-amber-200',
  low:    'text-rose-700 bg-rose-50 border-rose-200',
};

const confidenceLabel: Record<ResolvedSpecs['confidence'], string> = {
  high:   'High confidence',
  medium: 'Best guess',
  low:    'Low confidence — verify',
};

const bodyTypeLabel: Record<string, string> = {
  sedan:      'Sedan',
  hatchback:  'Hatchback',
  station:    'Station Wagon',
  suv:        'SUV / 4×4',
  truck:      'Truck / Pickup',
  motorcycle: 'Motorcycle',
  bus:        'Bus',
};

const ageBracketLabel: Record<string, string> = {
  '0-2': 'New (Under 2 years)',
  '2-5': '2 to 5 years old',
  '5+':  'Over 5 years old',
};

const fuelLabel: Record<string, string> = {
  petrol:   'Petrol (ICE)',
  diesel:   'Diesel (ICE)',
  hybrid:   'Hybrid (Petrol-Electric)',
  electric: 'Electric (EV)',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SpecResolver({ onSpecsResolved }: SpecResolverProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery]           = useState('');
  const [status, setStatus]         = useState<'idle' | 'loading' | 'resolved' | 'error'>('idle');
  const [result, setResult]         = useState<ResolvedSpecs | null>(null);
  const [errorMsg, setErrorMsg]     = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const EXAMPLES = ['Vitz 1KR', 'Allion 1NZ', 'Aqua hybrid', 'Hilux 1GD'];

  const handleResolve = async () => {
    if (!query.trim()) return;
    setStatus('loading');
    setResult(null);
    setErrorMsg('');
    try {
      const specs = await resolveVehicleSpecs(query.trim());
      setResult(specs);
      setStatus('resolved');
    } catch (e: unknown) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Unknown error occurred.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleResolve();
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setQuery('');
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
  };

  const handleUseSpecs = () => {
    if (result) {
      onSpecsResolved(result);
      handleCollapse();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {!isExpanded ? (
        /* ── Collapsed hint chip ── */
        <button
          type="button"
          onClick={handleExpand}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-400 hover:bg-white rounded-2xl text-left transition-all cursor-pointer outline-none"
        >
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-slate-700 leading-none">Not sure of the specs?</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
              Describe the car — e.g. <span className="font-bold text-slate-600">"Vitz 1KR"</span> or <span className="font-bold text-slate-600">"Allion 1NZ"</span>
            </p>
          </div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex-shrink-0">Spec Resolver</span>
        </button>
      ) : (
        /* ── Expanded resolver panel ── */
        <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden">

          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between bg-slate-900 border-b border-slate-800">
            <p className="text-xs font-extrabold text-white tracking-widest uppercase">Spec Resolver</p>
            <button
              type="button"
              onClick={handleCollapse}
              className="text-slate-400 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Search Input */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={query}
                maxLength={100}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='e.g. "Vitz 1KR" or "Premio 1NZ 2015"'
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 bg-slate-50 placeholder:text-slate-400 text-slate-800 transition-all"
              />
              <button
                type="button"
                onClick={handleResolve}
                disabled={!query.trim() || status === 'loading'}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer outline-none flex-shrink-0"
              >
                {status === 'loading' ? 'Resolving…' : 'Resolve'}
              </button>
            </div>

            {/* Example chips */}
            {status === 'idle' && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider self-center">Try:</span>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => { setQuery(ex); setTimeout(handleResolve, 50); }}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-all cursor-pointer"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}

            {/* Loading state */}
            {status === 'loading' && (
              <div className="text-center py-6">
                <p className="text-xs font-extrabold text-slate-700">Resolving vehicle specs…</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Checking engine codes, body type, and production years</p>
              </div>
            )}

            {/* Error state */}
            {status === 'error' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs font-extrabold text-slate-800">Could not resolve specs</p>
                <p className="text-[10px] font-medium text-slate-600 mt-0.5">{errorMsg}</p>
                <p className="text-[10px] text-slate-500 mt-1">Try being more specific, e.g. <em>"Toyota Vitz 1KR-FE 2008"</em></p>
              </div>
            )}

            {/* Result card */}
            {status === 'resolved' && result && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">

                {/* Result header */}
                <div className="px-3 py-2.5 bg-slate-900 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-white leading-none">{result.make} {result.model}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{result.engineCode} · {result.productionYears}</p>
                  </div>
                  <div className={`text-[9px] font-extrabold px-2 py-1 rounded-lg border uppercase tracking-wide ${confidenceStyle[result.confidence]}`}>
                    {confidenceLabel[result.confidence]}
                  </div>
                </div>

                {/* Spec grid */}
                <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-slate-100">
                  {[
                    { label: 'Engine',      value: result.engineCode,                              sub: `${result.engineCC.toLocaleString()}cc` },
                    { label: 'Body Type',   value: bodyTypeLabel[result.bodyType] || result.bodyType, sub: '' },
                    { label: 'Fuel',        value: fuelLabel[result.fuelType] || result.fuelType,  sub: '' },
                    { label: 'Age Bracket', value: ageBracketLabel[result.ageBracket] || result.ageBracket, sub: '' },
                  ].map((item) => (
                    <div key={item.label} className="px-3 py-2.5">
                      <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                      <p className="text-[11px] font-extrabold text-slate-800 mt-0.5 leading-tight">{item.value}</p>
                      {item.sub && <p className="text-[9px] font-mono text-slate-500 font-bold mt-0.5">{item.sub}</p>}
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {result.notes && (
                  <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
                    <p className="text-[9.5px] text-slate-500 font-medium leading-relaxed">
                      <span className="font-bold text-slate-600">Note: </span>{result.notes}
                    </p>
                  </div>
                )}

                {/* CTA */}
                <div className="px-3 py-3 border-t border-slate-100 flex gap-2">
                  <button
                    type="button"
                    onClick={handleUseSpecs}
                    className="flex-1 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer outline-none"
                  >
                    Use These Specs
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStatus('idle'); setResult(null); setQuery(''); }}
                    className="px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-400 rounded-xl transition-all cursor-pointer outline-none"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
