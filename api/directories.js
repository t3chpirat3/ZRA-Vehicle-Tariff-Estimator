import { Redis } from '@upstash/redis';

const kvConfigured = !!((process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) || 
                       (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN));

const kv = kvConfigured ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
}) : null;

const CACHE_KEY = 'market_directories';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!kvConfigured) {
    return res.status(404).json({ error: 'Redis not configured' });
  }

  try {
    const directories = await kv.get(CACHE_KEY);
    if (!directories) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json({ directories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
