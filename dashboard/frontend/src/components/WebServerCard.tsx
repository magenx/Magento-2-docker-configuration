import React from 'react';
import { useMetrics } from '../hooks/useMetrics';

interface NginxData {
  status: string;
  error?: string;
  active_connections?: number;
  accepts?: number;
  handled?: number;
  requests?: number;
  reading?: number;
  writing?: number;
  waiting?: number;
}

interface PhpFpmData {
  status: string;
  error?: string;
  pool?: string;
  process_manager?: string;
  start_since?: number;
  accepted_conn?: number;
  listen_queue?: number;
  max_listen_queue?: number;
  idle_processes?: number;
  active_processes?: number;
  total_processes?: number;
  max_active_processes?: number;
  max_children_reached?: number;
  slow_requests?: number;
  processes?: Array<{
    pid: number;
    state: string;
    requests: number;
    'request duration': number;
    'request method': string;
    'request uri': string;
    'last request cpu': number;
    'last request memory': number;
  }>;
}

function NginxMetrics({ data }: { data: NginxData }) {
  const requestsPerConn =
    data.active_connections && data.active_connections > 0 && data.requests
      ? (data.requests / data.accepts!).toFixed(2)
      : '—';

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🌐</span>
          <div>
            <div>Nginx</div>
            <div className="card-subtitle">Stub Status</div>
          </div>
        </div>
        {data.status === 'error' ? (
          <span className="status-badge error">
            <span className="status-dot" />
            Error
          </span>
        ) : (
          <span className="status-badge connected">
            <span className="status-dot pulse" />
            Online
          </span>
        )}
      </div>

      {data.status === 'error' ? (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-msg">{data.error}</div>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="value">{(data.active_connections || 0).toLocaleString()}</div>
              <div className="label">Active</div>
            </div>
            <div className="stat-item">
              <div className="value">{data.reading || 0}</div>
              <div className="label">Reading</div>
            </div>
            <div className="stat-item">
              <div className="value">{data.writing || 0}</div>
              <div className="label">Writing</div>
            </div>
            <div className="stat-item">
              <div className="value">{data.waiting || 0}</div>
              <div className="label">Waiting</div>
            </div>
          </div>

          <div className="metric-row">
            <span className="metric-label">Total Requests</span>
            <span className="metric-value highlight">{(data.requests || 0).toLocaleString()}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Accepts / Handled</span>
            <span className="metric-value">
              {(data.accepts || 0).toLocaleString()} / {(data.handled || 0).toLocaleString()}
            </span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Req/Connection</span>
            <span className="metric-value">{requestsPerConn}</span>
          </div>
        </>
      )}
    </div>
  );
}

function PhpFpmMetrics({ data }: { data: PhpFpmData }) {
  const procPct =
    data.total_processes && data.total_processes > 0 && data.active_processes !== undefined
      ? Math.round((data.active_processes / data.total_processes) * 100)
      : 0;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🐘</span>
          <div>
            <div>PHP-FPM</div>
            <div className="card-subtitle">
              {data.pool ? `Pool: ${data.pool}` : 'FPM Status'}
              {data.process_manager && ` · ${data.process_manager}`}
            </div>
          </div>
        </div>
        {data.status === 'error' ? (
          <span className="status-badge error">
            <span className="status-dot" />
            Error
          </span>
        ) : (
          <span className="status-badge connected">
            <span className="status-dot pulse" />
            Online
          </span>
        )}
      </div>

      {data.status === 'error' ? (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-msg">{data.error}</div>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="value">{data.active_processes || 0}</div>
              <div className="label">Active</div>
            </div>
            <div className="stat-item">
              <div className="value">{data.idle_processes || 0}</div>
              <div className="label">Idle</div>
            </div>
            <div className="stat-item">
              <div className="value">{data.total_processes || 0}</div>
              <div className="label">Total</div>
            </div>
            <div className="stat-item">
              <div className="value">{data.listen_queue || 0}</div>
              <div className="label">Queue</div>
            </div>
          </div>

          {procPct > 0 && (
            <div className="progress-bar-container">
              <div className="progress-bar-label">
                <span>Process Utilization</span>
                <span>{data.active_processes}/{data.total_processes} ({procPct}%)</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-bar-fill ${procPct >= 90 ? 'red' : procPct >= 70 ? 'yellow' : 'blue'}`}
                  style={{ width: `${Math.min(procPct, 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="metric-row">
            <span className="metric-label">Accepted Connections</span>
            <span className="metric-value highlight">
              {(data.accepted_conn || 0).toLocaleString()}
            </span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Max Listen Queue</span>
            <span className={`metric-value ${(data.max_listen_queue || 0) > 0 ? 'yellow' : ''}`}>
              {data.max_listen_queue || 0}
            </span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Max Active Procs</span>
            <span className="metric-value">{data.max_active_processes || 0}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Max Children Reached</span>
            <span className={`metric-value ${(data.max_children_reached || 0) > 0 ? 'red' : ''}`}>
              {data.max_children_reached || 0}
            </span>
          </div>
          {(data.slow_requests || 0) > 0 && (
            <div className="metric-row">
              <span className="metric-label">Slow Requests</span>
              <span className="metric-value yellow">{data.slow_requests}</span>
            </div>
          )}

          {data.processes && data.processes.length > 0 && (
            <>
              <div className="section-heading">Processes</div>
              <div className="scrollable-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>PID</th>
                      <th>State</th>
                      <th>Reqs</th>
                      <th>Last URI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.processes.map((proc) => (
                      <tr key={proc.pid}>
                        <td>{proc.pid}</td>
                        <td>
                          <span className={`badge ${proc.state === 'Idle' ? 'green' : proc.state === 'Running' ? 'blue' : 'gray'}`}>
                            {proc.state}
                          </span>
                        </td>
                        <td>{proc.requests}</td>
                        <td title={proc['request uri']}>{proc['request uri'] || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function WebServerCard() {
  const nginx = useMetrics<NginxData>('/nginx');
  const phpfpm = useMetrics<PhpFpmData>('/phpfpm');

  const nginxData = nginx.data || { status: nginx.loading ? 'loading' : 'error', error: nginx.error || undefined };
  const phpfpmData = phpfpm.data || { status: phpfpm.loading ? 'loading' : 'error', error: phpfpm.error || undefined };

  return (
    <>
      <NginxMetrics data={nginxData} />
      <PhpFpmMetrics data={phpfpmData} />
    </>
  );
}
