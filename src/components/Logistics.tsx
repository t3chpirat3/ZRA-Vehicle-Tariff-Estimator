import React, { useState } from 'react';
import ShippingSchedule from './ShippingSchedule';
import InlandTransit from './InlandTransit';
import { Ship, Truck } from 'lucide-react';

export default function Logistics() {
  const [activeTab, setActiveTab] = useState<'maritime' | 'inland'>('maritime');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[color:var(--text)]">
          Logistics & Transport
        </h1>
        
        {/* Sub-navigation for Logistics */}
        <div className="flex bg-[color:var(--surface-soft)] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('maritime')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'maritime' 
                ? 'bg-[color:var(--surface)] text-[color:var(--primary)] shadow-sm' 
                : 'text-slate-500 hover:text-[color:var(--text-muted)]'
            }`}
          >
            <Ship className="w-4 h-4" />
            Maritime
          </button>
          <button
            onClick={() => setActiveTab('inland')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'inland' 
                ? 'bg-[color:var(--surface)] text-[color:var(--primary)] shadow-sm' 
                : 'text-slate-500 hover:text-[color:var(--text-muted)]'
            }`}
          >
            <Truck className="w-4 h-4" />
            Inland
          </button>
        </div>
      </div>

      <div className="animate-fadeIn">
        {activeTab === 'maritime' ? <ShippingSchedule /> : <InlandTransit />}
      </div>
    </div>
  );
}
