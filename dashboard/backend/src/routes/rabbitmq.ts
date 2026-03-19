import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const RMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RMQ_MGMT_PORT = process.env.RABBITMQ_MANAGEMENT_PORT || '15672';
const RMQ_USER = process.env.RABBITMQ_USER || 'guest';
const RMQ_PASS = process.env.RABBITMQ_PASSWORD || 'guest';

if (RMQ_USER === 'guest' || RMQ_PASS === 'guest') {
  console.warn(
    '[rabbitmq] WARNING: Using default RabbitMQ guest credentials. ' +
    'Set RABBITMQ_USER and RABBITMQ_PASSWORD before deployment.'
  );
}
const BASE_URL = `http://${RMQ_HOST}:${RMQ_MGMT_PORT}/api`;

const rmqAxios = axios.create({
  baseURL: BASE_URL,
  auth: { username: RMQ_USER, password: RMQ_PASS },
  timeout: 10000,
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const [overviewRes, queuesRes, nodesRes] = await Promise.allSettled([
      rmqAxios.get('/overview'),
      rmqAxios.get('/queues'),
      rmqAxios.get('/nodes'),
    ]);

    const overview = overviewRes.status === 'fulfilled' ? overviewRes.value.data : null;
    const queues = queuesRes.status === 'fulfilled' ? queuesRes.value.data : [];
    const nodes = nodesRes.status === 'fulfilled' ? nodesRes.value.data : [];

    // Sort queues by message count descending
    const sortedQueues = Array.isArray(queues)
      ? queues
          .sort(
            (
              a: { messages: number },
              b: { messages: number }
            ) => (b.messages || 0) - (a.messages || 0)
          )
          .slice(0, 20)
          .map(
            (q: {
              name: string;
              vhost: string;
              state: string;
              messages: number;
              messages_ready: number;
              messages_unacknowledged: number;
              consumers: number;
              memory: number;
              message_stats?: { publish_details?: { rate: number } };
            }) => ({
              name: q.name,
              vhost: q.vhost,
              state: q.state,
              messages: q.messages || 0,
              messages_ready: q.messages_ready || 0,
              messages_unacknowledged: q.messages_unacknowledged || 0,
              consumers: q.consumers || 0,
              memory: q.memory || 0,
              publish_rate: q.message_stats?.publish_details?.rate || 0,
            })
          )
      : [];

    const nodeStats = Array.isArray(nodes)
      ? nodes.map(
          (n: {
            name: string;
            running: boolean;
            mem_used: number;
            mem_limit: number;
            disk_free: number;
            fd_used: number;
            fd_total: number;
            sockets_used: number;
            sockets_total: number;
            proc_used: number;
            proc_total: number;
          }) => ({
            name: n.name,
            running: n.running,
            mem_used: n.mem_used,
            mem_limit: n.mem_limit,
            disk_free: n.disk_free,
            fd_used: n.fd_used,
            fd_total: n.fd_total,
            sockets_used: n.sockets_used,
            sockets_total: n.sockets_total,
            proc_used: n.proc_used,
            proc_total: n.proc_total,
          })
        )
      : [];

    res.json({
      status: overview ? 'connected' : 'error',
      overview: overview
        ? {
            rabbitmq_version: overview.rabbitmq_version,
            erlang_version: overview.erlang_version,
            message_stats: overview.message_stats,
            queue_totals: overview.queue_totals,
            object_totals: overview.object_totals,
            node: overview.node,
          }
        : null,
      queues: sortedQueues,
      nodes: nodeStats,
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Connection failed',
    });
  }
});

export default router;
