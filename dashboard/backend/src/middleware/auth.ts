import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

if (!process.env.DASHBOARD_JWT_SECRET) {
  console.warn(
    '[auth] WARNING: DASHBOARD_JWT_SECRET is not set. ' +
    'Using insecure default — set this variable before deployment.'
  );
}

const JWT_SECRET = process.env.DASHBOARD_JWT_SECRET || 'changeme-set-DASHBOARD_JWT_SECRET';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

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

export { JWT_SECRET };
