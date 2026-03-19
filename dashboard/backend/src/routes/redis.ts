import { Router, Request, Response } from 'express';
import Redis from 'ioredis';

const router = Router();

interface RedisInstance {
  name: string;
  host: string;
  port: number;
}

const instances: RedisInstance[] = [
  {
    name: 'cache',
    host: process.env.REDIS_CACHE_HOST || 'cache',
    port: parseInt(process.env.REDIS_CACHE_PORT || '6380', 10),
  },
  {
    name: 'sessions',
    host: process.env.REDIS_SESSION_HOST || 'session',
    port: parseInt(process.env.REDIS_SESSION_PORT || '6379', 10),
  },
];

async function getRedisMetrics(instance: RedisInstance) {
  const client = new Redis({
    host: instance.host,
    port: instance.port,
    password: process.env.REDIS_PASSWORD || undefined,
    connectTimeout: 5000,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  try {
    await client.connect();
    const info = await client.info();
    const keyspaceInfo = await client.info('keyspace');
    const dbSize = await client.dbsize();

    // Parse INFO output
    const parseInfo = (raw: string): Record<string, string> => {
      const result: Record<string, string> = {};
      raw.split('\r\n').forEach((line) => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value !== undefined) {
            result[key.trim()] = value.trim();
          }
        }
      });
      return result;
    };

    const parsed = parseInfo(info);
    const keyspaceParsed = parseInfo(keyspaceInfo);

    // Extract keyspace TTL info
    const keyspaceData: Record<string, { keys: number; expires: number; avg_ttl: number }> = {};
    Object.entries(keyspaceParsed).forEach(([key, value]) => {
      if (key.startsWith('db')) {
        const parts: Record<string, string> = {};
        value.split(',').forEach((p) => {
          const [k, v] = p.split('=');
          parts[k] = v;
        });
        keyspaceData[key] = {
          keys: parseInt(parts['keys'] || '0', 10),
          expires: parseInt(parts['expires'] || '0', 10),
          avg_ttl: parseInt(parts['avg_ttl'] || '0', 10),
        };
      }
    });

    return {
      name: instance.name,
      status: 'connected',
      version: parsed['redis_version'],
      uptime_seconds: parseInt(parsed['uptime_in_seconds'] || '0', 10),
      connected_clients: parseInt(parsed['connected_clients'] || '0', 10),
      blocked_clients: parseInt(parsed['blocked_clients'] || '0', 10),
      used_memory: parseInt(parsed['used_memory'] || '0', 10),
      used_memory_human: parsed['used_memory_human'],
      used_memory_peak: parseInt(parsed['used_memory_peak'] || '0', 10),
      used_memory_peak_human: parsed['used_memory_peak_human'],
      maxmemory: parseInt(parsed['maxmemory'] || '0', 10),
      maxmemory_human: parsed['maxmemory_human'],
      mem_fragmentation_ratio: parseFloat(parsed['mem_fragmentation_ratio'] || '0'),
      total_keys: dbSize,
      keyspace: keyspaceData,
      total_commands_processed: parseInt(parsed['total_commands_processed'] || '0', 10),
      instantaneous_ops_per_sec: parseInt(parsed['instantaneous_ops_per_sec'] || '0', 10),
      keyspace_hits: parseInt(parsed['keyspace_hits'] || '0', 10),
      keyspace_misses: parseInt(parsed['keyspace_misses'] || '0', 10),
      evicted_keys: parseInt(parsed['evicted_keys'] || '0', 10),
      expired_keys: parseInt(parsed['expired_keys'] || '0', 10),
      role: parsed['role'],
    };
  } catch (err) {
    return {
      name: instance.name,
      status: 'error',
      error: err instanceof Error ? err.message : 'Connection failed',
    };
  } finally {
    client.disconnect();
  }
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const metrics = await Promise.all(instances.map(getRedisMetrics));
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

router.get('/:instance', async (req: Request, res: Response) => {
  const instance = instances.find((i) => i.name === req.params.instance);
  if (!instance) {
    res.status(404).json({ error: 'Instance not found' });
    return;
  }
  try {
    const metrics = await getRedisMetrics(instance);
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

export default router;
