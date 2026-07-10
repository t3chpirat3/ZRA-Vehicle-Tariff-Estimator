import crypto from 'crypto';

export function authenticate(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return { valid: false, reason: 'Server misconfigured: missing ADMIN_PASSWORD' };
  }

  if (!token) {
    return { valid: false, reason: 'Unauthorized' };
  }

  // Prevent timing attacks using crypto.timingSafeEqual
  const expectedBuf = Buffer.from(adminPassword);
  const tokenBuf = Buffer.from(token);

  let isValid = true;
  if (expectedBuf.length !== tokenBuf.length) {
    isValid = false;
    // Compare expected with expected to ensure execution time remains constant
    crypto.timingSafeEqual(expectedBuf, expectedBuf);
  } else {
    isValid = crypto.timingSafeEqual(expectedBuf, tokenBuf);
  }

  if (!isValid) {
    return { valid: false, reason: 'Unauthorized' };
  }

  return { valid: true };
}
