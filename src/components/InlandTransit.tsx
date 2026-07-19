import React, { useState, useEffect } from 'react';
import { INLAND_ROUTES as FALLBACK_ROUTES, CARBON_TAX_ZMW } from '../data/inlandData';
import { Truck, Navigation, Clock, Banknote, ShieldAlert, AlertTriangle, Ship } from 'lucide-react';
import { getApiUrl } from '../utils/api';

export default function InlandTransit() {
  const [inlandRoutes, setInlandRoutes] = useState<any[]>(FALLBACK_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState<string>(FALLBACK_ROUTES[0].id);
  const [engineCC, setEngineCC] = useState<number>(1800);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const res = await fetch(getApiUrl('/api/app-data?type=inland'));
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            setInlandRoutes(json.data);
            setSelectedRoute(json.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dynamic inland routes', err);
      }
    }
    fetchRoutes();
  }, []);

  const route = inlandRoutes.find(r => r.id === selectedRoute) || inlandRoutes[0];
  const carbonTax = CARBON_TAX_ZMW.find(c => engineCC <= c.maxCC) || CARBON_TAX_ZMW[CARBON_TAX_ZMW.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[color:var(--surface)] rounded-2xl border border-[color:var(--border)] p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[color:var(--primary-soft)] text-[color:var(--primary)] flex items-center justify-center flex-shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[color:var(--text)]">Inland Transport Estimator</h2>
            <p className="text-sm text-slate-500 mt-1">
              Estimate carrier costs, toll fees, and transit times for the final leg of your vehicle's journey into Zambia.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[color:var(--surface)] rounded-2xl border border-[color:var(--border)] p-5 shadow-sm">
            <h3 className="font-semibold text-[color:var(--text)] mb-4 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-500" />
              Select Route
            </h3>
            
            <div className="space-y-3">
              {inlandRoutes.map(r => (
                <label 
                  key={r.id}
                  className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedRoute === r.id 
                      ? 'border-[color:var(--primary)] bg-[color:var(--primary-soft)]' 
                      : 'border-slate-100 bg-[color:var(--surface-soft)] hover:border-[color:var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="route" 
                      value={r.id} 
                      checked={selectedRoute === r.id}
                      onChange={() => setSelectedRoute(r.id)}
                      className="w-4 h-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                    />
                    <span className="font-bold text-sm text-[color:var(--text)] leading-tight">{r.label}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="font-semibold text-[color:var(--text)] mb-3 text-sm">Vehicle Engine Size (CC)</h3>
              <p className="text-[10px] text-slate-500 mb-2 leading-tight">Used to calculate the mandatory Zambia Carbon Emission Surtax at the border.</p>
              <input 
                type="number" 
                value={engineCC || ''}
                onChange={e => setEngineCC(parseInt(e.target.value) || 0)}
                placeholder="e.g. 1800"
                className="w-full bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[color:var(--primary)] focus:ring-1 focus:ring-[color:var(--primary)]"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[color:var(--surface)] rounded-2xl border border-[color:var(--border)] p-6 shadow-sm">
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-[color:var(--text)]">{route.origin} to {route.destination}</h3>
                <p className="text-sm text-slate-500 mt-1">{route.description}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full">
                Mode: {route.transportMode}
              </span>
            </div>

            {!route.unregisteredAllowed && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-800 text-sm">Strict Transport Regulations</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Unregistered vehicles from ports cannot be driven locally on South African roads. You <strong>must</strong> use a bonded carrier to transport the vehicle out of the country.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {/* Cost Card */}
              <div className="p-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] flex flex-col justify-center">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Banknote className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Est. Carrier / Fuel Cost</span>
                </div>
                <div className="text-2xl font-black text-[color:var(--text)]">
                  ${route.estimatedCostMin.toLocaleString()} - ${route.estimatedCostMax.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">* Varies based on vehicle CBM size, fuel prices, and clearing agent.</p>
              </div>

              {/* Transit Card */}
              <div className="p-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] flex flex-col justify-center">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Est. Transit Time</span>
                </div>
                <div className="text-2xl font-black text-[color:var(--text)]">
                  {route.transitDaysMin} - {route.transitDaysMax} Days
                </div>
                <p className="text-[10px] text-slate-400 mt-1">* Includes typical border congestion delays.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-[color:var(--text)] border-b border-slate-100 pb-2">Mandatory Border Fees & Levies</h4>
              <ul className="space-y-3">
                {route.borderFees.map((fee, idx) => (
                  <li key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-[color:var(--text-muted)] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      {fee.name}
                    </span>
                    <span className="font-bold text-[color:var(--text)]">~${fee.estimatedCostUSD}</span>
                  </li>
                ))}
                <li className="flex items-center justify-between text-sm">
                  <span className="text-[color:var(--text-muted)] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    Zambia Carbon Emission Surtax ({engineCC || 0}cc)
                  </span>
                  <span className="font-bold text-[color:var(--text)]">{carbonTax.feeZMW.toFixed(2)} ZMW</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-[color:var(--surface-soft)] text-[11px] text-slate-500 flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <p>
                <strong>Disclaimer:</strong> All inland logistics costs are estimates intended for planning purposes. Market rates for car carriers fluctuate based on fuel prices, seasonal demand, and specific clearing agent markups. Always request an official quote from your clearing agent.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
