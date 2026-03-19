import { Router, Request, Response } from 'express';
import { readFile, stat } from 'fs/promises';

const router = Router();

const STATS_FILE = process.env.VARNISHSTAT_FILE || '/var/varnishstat/varnishstat.json';

interface VarnishCounter {
  description: string;
  flag: string;
  format: string;
  value: number;
}

interface VarnishStatOutput {
  version?: number;
  timestamp?: string;
  counters: Record<string, VarnishCounter>;
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    // Read file content first; stat is only needed for mtime, so do both in parallel.
    const [content, fileStat] = await Promise.all([
      readFile(STATS_FILE, 'utf8'),
      stat(STATS_FILE),
    ]);

    const raw: VarnishStatOutput = JSON.parse(content);
    const counters = raw.counters ?? {};

    let cacheHit = 0;
    let cacheMiss = 0;
    let cacheHitPass = 0;
    const purgeEntries: Array<{ key: string; description: string; value: number }> = [];
    const allEntries: Array<{ key: string; description: string; value: number }> = [];

    for (const [key, counter] of Object.entries(counters)) {
      const entry = { key, description: counter.description, value: counter.value };
      allEntries.push(entry);

      const lk = key.toLowerCase();
      if (lk.endsWith('cache_hit') && !lk.endsWith('cache_hitpass')) {
        cacheHit += counter.value;
      } else if (lk.endsWith('cache_hitpass')) {
        cacheHitPass += counter.value;
      } else if (lk.endsWith('cache_miss')) {
        cacheMiss += counter.value;
      } else if (lk.includes('purge')) {
        purgeEntries.push(entry);
      }
    }

    const total = cacheHit + cacheMiss + cacheHitPass;
    const hitRate = total > 0 ? Math.round((cacheHit / total) * 10000) / 100 : 0;
    const missRate = total > 0 ? Math.round((cacheMiss / total) * 10000) / 100 : 0;

    res.json({
      status: 'connected',
      timestamp: raw.timestamp,
      file_mtime: fileStat.mtime.toISOString(),
      hit_rate_pct: hitRate,
      miss_rate_pct: missRate,
      cache_hit: cacheHit,
      cache_miss: cacheMiss,
      cache_hitpass: cacheHitPass,
      total_requests: total,
      purge: purgeEntries,
      counters: allEntries,
    });
  } catch (err) {
    const fsErr = err as NodeJS.ErrnoException;
    let errorMsg: string;
    switch (fsErr.code) {
      case 'ENOENT':
        errorMsg = `Stats file not found: ${STATS_FILE}. On the Varnish container run: varnishstat -f "*cache_hit" -f "*cache_miss" -f "*purge*" -j -1 > /var/varnishstat/varnishstat.json (via cron every 30 s or a loop) and mount that directory via VARNISHSTAT_DIR.`;
        break;
      case 'EACCES':
        errorMsg = `Permission denied reading ${STATS_FILE}. Ensure the stats directory is readable by the backend container (check volume mount permissions).`;
        break;
      default:
        errorMsg = err instanceof Error ? err.message : String(err);
    }
    res.status(500).json({ status: 'error', error: errorMsg });
  }
});

export default router;
