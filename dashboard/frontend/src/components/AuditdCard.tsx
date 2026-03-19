import React, { useState, useMemo } from 'react';
import { useMetrics } from '../hooks/useMetrics';

interface AuditRow {
  date: string;
  time: string;
  user: string;
  group: string;
  operation: string;
  result: string;
  path: string;
  exec: string;
}

interface AuditdData {
  status: string;
  error?: string;
  date: string;
  availableDates: string[];
  rows: AuditRow[];
}

const AUDITD_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

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

function rowMatchesSearch(row: AuditRow, pattern: string): boolean {
  if (!pattern) return true;
  return (
    fuzzyMatch(row.time, pattern) ||
    fuzzyMatch(row.user, pattern) ||
    fuzzyMatch(row.group, pattern) ||
    fuzzyMatch(row.operation, pattern) ||
    fuzzyMatch(row.path, pattern) ||
    fuzzyMatch(row.exec, pattern)
  );
}

export default function AuditdCard() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [search, setSearch] = useState('');

  const endpoint = selectedDate ? `/auditd?date=${encodeURIComponent(selectedDate)}` : '/auditd';
  const auditd = useMetrics<AuditdData>(endpoint, AUDITD_REFRESH_INTERVAL);

  const data = auditd.data;
  const isLoading = auditd.loading && !data;
  const isError = !isLoading && (!data || data.status === 'error');

  // Keep available dates from the latest successful response so the dropdown
  // stays populated even while a new date is loading.
  const availableDates = data?.availableDates ?? [];

  const filtered = useMemo(
    () => (data?.rows ?? []).filter((r) => rowMatchesSearch(r, search)),
    [data?.rows, search],
  );

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🔍</span>
          <div>
            <div>Audit Log</div>
            <div className="card-subtitle">auditd · ausearch CSV</div>
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
            {data!.rows.length.toLocaleString()} events
          </span>
        )}
      </div>

      {/* Date selector */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <select
          className="filter-input"
          style={{ marginBottom: 0, flex: 1 }}
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setSearch('');
          }}
        >
          <option value="">Today</option>
          {availableDates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {auditd.loading && data && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Refreshing…
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="skeleton" style={{ height: 100 }} />
      ) : isError ? (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-msg">{data?.error ?? auditd.error ?? 'Audit log unavailable'}</div>
        </div>
      ) : (
        <>
          <input
            className="filter-input"
            type="text"
            placeholder="🔍 Fuzzy search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="scrollable-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User / Group</th>
                  <th>Operation</th>
                  <th>Path</th>
                  <th>Exec</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={`${row.date}-${row.time}-${i}`}>
                    <td style={{ whiteSpace: 'nowrap' }}>{row.time}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {row.user}
                      {row.group && row.group !== row.user ? (
                        <span style={{ color: 'var(--text-muted)' }}> / {row.group}</span>
                      ) : null}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          row.operation === 'deleted'
                            ? 'red'
                            : row.operation === 'opened-file'
                            ? 'blue'
                            : 'gray'
                        }`}
                      >
                        {row.operation}
                      </span>
                    </td>
                    <td title={row.path} style={{ maxWidth: 260 }}>
                      {row.path}
                    </td>
                    <td title={row.exec} style={{ maxWidth: 160 }}>
                      {row.exec}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && search && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 0' }}>
              No matching events for &ldquo;{search}&rdquo;
            </div>
          )}
          {filtered.length === 0 && !search && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 0' }}>
              No audit events found for this date.
            </div>
          )}
        </>
      )}
    </div>
  );
}
