import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const OS_HOST = process.env.OPENSEARCH_HOST || 'opensearch';
const OS_PORT = process.env.OPENSEARCH_PORT || '9200';
const OS_USER = process.env.OPENSEARCH_USER || 'admin';
const OS_PASS = process.env.OPENSEARCH_PASSWORD || '';
const BASE_URL = `http://${OS_HOST}:${OS_PORT}`;

const osAxios = axios.create({
  baseURL: BASE_URL,
  auth: OS_USER && OS_PASS ? { username: OS_USER, password: OS_PASS } : undefined,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const [healthRes, nodesRes, indicesRes] = await Promise.allSettled([
      osAxios.get('/_cluster/health?human&pretty=false'),
      osAxios.get('/_nodes/stats/jvm,os,process?human&pretty=false'),
      osAxios.get('/_cat/indices?v&h=index,health,status,uuid,pri,rep,docs.count,docs.deleted,store.size,pri.store.size&s=store.size:desc&format=json'),
    ]);

    const clusterHealth = healthRes.status === 'fulfilled' ? healthRes.value.data : null;
    const nodesStats = nodesRes.status === 'fulfilled' ? nodesRes.value.data : null;
    const indices = indicesRes.status === 'fulfilled' ? indicesRes.value.data : null;

    // Process JVM heap from nodes
    let heapData = null;
    if (nodesStats?.nodes) {
      const nodeList = Object.values(nodesStats.nodes) as Array<{
        name: string;
        jvm: { mem: { heap_used_in_bytes: number; heap_max_in_bytes: number; heap_used_percent: number; heap_used: string; heap_max: string } };
        os: { cpu: { percent: number }; mem: { total: string; used: string; free_percent: number } };
      }>;
      heapData = nodeList.map((node) => ({
        name: node.name,
        heap_used_percent: node.jvm?.mem?.heap_used_percent ?? 0,
        heap_used: node.jvm?.mem?.heap_used ?? '0b',
        heap_max: node.jvm?.mem?.heap_max ?? '0b',
        heap_used_in_bytes: node.jvm?.mem?.heap_used_in_bytes ?? 0,
        heap_max_in_bytes: node.jvm?.mem?.heap_max_in_bytes ?? 0,
        cpu_percent: node.os?.cpu?.percent ?? 0,
        os_mem_free_percent: node.os?.mem?.free_percent ?? 0,
      }));
    }

    res.json({
      status: clusterHealth ? 'connected' : 'error',
      cluster: clusterHealth,
      nodes_heap: heapData,
      indices: indices ?? null,
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Connection failed',
    });
  }
});

router.get('/allocation', async (_req: Request, res: Response) => {
  try {
    const response = await osAxios.get('/_cluster/allocation/explain?human&pretty=false');
    res.json(response.data);
  } catch (err) {
    // 400 means no unassigned shards - that's fine
    const axiosErr = err as { response?: { status: number; data: unknown } };
    if (axiosErr.response?.status === 400) {
      res.json({ message: 'All shards are assigned' });
    } else {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }
});

export default router;
