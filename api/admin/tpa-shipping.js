/**
 * api/admin/tpa-shipping.js
 *
 * Admin endpoint for publishing TPA Daily Shipping List data.
 * Accepts the JSON payload produced by scripts/tpa_parser.py.
 *
 * POST  — Publish/overwrite a TPA shipping list payload
 * DELETE — Remove the latest payload (and optionally a specific date)
 *
 * Auth: Bearer JWT (same token used by all other admin endpoints)
 *
 * The same KV keys are written here as in scripts/tpa_push.py:
 *   tpa:shipping:latest              (TTL: 48h)
 *   tpa:shipping:date:{YYYY-MM-DD}   (TTL: 90d)
 *   tpa:shipping:dates               (sorted set, no TTL)
 */

import { authenticate } from '../_lib/auth.js';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const kvConfigured =
  !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
  !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

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

export default async function handler(req, res) {
  if (!['POST', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Rate limit ──────────────────────────────────────────────────────────────
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

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

  // ── Auth ────────────────────────────────────────────────────────────────────
  const auth = authenticate(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.reason });
  }

  if (process.env.VERCEL === '1' && !kvConfigured) {
    return res.status(500).json({ error: 'FATAL: Upstash Redis is not connected to this project!' });
  }

  // ── POST: publish a new TPA daily payload ───────────────────────────────────
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

    // Score = Unix timestamp of the report date (midnight UTC) for the sorted set
    const dateScore = Math.floor(new Date(report_date + 'T00:00:00Z').getTime() / 1000);

    try {
      // Write both keys and update the dates index in parallel
      await Promise.all([
        kv.set(latestKey, body, { ex: TTL_LATEST }),
        kv.set(dateKey,   body, { ex: TTL_DATE }),
        kv.zadd(datesKey, { score: dateScore, member: report_date }),
      ]);

      // ── Enforce 30-day history cap ──────────────────────────────────────────
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

  // ── DELETE: remove latest (and optionally a specific date) ─────────────────
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
