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
import Logistics from './components/Logistics';
import AdminPanel from './components/AdminPanel';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse';
import PriceComparison from './components/PriceComparison';
import FaqSection from './components/FaqSection';
import { WatchlistItem } from './types';
import { Shield, Menu, X, WifiOff } from 'lucide-react';
import { useNetworkStatus } from './hooks/useNetworkStatus';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calc' | 'discover' | 'watchlist' | 'agents' | 'guide' | 'compare' | 'privacy' | 'terms' | 'logistics' | 'admin'>('calc');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const isOffline = useNetworkStatus();

  // Implement splash screen exit
  useEffect(() => {
    const timer1 = setTimeout(() => setIsAnimatingOut(true), 1800);
    const timer2 = setTimeout(() => setShowSplash(false), 2400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Handle hidden admin route
  useEffect(() => {
    const handleLocationChange = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        setActiveTab('admin');
        setShowSplash(false);
        // Normalize URL if it was a hash
        if (window.location.hash === '#admin') {
          window.history.replaceState(null, '', '/admin');
        }
      }
    };
    handleLocationChange();
    
    // Fallback: handle popstate if using browser back/forward
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const changeTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'admin') {
      window.history.pushState(null, '', '/admin');
    } else if (window.location.pathname === '/admin') {
      window.history.pushState(null, '', '/');
    }
  };

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
    changeTab('watchlist');

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
    { id: 'logistics', label: 'Logistics' },
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
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent group-hover:from-emerald-500 group-hover:to-teal-400 transition-colors text-4xl font-black font-display tracking-tight text-center">
                Duty Boss
              </span>
              <span className="hidden sm:inline font-bold text-slate-500 text-sm uppercase tracking-widest mt-2">
                Import Planning Platform
              </span>
          </div>
        </div>
      )}

      {/* Sticky Legal Disclaimer Banner */}
        <div className="bg-slate-900 text-amber-400 text-[10px] sm:text-xs font-bold text-center px-4 py-2 flex items-center justify-center gap-2 border-b border-slate-800 shadow-sm relative z-50">
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
          <span>Duty Boss is an independent tool built to help Zambians estimate vehicle import costs. We are not affiliated with the Zambia Revenue Authority (ZRA).</span>
        </div>

        {/* App Header Bar — sticky so navigation stays in reach during the single page scroll */}
        <header
          id="main-app-header"
          className="sticky top-0 z-30 bg-[color:var(--surface)]/85 backdrop-blur-md border-b border-[color:var(--border)]"
        >
          <div className="container mx-auto px-4 max-w-7xl flex items-center gap-4 sm:gap-8 py-3">
            <button
              className="flex flex-shrink-0 items-center gap-3 pr-2 cursor-pointer text-left focus:outline-none rounded-xl"
              onClick={() => changeTab('calc')}
            >
              <BrandMark className="w-10 h-10 flex-shrink-0" />
              <div className="flex flex-col">
                  <span className="font-bold text-[color:var(--text)] leading-tight text-lg font-display tracking-tight">Duty Boss</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Import Planning Platform
                  </span>
              </div>
            </button>

            <div className="ml-auto hidden sm:flex items-center gap-4">
              {isOffline && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold shadow-sm animate-pulse">
                  <WifiOff className="w-3.5 h-3.5" />
                  Offline
                </div>
              )}
              <nav className="flex items-center gap-2 text-[13px] font-semibold">
                {navTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => changeTab(tab.id)}
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

            {isOffline && (
              <div className="ml-auto sm:hidden flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold shadow-sm mr-2 animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
              </div>
            )}

            <button 
              className={`${isOffline ? '' : 'ml-auto'} sm:hidden p-2 -mr-2 rounded-xl text-[color:var(--text)] hover:bg-[color:var(--surface-soft)] focus:outline-none`}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
        </header>

      {/* Mobile Slide-out Drawer */}
      <div 
        className={`fixed inset-0 z-[100] transform transition-transform duration-300 ease-in-out sm:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div 
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`} 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
        <div className="absolute inset-y-0 left-0 w-[280px] bg-[color:var(--bg)] border-r border-[color:var(--border)] shadow-2xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[color:var(--border)]">
             <div className="flex items-center gap-3">
               <BrandMark className="w-8 h-8 flex-shrink-0" />
               <span className="font-bold text-[color:var(--text)] text-lg font-display tracking-tight">Duty Boss</span>
             </div>
             <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-[color:var(--text-muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--surface-soft)] rounded-lg">
                <X className="w-6 h-6" />
             </button>
          </div>
          <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1.5">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    changeTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3.5 rounded-xl flex items-center justify-between text-left transition-colors font-semibold ${
                    isActive
                      ? 'bg-[color:var(--primary-soft)] text-[color:var(--primary-hover)]'
                      : 'text-[color:var(--text-muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--surface-soft)]'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'watchlist' && watchlistCount > 0 && (
                    <span
                      className={`text-xs font-bold rounded-full min-w-[22px] h-[22px] inline-flex items-center justify-center px-1.5 ${
                        isActive ? 'bg-[color:var(--primary)] text-white' : 'bg-[color:var(--border-strong)] text-[color:var(--text)]'
                      }`}
                    >
                      {watchlistCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace — one natural page scroll, no nested scroll areas */}
      <main className="relative z-10 flex-1">
        <div className="container mx-auto px-4 max-w-7xl py-5">
          {activeTab === 'calc' && (
            <div className="animate-fadeIn">
              <Calculator onSaveToWatchlist={handleSaveToWatchlistFromCalculator} />
              <FaqSection />
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
          {activeTab === 'logistics' && (
            <div className="animate-fadeIn">
              <Logistics />
            </div>
          )}
          {activeTab === 'admin' && (
            <div className="animate-fadeIn">
              {isOffline ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-[color:var(--border)] shadow-sm">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <WifiOff className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Offline Mode</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    The Admin Panel requires an active internet connection to communicate with the secure server. Please reconnect to access administrative features.
                  </p>
                </div>
              ) : (
                <AdminPanel />
              )}
            </div>
          )}
          {activeTab === 'privacy' && (
            <div className="animate-fadeIn">
              <PrivacyPolicy onClose={() => changeTab('calc')} />
            </div>
          )}
          {activeTab === 'terms' && (
            <div className="animate-fadeIn">
              <TermsOfUse onClose={() => changeTab('calc')} />
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
            <span className="block sm:inline">&copy; 2026 · Independent import platform by{' '}
              <a href="https://shadreck.carrd.co/" target="_blank" rel="noopener noreferrer" className="text-[color:var(--primary-hover)] underline hover:no-underline font-semibold">t3chpirat3</a>.
              Duty Boss uses official public ZRA tariff schedules but is completely independent.
            </span>
          </p>
          <div className="flex gap-4 font-semibold text-[color:var(--text)] flex-shrink-0">
            <button onClick={() => changeTab('privacy')} className="hover:text-[color:var(--primary-hover)] cursor-pointer">Privacy</button>
            <button onClick={() => changeTab('terms')} className="hover:text-[color:var(--primary-hover)] cursor-pointer">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
