import React from 'react';
import { useMetrics, formatBytes, formatUptime, getProgressColor } from '../hooks/useMetrics';

// Memory values from jc --top are in MiB.
const MiB = 1024 * 1024;

interface LinuxCpuStats {
  usage_pct: number;
  user: number;
  system: number;
  idle: number;
  iowait: number;
  steal: number;
}

interface LinuxMemoryStats {
  total_mb: number;
  used_mb: number;
  free_mb: number;
  buff_cache_mb: number;
  available_mb: number;
  swap_total_mb: number;
  swap_used_mb: number;
  usage_pct: number;
}

interface LinuxLoadStats {
  load1: number;
  load5: number;
  load15: number;
  running_procs: number;
  total_procs: number;
}

interface LinuxTaskStats {
  total: number;
  running: number;
  sleeping: number;
  stopped: number;
  zombie: number;
}

interface LinuxStats {
  time: string;
  uptime_seconds: number;
  users: number;
  cpu: LinuxCpuStats;
  memory: LinuxMemoryStats;
  load: LinuxLoadStats;
  tasks: LinuxTaskStats;
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

interface DockerData {
  status: string;
  services: DockerService[];
  error?: string;
}

interface LinuxData {
  status: string;
  error?: string;
  top_mtime?: string;
  dcps_mtime?: string;
  linux?: LinuxStats;
  docker?: DockerData;
}

function serviceStateBadge(state?: string, health?: string) {
  const s = (state || '').toLowerCase();
  const h = (health || '').toLowerCase();
  if (s === 'running' && (h === 'healthy' || h === '')) {
    return <span className="badge green">{state}</span>;
  }
  if (h === 'unhealthy') {
    return <span className="badge red">{state} / unhealthy</span>;
  }
  if (h === 'starting') {
    return <span className="badge yellow">{state} / starting</span>;
  }
  if (s === 'exited' || s === 'dead') {
    return <span className="badge red">{state}</span>;
  }
  if (s === 'restarting') {
    return <span className="badge yellow">{state}</span>;
  }
  return <span className="badge gray">{state || '—'}</span>;
}

export default function LinuxCard() {
  const { data, loading, error } = useMetrics<LinuxData>('/linux');

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

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🐧</span>
          <div>
            <div>Linux</div>
            <div className="card-subtitle">
              top.json · shared volume
              {data?.top_mtime && ` · ${new Date(data.top_mtime).toLocaleTimeString()}`}
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
          {/* ── Linux stats (top-like upper half) ── */}
          {data?.linux && (
            <>
              <div className="section-heading">CPU &amp; Memory</div>

              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-item">
                  <div
                    className="value"
                    style={{
                      color:
                        data.linux.cpu.usage_pct >= 90
                          ? 'var(--accent-red)'
                          : data.linux.cpu.usage_pct >= 70
                          ? 'var(--accent-yellow)'
                          : 'var(--accent-green)',
                    }}
                  >
                    {data.linux.cpu.usage_pct}%
                  </div>
                  <div className="label">CPU</div>
                </div>
                <div className="stat-item">
                  <div
                    className="value"
                    style={{
                      color:
                        data.linux.memory.usage_pct >= 90
                          ? 'var(--accent-red)'
                          : data.linux.memory.usage_pct >= 70
                          ? 'var(--accent-yellow)'
                          : 'var(--accent-green)',
                    }}
                  >
                    {data.linux.memory.usage_pct}%
                  </div>
                  <div className="label">Mem</div>
                </div>
                <div className="stat-item">
                  <div className="value">{data.linux.load.load1.toFixed(2)}</div>
                  <div className="label">Load 1m</div>
                </div>
                <div className="stat-item">
                  <div className="value">{formatUptime(data.linux.uptime_seconds)}</div>
                  <div className="label">Uptime</div>
                </div>
              </div>

              <div className="progress-bar-container">
                <div className="progress-bar-label">
                  <span>CPU Usage</span>
                  <span>
                    usr {data.linux.cpu.user.toFixed(1)}% · sys {data.linux.cpu.system.toFixed(1)}% · iow{' '}
                    {data.linux.cpu.iowait.toFixed(1)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${getProgressColor(data.linux.cpu.usage_pct)}`}
                    style={{ width: `${Math.min(data.linux.cpu.usage_pct, 100)}%` }}
                  />
                </div>
              </div>

              <div className="progress-bar-container">
                <div className="progress-bar-label">
                  <span>Memory</span>
                  <span>
                    {formatBytes(data.linux.memory.used_mb * MiB)} /{' '}
                    {formatBytes(data.linux.memory.total_mb * MiB)} (
                    {data.linux.memory.usage_pct}%)
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${getProgressColor(data.linux.memory.usage_pct)}`}
                    style={{ width: `${Math.min(data.linux.memory.usage_pct, 100)}%` }}
                  />
                </div>
              </div>

              {data.linux.memory.swap_total_mb > 0 && (
                <div className="progress-bar-container">
                  <div className="progress-bar-label">
                    <span>Swap</span>
                    <span>
                      {formatBytes(data.linux.memory.swap_used_mb * MiB)} /{' '}
                      {formatBytes(data.linux.memory.swap_total_mb * MiB)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-bar-fill ${getProgressColor(
                        data.linux.memory.swap_total_mb > 0
                          ? Math.round(
                              (data.linux.memory.swap_used_mb / data.linux.memory.swap_total_mb) * 100
                            )
                          : 0
                      )}`}
                      style={{
                        width: `${Math.min(
                          data.linux.memory.swap_total_mb > 0
                            ? Math.round(
                                (data.linux.memory.swap_used_mb / data.linux.memory.swap_total_mb) * 100
                              )
                            : 0,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="metric-row">
                <span className="metric-label">Load avg (1m / 5m / 15m)</span>
                <span className="metric-value highlight">
                  {data.linux.load.load1.toFixed(2)} / {data.linux.load.load5.toFixed(2)} /{' '}
                  {data.linux.load.load15.toFixed(2)}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Tasks</span>
                <span className="metric-value">
                  {data.linux.tasks.running} running / {data.linux.tasks.total} total
                  {data.linux.tasks.zombie > 0 && (
                    <span style={{ color: 'var(--accent-red)' }}>
                      {' '}· {data.linux.tasks.zombie} zombie
                    </span>
                  )}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Buff / Cache</span>
                <span className="metric-value">
                  {formatBytes(data.linux.memory.buff_cache_mb * MiB)}
                </span>
              </div>
            </>
          )}

          {/* ── Docker Compose PS (lower half) ── */}
          <hr className="section-divider" />
          <div className="section-heading">Docker Compose</div>

          {data?.docker?.status === 'error' ? (
            <div className="error-state">
              <div className="error-icon">🐳</div>
              <div className="error-msg">{data.docker.error}</div>
            </div>
          ) : data?.docker?.services && data.docker.services.length > 0 ? (
            <div className="scrollable-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>State</th>
                    <th>Status</th>
                    <th>Ports</th>
                  </tr>
                </thead>
                <tbody>
                  {data.docker.services.map((svc, idx) => (
                    <tr key={svc.Name || svc.Service || idx}>
                      <td>{svc.Service || svc.Name || '—'}</td>
                      <td>{serviceStateBadge(svc.State || svc.Status, svc.Health)}</td>
                      <td title={svc.CreatedAt ? `Created: ${svc.CreatedAt}` : undefined}>{svc.Status || '—'}</td>
                      <td title={svc.Ports}>{svc.Ports || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="error-state">
              <div className="error-icon">🐳</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No containers found</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
