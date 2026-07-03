/// <reference types="vite/client" />
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
 * alternatives the buyer may never have heard of. If the API key is missing or
 * the call fails, callers fall back to the deterministic reasons — the feature
 * never hard-depends on AI.
 */

import { DiscoveryProfile, ScoredVehicle } from './discovery';
import { UseCase, Terrain } from '../data/vehiclesData';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY as string;

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
  return Boolean(DEEPSEEK_API_KEY);
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

const SYSTEM_PROMPT = `You are a friendly, knowledgeable car-buying adviser for the Zambian used-import market.
You speak plainly to ordinary buyers (assume non-technical), and you understand Japanese-import culture, parts availability, and what "repairability" means to a Zambian owner (how easy it is to find parts and a mechanic who knows the engine).

You will receive a buyer's needs and a shortlist of vehicles our own engine already ranked and priced. Do NOT re-rank or contradict the budget figures — they are authoritative.

Your job:
1. Write a short, warm "summary" (2-3 sentences) that reflects the buyer's needs.
2. For each shortlisted vehicle (by its "id"), write a "picks" entry: one or two sentences on why it suits THIS buyer specifically. Be concrete, mention the use case / terrain / repairability where relevant. No fluff.
3. Suggest up to 2 "extraSuggestions": real vehicle models commonly importable to Zambia that are NOT already in the shortlist and that the buyer probably hasn't considered, each with a one-sentence reason. Prefer genuinely useful, slightly off-the-radar choices over obvious trends.

Return STRICT JSON only, no markdown, in exactly this shape:
{
  "summary": "string",
  "picks": { "<vehicle-id>": "string", ... },
  "extraSuggestions": [ { "name": "Make Model", "reason": "string" } ]
}`;

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
${list}

Respond with the strict JSON described.`;
}

export async function enhanceWithAI(
  profile: DiscoveryProfile,
  shortlist: ScoredVehicle[],
): Promise<AIInsight | null> {
  if (!DEEPSEEK_API_KEY) return null;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(profile, shortlist) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 900,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AIInsight>;
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      picks: parsed.picks && typeof parsed.picks === 'object' ? parsed.picks : {},
      extraSuggestions: Array.isArray(parsed.extraSuggestions)
        ? parsed.extraSuggestions
            .filter((s) => s && typeof s.name === 'string' && typeof s.reason === 'string')
            .slice(0, 2)
        : [],
    };
  } catch {
    return null;
  }
}
