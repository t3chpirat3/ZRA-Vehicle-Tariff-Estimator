/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * discovery.ts
 * The deterministic brain behind Vehicle Discovery.
 *
 * It does three things, all offline and instant:
 *   1. Repairability  — derived from how ubiquitous a model's engine is across
 *                       the catalog, the make's parts ecosystem, and how common
 *                       the model already is locally.
 *   2. Landed cost    — reuses the duty calculator headlessly to estimate the
 *                       total ZMW to put a unit on the road.
 *   3. Match ranking  — scores every catalog model against the questionnaire
 *                       answers and returns a ranked, explained shortlist.
 *
 * An optional AI layer (see deepseekDiscovery) sits on top of these results;
 * if AI is unavailable, everything here still works.
 */

import {
  VEHICLES,
  VehicleModel,
  BRAND_PARTS_TIER,
  UseCase,
  Terrain,
} from '../data/vehiclesData';
import { MarketRegion } from './marketplaces';
import { CalculatorState, FuelType, calculateDuty } from '../types';

// Rough freight + insurance added to FOB to approximate CIF (Japan → Dar/Nakonde).
const FREIGHT_INSURANCE_USD = 850;

export interface DiscoveryProfile {
  budgetZMW: number;
  fx: number; // USD → ZMW
  primaryUse: UseCase;
  terrain: Terrain;
  fuelPref: FuelType | 'any';
  /** Importance weights, each 0–1, for the qualities the user ranked. */
  weights: {
    repairability: number;
    comfort: number;
    fuelEconomy: number;
    speed: number;
    towing: number;
    clearance: number;
  };
  preferredRegion?: MarketRegion | 'Any';
}

export interface LandedCost {
  fobMidUsd: number;
  cifZMW: number;
  dutyZMW: number;
  landedLowZMW: number;
  landedMidZMW: number;
  landedHighZMW: number;
}

export interface Repairability {
  score: number; // 0–100
  sharedCount: number; // how many catalog models share the engine family
  label: 'Excellent' | 'Good' | 'Fair' | 'Limited';
  reason: string;
}

export interface ScoredVehicle {
  vehicle: VehicleModel;
  matchScore: number; // 0–100
  withinBudget: boolean;
  landed: LandedCost;
  repairability: Repairability;
  reasons: string[];
  isWildcard: boolean;
}

// ── Engine ubiquity (precomputed once) ──────────────────────────────────────

const ENGINE_FAMILY_COUNT: Record<string, number> = (() => {
  const counts: Record<string, number> = {};
  for (const v of VEHICLES) {
    counts[v.engineFamily] = (counts[v.engineFamily] || 0) + 1;
  }
  return counts;
})();

const MAX_ENGINE_SHARE = Math.max(...Object.values(ENGINE_FAMILY_COUNT));

/** Other catalog models that share this model's engine family. */
export function sharedEngineModels(model: VehicleModel): VehicleModel[] {
  return VEHICLES.filter(
    (v) => v.engineFamily === model.engineFamily && v.id !== model.id,
  );
}

export function repairabilityOf(model: VehicleModel): Repairability {
  const sharedCount = (ENGINE_FAMILY_COUNT[model.engineFamily] || 1) - 1;

  // 50% engine ubiquity, 30% brand parts ecosystem, 20% local prevalence.
  const ubiquity = (ENGINE_FAMILY_COUNT[model.engineFamily] || 1) / MAX_ENGINE_SHARE; // 0–1
  const brand = (BRAND_PARTS_TIER[model.make] ?? 3) / 5; // 0–1
  const prevalence = model.popularityZm / 5; // 0–1

  const score = Math.round((0.5 * ubiquity + 0.3 * brand + 0.2 * prevalence) * 100);

  let label: Repairability['label'];
  if (score >= 75) label = 'Excellent';
  else if (score >= 58) label = 'Good';
  else if (score >= 42) label = 'Fair';
  else label = 'Limited';

  const others = sharedEngineModels(model);
  let reason: string;
  if (others.length >= 1) {
    const names = others.slice(0, 3).map((o) => `${o.make} ${o.model}`);
    reason = `Shares the ${model.engineFamily} engine with the ${names.join(', ')}${
      others.length > 3 ? ` and ${others.length - 3} more` : ''
    }, so parts and know-how are easy to find.`;
  } else {
    const tier = BRAND_PARTS_TIER[model.make] ?? 3;
    reason =
      tier >= 4
        ? `${model.make} parts are widely stocked locally, though this exact engine is less common in the catalog.`
        : `Parts for the ${model.engineFamily} are more specialist — budget for longer waits or imported spares.`;
  }

  return { score, sharedCount, label, reason };
}

// ── Landed cost (headless duty calc) ────────────────────────────────────────

/** Convert a real cc figure to the calculator's engine-band selector value. */
function ccToEngineBucket(cc: number): string {
  if (cc <= 1000) return '1000';
  if (cc <= 1500) return '1500';
  if (cc <= 2500) return '2500';
  if (cc <= 3000) return '3000';
  return '3500';
}

function buildCalcState(model: VehicleModel, fobUsd: number, fx: number): CalculatorState {
  const cifUSD = fobUsd + FREIGHT_INSURANCE_USD;
  return {
    age: model.typicalAge,
    cat: model.calcCat,
    type: model.calcType,
    fuel: model.fuel,
    busFuel: '',
    engine: ccToEngineBucket(model.engineCC),
    cifEngine: String(model.engineCC),
    weight: model.calcWeight ?? '',
    seats: String(model.seats),
    vdp: '',
    cifUSD,
    fx,
    hpCC: '',
    hpHP: '',
    origin: '',
  };
}

function dutyFor(model: VehicleModel, fobUsd: number, fx: number): number {
  const res = calculateDuty(buildCalcState(model, fobUsd, fx));
  return res?.total ?? 0;
}

export function landedCostOf(model: VehicleModel, fx: number): LandedCost {
  const fobMidUsd = (model.fobUsdLow + model.fobUsdHigh) / 2;

  const calcLanded = (fobUsd: number) => {
    const cif = (fobUsd + FREIGHT_INSURANCE_USD) * fx;
    return cif + dutyFor(model, fobUsd, fx);
  };

  const landedLowZMW = calcLanded(model.fobUsdLow);
  const landedMidZMW = calcLanded(fobMidUsd);
  const landedHighZMW = calcLanded(model.fobUsdHigh);

  return {
    fobMidUsd,
    cifZMW: (fobMidUsd + FREIGHT_INSURANCE_USD) * fx,
    dutyZMW: dutyFor(model, fobMidUsd, fx),
    landedLowZMW,
    landedMidZMW,
    landedHighZMW,
  };
}

// ── Matching / ranking ──────────────────────────────────────────────────────

const USE_CASE_LABEL: Record<UseCase, string> = {
  family: 'carrying the whole family',
  city: 'city commuting',
  work: 'work and hauling',
  offroad: 'off-road and rough roads',
  longDistance: 'long-distance travel',
};

/** How well a model suits a given terrain, on a 0–1 scale. */
function terrainFit(model: VehicleModel, terrain: Terrain): number {
  const clearance = model.scores.clearance / 5;
  const offroad = model.scores.offroad / 5;
  const comfort = model.scores.comfort / 5;
  const awd = model.drivetrain === 'awd' || model.drivetrain === '4wd' ? 1 : 0;

  switch (terrain) {
    case 'tar':
      return 0.6 * comfort + 0.4 * (model.scores.fuelEconomy / 5);
    case 'gravel':
      return 0.45 * clearance + 0.3 * awd + 0.25 * offroad;
    case 'sand':
      return 0.4 * (model.drivetrain === '4wd' ? 1 : awd * 0.5) + 0.35 * clearance + 0.25 * offroad;
    case 'mixed':
    default:
      return 0.35 * clearance + 0.25 * awd + 0.2 * offroad + 0.2 * comfort;
  }
}

function fuelFit(model: VehicleModel, pref: FuelType | 'any'): number {
  if (pref === 'any') return 0.7; // neutral-positive
  return model.fuel === pref ? 1 : 0.25;
}

/** Weighted average of the qualities the user ranked, normalised to 0–1. */
function criteriaFit(model: VehicleModel, profile: DiscoveryProfile, repair: Repairability): number {
  const w = profile.weights;
  const totalW = w.repairability + w.comfort + w.fuelEconomy + w.speed + w.towing + w.clearance;
  if (totalW <= 0) return 0.5;

  const sum =
    w.repairability * (repair.score / 100) +
    w.comfort * (model.scores.comfort / 5) +
    w.fuelEconomy * (model.scores.fuelEconomy / 5) +
    w.speed * (model.scores.speed / 5) +
    w.towing * (model.scores.towing / 5) +
    w.clearance * (model.scores.clearance / 5);

  return sum / totalW;
}

function buildReasons(
  model: VehicleModel,
  profile: DiscoveryProfile,
  repair: Repairability,
  landed: LandedCost,
  withinBudget: boolean,
): string[] {
  const reasons: string[] = [];

  const useScore = model.scores[profile.primaryUse];
  if (useScore >= 4) reasons.push(`Well suited to ${USE_CASE_LABEL[profile.primaryUse]}.`);

  if (withinBudget) {
    reasons.push('Fits comfortably inside your budget once duty is added.');
  } else if (landed.landedLowZMW <= profile.budgetZMW) {
    reasons.push('A well-priced unit can just fit your budget — shop carefully.');
  }

  if (repair.label === 'Excellent' || repair.label === 'Good') {
    reasons.push(repair.reason);
  }

  if (profile.weights.fuelEconomy >= 0.7 && model.scores.fuelEconomy >= 4) {
    reasons.push('Light on fuel for the running costs you care about.');
  }
  if (profile.terrain !== 'tar' && model.scores.clearance >= 4) {
    reasons.push('Good ground clearance for gravel and rough roads.');
  }

  return reasons.slice(0, 4);
}

export function scoreVehicle(model: VehicleModel, profile: DiscoveryProfile): ScoredVehicle {
  const repair = repairabilityOf(model);
  const landed = landedCostOf(model, profile.fx);
  const withinBudget = landed.landedMidZMW <= profile.budgetZMW;

  // Budget gate: a smooth penalty rather than a hard cut, so a slightly
  // pricier-but-perfect match can still surface.
  let budgetFactor: number;
  if (landed.landedMidZMW <= profile.budgetZMW) budgetFactor = 1;
  else if (landed.landedLowZMW <= profile.budgetZMW) budgetFactor = 0.7;
  else if (landed.landedLowZMW <= profile.budgetZMW * 1.15) budgetFactor = 0.4;
  else budgetFactor = 0.08;

  const useFit = model.scores[profile.primaryUse] / 5;
  const terrain = terrainFit(model, profile.terrain);
  const fuel = fuelFit(model, profile.fuelPref);
  const criteria = criteriaFit(model, profile, repair);

  const raw =
    0.3 * useFit +
    0.15 * terrain +
    0.1 * fuel +
    0.45 * criteria;

  const matchScore = Math.round(raw * budgetFactor * 100);

  return {
    vehicle: model,
    matchScore,
    withinBudget,
    landed,
    repairability: repair,
    reasons: buildReasons(model, profile, repair, landed, withinBudget),
    isWildcard: false,
  };
}

export interface RecommendationResult {
  topPicks: ScoredVehicle[];
  wildcards: ScoredVehicle[];
}

/**
 * Rank the whole catalog, return the strongest matches plus a couple of
 * "you probably haven't considered this" wildcards: high-scoring models that
 * are still uncommon on Zambian roads (low popularity).
 */
export function recommend(profile: DiscoveryProfile, topN = 5): RecommendationResult {
  const scored = VEHICLES.map((v) => scoreVehicle(v, profile)).sort(
    (a, b) => b.matchScore - a.matchScore,
  );

  const topPicks = scored.slice(0, topN);
  const topIds = new Set(topPicks.map((s) => s.vehicle.id));

  const wildcards = scored
    .filter(
      (s) =>
        !topIds.has(s.vehicle.id) &&
        s.vehicle.popularityZm <= 2 &&
        s.matchScore >= Math.max(35, (topPicks[topPicks.length - 1]?.matchScore ?? 0) - 18),
    )
    .slice(0, 2)
    .map((s) => ({ ...s, isWildcard: true }));

  return { topPicks, wildcards };
}
