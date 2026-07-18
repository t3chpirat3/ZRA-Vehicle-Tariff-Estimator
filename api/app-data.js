import { Redis } from '@upstash/redis';
import { authenticate } from './_lib/auth.js';

const kvConfigured = !!((process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) || 
                       (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN));

const kv = kvConfigured ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
}) : null;

// Map query types to Redis keys
const KEY_MAP = {
  'tax': 'zra_tax_rates',
  'inland': 'inland_logistics',
  'agents': 'featured_agents',
  'marketplaces': 'marketplace_platforms',
  'fx_override': 'fx_override'
};

export default async function handler(req, res) {
  if (!kvConfigured) {
    return res.status(500).json({ error: 'Redis not configured' });
  }

  const { type } = req.query;
  const cacheKey = KEY_MAP[type];

  if (!cacheKey) {
    return res.status(400).json({ error: 'Invalid or missing data type parameter' });
  }

  if (req.method === 'GET') {
    try {
      const data = await kv.get(cacheKey);
      if (!data) {
        return res.status(404).json({ error: 'Not found', fallback: true });
      }
      return res.status(200).json({ data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    const auth = authenticate(req);
    if (!auth.valid) {
      return res.status(401).json({ error: auth.reason });
    }

    try {
      const { data } = req.body || {};
      if (data === undefined) {
        return res.status(400).json({ error: 'Missing data payload' });
      }

      await kv.set(cacheKey, data);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
