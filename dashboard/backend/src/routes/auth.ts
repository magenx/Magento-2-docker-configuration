import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth';

const router = Router();

const DASHBOARD_USERNAME = process.env.DASHBOARD_USERNAME || 'admin';
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || '';

if (!DASHBOARD_PASSWORD) {
  console.warn(
    '[auth] WARNING: DASHBOARD_PASSWORD is not set. ' +
    'Login will be disabled until this variable is configured.'
  );
}

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
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  if (!DASHBOARD_PASSWORD) {
    res.status(503).json({ error: 'Authentication not configured. Set DASHBOARD_PASSWORD.' });
    return;
  }

  const usernameOk = timingSafeEqual(username, DASHBOARD_USERNAME);
  const passwordOk = timingSafeEqual(password, DASHBOARD_PASSWORD);

  if (!usernameOk || !passwordOk) {
    res.status(401).json({ error: 'Invalid credentials.' });
    return;
  }

  const token = jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: '8h', algorithm: 'HS256' });
  res.json({ token });
});

export default router;
