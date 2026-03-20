import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const rawSecret = process.env.DASHBOARD_JWT_SECRET;
if (!rawSecret) {
  console.error(
    '[auth] FATAL: DASHBOARD_JWT_SECRET is not set. ' +
    'Set this environment variable before starting the server.'
  );
  process.exit(1);
}

export const JWT_SECRET: string = rawSecret;

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = (req.cookies as Record<string, string | undefined>).dashboard_token;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
