import { verifyPassword, generateToken } from '../_lib/auth.js';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Redis and Rate Limiting Setup
const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const kvConfigured = !!(kv && (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL));

// Auth rate limit: 5 attempts per 15 minutes per IP
const authRateLimit = kvConfigured
  ? new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/auth',
    })
  : null;

// Fallback in-memory rate limiter
const fallbackRateLimitMap = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate Limiting Logic
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '127.0.0.1';
  let success = true;

  if (authRateLimit) {
    try {
      const { success: rlSuccess, reset } = await authRateLimit.limit(ip);
      success = rlSuccess;
      if (!success) {
        res.setHeader('X-RateLimit-Reset', reset.toString());
      }
    } catch (err) {
      console.warn('[RedisFailure] Auth rate limiting failed, failing closed.');
      return res.status(503).json({ error: 'Authentication service temporarily unavailable' });
    }
  } else {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const record = fallbackRateLimitMap.get(ip) || { count: 0, reset: now + windowMs };
    
    if (now > record.reset) {
      record.count = 0;
      record.reset = now + windowMs;
    }
    
    record.count++;
    fallbackRateLimitMap.set(ip, record);
    
    if (record.count > 5) {
      success = false;
    }
  }

  if (!success) {
    return res.status(429).json({ error: 'Too many authentication attempts. Please try again later.' });
  }

  // Verify credentials
  let password = '';
  
  if (req.body && req.body.password) {
    password = req.body.password;
  } else {
    const authHeader = req.headers['authorization'] || '';
    password = authHeader.replace(/^Bearer\s+/i, '').trim();
  }

  const auth = await verifyPassword(password);
  
  if (!auth.valid) {
    // Artificial delay to foil timing attacks when guessing
    await new Promise(r => setTimeout(r, Math.random() * 200 + 100));
    return res.status(401).json({ error: auth.reason });
  }

  const token = generateToken();
  return res.status(200).json({ valid: true, token });
}
