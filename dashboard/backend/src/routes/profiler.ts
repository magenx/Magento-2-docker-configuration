import { Router, Request, Response } from 'express';
import { readFile } from 'fs/promises';

const router = Router();

// Absolute path to the profiler CSV file written externally (default: /var/profiler/profiler.csv)
const PROFILER_CSV_PATH = process.env.PROFILER_CSV_PATH || '/var/profiler/profiler.csv';

const PROFILER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export interface ProfilerRow {
  timer: string;
  time: string;
  avg: string;
  count: number;
  emalloc: string;
  realMem: string;
}

interface ProfilerResponseData {
  status: string;
  error?: string;
  lastRun: string | null;
  rows: ProfilerRow[];
}

interface ProfilerCache {
  data: ProfilerResponseData | null;
  fetchedAt: number;
}

let cache: ProfilerCache = { data: null, fetchedAt: 0 };

// Parse a single RFC-4180 CSV line, handling double-quoted fields and escaped quotes.
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let inQuotes = false;
  let current = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote inside a quoted field.
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  fields.push(current);
  return fields;
}

// Parse the CSV content written by Magento's csvfile profiler driver.
// Expected header: Timer Id,Time,Avg,Cnt,Emalloc,RealMem
function parseProfilerCsv(csv: string): ProfilerRow[] {
  const lines = csv.split('\n').filter((l) => l.length > 0);
  if (lines.length < 2) return [];

  const rows: ProfilerRow[] = [];
  // Skip the header row (index 0).
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length >= 4) {
      rows.push({
        timer: cells[0] ?? '',
        time: cells[1] ?? '',
        avg: cells[2] ?? '',
        count: parseInt(cells[3] ?? '0', 10) || 0,
        emalloc: cells[4] ?? '',
        realMem: cells[5] ?? '',
      });
    }
  }
  return rows;
}

router.get('/', async (_req: Request, res: Response) => {
  const now = Date.now();

  // Return cached data if still within TTL
  if (cache.data && now - cache.fetchedAt < PROFILER_CACHE_TTL) {
    return res.json(cache.data);
  }

  const lastRun = new Date().toISOString();

  try {
    let csvContent: string;
    try {
      csvContent = await readFile(PROFILER_CSV_PATH, 'utf-8');
    } catch (fileErr) {
      const msg = fileErr instanceof Error ? fileErr.message : String(fileErr);
      const data: ProfilerResponseData = {
        status: 'error',
        error: `Failed to read profiler CSV at ${PROFILER_CSV_PATH}: ${msg}`,
        lastRun,
        rows: [],
      };
      cache = { data, fetchedAt: now };
      return res.json(data);
    }

    const rows = parseProfilerCsv(csvContent);
    const data: ProfilerResponseData = {
      status: rows.length > 0 ? 'ok' : 'error',
      error: rows.length === 0 ? 'No profiler data found in CSV file' : undefined,
      lastRun,
      rows,
    };

    cache = { data, fetchedAt: now };
    return res.json(data);
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Profiler read failed',
      lastRun: null,
      rows: [],
    });
  }
});

export default router;
