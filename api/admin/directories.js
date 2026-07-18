import { authenticate } from './auth.js';
import { Redis } from '@upstash/redis';

const kvConfigured = !!((process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) || 
                       (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN));

const kv = kvConfigured ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
}) : null;

const CACHE_KEY = 'market_directories';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = authenticate(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.reason });
  }

  if (!kvConfigured) {
    return res.status(500).json({ error: 'Redis is not configured on this environment.' });
  }

  try {
    const { directories } = req.body || {};
    if (!directories) {
      return res.status(400).json({ error: 'Missing directories payload' });
    }

    await kv.set(CACHE_KEY, directories);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
