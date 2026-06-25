/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Calculator from './components/Calculator';
import Watchlist from './components/Watchlist';
import ClearingAgents from './components/ClearingAgents';
import ImportGuide from './components/ImportGuide';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse';
import { WatchlistItem } from './types';

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

/**
 * A spiky, rippling monochrome blob that trails the pointer.
 *
 * The body is a closed membrane whose radius is driven by layered sine waves,
 * so it gently undulates at rest. Pointer velocity pumps "ripple energy" into a
 * traveling wave that rolls around the rim — biased toward the direction of
 * travel — so moving the cursor sends a wash of spikes rippling around it,
 * echoing the Antigravity feel. Rendered on a full-viewport canvas.
 */
function CursorBlob() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // A soft radial body fill, defined once at the origin and reused every
    // frame (the per-frame translate maps it onto the blob's current centre).
    const bodyGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 110);
    bodyGrad.addColorStop(0, 'rgba(0,0,0,0.20)');
    bodyGrad.addColorStop(0.6, 'rgba(0,0,0,0.11)');
    bodyGrad.addColorStop(1, 'rgba(0,0,0,0)');

    let targetX = width / 2;
    let targetY = height / 2;
    let x = targetX;
    let y = targetY;
    let prevX = x;
    let prevY = y;
    let ripple = 0; // movement-driven energy that decays over time
    let moveAngle = 0; // direction of the most recent movement
    let t = 0;
    let raf = 0;

    const SPIKES = 220;
    const BASE = 78; // resting body radius (px)
    const SPIKE = 34; // max spike length (px)
    const TWO_PI = Math.PI * 2;

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const render = () => {
      t += 0.016;

      x += (targetX - x) * 0.16;
      y += (targetY - y) * 0.16;

      const dx = x - prevX;
      const dy = y - prevY;
      const speed = Math.hypot(dx, dy);
      prevX = x;
      prevY = y;
      if (speed > 0.4) moveAngle = Math.atan2(dy, dx);
      // Inject energy on movement, then bleed it off so ripples fade out.
      ripple = Math.min(ripple + speed * 0.5, 26) * 0.95;

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(x, y);

      ctx.beginPath();
      const tips: number[] = [];
      for (let i = 0; i <= SPIKES; i++) {
        const a = (i / SPIKES) * TWO_PI;
        const cos = Math.cos(a);
        const sin = Math.sin(a);

        // Ambient breathing of the membrane.
        const ambient =
          Math.sin(a * 4 + t * 0.8) * 6 +
          Math.sin(a * 7 - t * 1.3) * 4 +
          Math.sin(a * 2 + t * 0.5) * 3;
        // Traveling ripple, strongest on the side the cursor is heading toward.
        const dir = 0.5 + 0.5 * Math.cos(a - moveAngle);
        const wave = Math.sin(a * 9 - t * 6) * ripple * dir;

        const membrane = BASE + ambient + wave * 0.5;
        const spikeLen =
          SPIKE * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(a * 14 + t * 2.2))) + wave;
        const tip = membrane + spikeLen;

        tips.push(cos * membrane, sin * membrane);

        // Each spike is a thin radial line from membrane to tip.
        ctx.moveTo(cos * membrane, sin * membrane);
        ctx.lineTo(cos * tip, sin * tip);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.14)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // Soft body filling the membrane outline.
      ctx.beginPath();
      ctx.moveTo(tips[0], tips[1]);
      for (let i = 2; i < tips.length; i += 2) ctx.lineTo(tips[i], tips[i + 1]);
      ctx.closePath();
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      ctx.restore();
      raf = requestAnimationFrame(render);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        prevX = x;
        prevY = y;
        raf = requestAnimationFrame(render);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas id="cursor-blob" ref={canvasRef} aria-hidden="true" />;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<'calc' | 'watchlist' | 'agents' | 'guide' | 'privacy' | 'terms'>('calc');
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
    <div className="text-black h-[100dvh] font-sans flex flex-col overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      {/* Reactive cursor-tracking blob */}
      <CursorBlob />

      {/* Splash Screen */}
      {showSplash && (
        <div
          className={`fixed inset-0 flex flex-col items-center justify-center bg-white z-[9999] transition-opacity duration-500 ease-in-out ${
            isAnimatingOut ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex flex-col items-center justify-center animate-pulse">
            <BrandMark className="w-24 h-24 mb-6" />
            <h1 className="text-4xl font-black font-display text-black tracking-tight text-center">
              {'{ZRA}'}
            </h1>
            <p className="text-xs text-neutral-500 font-bold tracking-widest uppercase mt-2">
              {'{Vehicle Tariff Estimator}'}
            </p>
          </div>
        </div>
      )}

      {/* App Header Bar */}
      <header id="main-app-header" className="relative z-10 bg-white py-3 border-b border-neutral-200 flex-shrink-0">
        <div className="container mx-auto px-4 max-w-7xl flex items-center gap-6 sm:gap-8 md:gap-10 overflow-x-auto scrollbar-none">
          <button
            className="flex flex-shrink-0 items-center gap-3 pr-2 cursor-pointer text-left focus:outline-none"
            onClick={() => setActiveTab('calc')}
          >
            <div className="flex-shrink-0">
              <BrandMark className="w-10 h-10" />
            </div>
            <div className="flex flex-col justify-center border-r border-neutral-200 pr-6 group">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display text-black leading-none group-hover:text-neutral-500 transition-colors">
                {'{ZRA}'}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 font-bold tracking-tight uppercase mt-0.5 leading-none whitespace-nowrap group-hover:text-neutral-700 transition-colors">
                {'{Vehicle Tariff Estimator}'}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-6 sm:gap-8 text-[11px] sm:text-xs font-bold text-neutral-500">
            <button
              onClick={() => setActiveTab('calc')}
              className={`transition-colors whitespace-nowrap hover:text-black ${activeTab === 'calc' ? 'text-black' : ''}`}
            >
              {'{Calculate Duty}'}
            </button>
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`transition-colors whitespace-nowrap hover:text-black flex items-center gap-1.5 ${activeTab === 'watchlist' ? 'text-black' : ''}`}
            >
              {'{Watchlist}'}
              {watchlistCount > 0 && (
                <span className={`text-[9px] font-black rounded-full px-1.5 py-0.5 ${activeTab === 'watchlist' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                  {watchlistCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`transition-colors whitespace-nowrap hover:text-black ${activeTab === 'agents' ? 'text-black' : ''}`}
            >
              {'{Clearing Agents}'}
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`transition-colors whitespace-nowrap hover:text-black ${activeTab === 'guide' ? 'text-black' : ''}`}
            >
              {'{Import Guide}'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Panels — fills remaining height; only scrolls when content demands it */}
      <main className="relative z-10 flex-1 min-h-0 overflow-y-auto">
        <div className="container mx-auto px-4 max-w-7xl py-4 h-full">
          {activeTab === 'calc' && (
            <div className="animate-fadeIn h-full">
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
            <div className="animate-fadeIn h-full">
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

      {/* Slim Monochrome Footer */}
      <footer className="relative z-10 bg-white border-t border-neutral-200 py-2 flex-shrink-0">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10px] text-neutral-500">
          <p className="text-center sm:text-left leading-tight">
            <span className="font-extrabold text-black font-display">{'{ZRA Vehicle Tariff Estimator}'}</span>
            <span className="mx-1.5 hidden sm:inline">·</span>
            <span className="block sm:inline">&copy; 2026 · Independent estimator by{' '}
              <a href="https://shadreck.carrd.co/" target="_blank" rel="noopener noreferrer" className="text-black underline hover:no-underline font-semibold">t3chpirat3</a>.
              Not affiliated with the ZRA. Estimates only.
            </span>
          </p>
          <div className="flex gap-4 font-semibold text-black flex-shrink-0">
            <button onClick={() => setActiveTab('privacy')} className="hover:underline cursor-pointer">{'{Privacy}'}</button>
            <button onClick={() => setActiveTab('terms')} className="hover:underline cursor-pointer">{'{Terms}'}</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
