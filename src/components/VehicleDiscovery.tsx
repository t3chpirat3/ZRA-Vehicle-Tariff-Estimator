/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * VehicleDiscovery.tsx
 * A short, friendly questionnaire that suggests alternative vehicle models for
 * the Zambian buyer — ranked by fit, budget (landed, incl. duty), and
 * repairability (engine ubiquity). A deterministic engine does the ranking;
 * DeepSeek adds tailored explanations and a couple of off-the-radar ideas when
 * it is configured.
 */

import React, { useMemo, useState } from 'react';
import { FuelType } from '../types';
import { UseCase, Terrain, BodyStyle } from '../data/vehiclesData';
import {
  DiscoveryProfile,
  RecommendationResult,
  ScoredVehicle,
  Repairability,
  recommend,
} from '../utils/discovery';
import { AIInsight, enhanceWithAI, isAIConfigured } from '../utils/deepseekDiscovery';
import { MarketplaceLink, marketplaceLinks, keywordMarketplaceLinks } from '../utils/marketplaces';
import { SA_MARKET_DIRECTORY, carsZaUrl } from '../data/saMarketDirectory';
import { JDM_DIRECTORY, beforwardUrl } from '../data/jdmDirectory';

/** Both market directories share this shape, so one view can render either. */
interface DirectoryData {
  category: string;
  blurb: string;
  makes: { make: string; models: string[] }[];
}

const fmtZMW = (n: number) => 'ZMW ' + Math.round(n).toLocaleString('en-ZM');

const TOTAL_STEPS = 5;

const USE_CASES: { id: UseCase; label: string; desc: string }[] = [
  { id: 'family', label: 'Carry the family', desc: 'School runs, church, lots of passengers and luggage.' },
  { id: 'city', label: 'City commuting', desc: 'Daily town driving, easy parking, low running costs.' },
  { id: 'work', label: 'Work & hauling', desc: 'Farm, labour and carrying loads or equipment.' },
  { id: 'offroad', label: 'Off-road', desc: 'Rough roads, bush tracks and serious four-wheel drive.' },
  { id: 'longDistance', label: 'Long distance', desc: 'Frequent highway trips between towns and provinces.' },
];

const TERRAINS: { id: Terrain; label: string; desc: string }[] = [
  { id: 'tar', label: 'Mostly tar', desc: 'Sealed town and highway roads.' },
  { id: 'gravel', label: 'Gravel roads', desc: 'Unsealed, dusty or corrugated surfaces.' },
  { id: 'sand', label: 'Sand / loose', desc: 'Soft, sandy or very loose ground.' },
  { id: 'mixed', label: 'A mix of everything', desc: 'A bit of tar, a bit of gravel and rough patches.' },
];

const FUELS: { id: FuelType | 'any'; label: string }[] = [
  { id: 'any', label: 'No preference' },
  { id: 'petrol', label: 'Petrol' },
  { id: 'diesel', label: 'Diesel' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'electric', label: 'Electric' },
];

type CriterionKey = keyof DiscoveryProfile['weights'];
const CRITERIA: { id: CriterionKey; label: string; desc: string }[] = [
  { id: 'repairability', label: 'Easy to repair', desc: 'Parts are common and mechanics know the engine.' },
  { id: 'fuelEconomy', label: 'Fuel economy', desc: 'Light on fuel for everyday running costs.' },
  { id: 'comfort', label: 'Comfort', desc: 'A smooth, quiet, pleasant ride.' },
  { id: 'clearance', label: 'Ground clearance', desc: 'Sits high enough for bad roads and speed humps.' },
  { id: 'towing', label: 'Towing & loads', desc: 'Pulls trailers or carries heavy loads.' },
  { id: 'speed', label: 'Speed & power', desc: 'Strong acceleration and a lively engine.' },
];

const IMPORTANCE: { label: string; val: number }[] = [
  { label: 'Not important', val: 0.15 },
  { label: 'Helpful', val: 0.55 },
  { label: 'Very important', val: 1 },
];

const BODY_LABEL: Record<BodyStyle, string> = {
  hatchback: 'Hatchback',
  sedan: 'Sedan',
  station: 'Station Wagon',
  suv: 'SUV / Crossover',
  mpv: 'MPV / 7–8 Seater',
  pickup: 'Pickup',
};

const FUEL_LABEL: Record<string, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  hybrid: 'Hybrid',
  electric: 'Electric',
};

const REPAIR_STYLE: Record<Repairability['label'], string> = {
  Excellent: 'text-[color:#2f8a72] bg-[color:var(--accent-soft)]',
  Good: 'text-[color:var(--primary-hover)] bg-[color:var(--primary-soft)]',
  Fair: 'text-[color:var(--text-muted)] bg-[color:var(--surface-soft)]',
  Limited: 'text-[color:#9a4b2e] bg-[color:var(--warn-soft)]',
};

export default function VehicleDiscovery() {
  const [view, setView] = useState<'quiz' | 'sa' | 'jdm'>('quiz');
  const [step, setStep] = useState(1);

  // ── Questionnaire state ──
  const [budget, setBudget] = useState<string>('');
  const [fx, setFx] = useState<string>('27.5');
  const [primaryUse, setPrimaryUse] = useState<UseCase | ''>('');
  const [terrain, setTerrain] = useState<Terrain | ''>('');
  const [fuelPref, setFuelPref] = useState<FuelType | 'any'>('any');
  const [weights, setWeights] = useState<Record<CriterionKey, number>>({
    repairability: 0.55,
    comfort: 0.55,
    fuelEconomy: 0.55,
    speed: 0.55,
    towing: 0.55,
    clearance: 0.55,
  });

  // ── Results state ──
  const [results, setResults] = useState<RecommendationResult | null>(null);
  const [ai, setAi] = useState<AIInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const budgetNum = parseFloat(budget.replace(/,/g, '')) || 0;
  const fxNum = parseFloat(fx) || 0;

  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return budgetNum > 0 && fxNum > 0;
      case 2:
        return primaryUse !== '';
      case 3:
        return terrain !== '';
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  }, [step, budgetNum, fxNum, primaryUse, terrain]);

  const runDiscovery = async () => {
    const profile: DiscoveryProfile = {
      budgetZMW: budgetNum,
      fx: fxNum,
      primaryUse: primaryUse as UseCase,
      terrain: terrain as Terrain,
      fuelPref,
      weights,
    };
    const rec = recommend(profile);
    setResults(rec);
    setAi(null);
    setStep(6); // results view

    if (isAIConfigured()) {
      setAiLoading(true);
      const insight = await enhanceWithAI(profile, [...rec.topPicks, ...rec.wildcards]);
      setAi(insight);
      setAiLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setResults(null);
    setAi(null);
    setBudget('');
    setPrimaryUse('');
    setTerrain('');
    setFuelPref('any');
    setWeights({ repairability: 0.55, comfort: 0.55, fuelEconomy: 0.55, speed: 0.55, towing: 0.55, clearance: 0.55 });
  };

  // ───────────────────────────── Directory views ─────────────────────────────
  if (view === 'sa') {
    return (
      <DirectoryView
        onBack={() => setView('quiz')}
        title="South African Market"
        intro="Browse nameplates sold in South Africa (2000–present) that can be imported to Zambia — the home of the sought-after SA-spec pickups and SUVs. Tap a make, then a model, to view current listings on cars.co.za."
        searchPlaceholder="Search a make or model — e.g. Ranger, Pajero, Polo"
        categories={SA_MARKET_DIRECTORY}
        linkFor={carsZaUrl}
        footer="Listings open on cars.co.za in a new tab. This directory is for browsing the South African market; for tailored recommendations with duty estimates, use the questionnaire. We are not affiliated with cars.co.za or any dealer."
      />
    );
  }
  if (view === 'jdm') {
    return (
      <DirectoryView
        onBack={() => setView('quiz')}
        title="Japanese (JDM) Market"
        intro="Browse the Japanese used-export market (2000–2026) — the models that fill SBT Japan, BE FORWARD and Autocom. Tap a make, then a model, to view current listings on BE FORWARD."
        searchPlaceholder="Search a make or model — e.g. Mark X, Vezel, Forester"
        categories={JDM_DIRECTORY}
        linkFor={beforwardUrl}
        footer="Listings open on BE FORWARD in a new tab. Most of these models are also on SBT Japan and Autocom. This directory is for browsing; for tailored recommendations with duty estimates, use the questionnaire. We are not affiliated with any exporter or dealer."
      />
    );
  }

  // ───────────────────────────── Results view ─────────────────────────────
  if (step === 6 && results) {
    return (
      <ResultsView
        results={results}
        ai={ai}
        aiLoading={aiLoading}
        budgetZMW={budgetNum}
        onRestart={reset}
      />
    );
  }

  // ───────────────────────────── Questionnaire ─────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">
      {/* Intro */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight">Find Your Vehicle</h2>
        <p className="text-sm text-[color:var(--text-muted)] mt-1.5 max-w-xl mx-auto leading-relaxed">
          Answer a few quick questions and we will suggest models that genuinely fit your needs,
          budget and roads — including good options you may never have considered.
        </p>
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-[color:var(--text-muted)]">Just browsing? See the full market list:</span>
          <button
            type="button"
            onClick={() => setView('jdm')}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[color:var(--surface-soft)] border border-[color:var(--border-strong)] text-[color:var(--text)] hover:border-[color:var(--primary)] hover:text-[color:var(--primary-hover)] transition-colors cursor-pointer"
          >
            Japanese (JDM) market
          </button>
          <button
            type="button"
            onClick={() => setView('sa')}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[color:var(--surface-soft)] border border-[color:var(--border-strong)] text-[color:var(--text)] hover:border-[color:var(--primary)] hover:text-[color:var(--primary-hover)] transition-colors cursor-pointer"
          >
            South African market
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[color:var(--surface-soft)] overflow-hidden">
          <div
            className="h-full bw-ink rounded-full transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl p-5 sm:p-7 shadow-[var(--shadow)] animate-fadeIn">
        {/* Step 1 — Budget */}
        {step === 1 && (
          <div>
            <h3 className="text-lg font-extrabold mb-1">What is your total budget?</h3>
            <p className="text-xs text-[color:var(--text-muted)] mb-5 leading-relaxed">
              This is the all-in landed cost — the price of the car plus the estimated import duty —
              so the suggestions stay realistic.
            </p>

            <label className="block text-xs font-bold text-[color:var(--text)] mb-1.5">Budget (ZMW)</label>
            <input
              type="text"
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value.replace(/[^\d,]/g, ''))}
              placeholder="e.g. 250,000"
              className="w-full border border-[color:var(--border-strong)] rounded-xl px-4 py-3 text-base font-bold outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] bg-[color:var(--surface-soft)] text-[color:var(--text)] placeholder:text-slate-400"
            />

            <label className="block text-xs font-bold text-[color:var(--text)] mt-4 mb-1.5">
              Exchange rate (1 USD = ZMW)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={fx}
              onChange={(e) => setFx(e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="e.g. 27.5"
              className="w-full border border-[color:var(--border-strong)] rounded-xl px-4 py-3 text-base font-bold outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] bg-[color:var(--surface-soft)] text-[color:var(--text)] placeholder:text-slate-400"
            />
            <p className="text-[11px] text-[color:var(--text-muted)] mt-2">
              We use this to convert import prices into Kwacha. Adjust it to today's rate for the most
              accurate estimates.
            </p>
          </div>
        )}

        {/* Step 2 — Primary use */}
        {step === 2 && (
          <div>
            <h3 className="text-lg font-extrabold mb-1">How will you mainly use it?</h3>
            <p className="text-xs text-[color:var(--text-muted)] mb-5">Pick the one that fits best.</p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {USE_CASES.map((u) => (
                <OptionCard
                  key={u.id}
                  selected={primaryUse === u.id}
                  title={u.label}
                  desc={u.desc}
                  onClick={() => setPrimaryUse(u.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Terrain */}
        {step === 3 && (
          <div>
            <h3 className="text-lg font-extrabold mb-1">Where do you drive most?</h3>
            <p className="text-xs text-[color:var(--text-muted)] mb-5">The roads you use most of the time.</p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {TERRAINS.map((t) => (
                <OptionCard
                  key={t.id}
                  selected={terrain === t.id}
                  title={t.label}
                  desc={t.desc}
                  onClick={() => setTerrain(t.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 4 — Fuel preference */}
        {step === 4 && (
          <div>
            <h3 className="text-lg font-extrabold mb-1">Any fuel preference?</h3>
            <p className="text-xs text-[color:var(--text-muted)] mb-5">
              Choose "No preference" if you are open to anything.
            </p>
            <div className="flex flex-wrap gap-2">
              {FUELS.map((f) => {
                const selected = fuelPref === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFuelPref(f.id)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                      selected
                        ? 'bg-[color:var(--primary-soft)] text-[color:var(--primary-hover)] border-[color:var(--primary-border)]'
                        : 'bg-[color:var(--surface-soft)] text-[color:var(--text-muted)] border-[color:var(--border-strong)] hover:text-[color:var(--text)]'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5 — Priorities */}
        {step === 5 && (
          <div>
            <h3 className="text-lg font-extrabold mb-1">What matters most to you?</h3>
            <p className="text-xs text-[color:var(--text-muted)] mb-5">
              Tell us how important each quality is. This shapes the ranking.
            </p>
            <div className="space-y-3.5">
              {CRITERIA.map((c) => (
                <div key={c.id}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-sm font-bold text-[color:var(--text)]">{c.label}</span>
                    <span className="text-[11px] text-[color:var(--text-muted)] hidden sm:block">{c.desc}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {IMPORTANCE.map((lvl) => {
                      const selected = Math.abs(weights[c.id] - lvl.val) < 0.01;
                      return (
                        <button
                          key={lvl.label}
                          type="button"
                          onClick={() => setWeights((w) => ({ ...w, [c.id]: lvl.val }))}
                          className={`px-2 py-2 rounded-lg text-[11px] sm:text-xs font-bold border text-center transition-colors ${
                            selected
                              ? 'bg-[color:var(--primary-soft)] text-[color:var(--primary-hover)] border-[color:var(--primary-border)]'
                              : 'bg-[color:var(--surface-soft)] text-[color:var(--text-muted)] border-[color:var(--border-strong)] hover:text-[color:var(--text)]'
                          }`}
                        >
                          {lvl.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wizard controls */}
        <div className="flex items-center justify-between gap-3 mt-7 pt-5 border-t border-[color:var(--border)]">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-5 py-2.5 text-sm btn-ghost cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed}
              className="px-6 py-2.5 text-sm btn-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={runDiscovery}
              disabled={!canProceed}
              className="px-6 py-2.5 text-sm btn-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Show My Matches
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────── Sub-components ─────────────────────────────

function OptionCard({
  selected,
  title,
  desc,
  onClick,
}: {
  selected: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left px-4 py-3.5 rounded-xl border transition-colors ${
        selected
          ? 'bg-[color:var(--primary-soft)] border-[color:var(--primary-border)] shadow-[inset_0_0_0_1.5px_var(--primary-border)]'
          : 'bg-[color:var(--surface-soft)] border-[color:var(--border-strong)] hover:border-[color:var(--primary-border)]'
      }`}
    >
      <p className={`text-sm font-extrabold ${selected ? 'text-[color:var(--primary-hover)]' : 'text-[color:var(--text)]'}`}>
        {title}
      </p>
      <p className="text-[11.5px] text-[color:var(--text-muted)] mt-0.5 leading-snug">{desc}</p>
    </button>
  );
}

function ResultsView({
  results,
  ai,
  aiLoading,
  budgetZMW,
  onRestart,
}: {
  results: RecommendationResult;
  ai: AIInsight | null;
  aiLoading: boolean;
  budgetZMW: number;
  onRestart: () => void;
}) {
  const { topPicks, wildcards } = results;

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight">Your Matches</h2>
          <p className="text-sm text-[color:var(--text-muted)] mt-1">
            Ranked for your needs and a budget of <span className="font-bold text-[color:var(--text)]">{fmtZMW(budgetZMW)}</span>.
          </p>
        </div>
        <button type="button" onClick={onRestart} className="px-4 py-2.5 text-sm btn-ghost cursor-pointer flex-shrink-0">
          Start Over
        </button>
      </div>

      {/* AI summary */}
      {(ai?.summary || aiLoading) && (
        <div className="bg-[color:var(--primary-soft)] border border-[color:var(--primary-border)] rounded-2xl px-5 py-4 mb-5">
          {aiLoading && !ai ? (
            <p className="text-sm font-semibold text-[color:var(--primary-hover)]">Putting together tailored advice…</p>
          ) : (
            <p className="text-sm text-[color:var(--text)] leading-relaxed">{ai?.summary}</p>
          )}
        </div>
      )}

      {/* Top picks */}
      <div className="space-y-3">
        {topPicks.map((sv, i) => (
          <ResultCard key={sv.vehicle.id} sv={sv} rank={i + 1} aiText={ai?.picks?.[sv.vehicle.id]} />
        ))}
      </div>

      {/* Wildcards */}
      {wildcards.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-extrabold mb-1">You might not have considered…</h3>
          <p className="text-xs text-[color:var(--text-muted)] mb-3">
            Strong matches that are still uncommon on Zambian roads.
          </p>
          <div className="space-y-3">
            {wildcards.map((sv) => (
              <ResultCard key={sv.vehicle.id} sv={sv} aiText={ai?.picks?.[sv.vehicle.id]} wildcard />
            ))}
          </div>
        </div>
      )}

      {/* AI extra suggestions (beyond the catalog) */}
      {ai && ai.extraSuggestions.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-extrabold mb-1">A couple more ideas to research</h3>
          <p className="text-xs text-[color:var(--text-muted)] mb-3">
            Suggested by our adviser — verify specs and duty in the calculator before deciding.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {ai.extraSuggestions.map((s) => (
              <div key={s.name} className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-xl p-4">
                <p className="text-sm font-extrabold text-[color:var(--text)]">{s.name}</p>
                <p className="text-xs text-[color:var(--text-muted)] mt-1 leading-relaxed">{s.reason}</p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {keywordMarketplaceLinks(s.name).map((l) => (
                    <a
                      key={l.name}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[color:var(--surface-soft)] border border-[color:var(--border-strong)] text-[color:var(--text)] hover:border-[color:var(--primary)] hover:text-[color:var(--primary-hover)] transition-colors"
                    >
                      {l.name}
                      <span className="text-[9px] text-[color:var(--text-muted)]">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-[color:var(--text-muted)] mt-8 leading-relaxed">
        Estimates only. Landed costs assume a typical used unit and approximate freight; actual prices,
        condition and duty vary. Always confirm the exact figure in the Duty Calculator.
      </p>
    </div>
  );
}

function ResultCard({
  sv,
  rank,
  aiText,
  wildcard,
}: {
  sv: ScoredVehicle;
  rank?: number;
  aiText?: string;
  wildcard?: boolean;
}) {
  const { vehicle: v, repairability, landed, withinBudget } = sv;
  const reasons = aiText ? [aiText] : sv.reasons;
  const [showSources, setShowSources] = useState(false);
  const links = useMemo(() => marketplaceLinks(v), [v]);

  return (
    <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl p-4 sm:p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-start gap-3">
        {rank && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[color:var(--primary-soft)] text-[color:var(--primary-hover)] flex items-center justify-center text-sm font-black">
            {rank}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
            <h4 className="text-base sm:text-lg font-extrabold text-[color:var(--text)] leading-tight">
              {v.make} {v.model}
            </h4>
            {v.aka && v.aka.length > 0 && (
              <span className="text-[11px] text-[color:var(--text-muted)] font-medium">
                also known as {v.aka.join(', ')}
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-[color:var(--text-muted)] font-semibold mt-0.5">
            {BODY_LABEL[v.body]} · {v.engineFamily} {v.engineCC > 0 ? `${v.engineCC.toLocaleString()}cc` : ''} · {FUEL_LABEL[v.fuel]} · {v.drivetrain.toUpperCase()}
          </p>
        </div>

        {/* Match score */}
        <div className="flex-shrink-0 text-right">
          <p className="text-xl font-black text-[color:var(--text)] leading-none">{sv.matchScore}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">match</p>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wide ${REPAIR_STYLE[repairability.label]}`}>
          Parts: {repairability.label}
        </span>
        <span
          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wide ${
            withinBudget
              ? 'text-[color:#2f8a72] bg-[color:var(--accent-soft)]'
              : 'text-[color:#9a4b2e] bg-[color:var(--warn-soft)]'
          }`}
        >
          {withinBudget ? 'In budget' : 'Above budget'}
        </span>
        {wildcard && (
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wide text-[color:var(--primary-hover)] bg-[color:var(--primary-soft)]">
            Hidden gem
          </span>
        )}
      </div>

      {/* Landed cost */}
      <div className="mt-3 pt-3 border-t border-[color:var(--border)] flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">Est. landed cost</span>
        <span className="text-sm font-extrabold text-[color:var(--text)]">{fmtZMW(landed.landedMidZMW)}</span>
        <span className="text-[11px] text-[color:var(--text-muted)]">
          (range {fmtZMW(landed.landedLowZMW)} – {fmtZMW(landed.landedHighZMW)})
        </span>
      </div>

      {/* Reasons */}
      <p className="text-[13px] text-[color:var(--text)] mt-3 leading-relaxed">{v.blurb}</p>
      {reasons.length > 0 && (
        <ul className="mt-2 space-y-1">
          {reasons.map((r, idx) => (
            <li key={idx} className="text-[12.5px] text-[color:var(--text-muted)] leading-relaxed flex gap-2">
              <span className="text-[color:var(--primary)] font-bold flex-shrink-0">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Repairability detail */}
      <p className="text-[11.5px] text-[color:var(--text-muted)] mt-2.5 leading-relaxed italic">
        {repairability.reason}
      </p>

      {/* Where to buy listings */}
      <div className="mt-3 pt-3 border-t border-[color:var(--border)]">
        <button
          type="button"
          onClick={() => setShowSources((s) => !s)}
          className="text-xs font-extrabold text-[color:var(--primary-hover)] hover:underline cursor-pointer flex items-center gap-1"
        >
          {showSources ? 'Hide listings' : `Find a ${v.make} ${v.model} to buy`}
          <span className="text-[10px]">{showSources ? '▴' : '▾'}</span>
        </button>
        {showSources && <ListingLinks links={links} />}
      </div>
    </div>
  );
}

function ListingLinks({ links }: { links: MarketplaceLink[] }) {
  const regions: MarketplaceLink['region'][] = ['Japan', 'South Africa'];
  return (
    <div className="mt-3 space-y-2.5 animate-fadeIn">
      {regions.map((region) => {
        const group = links.filter((l) => l.region === region);
        if (group.length === 0) return null;
        return (
          <div key={region}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-muted)] mb-1.5">
              Import from {region}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.map((l) => (
                <a
                  key={l.name}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[color:var(--surface-soft)] border border-[color:var(--border-strong)] text-[color:var(--text)] hover:border-[color:var(--primary)] hover:text-[color:var(--primary-hover)] hover:bg-[color:var(--primary-soft)] transition-colors"
                >
                  {l.name}
                  <span className="text-[9px] text-[color:var(--text-muted)]">↗</span>
                </a>
              ))}
            </div>
          </div>
        );
      })}
      <p className="text-[10px] text-[color:var(--text-muted)] leading-relaxed pt-0.5">
        Opens the seller's site in a new tab. We are not affiliated with these dealers — always verify the
        car, seller and final landed cost before paying anything.
      </p>
    </div>
  );
}

function DirectoryView({
  onBack,
  title,
  intro,
  searchPlaceholder,
  categories,
  linkFor,
  footer,
}: {
  onBack: () => void;
  title: string;
  intro: string;
  searchPlaceholder: string;
  categories: DirectoryData[];
  linkFor: (make: string, model: string) => string;
  footer: string;
}) {
  const [query, setQuery] = useState('');
  const [openMakes, setOpenMakes] = useState<Set<string>>(new Set());

  const q = query.trim().toLowerCase();

  // When searching, match makes and models; otherwise show everything collapsed.
  const filtered = useMemo(() => {
    if (!q) return categories;
    return categories.map((cat) => ({
      ...cat,
      makes: cat.makes
        .map((mk) => {
          const makeHit = mk.make.toLowerCase().includes(q);
          const models = makeHit ? mk.models : mk.models.filter((m) => m.toLowerCase().includes(q));
          return { ...mk, models };
        })
        .filter((mk) => mk.models.length > 0),
    })).filter((cat) => cat.makes.length > 0);
  }, [q, categories]);

  const isOpen = (make: string) => Boolean(q) || openMakes.has(make);

  const toggle = (make: string) =>
    setOpenMakes((prev) => {
      const next = new Set(prev);
      if (next.has(make)) next.delete(make);
      else next.add(make);
      return next;
    });

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight">{title}</h2>
          <p className="text-sm text-[color:var(--text-muted)] mt-1 max-w-xl leading-relaxed">{intro}</p>
        </div>
        <button type="button" onClick={onBack} className="px-4 py-2.5 text-sm btn-ghost cursor-pointer flex-shrink-0">
          Back
        </button>
      </div>

      {/* Search */}
      <div className="sticky top-[60px] z-10 bg-[color:var(--bg)]/95 backdrop-blur-sm py-3 mb-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full border border-[color:var(--border-strong)] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] bg-[color:var(--surface-soft)] text-[color:var(--text)] placeholder:text-slate-400"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[color:var(--text-muted)] py-8 text-center">
          No makes or models match “{query}”.
        </p>
      ) : (
        <div className="space-y-6">
          {filtered.map((cat) => (
            <div key={cat.category}>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[color:var(--text-muted)] mb-0.5">
                {cat.category}
              </h3>
              <p className="text-[11.5px] text-[color:var(--text-muted)] mb-2.5 leading-snug">{cat.blurb}</p>
              <div className="space-y-2">
                {cat.makes.map((mk) => (
                  <div
                    key={mk.make}
                    className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(mk.make)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-[color:var(--surface-soft)] transition-colors"
                    >
                      <span className="text-sm font-extrabold text-[color:var(--text)]">{mk.make}</span>
                      <span className="text-[11px] text-[color:var(--text-muted)] font-semibold">
                        {mk.models.length} model{mk.models.length === 1 ? '' : 's'}
                        <span className="ml-2 text-[10px]">{isOpen(mk.make) ? '▴' : '▾'}</span>
                      </span>
                    </button>
                    {isOpen(mk.make) && (
                      <div className="px-4 pb-3.5 pt-1 flex flex-wrap gap-1.5 animate-fadeIn">
                        {mk.models.map((model) => (
                          <a
                            key={model}
                            href={linkFor(mk.make, model)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg bg-[color:var(--surface-soft)] border border-[color:var(--border-strong)] text-[color:var(--text)] hover:border-[color:var(--primary)] hover:text-[color:var(--primary-hover)] hover:bg-[color:var(--primary-soft)] transition-colors"
                          >
                            {model}
                            <span className="text-[9px] text-[color:var(--text-muted)]">↗</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-[color:var(--text-muted)] mt-8 leading-relaxed">{footer}</p>
    </div>
  );
}
