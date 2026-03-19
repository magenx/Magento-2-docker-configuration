import React from 'react';
import { useMetrics, formatBytes, formatUptime } from '../hooks/useMetrics';

interface Database {
  database: string;
  size_mb: number;
  table_count: number;
}

interface TopTable {
  database: string;
  table_name: string;
  size_mb: number;
  table_rows: number;
  data_mb: number;
  index_mb: number;
}

interface ProcessInfo {
  id: number;
  user: string;
  host: string;
  db: string;
  command: string;
  time: number;
  state: string;
  query_preview: string;
}

interface TopQuery {
  query: string;
  exec_count: number;
  total_time_sec: number;
  avg_time_sec: number;
  rows_examined: number;
  rows_sent: number;
}

interface MariaDBData {
  status: string;
  error?: string;
  version?: string;
  version_comment?: string;
  uptime_seconds?: number;
  connections?: {
    current: number;
    running: number;
    max_used: number;
    max_allowed: number;
    aborted: number;
  };
  memory?: {
    innodb_buffer_pool_size: number;
    key_buffer_size: number;
  };
  queries?: {
    total: number;
    slow: number;
    select: number;
    insert: number;
    update: number;
    delete: number;
  };
  innodb?: {
    buffer_pool_read_requests: number;
    buffer_pool_reads: number;
    row_lock_waits: number;
  };
  databases?: Database[];
  top_tables?: TopTable[];
  processlist?: ProcessInfo[];
  top_queries?: TopQuery[];
}

export default function MariaDBCard() {
  const { data, loading, error } = useMetrics<MariaDBData>('/mariadb');

  if (loading && !data) {
    return (
      <div className="card">
        <div className="skeleton" style={{ width: '50%', height: '16px', marginBottom: '12px' }} />
        <div className="skeleton" />
        <div className="skeleton" style={{ width: '80%', marginTop: '8px' }} />
        <div className="skeleton" style={{ width: '60%', marginTop: '8px' }} />
      </div>
    );
  }

  const isError = !data || data.status === 'error';

  const connPct = data?.connections && data.connections.max_allowed > 0
    ? Math.round((data.connections.current / data.connections.max_allowed) * 100)
    : 0;

  const bufferPoolHitRate =
    data?.innodb && data.innodb.buffer_pool_read_requests > 0
      ? Math.round(
          ((data.innodb.buffer_pool_read_requests - data.innodb.buffer_pool_reads) /
            data.innodb.buffer_pool_read_requests) *
            100
        )
      : 0;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🐬</span>
          <div>
            <div>MariaDB</div>
            <div className="card-subtitle">
              Port 3306
              {data?.version && ` · ${data.version}`}
            </div>
          </div>
        </div>
        {isError ? (
          <span className="status-badge error">
            <span className="status-dot" />
            Error
          </span>
        ) : (
          <span className="status-badge connected">
            <span className="status-dot pulse" />
            Up {formatUptime(data?.uptime_seconds || 0)}
          </span>
        )}
      </div>

      {isError ? (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-msg">{error || data?.error}</div>
        </div>
      ) : (
        <>
          {data?.connections && (
            <>
              <div className="progress-bar-container">
                <div className="progress-bar-label">
                  <span>Connections</span>
                  <span>
                    {data.connections.current} / {data.connections.max_allowed} ({connPct}%)
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${connPct >= 80 ? 'red' : connPct >= 60 ? 'yellow' : 'blue'}`}
                    style={{ width: `${Math.min(connPct, 100)}%` }}
                  />
                </div>
              </div>
              <div className="metric-row">
                <span className="metric-label">Active / Max Used</span>
                <span className="metric-value">
                  {data.connections.running} running / {data.connections.max_used} peak
                </span>
              </div>
            </>
          )}

          {data?.memory && (
            <div className="metric-row">
              <span className="metric-label">InnoDB Buffer Pool</span>
              <span className="metric-value highlight">
                {formatBytes(data.memory.innodb_buffer_pool_size)}
              </span>
            </div>
          )}

          {bufferPoolHitRate > 0 && (
            <div className="metric-row">
              <span className="metric-label">Buffer Pool Hit Rate</span>
              <span className={`metric-value ${bufferPoolHitRate < 95 ? 'yellow' : 'green'}`}>
                {bufferPoolHitRate}%
              </span>
            </div>
          )}

          {data?.queries && (
            <>
              <div className="section-heading">Query Stats</div>
              <div className="metric-cols">
                <div className="metric-row">
                  <span className="metric-label">Total</span>
                  <span className="metric-value">{(data.queries.total || 0).toLocaleString()}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Slow</span>
                  <span className={`metric-value ${data.queries.slow > 0 ? 'yellow' : ''}`}>
                    {data.queries.slow}
                  </span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">SELECT</span>
                  <span className="metric-value">{(data.queries.select || 0).toLocaleString()}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">INSERT</span>
                  <span className="metric-value">{(data.queries.insert || 0).toLocaleString()}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">UPDATE</span>
                  <span className="metric-value">{(data.queries.update || 0).toLocaleString()}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">DELETE</span>
                  <span className="metric-value">{(data.queries.delete || 0).toLocaleString()}</span>
                </div>
              </div>
            </>
          )}

          {data?.databases && data.databases.length > 0 && (
            <>
              <div className="section-heading">Databases by Size</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Database</th>
                    <th>Size</th>
                    <th>Tables</th>
                  </tr>
                </thead>
                <tbody>
                  {data.databases.map((db) => (
                    <tr key={db.database}>
                      <td>{db.database}</td>
                      <td>{db.size_mb} MB</td>
                      <td>{db.table_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {data?.top_tables && data.top_tables.length > 0 && (
            <>
              <div className="section-heading">Top 10 Tables by Size</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Table</th>
                    <th>Size</th>
                    <th>Rows</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_tables.map((t) => (
                    <tr key={`${t.database}.${t.table_name}`}>
                      <td title={`${t.database}.${t.table_name}`}>
                        {t.database}.{t.table_name}
                      </td>
                      <td>{t.size_mb} MB</td>
                      <td>{(t.table_rows || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {data?.processlist && data.processlist.length > 0 && (
            <>
              <div className="section-heading">Active Queries</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>DB</th>
                    <th>Time</th>
                    <th>Query</th>
                  </tr>
                </thead>
                <tbody>
                  {data.processlist.map((p) => (
                    <tr key={p.id}>
                      <td>{p.user}</td>
                      <td>{p.db || '—'}</td>
                      <td>
                        <span className={p.time > 10 ? 'badge red' : 'badge gray'}>
                          {p.time}s
                        </span>
                      </td>
                      <td title={p.query_preview}>{p.query_preview || p.command}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {data?.top_queries && data.top_queries.length > 0 && (
            <>
              <div className="section-heading">Top 5 Most Executed Queries</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Query</th>
                    <th>Count</th>
                    <th>Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_queries.map((q, i) => (
                    <tr key={i}>
                      <td title={q.query}>{q.query}</td>
                      <td>{(q.exec_count || 0).toLocaleString()}</td>
                      <td>{q.avg_time_sec?.toFixed(4)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
}
