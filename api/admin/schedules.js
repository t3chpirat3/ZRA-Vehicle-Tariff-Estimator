import crypto from 'crypto';
import { authenticate } from '../_lib/auth.js';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const CACHE_KEY = 'shipping_schedules';
const LOCK_KEY = 'shipping_schedules_lock';

const REQUIRED_FIELDS = [
  'carrier',
  'vessel_name',
  'origin_port',
  'destination_port',
  'etd',
  'eta',
];

const VALID_STATUSES = ['Scheduled', 'Booking Open', 'Booking Closed', 'Departed', 'Arrived', 'Completed'];

const kvConfigured = !!((process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) || 
                       (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN));

const adminRateLimit = kvConfigured
  ? new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/admin_schedules',
    })
  : null;

async function acquireLock() {
  if (!kvConfigured) return true;
  for (let i = 0; i < 10; i++) {
    const locked = await kv.set(LOCK_KEY, 'locked', { nx: true, ex: 5 });
    if (locked) return true;
    await new Promise(r => setTimeout(r, 300));
  }
  return false;
}

async function releaseLock() {
  if (kvConfigured) {
    await kv.del(LOCK_KEY);
  }
}

async function readSchedules() {
  let schedules = null;
  if (kvConfigured) {
    try {
      schedules = await kv.get(CACHE_KEY);
    } catch (err) {
      console.warn('[RedisFailure] Failed to read schedules from KV:', err);
    }
  }
  if (!schedules && globalThis.__memorySchedules) {
    schedules = globalThis.__memorySchedules;
  }
  return Array.isArray(schedules) ? schedules : [];
}

async function writeSchedules(schedules) {
  if (kvConfigured) {
    try {
      await kv.set(CACHE_KEY, schedules);
    } catch (err) {
      console.warn('[RedisFailure] Failed to write schedules to KV:', err);
    }
  }
  globalThis.__memorySchedules = schedules;
}

const safeStr = (str) => typeof str === 'string' ? str.slice(0, 255).trim() : '';

export default async function handler(req, res) {
  const method = req.method;

  if (!['POST', 'PUT', 'DELETE'].includes(method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate Limiting Logic
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '127.0.0.1';
  if (adminRateLimit) {
    try {
      const { success, reset } = await adminRateLimit.limit(ip);
      if (!success) {
        res.setHeader('X-RateLimit-Reset', reset.toString());
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }
    } catch (err) {
      console.warn('[RedisFailure] Rate limiting failed.');
    }
  }

  // Authenticate
  const auth = authenticate(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.reason });
  }

  if (process.env.VERCEL === "1" && !kvConfigured) {
    return res.status(500).json({ error: "FATAL: Upstash Redis is not connected to this project!" });
  }

  // Acquire Lock for CRUD operations
  const gotLock = await acquireLock();
  if (!gotLock) {
    return res.status(409).json({ error: 'Database is currently locked by another operation. Please try again in a few seconds.' });
  }

  try {
    // --- POST: Add a new schedule(s) ---
    if (method === 'POST') {
      const body = req.body || {};
      const items = Array.isArray(body) ? body : [body];
      const newSchedules = [];

      for (const item of items) {
        const missing = REQUIRED_FIELDS.filter((f) => !item[f] || typeof item[f] !== 'string' || item[f].trim() === '');
        if (missing.length > 0) {
          return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
        }

        const status = item.status || 'Scheduled';
        if (!VALID_STATUSES.includes(status)) {
          return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
        }

        const now = new Date().toISOString();
        newSchedules.push({
          id: crypto.randomUUID(),
          carrier: safeStr(item.carrier),
          vessel_name: safeStr(item.vessel_name),
          origin_port: safeStr(item.origin_port),
          destination_port: safeStr(item.destination_port),
          inspection_cutoff: safeStr(item.inspection_cutoff),
          port_cutoff: safeStr(item.port_cutoff),
          etd: safeStr(item.etd),
          eta: safeStr(item.eta),
          transit_days: typeof item.transit_days === 'number' ? item.transit_days : 0,
          status,
          created_at: now,
          updated_at: now,
        });
      }

      const schedules = await readSchedules();
      schedules.push(...newSchedules);
      await writeSchedules(schedules);

      return res.status(201).json({ added: newSchedules.length });
    }

    // --- PUT: Update an existing schedule ---
    if (method === 'PUT') {
      const { id, ...updates } = req.body || {};

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid schedule id' });
      }

      if (updates.status && !VALID_STATUSES.includes(updates.status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      }

      const schedules = await readSchedules();
      const index = schedules.findIndex((s) => s.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      const allowedFields = [
        'carrier', 'vessel_name', 'origin_port', 'destination_port',
        'inspection_cutoff', 'port_cutoff', 'etd', 'eta', 'status', 'transit_days'
      ];

      const sanitizedUpdates = {};
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          sanitizedUpdates[field] = typeof updates[field] === 'string' ? safeStr(updates[field]) : updates[field];
        }
      }

      schedules[index] = {
        ...schedules[index],
        ...sanitizedUpdates,
        updated_at: new Date().toISOString(),
      };

      await writeSchedules(schedules);

      return res.status(200).json({ schedule: schedules[index] });
    }

    // --- DELETE: Remove a schedule by ID ---
    if (method === 'DELETE') {
      const { id } = req.body || {};

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid schedule id' });
      }

      const schedules = await readSchedules();
      const filtered = schedules.filter((s) => s.id !== id);

      if (filtered.length === schedules.length) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      await writeSchedules(filtered);

      return res.status(200).json({ deleted: id, remaining: filtered.length });
    }
  } finally {
    await releaseLock();
  }
}
