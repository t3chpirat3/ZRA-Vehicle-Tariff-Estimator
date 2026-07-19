import React, { useState } from 'react';
import { 
  Search, ShieldAlert, LineChart, Briefcase, FileCheck, 
  CarFront, MapPin, BadgeDollarSign, Anchor
} from 'lucide-react';
import { MarkdownContent } from './MarkdownContent';
import buyersGuideData from '../data/buyersGuideData.json';

const categories = [
  {
    id: 'marketplaces',
    label: 'Marketplaces & Sourcing',
    icon: Search,
    indices: [0, 1, 2, 3, 18, 24, 28],
    desc: 'Understand how platforms operate, where to buy, and the Japanese auction ecosystem.'
  },
  {
    id: 'financials',
    label: 'Financials & Scams',
    icon: BadgeDollarSign,
    indices: [4, 5, 11, 15],
    desc: 'Payment structures, escrow, insider tips, resolving fraud, and missing items.'
  },
  {
    id: 'fraud',
    label: 'Inspections & Fraud',
    icon: ShieldAlert,
    indices: [9, 10, 14, 12],
    desc: 'Odometer verification, JEVIC/QISJ inspections, forged documents, and UI quirks.'
  },
  {
    id: 'assessment',
    label: 'Condition Assessment',
    icon: FileCheck,
    indices: [7, 8, 13, 16, 17],
    desc: 'Reading auction sheets, forensic photo analysis, and source market specific illnesses.'
  },
  {
    id: 'performance',
    label: 'Performance & Tuners',
    icon: LineChart,
    indices: [19, 20],
    desc: 'Sourcing JDM legends, octane mismatch, and RTSA legal traps for off-road modifications.'
  },
  {
    id: 'regulations',
    label: 'Regulations & Final Mile',
    icon: MapPin,
    indices: [21, 22, 23, 26, 27],
    desc: 'Border impounds, transit logistics, LHD exemptions, fitness checklists, and the ultimate tyre guide.'
  },
  {
    id: 'mechanics',
    label: 'Mechanics & Tech',
    icon: CarFront,
    indices: [25],
    desc: 'Understanding engine displacement, range vs efficiency, turbos, and hybrids.'
  }
];

export default function BuyersGuide() {
  const [activeTab, setActiveTab] = useState(categories[0].id);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">
      <div className="bg-[color:var(--surface)] rounded-2xl p-6 sm:p-10 shadow-sm border border-[color:var(--border)]">
        <h2 className="text-3xl font-black font-display text-[color:var(--text)] tracking-tight mb-3">
          The Importer's Knowledge Base
        </h2>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed mb-6">
          The definitive guide to sourcing, vetting, and securely acquiring vehicles from international markets. Learn to spot fraud, decode auction sheets, and avoid the most expensive mistakes in the import pipeline.
        </p>

        {/* Categories Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  isActive 
                  ? 'bw-active' 
                  : 'text-[color:var(--text-muted)] bg-[color:var(--surface-soft)] hover:bg-[color:var(--primary-soft)] hover:text-[color:var(--primary-hover)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Rendering */}
      <div className="space-y-6">
        {categories.map((cat) => {
          if (cat.id !== activeTab) return null;
          return (
            <div key={cat.id} className="animate-fadeIn space-y-6">
              {/* Category Header */}
              <div className="bg-[color:var(--surface-soft)] rounded-xl p-5 border border-[color:var(--border)]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-[color:var(--text)]">
                    <cat.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-[color:var(--text)]">{cat.label}</h3>
                </div>
                <p className="text-[color:var(--text-muted)] text-sm">{cat.desc}</p>
              </div>

              {/* Render each topic inside the category */}
              {cat.indices.map(index => {
                const textContent = buyersGuideData[index];
                if (!textContent) return null;

                return (
                  <div key={index} className="bg-[color:var(--surface)] rounded-2xl p-6 sm:p-8 shadow-sm border border-[color:var(--border)] prose-styles">
                    <MarkdownContent content={textContent} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
