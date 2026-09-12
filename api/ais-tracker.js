/**
 * api/ais-tracker.js
 *
 * Live AIS position tracking for a curated fleet of RoRo vessels
 * that service East/Southern African ports (Dar es Salaam, Durban, etc.)
 *
 * Uses the Pelyr HTTPS API — called server-side only, key never exposed.
 * Results are cached in Upstash Redis for 3 minutes to stay within
 * Pelyr's 12 req/min rate limit (17 vessels = 17 requests per refresh).
 *
 * GET — Public: returns cached or freshly fetched fleet positions.
 */

import { Redis } from '@upstash/redis';

const PELYR_BASE = 'https://api.pelyr.com/v1';
const CACHE_KEY  = 'ais:fleet:positions';
const CACHE_TTL  = 180; // seconds (3 minutes)

const kv = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL   || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const kvConfigured = !!((
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
  (process.env.KV_REST_API_URL       && process.env.KV_REST_API_TOKEN));

// ---------------------------------------------------------------------------
// Vessel registry — edit here to add/remove tracked vessels
// ---------------------------------------------------------------------------
const VESSELS = [
  { name: 'Jasper Arrow',       imo: 9267912, mmsi: 311919000, flag: 'Bahamas' },
  { name: 'Prometheus Leader',  imo: 9338888, mmsi: 565835000, flag: 'Singapore' },
  { name: 'Glovis Solar',       imo: 9955650, mmsi: 636023991, flag: 'Liberia' },
  { name: 'Freedom Ace',        imo: 9293662, mmsi: 431868000, flag: 'Japan' },
  { name: 'Olympian Highway',   imo: 9757993, mmsi: 431651000, flag: 'Japan' },
  { name: 'Crystal Ace',        imo: 9539224, mmsi: 538004619, flag: 'Marshall Islands' },
  { name: 'Lake Qaraoun',       imo: 9946099, mmsi: 636021540, flag: 'Liberia' },
  { name: 'Hoegh Copenhagen',   imo: 9420057, mmsi: 257368000, flag: 'Norway' },
  { name: 'Grande Napoli',      imo: 9247924, mmsi: 247080200, flag: 'Italy' },
  { name: 'Neptune Leader',     imo: 9402744, mmsi: 357079000, flag: 'Panama' },
  { name: 'Glorious Ace',       imo: 9561277, mmsi: 319409000, flag: 'Cayman Islands' },
  { name: 'Elegant Ace',        imo: 9561265, mmsi: 352980796, flag: 'Panama' },
  { name: 'Glovis Silver',      imo: 9775828, mmsi: 440249000, flag: 'South Korea' },
  { name: 'Viking Passama',     imo: 9491874, mmsi: 538009816, flag: 'Marshall Islands' },
  { name: 'Hoegh Tracer',       imo: 9684990, mmsi: 258628000, flag: 'Norway' },
  { name: 'Brilliant Ace',      imo: 9598012, mmsi: 355911000, flag: 'Panama' },
  { name: 'Sunrise Ace',        imo: 9338840, mmsi: 311013600, flag: 'Bahamas' },
];

// ---------------------------------------------------------------------------
// Fetch a single vessel from Pelyr
// ---------------------------------------------------------------------------
async function fetchVessel(vessel, apiKey) {
  const url = PELYR_BASE + '/vessels/' + vessel.mmsi;
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + apiKey },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 404) {
      // Vessel silent for >1 hour — not an error
      return {
        name: vessel.name,
        imo:  vessel.imo,
        mmsi: vessel.mmsi,
        flag: vessel.flag,
        status: 'silent',
        lat: null, lon: null, sog: null, cog: null, heading: null,
        nav_status: null, destination: null, eta: null, last_seen: null,
      };
    }

    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }

    const data = await res.json();
    const pos  = data.position || {};
    const stat = data.static   || {};

    return {
      name:        vessel.name,
      imo:         vessel.imo,
      mmsi:        vessel.mmsi,
      flag:        vessel.flag,
      status:      'live',
      lat:         pos.lat         ?? null,
      lon:         pos.lon         ?? null,
      sog:         pos.sog         ?? null,
      cog:         pos.cog         ?? null,
      heading:     pos.heading     ?? null,
      nav_status:  pos.nav_status  ?? null,
      last_seen:   pos.ts          ?? null,
      destination: stat.dest       ?? null,
      eta:         stat.eta        ?? null,
      vessel_name: stat.name       ?? vessel.name,
    };
  } catch (err) {
    console.error('[ais-tracker] Failed to fetch MMSI ' + vessel.mmsi + ':', err?.message);
    return {
      name: vessel.name,
      imo:  vessel.imo,
      mmsi: vessel.mmsi,
      flag: vessel.flag,
      status: 'error',
      lat: null, lon: null, sog: null, cog: null, heading: null,
      nav_status: null, destination: null, eta: null, last_seen: null,
    };
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const forceRefresh = req.query.refresh === '1';

  // ---- Try cache first ----
  if (kvConfigured && !forceRefresh) {
    try {
      const cached = await kv.get(CACHE_KEY);
      if (cached) {
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cached);
      }
    } catch (err) {
      console.warn('[ais-tracker] Redis read failed:', err?.message);
    }
  }

  // ---- Fetch from Pelyr ----
  const apiKey = process.env.PELYR_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'PELYR_API_KEY is not configured.' });
  }

  const fetched_at = new Date().toISOString();

  // Fire all vessel requests in parallel
  const vessels = await Promise.all(VESSELS.map(v => fetchVessel(v, apiKey)));

  const live    = vessels.filter(v => v.status === 'live').length;
  const silent  = vessels.filter(v => v.status === 'silent').length;
  const errors  = vessels.filter(v => v.status === 'error').length;

  const payload = {
    vessels,
    fetched_at,
    cache_ttl_s: CACHE_TTL,
    summary: { total: vessels.length, live, silent, errors },
    attribution: 'AIS data provided by Pelyr (pelyr.com)',
  };

  // ---- Cache result ----
  if (kvConfigured) {
    try {
      await kv.set(CACHE_KEY, payload, { ex: CACHE_TTL });
    } catch (err) {
      console.warn('[ais-tracker] Redis write failed:', err?.message);
    }
  }

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  res.setHeader('X-Cache', 'MISS');
  return res.status(200).json(payload);
}