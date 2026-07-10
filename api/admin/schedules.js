import crypto from 'crypto';
import { kv } from '@vercel/kv';

const CACHE_KEY = 'shipping_schedules';

const REQUIRED_FIELDS = [
  'carrier',
  'vessel_name',
  'origin_port',
  'destination_port',
  'etd',
  'eta',
];

const VALID_STATUSES = ['Scheduled', 'Booking Open', 'Booking Closed', 'Departed', 'Arrived', 'Completed'];

function authenticate(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return { valid: false, reason: 'Server misconfigured: missing ADMIN_PASSWORD' };
  }

  if (!token || token !== adminPassword) {
    return { valid: false, reason: 'Unauthorized' };
  }

  return { valid: true };
}

async function readSchedules(kvConfigured) {
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

async function writeSchedules(kvConfigured, schedules) {
  if (kvConfigured) {
    try {
      await kv.set(CACHE_KEY, schedules);
    } catch (err) {
      console.warn('[RedisFailure] Failed to write schedules to KV:', err);
    }
  }

  // Always update in-memory store as fallback
  globalThis.__memorySchedules = schedules;
}

export default async function handler(req, res) {
  const method = req.method;

  if (!['POST', 'PUT', 'DELETE'].includes(method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate
  const auth = authenticate(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.reason });
  }

  const kvConfigured = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

  // If deployed to Vercel, KV is mandatory. Memory fallback is ONLY for local development!
  if (process.env.VERCEL === "1" && !kvConfigured) {
    return res.status(500).json({ error: "FATAL: Vercel KV Database is not connected to this project! Please go to Vercel Dashboard -> Storage -> Create KV Database and link it to this project." });
  }

  // --- POST: Add a new schedule(s) ---
  if (method === 'POST') {
    const body = req.body || {};
    const items = Array.isArray(body) ? body : [body];
    const newSchedules = [];

    for (const item of items) {
      // Validate required fields
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
        carrier: item.carrier.trim(),
        vessel_name: item.vessel_name.trim(),
        origin_port: item.origin_port.trim(),
        destination_port: item.destination_port.trim(),
        inspection_cutoff: (item.inspection_cutoff || '').trim(),
        port_cutoff: (item.port_cutoff || '').trim(),
        etd: item.etd.trim(),
        eta: item.eta.trim(),
        transit_days: typeof item.transit_days === 'number' ? item.transit_days : 0,
        status,
        created_at: now,
        updated_at: now,
      });
    }

    const schedules = await readSchedules(kvConfigured);
    schedules.push(...newSchedules);
    await writeSchedules(kvConfigured, schedules);

    return res.status(201).json({ added: newSchedules.length });
  }

  // --- PUT: Update an existing schedule ---
  if (method === 'PUT') {
    const { id, ...updates } = req.body || {};

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid schedule id' });
    }

    // Validate status if being updated
    if (updates.status && !VALID_STATUSES.includes(updates.status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const schedules = await readSchedules(kvConfigured);
    const index = schedules.findIndex((s) => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Merge updates (only allow known fields)
    const allowedFields = [
      'carrier', 'vessel_name', 'origin_port', 'destination_port',
      'inspection_cutoff', 'port_cutoff', 'etd', 'eta', 'status', 'transit_days'
    ];

    const sanitizedUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = typeof updates[field] === 'string' ? updates[field].trim() : updates[field];
      }
    }

    schedules[index] = {
      ...schedules[index],
      ...sanitizedUpdates,
      updated_at: new Date().toISOString(),
    };

    await writeSchedules(kvConfigured, schedules);

    return res.status(200).json({ schedule: schedules[index] });
  }

  // --- DELETE: Remove a schedule by ID ---
  if (method === 'DELETE') {
    const { id } = req.body || {};

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid schedule id' });
    }

    const schedules = await readSchedules(kvConfigured);
    const filtered = schedules.filter((s) => s.id !== id);

    if (filtered.length === schedules.length) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    await writeSchedules(kvConfigured, filtered);

    return res.status(200).json({ deleted: id, remaining: filtered.length });
  }
}
