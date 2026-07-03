/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * marketplaces.ts
 * Builds "where to buy" deep links to the curated exporter / marketplace sites
 * a Zambian importer actually uses. URL patterns were verified against each
 * site:
 *   - SBT Japan   → model path   (/used-cars/{make}/{model}/) — also holds
 *                   Singaporean stock
 *   - BE FORWARD  → keyword path  (/stocklist/keyword={make model}/) — also
 *                   holds Singaporean stock
 *   - Autocom Japan → keyword query (?key={make model})
 *   - Cars.co.za  → model-level browse (/usedcars/{Make}/{Model}/), shown ONLY
 *                   for SA-sourced vehicles (the larger "SA-spec" pickups and
 *                   SUVs), keyed off the model's `saName`.
 */

import { VehicleModel } from '../data/vehiclesData';

export type MarketRegion = 'Japan' | 'South Africa';

export interface MarketplaceLink {
  name: string;
  region: MarketRegion;
  url: string;
}

/** Lower-case, hyphenated slug for the Japanese exporters. */
const slug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Cars.co.za preserves the original casing and hyphenates (e.g. "CX-5",
 *  "X-Trail", "Land-Cruiser-Prado"). */
const saSlug = (s: string) =>
  s
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Listing links for a catalogued model. */
export function marketplaceLinks(v: VehicleModel): MarketplaceLink[] {
  const keyword = encodeURIComponent(`${v.make} ${v.model}`);
  const links: MarketplaceLink[] = [];

  // The Japanese exporters carry most models; skip them for SA/India-only
  // nameplates so we never show a search that returns nothing.
  if (v.jpAvailable !== false) {
    links.push(
      {
        name: 'SBT Japan',
        region: 'Japan',
        url: `https://www.sbtjapan.com/used-cars/${slug(v.make)}/${slug(v.model)}/`,
      },
      {
        name: 'BE FORWARD',
        region: 'Japan',
        url: `https://www.beforward.jp/stocklist/keyword=${keyword}/`,
      },
      {
        name: 'Autocom Japan',
        region: 'Japan',
        url: `https://autocj.co.jp/used_cars?key=${keyword}`,
      },
    );
  }

  // South Africa is the sourcing market chiefly for the larger SA-spec
  // vehicles, so only offer it where we have a confirmed cars.co.za model name.
  if (v.saName) {
    links.push({
      name: 'Cars.co.za',
      region: 'South Africa',
      url: `https://www.cars.co.za/usedcars/${encodeURIComponent(v.make)}/${saSlug(v.saName)}/`,
    });
  }

  return links;
}

/** Keyword-only links for free-text AI suggestions that aren't in the catalog. */
export function keywordMarketplaceLinks(query: string): MarketplaceLink[] {
  const keyword = encodeURIComponent(query);
  return [
    {
      name: 'BE FORWARD',
      region: 'Japan',
      url: `https://www.beforward.jp/stocklist/keyword=${keyword}/`,
    },
    {
      name: 'Autocom Japan',
      region: 'Japan',
      url: `https://autocj.co.jp/used_cars?key=${keyword}`,
    },
  ];
}
