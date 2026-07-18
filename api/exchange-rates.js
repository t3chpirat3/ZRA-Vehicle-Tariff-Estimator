import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const kvConfigured = !!(kv && (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL));

const rateLimit = kvConfigured
  ? new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/exchange_rates',
    })
  : null;

const CACHE_KEY = 'zmw_fx_rates';
const CACHE_TTL = 86400; // 24 hours in seconds

// In-memory fallback
let memoryCache = null;
let memoryCacheExpiry = 0;
const fallbackRateLimitMap = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate Limiting Logic
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '127.0.0.1';
  let success = true;

  if (rateLimit) {
    try {
      const { success: rlSuccess, reset } = await rateLimit.limit(ip);
      success = rlSuccess;
      if (!success) {
        res.setHeader('X-RateLimit-Reset', reset.toString());
      }
    } catch (err) {
      console.warn('[RedisFailure] Rate limiting failed, failing closed.', err);
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }
  } else {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const record = fallbackRateLimitMap.get(ip) || { count: 0, reset: now + windowMs };
    
    if (now > record.reset) {
      record.count = 0;
      record.reset = now + windowMs;
    }
    
    record.count++;
    fallbackRateLimitMap.set(ip, record);
    
    if (record.count > 20) {
      success = false;
    }
  }

  if (!success) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // 1. Try to get from Cache
  let cachedRates = null;

  if (kvConfigured) {
    try {
      cachedRates = await kv.get(CACHE_KEY);
    } catch (err) {
      console.warn('[RedisFailure] Failed to read FX cache from KV:', err);
    }
  } else {
    if (memoryCache && Date.now() < memoryCacheExpiry) {
      cachedRates = memoryCache;
    }
  }

  if (cachedRates && cachedRates.usdToZmw && cachedRates.zarToZmw) {
    return res.status(200).json({
      source: 'cache',
      rates: cachedRates,
      timestamp: cachedRates.timestamp || Date.now()
    });
  }

  // 2. Fetch fresh rates
  try {
    let url = 'https://open.er-api.com/v6/latest/USD';
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (apiKey) {
      url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`ExchangeRate-API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.result !== 'success') {
      throw new Error('API returned unsuccessful result');
    }

    const rates = data.conversion_rates || data.rates;
    if (!rates || !rates.ZMW || !rates.ZAR) {
      throw new Error('Required currencies not found in API response');
    }

    const payload = {
      usdToZmw: rates.ZMW,
      zarToZmw: rates.ZMW / rates.ZAR,
      timestamp: Date.now()
    };

    // 3. Save to cache
    if (kvConfigured) {
      try {
        await kv.set(CACHE_KEY, payload, { ex: CACHE_TTL });
      } catch (err) {
        console.warn('[RedisFailure] Failed to write FX cache to KV:', err);
      }
    } else {
      memoryCache = payload;
      memoryCacheExpiry = Date.now() + (CACHE_TTL * 1000);
    }

    return res.status(200).json({
      source: 'api',
      rates: payload,
      timestamp: payload.timestamp
    });

  } catch (error) {
    console.error('[FXError] Failed to fetch live exchange rates:', error);
    return res.status(502).json({ error: 'Failed to fetch exchange rates.' });
  }
}
