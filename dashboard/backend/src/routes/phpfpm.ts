import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const PHPFPM_STATUS_URL =
  process.env.PHPFPM_STATUS_URL || 'http://nginx/fpm_status';

router.get('/', async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(`${PHPFPM_STATUS_URL}?full&json`, { timeout: 5000 });
    const data = response.data;

    // PHP-FPM JSON full status response
    res.json({
      status: 'connected',
      pool: data.pool,
      process_manager: data['process manager'],
      start_time: data['start time'],
      start_since: data['start since'],
      accepted_conn: data['accepted conn'],
      listen_queue: data['listen queue'],
      max_listen_queue: data['max listen queue'],
      listen_queue_len: data['listen queue len'],
      idle_processes: data['idle processes'],
      active_processes: data['active processes'],
      total_processes: data['total processes'],
      max_active_processes: data['max active processes'],
      max_children_reached: data['max children reached'],
      slow_requests: data['slow requests'],
      processes: Array.isArray(data.processes) ? data.processes : [],
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Connection failed',
    });
  }
});

export default router;
