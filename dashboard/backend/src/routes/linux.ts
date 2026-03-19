import { Router, Request, Response } from 'express';
import { readFile, stat } from 'fs/promises';

const router = Router();

const TOP_FILE        = process.env.TOP_JSON_FILE        || '/var/host/top.json';
const DCPS_FILE       = process.env.DCPS_JSON_FILE       || '/var/host/dcps.json';
const PROC_UPTIME_FILE = process.env.PROC_UPTIME_FILE || '/proc/uptime';

interface JcTopEntry {
  time?: string;
  uptime?: number;
  users?: number;
  load_1m?: number;
  load_5m?: number;
  load_15m?: number;
  tasks_total?: number;
  tasks_running?: number;
  tasks_sleeping?: number;
  tasks_stopped?: number;
  tasks_zombie?: number;
  cpu_user?: number;
  cpu_sys?: number;
  cpu_nice?: number;
  cpu_idle?: number;
  cpu_wait?: number;
  cpu_hardware?: number;
  cpu_software?: number;
  cpu_steal?: number;
  mem_total?: number;
  mem_free?: number;
  mem_used?: number;
  mem_buff_cache?: number;
  mem_available?: number;
  swap_total?: number;
  swap_free?: number;
  swap_used?: number;
}

interface DockerService {
  Name?: string;
  Service?: string;
  Status?: string;
  State?: string;
  Health?: string;
  Ports?: string;
  Image?: string;
  CreatedAt?: string;
  ExitCode?: number;
}

// Parse `docker compose ps --format json` output.
// Newer Docker outputs NDJSON (one object per line); older versions may output
// a JSON array.  Both formats are handled.
function parseDockerPs(content: string): DockerService[] {
  const trimmedContent = content.trim();
  if (!trimmedContent) return [];
  if (trimmedContent.startsWith('[')) {
    return JSON.parse(trimmedContent) as DockerService[];
  }
  const services: DockerService[] = [];
  for (const line of trimmedContent.split('\n')) {
    const l = line.trim();
    if (!l) continue;
    try {
      const svc = JSON.parse(l) as DockerService;
      if (svc.Service || svc.Name) services.push(svc);
    } catch {
      // skip malformed lines
    }
  }
  return services;
}

// Map a jc --top entry to the normalised shape consumed by the frontend.
// uptimeSeconds comes from /proc/uptime (more reliable than jc's encoded integer).
function mapTopEntry(t: JcTopEntry, uptimeSeconds: number) {
  const cpuIdle  = t.cpu_idle  ?? 0;
  const cpuUser  = t.cpu_user  ?? 0;
  const cpuSys   = t.cpu_sys   ?? 0;
  const cpuWait  = t.cpu_wait  ?? 0;
  const cpuSteal = t.cpu_steal ?? 0;
  // Sum non-idle components rather than (100 - idle) so that rounding
  // differences in jc's output don't silently yield 100 %.
  const usagePct = Math.min(
    Math.round(cpuUser + cpuSys + (t.cpu_nice ?? 0) + cpuWait + cpuSteal + (t.cpu_hardware ?? 0) + (t.cpu_software ?? 0)),
    100
  );

  const memTotal    = t.mem_total ?? 0;
  const memUsed     = t.mem_used  ?? 0;
  const memUsagePct = memTotal > 0 ? Math.round((memUsed / memTotal) * 100) : 0;

  return {
    time:           t.time   ?? '',
    uptime_seconds: uptimeSeconds,
    users:          t.users  ?? 0,
    cpu: {
      usage_pct: usagePct,
      user:      cpuUser,
      system:    cpuSys,
      idle:      cpuIdle,
      iowait:    cpuWait,
      steal:     cpuSteal,
    },
    memory: {
      total_mb:      memTotal,
      used_mb:       memUsed,
      free_mb:       t.mem_free       ?? 0,
      buff_cache_mb: t.mem_buff_cache ?? 0,
      available_mb:  t.mem_available  ?? 0,
      swap_total_mb: t.swap_total     ?? 0,
      swap_used_mb:  t.swap_used      ?? 0,
      usage_pct:     memUsagePct,
    },
    load: {
      load1:         t.load_1m       ?? 0,
      load5:         t.load_5m       ?? 0,
      load15:        t.load_15m      ?? 0,
      running_procs: t.tasks_running ?? 0,
      total_procs:   t.tasks_total   ?? 0,
    },
    tasks: {
      total:    t.tasks_total    ?? 0,
      running:  t.tasks_running  ?? 0,
      sleeping: t.tasks_sleeping ?? 0,
      stopped:  t.tasks_stopped  ?? 0,
      zombie:   t.tasks_zombie   ?? 0,
    },
  };
}

function fileError(code: string | undefined, file: string): string {
  if (code === 'ENOENT') {
    return (
      `File not found: ${file}. ` +
      `Ensure the host cron job is running and the directory is bind-mounted into this container.`
    );
  }
  if (code === 'EACCES') {
    return (
      `Permission denied reading ${file}. ` +
      `Check volume mount permissions (e.g. chmod o+r on the file).`
    );
  }
  return `Cannot read ${file}`;
}

router.get('/', async (_req: Request, res: Response) => {
  // top.json is mandatory — return a top-level error if it is missing.
  let topContent: string;
  let topMtime: string;
  try {
    const [content, fileStat] = await Promise.all([
      readFile(TOP_FILE, 'utf8'),
      stat(TOP_FILE),
    ]);
    topContent = content;
    topMtime   = fileStat.mtime.toISOString();
  } catch (err) {
    const fsErr = err as NodeJS.ErrnoException;
    return res.status(500).json({
      status: 'error',
      error:
        `top.json: ${fileError(fsErr.code, TOP_FILE)} ` +
        `Host cron job: * * * * * top -b -n 2 | jc --top -p > ${TOP_FILE}`,
    });
  }

  // Read /proc/uptime for an accurate uptime in seconds.  The file contains
  // two space-separated floats; the first is seconds since boot.  If the file
  // is unavailable (non-Linux environments), fall back to 0.
  let uptimeSeconds = 0;
  try {
    const procContent = await readFile(PROC_UPTIME_FILE, 'utf8');
    const parsed = parseFloat(procContent.trim().split(/\s+/)[0]);
    if (!isNaN(parsed)) uptimeSeconds = Math.floor(parsed);
  } catch {
    // non-fatal — leave uptimeSeconds = 0
  }

  // Parse top.json — jc --top outputs an array.
  // Use the LAST element: with `top -b -n 2` the last sample has an accurate
  // CPU delta; with `top -b -n 1` (legacy) there is only one element anyway.
  let linux: ReturnType<typeof mapTopEntry>;
  try {
    const arr = JSON.parse(topContent) as JcTopEntry[];
    if (!Array.isArray(arr) || arr.length === 0) {
      return res.status(500).json({ status: 'error', error: 'top.json is empty or not an array' });
    }
    linux = mapTopEntry(arr[arr.length - 1], uptimeSeconds);
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      error: `Failed to parse top.json: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // dcps.json is non-fatal — return docker error section when it is missing.
  let docker: { status: string; services: DockerService[]; error?: string };
  let dcpsMtime: string | undefined;
  try {
    const [dcpsContent, dcpsStat] = await Promise.all([
      readFile(DCPS_FILE, 'utf8'),
      stat(DCPS_FILE),
    ]);
    dcpsMtime = dcpsStat.mtime.toISOString();
    docker = { status: 'ok', services: parseDockerPs(dcpsContent) };
  } catch (err) {
    const fsErr = err as NodeJS.ErrnoException;
    docker = {
      status: 'error',
      services: [],
      error:
        `dcps.json: ${fileError(fsErr.code, DCPS_FILE)} ` +
        `Host cron job: * * * * * docker compose ps --format json > ${DCPS_FILE}`,
    };
  }

  res.json({
    status:     'ok',
    top_mtime:  topMtime,
    dcps_mtime: dcpsMtime,
    linux,
    docker,
  });
});

export default router;
