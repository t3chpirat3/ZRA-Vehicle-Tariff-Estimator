import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || 'fallback-secret-do-not-use-in-prod';

export async function verifyPassword(password) {
  const adminPasswordHash = process.env.ADMIN_PASSWORD;
  
  if (!adminPasswordHash) {
    return { valid: false, reason: 'Server misconfigured: missing ADMIN_PASSWORD' };
  }

  if (!password) {
    return { valid: false, reason: 'Unauthorized' };
  }

  // Fallback for plaintext password if not yet hashed in environment
  if (!adminPasswordHash.startsWith('$2')) {
    const expectedBuf = Buffer.from(adminPasswordHash);
    const tokenBuf = Buffer.from(password);
    
    let isValid = true;
    if (expectedBuf.length !== tokenBuf.length) {
      isValid = false;
      crypto.timingSafeEqual(expectedBuf, expectedBuf);
    } else {
      isValid = crypto.timingSafeEqual(expectedBuf, tokenBuf);
    }
    
    return { valid: isValid, reason: isValid ? null : 'Unauthorized' };
  }

  try {
    const isValid = await bcrypt.compare(password, adminPasswordHash);
    return { valid: isValid, reason: isValid ? null : 'Unauthorized' };
  } catch (err) {
    return { valid: false, reason: 'Unauthorized' };
  }
}

export function generateToken() {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
}

export function authenticate(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return { valid: false, reason: 'Unauthorized' };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.role === 'admin') {
      return { valid: true };
    }
  } catch (err) {
    return { valid: false, reason: 'Invalid or expired token' };
  }

  return { valid: false, reason: 'Unauthorized' };
}
