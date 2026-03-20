import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, authMiddleware } from '../middleware/auth';

const router = Router();

const DASHBOARD_USERNAME = process.env.DASHBOARD_USERNAME || 'admin';
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || '';

if (!DASHBOARD_PASSWORD) {
  console.warn(
    '[auth] WARNING: DASHBOARD_PASSWORD is not set. ' +
    'Login will be disabled until this variable is configured.'
  );
}

const MAX_USERNAME_LEN = 255;
const MAX_PASSWORD_LEN = 1024;

// Whether to set the Secure flag on the session cookie (HTTPS only in production)
const COOKIE_SECURE = process.env.NODE_ENV === 'production';

// Fixed-length dummy buffer used to keep timing consistent when lengths differ
const DUMMY_BUF = Buffer.alloc(64, 0);

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a).subarray(0, 64);
  const bufB = Buffer.from(b).subarray(0, 64);
  const padA = Buffer.concat([bufA, DUMMY_BUF]).subarray(0, 64);
  const padB = Buffer.concat([bufB, DUMMY_BUF]).subarray(0, 64);
  const equal = crypto.timingSafeEqual(padA, padB);
  // Also require original lengths to match to prevent prefix attacks
  return equal && a.length === b.length;
}

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body as { username?: unknown; password?: unknown };

  // Validate that both fields are non-empty strings
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  // Reject implausibly long inputs (prevents resource exhaustion / log flooding)
  if (username.length > MAX_USERNAME_LEN || password.length > MAX_PASSWORD_LEN) {
    res.status(400).json({ error: 'Invalid credentials.' });
    return;
  }

  if (!DASHBOARD_PASSWORD) {
    res.status(503).json({ error: 'Authentication not configured. Set DASHBOARD_PASSWORD.' });
    return;
  }

  const usernameOk = timingSafeEqual(username, DASHBOARD_USERNAME);
  const passwordOk = timingSafeEqual(password, DASHBOARD_PASSWORD);

  if (!usernameOk || !passwordOk) {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const safeUser = username.slice(0, 64);
    const lenHint = username.length > 64 ? ` (${username.length} chars)` : '';
    console.warn(`[auth] Failed login attempt for user "${safeUser}"${lenHint} from ${ip} at ${new Date().toISOString()}`);
    res.status(401).json({ error: 'Invalid credentials.' });
    return;
  }

  const token = jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: '8h', algorithm: 'HS256' });

  // Issue token as an httpOnly, SameSite=Strict cookie to prevent XSS token theft
  res.cookie('dashboard_token', token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
    path: '/',
  });

  res.json({ ok: true });
});

// Check whether the current session cookie is valid (used by the SPA on mount)
router.get('/check', authMiddleware, (_req: Request, res: Response): void => {
  res.json({ ok: true });
});

// Invalidate the session cookie
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('dashboard_token', {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'strict',
    path: '/',
  });
  res.json({ ok: true });
});

export default router;
