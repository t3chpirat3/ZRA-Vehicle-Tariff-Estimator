/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * deepseekDiscovery.ts
 * Optional AI enrichment on top of the deterministic discovery engine.
 *
 * Given the user's profile and the locally-ranked shortlist, DeepSeek writes a
 * short, friendly rationale per pick and proposes a couple of lesser-known
 * alternatives the buyer may never have heard of.
 *
 * Calls the secure backend proxy `/api/enhance-discovery` to avoid exposing the API key.
 */

import { DiscoveryProfile, ScoredVehicle } from './discovery';
import { UseCase, Terrain } from '../data/vehiclesData';

export interface AIExtraSuggestion {
  name: string;
  reason: string;
}

export interface AIInsight {
  summary: string;
  /** Map of vehicle id → a one or two sentence, buyer-facing rationale. */
  picks: Record<string, string>;
  extraSuggestions: AIExtraSuggestion[];
}

export function isAIConfigured(): boolean {
  // Now that we proxy through our own backend, we just assume it's configured.
  // If the backend lacks the key, it will gracefully fail and return null.
  return true;
}

const USE_CASE_TEXT: Record<UseCase, string> = {
  family: 'carrying the whole family',
  city: 'city commuting',
  work: 'farm / labour / hauling work',
  offroad: 'off-roading and rough terrain',
  longDistance: 'long-distance highway travel',
};

const TERRAIN_TEXT: Record<Terrain, string> = {
  tar: 'mostly tarred roads',
  gravel: 'gravel roads',
  sand: 'sandy / loose surfaces',
  mixed: 'a mixture of surfaces',
};

function buildUserMessage(profile: DiscoveryProfile, shortlist: ScoredVehicle[]): string {
  const rankedWeights = Object.entries(profile.weights)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} (${Math.round(v * 100)}%)`)
    .join(', ');

  const list = shortlist
    .map((s) => {
      const v = s.vehicle;
      return `- id: ${v.id} | ${v.make} ${v.model} | body: ${v.body} | engine: ${v.engineFamily} ${v.engineCC}cc ${v.fuel} | repairability: ${s.repairability.label} (${s.repairability.score}/100) | est. landed ~ZMW ${Math.round(
        s.landed.landedMidZMW,
      ).toLocaleString()} | match ${s.matchScore}/100${s.isWildcard ? ' | (wildcard)' : ''}`;
    })
    .join('\n');

  return `Buyer needs:
- Budget (landed, incl. duty): ZMW ${profile.budgetZMW.toLocaleString()}
- Main use: ${USE_CASE_TEXT[profile.primaryUse]}
- Driving environment: ${TERRAIN_TEXT[profile.terrain]}
- Fuel preference: ${profile.fuelPref}
- Priorities (most → least): ${rankedWeights}

Shortlist (already ranked and priced by our engine — keep these prices):
${list}`;
}

export async function enhanceWithAI(
  profile: DiscoveryProfile,
  shortlist: ScoredVehicle[],
): Promise<AIInsight | null> {
  try {
    const response = await fetch('/api/enhance-discovery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage: buildUserMessage(profile, shortlist)
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.summary) return null;

    return data as AIInsight;
  } catch {
    return null;
  }
}
