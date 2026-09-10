/**
 * api/tpa-shipping.js
 *
 * Public GET endpoint — serves TPA Daily Shipping List data from Upstash KV.
 *
 * Query params:
 *   ?date=YYYY-MM-DD   serve a specific archived date
 *   (omit)             serve the latest pushed payload
 *
 * Response shape:
 *   { payload: TpaShippingPayload | null, available_dates: string[], timestamp: number }
 *
 * Data is written by scripts/tpa_push.py using the Upstash REST pipeline API.
 * Keys:
 *   tpa:shipping:latest              — full payload, TTL 48h
 *   tpa:shipping:date:{YYYY-MM-DD}   — per-date archive, TTL 90d
 *   tpa:shipping:dates               — ZSET of published dates (score = Unix ts)
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const kvConfigured =
  !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
  !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

const rateLimit = kvConfigured
  ? new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/tpa_shipping_public',
    })
  : null;

/** Validate that a date string is YYYY-MM-DD and looks plausible. */
function isValidDateParam(d) {
  if (!d || typeof d !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  if (rateLimit) {
    try {
      const { success, reset } = await rateLimit.limit(ip);
      if (!success) {
        res.setHeader('X-RateLimit-Reset', reset.toString());
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }
    } catch (err) {
      console.warn('[tpa-shipping] Rate limit check failed:', err?.message);
    }
  }

  // ── Resolve which key to read ──────────────────────────────────────────────
  const { date } = req.query;
  const useDate = isValidDateParam(date) ? date : null;
  const payloadKey = useDate ? `tpa:shipping:date:${useDate}` : 'tpa:shipping:latest';

  let payload = null;
  let available_dates = [];

  if (kvConfigured) {
    try {
      // Fetch payload and the full dates sorted set in parallel
      const [rawPayload, rawDates] = await Promise.all([
        kv.get(payloadKey),
        kv.zrange('tpa:shipping:dates', 0, -1, { rev: true }), // newest first
      ]);

      payload = rawPayload ?? null;
      available_dates = Array.isArray(rawDates) ? rawDates : [];
    } catch (err) {
      console.warn('[tpa-shipping] KV read failed:', err?.message);
      // Return graceful empty response — don't 500
    }
  }

  // ── Cache headers ──────────────────────────────────────────────────────────
  // TPA publishes once daily; 5-min CDN cache is plenty.
  // Historical date requests can be cached much longer (data never changes).
  const cacheAge = useDate ? 86400 : 300; // 24h for archive, 5min for latest
  res.setHeader('Cache-Control', `s-maxage=${cacheAge}, stale-while-revalidate=3600`);

  return res.status(200).json({
    payload,
    available_dates,
    timestamp: Date.now(),
  });
}
