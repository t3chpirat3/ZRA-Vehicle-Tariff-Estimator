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

export type MarketRegion = 'Japan' | 'South Africa' | 'Singapore' | 'UAE' | 'Korea';

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
export function marketplaceLinks(v: VehicleModel, preferredRegion?: MarketRegion | 'Any'): MarketplaceLink[] {
  const keyword = encodeURIComponent(`${v.make} ${v.model}`);
  const links: MarketplaceLink[] = [];

  // South Africa
  if (v.saName && (preferredRegion === 'South Africa' || preferredRegion === 'Any' || !preferredRegion)) {
    links.push(
      {
        name: 'Cars.co.za',
        region: 'South Africa',
        url: `https://www.cars.co.za/usedcars/${encodeURIComponent(v.make)}/${saSlug(v.saName)}/`,
      },
      {
        name: 'AutoTrader SA',
        region: 'South Africa',
        url: `https://www.autotrader.co.za/cars-for-sale/${slug(v.make)}/${saSlug(v.saName)}/`,
      }
    );
  }

  // Japan / Global
  if (v.jpAvailable !== false) {
    if (preferredRegion === 'Japan' || preferredRegion === 'Any' || !preferredRegion) {
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
          name: 'TC-V (Trade Car View)',
          region: 'Japan',
          url: `https://www.tc-v.com/used_car/${slug(v.make)}/${slug(v.model)}/`,
        }
      );
    }

    // Handle other preferred regions
    const extraRegions: MarketRegion[] = ['Singapore', 'UAE', 'Korea'];
    for (const r of extraRegions) {
      if (preferredRegion === r || preferredRegion === 'Any' || !preferredRegion) {
        if (r === 'Singapore') {
          links.push({
            name: 'SGCarmart',
            region: r as MarketRegion,
            url: `https://www.sgcarmart.com/used_cars/listing.php?MOD=${keyword}`,
          });
        }
        if (r === 'UAE') {
          links.push({
            name: 'Dubizzle UAE',
            region: r as MarketRegion,
            url: `https://uae.dubizzle.com/motors/used-cars/?keywords=${keyword}`,
          });
        }
        if (r === 'Korea') {
          links.push({
            name: 'Autowini',
            region: r as MarketRegion,
            url: `https://www.autowini.com/search?keyword=${keyword}`,
          });
        }
      }
    }
  }

  return links;
}

/** Keyword-only links for free-text AI suggestions that aren't in the catalog. */
export function keywordMarketplaceLinks(query: string, preferredRegion?: MarketRegion | 'Any'): MarketplaceLink[] {
  const keyword = encodeURIComponent(query);
  const links: MarketplaceLink[] = [
    {
      name: 'BE FORWARD',
      region: 'Japan',
      url: `https://www.beforward.jp/stocklist/keyword=${keyword}/`,
    },
    {
      name: 'TC-V',
      region: 'Japan',
      url: `https://www.tc-v.com/used_car/search?keyword=${keyword}`,
    },
    {
      name: 'Autowini',
      region: 'Korea',
      url: `https://www.autowini.com/search?keyword=${keyword}`,
    }
  ];
  return links;
}
