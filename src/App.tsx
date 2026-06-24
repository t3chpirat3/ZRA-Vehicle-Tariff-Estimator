/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calculator as CalcIcon, Bookmark, Settings, Car, Shield } from 'lucide-react';
import Calculator from './components/Calculator';
import Watchlist from './components/Watchlist';
import ClearingAgents from './components/ClearingAgents';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse';
import { WatchlistItem, zmwFormat } from './types';

const WATCHLIST_LOCAL_KEY = 'zra_vehicle_watchlist_v1';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<'calc' | 'watchlist' | 'agents' | 'privacy' | 'terms'>('calc');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  // Implement splash screen exit
  useEffect(() => {
    const timer1 = setTimeout(() => setIsAnimatingOut(true), 1800);
    const timer2 = setTimeout(() => setShowSplash(false), 2400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Intermediate bridge states to pre-fill Watchlist additions
  const [lastCalcTotal, setLastCalcTotal] = useState<number>(0);
  const [lastCalcUSD, setLastCalcUSD] = useState<number>(0);
  const [lastCalcFx, setLastCalcFx] = useState<number>(0);

  // Load from local storage initially
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_LOCAL_KEY);
      if (stored) {
        setWatchlist(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse watchlist from localStorage:', e);
    }
  }, []);

  // Save updates to local storage
  const handleUpdateWatchlist = (newList: WatchlistItem[]) => {
    setWatchlist(newList);
    try {
      localStorage.setItem(WATCHLIST_LOCAL_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save watchlist to localStorage:', e);
    }
  };

  // Callback when user taps "Save to Watchlist" within Calculator side results
  const handleSaveToWatchlistFromCalculator = (total: number, cifUSD: number, fx: number) => {
    setLastCalcTotal(total);
    setLastCalcUSD(cifUSD);
    setLastCalcFx(fx);
    setActiveTab('watchlist');

    // Smooth scroll down to the "Add Vehicle to Watchlist" form
    setTimeout(() => {
      const el = document.getElementById('watchlist-add-form');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const watchlistCount = watchlist.length;

  return (
    <div className="bg-slate-50 min-h-[100dvh] font-sans flex flex-col justify-between pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      {/* Splash Screen */}
      {showSplash && (
        <div
          className={`fixed inset-0 flex flex-col items-center justify-center bg-white z-[9999] transition-opacity duration-500 ease-in-out ${
            isAnimatingOut ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex flex-col items-center justify-center animate-pulse">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 drop-shadow-sm mb-6">
              <path d="M50 90 C 50 90, 85 75, 85 45 V 20 L 50 5 L 15 20 V 45 C 15 75, 50 90, 50 90 Z" fill="#1e293b"/>
              <path d="M50 82 C 50 82, 77 70, 77 45 V 25 L 50 13 L 23 25 V 45 C 23 70, 50 82, 50 82 Z" fill="#10b981"/>
              <path d="M30 55 L 70 55" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <path d="M35 55 L 40 40 L 60 40 L 65 55" stroke="white" strokeWidth="4" strokeLinejoin="round"/>
              <rect x="30" y="55" width="40" height="15" rx="3" fill="white"/>
              <circle cx="38" cy="62" r="3" fill="#1e293b"/>
              <circle cx="62" cy="62" r="3" fill="#1e293b"/>
            </svg>
            <h1 className="text-4xl font-black font-display text-slate-800 tracking-tight text-center">
              ZRA
            </h1>
            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-2">
              Vehicle Tariff Estimator
            </p>
          </div>
        </div>
      )}

      <div>
        
        {/* App Header Bar */}
        <header id="main-app-header" className="bg-white py-3 border-b border-slate-200">
          <div className="container mx-auto px-4 max-w-7xl flex items-center gap-6 sm:gap-8 md:gap-10 overflow-x-auto scrollbar-none">
            <button 
              className="flex flex-shrink-0 items-center gap-3 pr-2 cursor-pointer text-left focus:outline-none"
              onClick={() => setActiveTab('calc')}
            >
              <div className="flex-shrink-0">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 drop-shadow-sm">
                  <path d="M50 90 C 50 90, 85 75, 85 45 V 20 L 50 5 L 15 20 V 45 C 15 75, 50 90, 50 90 Z" fill="#1e293b"/>
                  <path d="M50 82 C 50 82, 77 70, 77 45 V 25 L 50 13 L 23 25 V 45 C 23 70, 50 82, 50 82 Z" fill="#10b981"/>
                  <path d="M30 55 L 70 55" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M35 55 L 40 40 L 60 40 L 65 55" stroke="white" strokeWidth="4" strokeLinejoin="round"/>
                  <rect x="30" y="55" width="40" height="15" rx="3" fill="white"/>
                  <circle cx="38" cy="62" r="3" fill="#1e293b"/>
                  <circle cx="62" cy="62" r="3" fill="#1e293b"/>
                </svg>
              </div>
              <div className="flex flex-col justify-center border-r border-slate-200 pr-6 group">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display text-slate-800 leading-none group-hover:text-emerald-600 transition-colors">
                  ZRA
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold tracking-tight uppercase mt-0.5 leading-none whitespace-nowrap group-hover:text-emerald-500 transition-colors">
                  Vehicle Tariff Estimator
                </p>
              </div>
            </button>

            <div className="flex items-center gap-6 sm:gap-8 text-[11px] sm:text-xs font-bold text-slate-500">
              <button
                onClick={() => setActiveTab('calc')}
                className={`transition-colors whitespace-nowrap hover:text-slate-900 ${activeTab === 'calc' ? 'text-slate-900' : ''}`}
              >
                Calculate Duty
              </button>
              <button
                onClick={() => setActiveTab('watchlist')}
                className={`transition-colors whitespace-nowrap hover:text-slate-900 flex items-center gap-1.5 ${activeTab === 'watchlist' ? 'text-slate-900' : ''}`}
              >
                Watchlist
                {watchlistCount > 0 && (
                  <span className={`text-[9px] font-black rounded-full px-1.5 py-0.5 ${activeTab === 'watchlist' ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500'}`}>
                    {watchlistCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('agents')}
                className={`transition-colors whitespace-nowrap hover:text-slate-900 ${activeTab === 'agents' ? 'text-slate-900' : ''}`}
              >
                Clearing Agents
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace Panels */}
        <main className="container mx-auto px-4 max-w-7xl pt-5 pb-12 transition-all duration-300">
          {activeTab === 'calc' && (
            <div className="animate-fadeIn">
              <Calculator onSaveToWatchlist={handleSaveToWatchlistFromCalculator} />
            </div>
          )}
          {activeTab === 'watchlist' && (
            <div className="animate-fadeIn">
              <Watchlist
                watchlist={watchlist}
                onUpdateWatchlist={handleUpdateWatchlist}
                lastCalcTotal={lastCalcTotal}
                lastCalcUSD={lastCalcUSD}
                lastCalcFx={lastCalcFx}
                onActivated={() => {}}
              />
            </div>
          )}
          {activeTab === 'agents' && (
            <div className="animate-fadeIn">
              <ClearingAgents />
            </div>
          )}
          {activeTab === 'privacy' && (
            <div className="animate-fadeIn">
              <PrivacyPolicy onClose={() => setActiveTab('calc')} />
            </div>
          )}
          {activeTab === 'terms' && (
            <div className="animate-fadeIn">
              <TermsOfUse onClose={() => setActiveTab('calc')} />
            </div>
          )}
        </main>

      </div>

      {/* Custom Monochrome Footer */}
      <footer className="bg-slate-900 border-t border-slate-950 py-8 text-center sm:text-left text-slate-500 text-xs mt-auto">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 grayscale opacity-80 flex-shrink-0">
              <path d="M50 90 C 50 90, 85 75, 85 45 V 20 L 50 5 L 15 20 V 45 C 15 75, 50 90, 50 90 Z" fill="#cbd5e1" opacity="0.3"/>
              <path d="M50 82 C 50 82, 77 70, 77 45 V 25 L 50 13 L 23 25 V 45 C 23 70, 50 82, 50 82 Z" fill="#94a3b8" opacity="0.2"/>
              <path d="M30 55 L 70 55" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-slate-300"/>
              <path d="M35 55 L 40 40 L 60 40 L 65 55" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" className="text-slate-300"/>
              <rect x="30" y="55" width="40" height="15" rx="3" fill="currentColor" className="text-slate-300"/>
              <circle cx="38" cy="62" r="3" fill="currentColor" className="text-slate-900"/>
              <circle cx="62" cy="62" r="3" fill="currentColor" className="text-slate-900"/>
            </svg>
            <div>
              <p className="font-extrabold text-slate-200 text-sm tracking-tight font-display mb-1">
                ZRA <span className="font-medium text-[11px] text-slate-400 uppercase tracking-widest ml-1">Vehicle Tariff Estimator</span>
              </p>
              <p className="text-[10px] text-slate-500">
                &copy; 2026 ZRA VEHICLE TARIFF ESTIMATOR. All rights reserved.
              </p>
              <p className="text-[10px] text-slate-500 mt-2">
                Created independently by <a href="https://shadreck.carrd.co/" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">t3chpirat3</a>.
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Not affiliated with or endorsed by the Zambia Revenue Authority (ZRA). All calculation outputs are estimates for informational purposes only.
              </p>
            </div>
          </div>
          <div className="flex gap-4 font-medium text-slate-400">
            <button onClick={() => setActiveTab('privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
            <button onClick={() => setActiveTab('terms')} className="hover:text-white transition-colors cursor-pointer">Terms of Use</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
