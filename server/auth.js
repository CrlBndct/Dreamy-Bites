import { scrypt, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const secret = () => process.env.JWT_SECRET;

/* ---------- passwords (scrypt + random salt) ---------- */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scryptAsync(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const expected = Buffer.from(hash, 'hex');
  const key = await scryptAsync(password, salt, 64);
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/* ---------- signed tokens (HS256, JWT format) ---------- */
const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
const sign = (data) => createHmac('sha256', secret()).update(data).digest('base64url');

export function signToken(payload, seconds = 60 * 60 * 24 * 7) {
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const body = encode({ ...payload, exp: Math.floor(Date.now() / 1000) + seconds });
  return `${header}.${body}.${sign(`${header}.${body}`)}`;
}

export function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const a = Buffer.from(sig);
    const b = Buffer.from(sign(`${header}.${body}`));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}