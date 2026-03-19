import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const NGINX_STATUS_URL =
  process.env.NGINX_STATUS_URL || 'http://nginx/nginx_status';

router.get('/', async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(NGINX_STATUS_URL, { timeout: 5000 });
    const text: string = response.data;

    // Parse nginx stub_status output:
    // Active connections: 291
    // server accepts handled requests
    //  16630948 16630948 31070465
    // Reading: 6 Writing: 179 Waiting: 106
    const activeMatch = text.match(/Active connections:\s*(\d+)/);
    const serverStats = text.match(/(\d+)\s+(\d+)\s+(\d+)/);
    const readingMatch = text.match(/Reading:\s*(\d+)/);
    const writingMatch = text.match(/Writing:\s*(\d+)/);
    const waitingMatch = text.match(/Waiting:\s*(\d+)/);

    res.json({
      status: 'connected',
      active_connections: activeMatch ? parseInt(activeMatch[1], 10) : 0,
      accepts: serverStats ? parseInt(serverStats[1], 10) : 0,
      handled: serverStats ? parseInt(serverStats[2], 10) : 0,
      requests: serverStats ? parseInt(serverStats[3], 10) : 0,
      reading: readingMatch ? parseInt(readingMatch[1], 10) : 0,
      writing: writingMatch ? parseInt(writingMatch[1], 10) : 0,
      waiting: waitingMatch ? parseInt(waitingMatch[1], 10) : 0,
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Connection failed',
    });
  }
});

export default router;
