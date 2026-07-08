/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Calculator from './components/Calculator';
import VehicleDiscovery from './components/VehicleDiscovery';
import Watchlist from './components/Watchlist';
import ClearingAgents from './components/ClearingAgents';
import ImportGuide from './components/ImportGuide';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse';
import PriceComparison from './components/PriceComparison';
import { WatchlistItem } from './types';
import { Shield } from 'lucide-react';

const WATCHLIST_LOCAL_KEY = 'zra_vehicle_watchlist_v1';

/** Monochrome brand mark — pure black shield with a grey inner plate. */
const BrandMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M50 90 C 50 90, 85 75, 85 45 V 20 L 50 5 L 15 20 V 45 C 15 75, 50 90, 50 90 Z" fill="#000000" />
    <path d="M50 82 C 50 82, 77 70, 77 45 V 25 L 50 13 L 23 25 V 45 C 23 70, 50 82, 50 82 Z" fill="#525252" />
    <path d="M30 55 L 70 55" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <path d="M35 55 L 40 40 L 60 40 L 65 55" stroke="white" strokeWidth="4" strokeLinejoin="round" />
    <rect x="30" y="55" width="40" height="15" rx="3" fill="white" />
    <circle cx="38" cy="62" r="3" fill="#000000" />
    <circle cx="62" cy="62" r="3" fill="#000000" />
  </svg>
);

/** A soft grey glow that smoothly trails the mouse pointer. The animation loop
 *  idles whenever the pointer is still, so it costs nothing at rest. */
function CursorBlob() {
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const blob = blobRef.current;
    if (!blob) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let frame = 0;
    let running = false;

    const render = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      blob.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;

      if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
        frame = requestAnimationFrame(render);
      } else {
        running = false;
      }
    };

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!running) {
        running = true;
        frame = requestAnimationFrame(render);
      }
    };

    blob.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div id="cursor-blob" ref={blobRef} aria-hidden="true" />;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<'calc' | 'discover' | 'watchlist' | 'agents' | 'guide' | 'compare' | 'privacy' | 'terms'>('calc');
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

  const navTabs: { id: typeof activeTab; label: string }[] = [
    { id: 'calc', label: 'Calculate Duty' },
    { id: 'discover', label: 'Find Your Vehicle' },
    { id: 'watchlist', label: 'Watchlist' },
    { id: 'compare', label: 'Price Comparison' },
    { id: 'agents', label: 'Clearing Agents' },
    { id: 'guide', label: 'Import Guide' },
  ];

  return (
    <div className="min-h-[100dvh] font-sans flex flex-col text-[color:var(--text)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      {/* Reactive cursor-tracking blob */}
      <CursorBlob />

      {/* Splash Screen */}
      {showSplash && (
        <div
          id="splash-screen"
          className={`fixed inset-0 flex flex-col items-center justify-center bg-[color:var(--bg)] z-[9999] transition-opacity duration-500 ease-in-out ${
            isAnimatingOut ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex flex-col items-center justify-center animate-pulse">
            <BrandMark className="w-24 h-24 mb-6" />
            <h1 className="text-4xl font-black font-display tracking-tight text-center">
              DUTY BOSS
            </h1>
            <p className="text-xs text-[color:var(--text-muted)] font-bold tracking-widest uppercase mt-2">
              Vehicle Tariff Estimator
            </p>
          </div>
        </div>
      )}

      {/* Sticky Legal Disclaimer Banner */}
        <div className="bg-slate-900 text-amber-400 text-[10px] sm:text-xs font-bold text-center px-4 py-2 flex items-center justify-center gap-2 border-b border-slate-800 shadow-sm relative z-50">
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
          <span>Duty Boss is an independent tool. We are NOT affiliated with, endorsed by, or operated by the Zambia Revenue Authority (ZRA).</span>
        </div>

        {/* App Header Bar — sticky so navigation stays in reach during the single page scroll */}
        <header
          id="main-app-header"
          className="sticky top-0 z-30 bg-[color:var(--surface)]/85 backdrop-blur-md border-b border-[color:var(--border)]"
        >
          <div className="container mx-auto px-4 max-w-7xl flex items-center gap-4 sm:gap-8 py-3">
            <button
              className="flex flex-shrink-0 items-center gap-3 pr-2 cursor-pointer text-left focus:outline-none rounded-xl"
              onClick={() => setActiveTab('calc')}
            >
              <BrandMark className="w-10 h-10 flex-shrink-0" />
              <div className="flex flex-col justify-center">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display leading-none">
                  DUTY BOSS
                </h1>
                <p className="text-[10px] sm:text-[11px] text-[color:var(--text-muted)] font-bold tracking-tight uppercase mt-0.5 leading-none whitespace-nowrap">
                  Vehicle Tariff Estimator
                </p>
              </div>
          </button>

          <nav className="ml-auto flex items-center gap-1 sm:gap-2 text-[11px] sm:text-[13px] font-semibold overflow-x-auto scrollbar-none">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-[color:var(--primary-soft)] text-[color:var(--primary-hover)]'
                      : 'text-[color:var(--text-muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--surface-soft)]'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'watchlist' && watchlistCount > 0 && (
                    <span
                      className={`text-[10px] font-bold rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 ${
                        isActive ? 'bg-[color:var(--primary)] text-white' : 'bg-[color:var(--border-strong)] text-[color:var(--text)]'
                      }`}
                    >
                      {watchlistCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Workspace — one natural page scroll, no nested scroll areas */}
      <main className="relative z-10 flex-1">
        <div className="container mx-auto px-4 max-w-7xl py-5">
          {activeTab === 'calc' && (
            <div className="animate-fadeIn">
              <Calculator onSaveToWatchlist={handleSaveToWatchlistFromCalculator} />
            </div>
          )}
          {activeTab === 'discover' && (
            <div className="animate-fadeIn">
              <VehicleDiscovery />
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
          {activeTab === 'compare' && (
            <div className="animate-fadeIn">
              <PriceComparison />
            </div>
          )}
          {activeTab === 'agents' && (
            <div className="animate-fadeIn">
              <ClearingAgents />
            </div>
          )}
          {activeTab === 'guide' && (
            <div className="animate-fadeIn">
              <ImportGuide />
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
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-[color:var(--surface)] border-t border-[color:var(--border)] py-3 mt-2">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-[color:var(--text-muted)]">
          <p className="text-center sm:text-left leading-tight">
            <span className="font-extrabold text-[color:var(--text)] font-display">DUTY BOSS</span>
            <span className="mx-1.5 hidden sm:inline">·</span>
            <span className="block sm:inline">&copy; 2026 · Independent estimator by{' '}
              <a href="https://shadreck.carrd.co/" target="_blank" rel="noopener noreferrer" className="text-[color:var(--primary-hover)] underline hover:no-underline font-semibold">t3chpirat3</a>.
              Not affiliated with the Zambia Revenue Authority (ZRA). Estimates only.
            </span>
          </p>
          <div className="flex gap-4 font-semibold text-[color:var(--text)] flex-shrink-0">
            <button onClick={() => setActiveTab('privacy')} className="hover:text-[color:var(--primary-hover)] cursor-pointer">Privacy</button>
            <button onClick={() => setActiveTab('terms')} className="hover:text-[color:var(--primary-hover)] cursor-pointer">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
