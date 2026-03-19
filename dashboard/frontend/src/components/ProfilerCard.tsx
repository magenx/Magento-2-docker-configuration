import React, { useState } from 'react';
import { useMetrics } from '../hooks/useMetrics';

interface ProfilerRow {
  timer: string;
  time: string;
  avg: string;
  count: number;
  emalloc: string;
  realMem: string;
}

interface ProfilerData {
  status: string;
  error?: string;
  lastRun: string | null;
  rows: ProfilerRow[];
}

const PROFILER_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes — matches backend cache TTL

function fuzzyMatch(text: string, pattern: string): boolean {
  if (!pattern) return true;
  const t = text.toLowerCase();
  const p = pattern.toLowerCase();
  let ti = 0;
  for (let pi = 0; pi < p.length; pi++) {
    while (ti < t.length && t[ti] !== p[pi]) ti++;
    if (ti >= t.length) return false;
    ti++;
  }
  return true;
}

export default function ProfilerCard() {
  const profiler = useMetrics<ProfilerData>('/profiler', PROFILER_REFRESH_INTERVAL);
  const [search, setSearch] = useState('');

  const data = profiler.data;

  if (data?.status === 'not_configured') return null;

  const isLoading = profiler.loading && !data;
  const isError = !isLoading && (!data || data.status === 'error');
  const filtered = (data?.rows ?? []).filter((r) => fuzzyMatch(r.timer, search));

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">⚡</span>
          <div>
            <div>Profiler</div>
            <div className="card-subtitle">Magento CSV Profiler</div>
          </div>
        </div>
        {isLoading ? (
          <span className="status-badge">
            <span className="status-dot" />
            Loading
          </span>
        ) : isError ? (
          <span className="status-badge error">
            <span className="status-dot" />
            Error
          </span>
        ) : (
          <span className="status-badge connected">
            <span className="status-dot pulse" />
            Active
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="skeleton" style={{ height: 80 }} />
      ) : isError ? (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-msg">{data?.error ?? profiler.error ?? 'Profiler unavailable'}</div>
        </div>
      ) : (
        <>
          {data!.lastRun && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              Last run: {new Date(data!.lastRun).toLocaleTimeString()}
            </div>
          )}
          <input
            className="filter-input"
            type="text"
            placeholder="🔍 Fuzzy search timers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="scrollable-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timer</th>
                  <th>Time</th>
                  <th>Avg</th>
                  <th>Cnt</th>
                  <th>Emalloc</th>
                  <th>RealMem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.timer || i}>
                    <td title={row.timer}>{row.timer}</td>
                    <td>{row.time}</td>
                    <td>{row.avg}</td>
                    <td>{row.count}</td>
                    <td>{row.emalloc}</td>
                    <td>{row.realMem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && search && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 0' }}>
              No matching timers for &ldquo;{search}&rdquo;
            </div>
          )}
          {filtered.length === 0 && !search && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 0' }}>
              No profiler data available.
            </div>
          )}
        </>
      )}
    </div>
  );
}
