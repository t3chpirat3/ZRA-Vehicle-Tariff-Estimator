import { authenticate } from './auth.js';

export default function handler(req, res) {
  // Validate method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check Authorization
  const auth = authenticate(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.reason });
  }

  // If valid, return success
  return res.status(200).json({ valid: true });
}
