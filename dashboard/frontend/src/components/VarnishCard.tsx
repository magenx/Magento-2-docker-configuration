import React, { useState } from 'react';
import { useMetrics } from '../hooks/useMetrics';

interface CounterEntry {
  key: string;
  description: string;
  value: number;
}

interface VarnishData {
  status: string;
  error?: string;
  timestamp?: string;
  file_mtime?: string;
  hit_rate_pct?: number;
  miss_rate_pct?: number;
  cache_hit?: number;
  cache_miss?: number;
  cache_hitpass?: number;
  total_requests?: number;
  purge?: CounterEntry[];
  counters?: CounterEntry[];
}

function ProgressBar({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="progress-bar-container">
      <div className="progress-bar-label">
        <span>{label}</span>
        <span>
          {value} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="progress-bar">
        <div
          className={`progress-bar-fill ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

const EXCLUDED_COUNTER_PATTERNS = ['cache_hit', 'cache_miss'];

export default function VarnishCard() {
  const { data, loading, error } = useMetrics<VarnishData>('/varnish');
  const [counterSearch, setCounterSearch] = useState('');

  if (loading && !data) {
    return (
      <div className="card">
        <div className="skeleton" style={{ width: '50%', height: '16px', marginBottom: '12px' }} />
        <div className="skeleton" />
        <div className="skeleton" style={{ width: '60%', marginTop: '8px' }} />
      </div>
    );
  }

  const isError = !data || data.status === 'error';
  const hitPct = data?.hit_rate_pct ?? 0;
  const missPct = data?.miss_rate_pct ?? 0;

  // Hit rate is good when high, so invert colour logic
  const hitColor = hitPct >= 80 ? 'green' : hitPct >= 50 ? 'yellow' : 'red';
  const missColor = missPct >= 50 ? 'red' : missPct >= 20 ? 'yellow' : 'green';

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🔄</span>
          <div>
            <div>Varnish</div>
            <div className="card-subtitle">
              Stats JSON · shared volume
              {data?.file_mtime && ` · ${new Date(data.file_mtime).toLocaleTimeString()}`}
            </div>
          </div>
        </div>
        <span className={`status-badge ${isError ? 'error' : 'connected'}`}>
          <span className={`status-dot ${!isError ? 'pulse' : ''}`} />
          {isError ? 'Error' : 'Online'}
        </span>
      </div>

      {isError ? (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-msg">{error || data?.error}</div>
        </div>
      ) : (
        <>
          {/* Hit / Miss totals */}
          <div className="stats-grid">
            <div className="stat-item">
              <div className="value" style={{ color: 'var(--accent-green)' }}>
                {hitPct.toFixed(1)}%
              </div>
              <div className="label">Hit Rate</div>
            </div>
            <div className="stat-item">
              <div
                className="value"
                style={{
                  color:
                    missPct >= 50
                      ? 'var(--accent-red)'
                      : missPct >= 20
                      ? 'var(--accent-yellow)'
                      : 'var(--accent-green)',
                }}
              >
                {missPct.toFixed(1)}%
              </div>
              <div className="label">Miss Rate</div>
            </div>
            <div className="stat-item">
              <div className="value">{(data?.cache_hit ?? 0).toLocaleString()}</div>
              <div className="label">Hits</div>
            </div>
            <div className="stat-item">
              <div className="value">{(data?.cache_miss ?? 0).toLocaleString()}</div>
              <div className="label">Misses</div>
            </div>
          </div>

          <ProgressBar
            label="Cache Hit"
            value={(data?.cache_hit ?? 0).toLocaleString()}
            pct={hitPct}
            color={hitColor}
          />
          <ProgressBar
            label="Cache Miss"
            value={(data?.cache_miss ?? 0).toLocaleString()}
            pct={missPct}
            color={missColor}
          />

          {(data?.cache_hitpass ?? 0) > 0 && (
            <div className="metric-row">
              <span className="metric-label">Hit-for-Pass</span>
              <span className="metric-value yellow">
                {(data?.cache_hitpass ?? 0).toLocaleString()}
              </span>
            </div>
          )}

          <div className="metric-row">
            <span className="metric-label">Total Requests</span>
            <span className="metric-value highlight">
              {(data?.total_requests ?? 0).toLocaleString()}
            </span>
          </div>

          {/* Counters with fuzzy search */}
          {data?.counters && data.counters.length > 0 && (
            (() => {
              const query = counterSearch.trim().toLowerCase();
              const filtered = data.counters.filter(
                (e) =>
                  !EXCLUDED_COUNTER_PATTERNS.some((p) => e.key.toLowerCase().includes(p)) &&
                  (query === '' ||
                    e.key.toLowerCase().includes(query) ||
                    e.description.toLowerCase().includes(query))
              );
              return filtered.length > 0 || query !== '' ? (
                <>
                  <div className="section-heading">Counters</div>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Filter counters…"
                    value={counterSearch}
                    onChange={(e) => setCounterSearch(e.target.value)}
                  />
                  <div className="scrollable-list">
                    {filtered.map((entry) => (
                      <div key={entry.key} className="metric-row">
                        <span className="metric-label" title={entry.description}>
                          {entry.key.replace(/^[^.]+\./, '')}
                        </span>
                        <span className="metric-value">{entry.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : null;
            })()
          )}
        </>
      )}
    </div>
  );
}
