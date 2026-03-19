import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import redisRouter from './routes/redis';
import opensearchRouter from './routes/opensearch';
import rabbitmqRouter from './routes/rabbitmq';
import mariadbRouter from './routes/mariadb';
import nginxRouter from './routes/nginx';
import phpfpmRouter from './routes/phpfpm';
import varnishRouter from './routes/varnish';
import magentoRouter from './routes/magento';
import linuxRouter from './routes/linux';
import profilerRouter from './routes/profiler';
import auditdRouter from './routes/auditd';
import authRouter from './routes/auth';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3001;

// Security headers
app.use(helmet());

// Restrict CORS to a configurable origin; defaults to same-origin (no extra header)
const corsOrigin = process.env.DASHBOARD_CORS_ORIGIN;
if (corsOrigin) {
  app.use(cors({ origin: corsOrigin, credentials: true }));
}

// Limit request body size to prevent DoS via large payloads
app.use(express.json({ limit: '10kb' }));

// Stricter rate limit on login to prevent brute-force: 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/login', loginLimiter);

// Rate limit: max 60 requests per minute per IP (enough for 30s auto-refresh + manual)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});
app.use('/api/', apiLimiter);

// Auth routes (public)
app.use('/api/auth', authRouter);

// Health check (public)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// All remaining service routes are protected by auth
app.use('/api/redis', authMiddleware, redisRouter);
app.use('/api/opensearch', authMiddleware, opensearchRouter);
app.use('/api/rabbitmq', authMiddleware, rabbitmqRouter);
app.use('/api/mariadb', authMiddleware, mariadbRouter);
app.use('/api/nginx', authMiddleware, nginxRouter);
app.use('/api/phpfpm', authMiddleware, phpfpmRouter);
app.use('/api/varnish', authMiddleware, varnishRouter);
app.use('/api/magento', authMiddleware, magentoRouter);
app.use('/api/linux', authMiddleware, linuxRouter);
app.use('/api/profiler', authMiddleware, profilerRouter);
app.use('/api/auditd', authMiddleware, auditdRouter);

app.listen(PORT, () => {
  console.log(`Dashboard backend running on port ${PORT}`);
});

export default app;
