import { Router, Request, Response } from 'express';
import { readFile, readdir } from 'fs/promises';
import path from 'path';

const router = Router();

// Directory containing date-stamped auditd CSV files (default: /var/host)
const AUDITD_DIR = process.env.AUDITD_DIR || '/var/host';

export interface AuditRow {
  date: string;
  time: string;
  user: string;
  group: string;
  operation: string;
  result: string;
  path: string;
  exec: string;
}

interface AuditdResponseData {
  status: string;
  error?: string;
  date: string;
  availableDates: string[];
  rows: AuditRow[];
}

// Return today's date in YYYY-MM-DD format (used as the default filename date).
function todayDateStr(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// List available audit CSV files and return their date strings sorted newest first.
async function listAvailableDates(dir: string): Promise<string[]> {
  try {
    const files = await readdir(dir);
    return files
      .filter((f) => f.startsWith('auditd_') && f.endsWith('.csv'))
      .map((f) => f.slice('auditd_'.length, -'.csv'.length))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

// Parse a single CSV line from ausearch output.
// Expected column layout (0-indexed):
//   0: record id (empty)   1: type      2: date (MM/DD/YYYY)  3: time (HH:MM:SS)
//   4: event id            5: rule key  6: uid                7: user
//   8: group               9: acct type 10: operation         11: result
//  12: path               13: inode    14: file type         15: exec
function parseAuditLine(line: string): AuditRow | null {
  const cols = line.split(',');
  if (cols.length < 16) return null;
  const date = cols[2]?.trim() ?? '';
  const time = cols[3]?.trim() ?? '';
  if (!date && !time) return null;
  return {
    date,
    time,
    user: cols[7]?.trim() ?? '',
    group: cols[8]?.trim() ?? '',
    operation: cols[10]?.trim() ?? '',
    result: cols[11]?.trim() ?? '',
    path: cols[12]?.trim() ?? '',
    exec: cols[15]?.trim() ?? '',
  };
}

router.get('/', async (req: Request, res: Response) => {
  const requestedDate =
    typeof req.query.date === 'string' && req.query.date.trim()
      ? req.query.date.trim()
      : todayDateStr();

  // Basic validation: only allow alphanumeric and hyphens (YYYY-MM-DD format) to prevent path traversal.
  if (!/^[\w-]+$/.test(requestedDate)) {
    return res.status(400).json({ status: 'error', error: 'Invalid date parameter.' });
  }

  const availableDates = await listAvailableDates(AUDITD_DIR);

  const filePath = path.join(AUDITD_DIR, `auditd_${requestedDate}.csv`);

  // Guard against path traversal: ensure resolved path stays within AUDITD_DIR.
  const resolvedDir = path.resolve(AUDITD_DIR);
  const resolvedFile = path.resolve(filePath);
  if (!resolvedFile.startsWith(resolvedDir + path.sep) && resolvedFile !== resolvedDir) {
    return res.status(400).json({ status: 'error', error: 'Invalid date parameter.' });
  }

  try {
    const csvContent = await readFile(filePath, 'utf-8');
    const lines = csvContent.split('\n').filter((l) => l.trim().length > 0);
    const rows: AuditRow[] = [];
    for (const line of lines) {
      const row = parseAuditLine(line);
      if (row) rows.push(row);
    }
    const data: AuditdResponseData = {
      status: 'ok',
      date: requestedDate,
      availableDates,
      rows,
    };
    return res.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const data: AuditdResponseData = {
      status: 'error',
      error: `Failed to read audit log for ${requestedDate}: ${msg}`,
      date: requestedDate,
      availableDates,
      rows: [],
    };
    return res.json(data);
  }
});

export default router;
