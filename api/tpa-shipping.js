/**
 * api/tpa-shipping.js
 *
 * Unified endpoint for TPA Daily Shipping List data.
 * Merges public GET access with authenticated admin POST/DELETE.
 *
 * GET   — Public: serve the latest or archived TPA payload
 * POST  — Admin: publish/overwrite a TPA payload
 * DELETE— Admin: remove the latest payload (and optionally a specific date)
 */

import { authenticate } from './_lib/auth.js';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const kvConfigured =
  !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
  !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

const publicRateLimit = kvConfigured
  ? new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/tpa_shipping_public',
    })
  : null;

const adminRateLimit = kvConfigured
  ? new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/admin_tpa',
    })
  : null;

const TTL_LATEST  = 48 * 3600;      // 48 hours
const MAX_HISTORY = 30;             // Max days to keep in archive
const TTL_DATE    = MAX_HISTORY * 24 * 3600;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Validate that a date string is YYYY-MM-DD and looks plausible. */
function isValidDateParam(d) {
  if (!d || typeof d !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

/** Validate that the payload has the expected top-level shape from tpa_parser.py */
function validatePayload(body) {
  if (!body || typeof body !== 'object') {
    return 'Payload must be a JSON object';
  }
  if (!body.report_date || typeof body.report_date !== 'string') {
    return 'Missing or invalid report_date (expected YYYY-MM-DD string)';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.report_date)) {
    return 'report_date must be in YYYY-MM-DD format';
  }
  const requiredArrays = ['expected_arrivals', 'ships_at_berth', 'coastal_anchorages', 'outer_anchorages'];
  for (const key of requiredArrays) {
    if (!Array.isArray(body[key])) {
      return `Missing or invalid "${key}" (expected array) — is this a valid tpa_parser.py output?`;
    }
  }
  // Sanity-check: reject absurdly large payloads (> 2 MB)
  const jsonSize = JSON.stringify(body).length;
  if (jsonSize > 2 * 1024 * 1024) {
    return 'Payload exceeds 2 MB limit';
  }
  return null; // valid
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  // ===========================================================================
  // PUBLIC GET ENDPOINT
  // ===========================================================================
  if (req.method === 'GET') {
    if (publicRateLimit) {
      try {
        const { success, reset } = await publicRateLimit.limit(ip);
        if (!success) {
          res.setHeader('X-RateLimit-Reset', reset.toString());
          return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }
      } catch (err) {
        console.warn('[tpa-shipping] Rate limit check failed:', err?.message);
      }
    }

    const { date } = req.query;
    const useDate = isValidDateParam(date) ? date : null;
    const payloadKey = useDate ? `tpa:shipping:date:${useDate}` : 'tpa:shipping:latest';

    let payload = null;
    let available_dates = [];

    if (kvConfigured) {
      try {
        const [rawPayload, rawDates] = await Promise.all([
          kv.get(payloadKey),
          kv.zrange('tpa:shipping:dates', 0, -1, { rev: true }), // newest first
        ]);
        payload = rawPayload ?? null;
        available_dates = Array.isArray(rawDates) ? rawDates : [];
      } catch (err) {
        console.warn('[tpa-shipping] KV read failed:', err?.message);
      }
    }

    // Cache headers
    const cacheAge = useDate ? 86400 : 300; // 24h for archive, 5min for latest
    res.setHeader('Cache-Control', `s-maxage=${cacheAge}, stale-while-revalidate=3600`);

    return res.status(200).json({
      payload,
      available_dates,
      timestamp: Date.now(),
    });
  }

  // ===========================================================================
  // ADMIN POST / DELETE ENDPOINTS
  // ===========================================================================

  // 1. Admin rate limit
  if (adminRateLimit) {
    try {
      const { success, reset } = await adminRateLimit.limit(ip);
      if (!success) {
        res.setHeader('X-RateLimit-Reset', reset.toString());
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }
    } catch (err) {
      console.warn('[admin/tpa-shipping] Rate limit check failed:', err?.message);
    }
  }

  // 2. Admin auth check
  const auth = authenticate(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.reason });
  }

  if (process.env.VERCEL === '1' && !kvConfigured) {
    return res.status(500).json({ error: 'FATAL: Upstash Redis is not connected to this project!' });
  }

  // 3. POST (Publish)
  if (req.method === 'POST') {
    const body = req.body;
    const validationError = validatePayload(body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { report_date } = body;
    const latestKey = 'tpa:shipping:latest';
    const dateKey   = `tpa:shipping:date:${report_date}`;
    const datesKey  = 'tpa:shipping:dates';
    const dateScore = Math.floor(new Date(report_date + 'T00:00:00Z').getTime() / 1000);

    try {
      await Promise.all([
        kv.set(latestKey, body, { ex: TTL_LATEST }),
        kv.set(dateKey,   body, { ex: TTL_DATE }),
        kv.zadd(datesKey, { score: dateScore, member: report_date }),
      ]);

      // Enforce 30-day history cap
      const allDates = await kv.zrange(datesKey, 0, -1, { rev: false }); // oldest first
      if (allDates && allDates.length > MAX_HISTORY) {
        const oldDates = allDates.slice(0, allDates.length - MAX_HISTORY);
        if (oldDates.length > 0) {
          const keysToDelete = oldDates.map(d => `tpa:shipping:date:${d}`);
          await Promise.all([
            ...keysToDelete.map(k => kv.del(k)),
            kv.zrem(datesKey, ...oldDates)
          ]);
          console.log(`[admin/tpa-shipping] Pruned ${oldDates.length} old dates beyond ${MAX_HISTORY}-day cap.`);
        }
      }

      const summary = {
        report_date,
        expected_arrivals: body.expected_arrivals.length,
        ships_at_berth_rows: body.ships_at_berth.length,
        coastal_anchorages: body.coastal_anchorages.length,
        outer_anchorages: body.outer_anchorages.length,
        stale_snapshot_suspected: body.outer_anchorages_stale_snapshot_suspected ?? false,
      };

      console.log('[admin/tpa-shipping] Published:', summary);
      return res.status(200).json({ ok: true, summary });
    } catch (err) {
      console.error('[admin/tpa-shipping] KV write error:', err);
      return res.status(500).json({ error: 'Failed to write to KV store: ' + err?.message });
    }
  }

  // 4. DELETE (Remove latest)
  if (req.method === 'DELETE') {
    const { date } = req.body || {};
    try {
      const toDelete = ['tpa:shipping:latest'];
      if (date && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        toDelete.push(`tpa:shipping:date:${date}`);
        await Promise.all([
          ...toDelete.map(k => kv.del(k)),
          kv.zrem('tpa:shipping:dates', date),
        ]);
        return res.status(200).json({ ok: true, deleted: toDelete, removedFromIndex: date });
      } else {
        await kv.del('tpa:shipping:latest');
        return res.status(200).json({ ok: true, deleted: ['tpa:shipping:latest'] });
      }
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete: ' + err?.message });
    }
  }
}
