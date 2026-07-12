import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const CACHE_KEY = 'shipping_schedules';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const kvConfigured = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) || 
                       (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  // Rate Limiting Logic
  const rateLimit = kvConfigured
    ? new Ratelimit({
        redis: kv,
        limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
        analytics: true,
        prefix: '@upstash/ratelimit/schedules_public',
      })
    : null;

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '127.0.0.1';
  let success = true;

  if (rateLimit) {
    try {
      const { success: rlSuccess, reset } = await rateLimit.limit(ip);
      success = rlSuccess;
      if (!success) res.setHeader('X-RateLimit-Reset', reset.toString());
    } catch (err) {
      console.warn('[RedisFailure] Rate limiting failed.');
    }
  }

  if (!success) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  let schedules = null;
  let source = 'memory';

  // 1. Read schedules from KV or memory
  if (kvConfigured) {
    try {
      schedules = await kv.get(CACHE_KEY);
      source = 'kv';
    } catch (err) {
      console.warn('[RedisFailure] Failed to read schedules from KV:', err);
    }
  }

  // Fallback to in-memory cache
  if (!schedules && globalThis.__memorySchedules) {
    schedules = globalThis.__memorySchedules;
    source = 'memory';
  }

  // Handle empty state
  if (!schedules || !Array.isArray(schedules)) {
    schedules = [];
  }

  // 2. Auto-filter out schedules where ETA is >14 days in the past
  const now = Date.now();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  schedules = schedules.filter((s) => {
    if (!s.eta) return true;
    const etaDate = new Date(s.eta).getTime();
    return !isNaN(etaDate) && (now - etaDate) <= fourteenDaysMs;
  });

  // 3. Sort by ETD ascending (nearest departure first)
  schedules.sort((a, b) => {
    const etdA = new Date(a.etd || 0).getTime();
    const etdB = new Date(b.etd || 0).getTime();
    return etdA - etdB;
  });

  // 4. Set CDN cache headers (60 seconds)
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=86400');

  return res.status(200).json({
    schedules,
    source,
    timestamp: Date.now(),
  });
}
