import { Redis } from '@upstash/redis';

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const CACHE_KEY = 'zmw_fx_rates';
const CACHE_TTL = 86400; // 24 hours in seconds

// In-memory fallback if Vercel KV isn't configured
let memoryCache = null;
let memoryCacheExpiry = 0;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing EXCHANGE_RATE_API_KEY' });
  }

  // 1. Try to get from Cache
  let cachedRates = null;
  const kvConfigured = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

  if (kvConfigured) {
    try {
      cachedRates = await kv.get(CACHE_KEY);
    } catch (err) {
      console.warn('[RedisFailure] Failed to read FX cache from KV:', err);
    }
  } else {
    // Fallback to in-memory cache
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

  // 2. Fetch fresh rates from ExchangeRate-API (Free tier)
  try {
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`ExchangeRate-API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.result !== 'success') {
      throw new Error('API returned unsuccessful result');
    }

    const rates = data.conversion_rates;
    if (!rates.ZMW || !rates.ZAR) {
      throw new Error('Required currencies not found in API response');
    }

    // Free tier uses USD as base.
    // ZMW = USD * ZMW_RATE
    // ZAR_TO_ZMW = ZMW_RATE / ZAR_RATE
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
