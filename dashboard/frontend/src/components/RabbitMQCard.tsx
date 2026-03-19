import React from 'react';
import { useMetrics, formatBytes } from '../hooks/useMetrics';

interface Queue {
  name: string;
  vhost: string;
  state: string;
  messages: number;
  messages_ready: number;
  messages_unacknowledged: number;
  consumers: number;
  memory: number;
  publish_rate: number;
}

interface NodeStats {
  name: string;
  running: boolean;
  mem_used: number;
  mem_limit: number;
  disk_free: number;
  fd_used: number;
  fd_total: number;
  sockets_used: number;
  sockets_total: number;
  proc_used: number;
  proc_total: number;
}

interface Overview {
  rabbitmq_version: string;
  erlang_version: string;
  queue_totals: {
    messages: number;
    messages_ready: number;
    messages_unacknowledged: number;
  };
  object_totals: {
    channels: number;
    connections: number;
    consumers: number;
    exchanges: number;
    queues: number;
  };
  node: string;
}

interface RabbitMQData {
  status: string;
  error?: string;
  overview: Overview | null;
  queues: Queue[];
  nodes: NodeStats[];
}

export default function RabbitMQCard() {
  const { data, loading, error } = useMetrics<RabbitMQData>('/rabbitmq');

  if (loading && !data) {
    return (
      <div className="card">
        <div className="skeleton" style={{ width: '50%', height: '16px', marginBottom: '12px' }} />
        <div className="skeleton" />
        <div className="skeleton" style={{ width: '80%', marginTop: '8px' }} />
      </div>
    );
  }

  const isError = !data || data.status === 'error';

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🐇</span>
          <div>
            <div>RabbitMQ</div>
            <div className="card-subtitle">
              Port 5672 · Mgmt 15672
              {data?.overview && ` · v${data.overview.rabbitmq_version}`}
            </div>
          </div>
        </div>
        <span className={`status-badge ${isError ? 'error' : 'connected'}`}>
          <span className="status-dot pulse" />
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
          {data?.overview && (
            <>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="value">{data.overview.object_totals?.queues || 0}</div>
                  <div className="label">Queues</div>
                </div>
                <div className="stat-item">
                  <div className="value">{data.overview.queue_totals?.messages || 0}</div>
                  <div className="label">Messages</div>
                </div>
                <div className="stat-item">
                  <div className="value">{data.overview.object_totals?.consumers || 0}</div>
                  <div className="label">Consumers</div>
                </div>
                <div className="stat-item">
                  <div className="value">{data.overview.object_totals?.connections || 0}</div>
                  <div className="label">Connections</div>
                </div>
              </div>

              <div className="metric-row">
                <span className="metric-label">Ready Messages</span>
                <span className="metric-value highlight">
                  {(data.overview.queue_totals?.messages_ready || 0).toLocaleString()}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Unacknowledged</span>
                <span className={`metric-value ${(data.overview.queue_totals?.messages_unacknowledged || 0) > 0 ? 'yellow' : ''}`}>
                  {(data.overview.queue_totals?.messages_unacknowledged || 0).toLocaleString()}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Channels</span>
                <span className="metric-value">{data.overview.object_totals?.channels || 0}</span>
              </div>
            </>
          )}

          {data?.nodes && data.nodes.length > 0 && (
            <>
              <div className="section-heading">Nodes</div>
              {data.nodes.map((node) => {
                const memPct = node.mem_limit > 0
                  ? Math.round((node.mem_used / node.mem_limit) * 100)
                  : 0;
                return (
                  <div key={node.name} className="progress-bar-container">
                    <div className="progress-bar-label">
                      <span title={node.name}>{node.name.split('@').pop()}</span>
                      <span>
                        {formatBytes(node.mem_used)} / {formatBytes(node.mem_limit)} ({memPct}%) ·{' '}
                        {node.running ? (
                          <span style={{ color: 'var(--accent-green)' }}>Running</span>
                        ) : (
                          <span style={{ color: 'var(--accent-red)' }}>Stopped</span>
                        )}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-bar-fill ${memPct >= 80 ? 'red' : memPct >= 60 ? 'yellow' : 'purple'}`}
                        style={{ width: `${Math.min(memPct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {data?.queues && data.queues.length > 0 && (
            <>
              <div className="section-heading">Queues by Message Count</div>
              <div className="scrollable-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Queue</th>
                      <th>Ready</th>
                      <th>Unacked</th>
                      <th>Consumers</th>
                      <th>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.queues.map((q) => (
                      <tr key={`${q.vhost}-${q.name}`}>
                        <td title={q.name}>{q.name}</td>
                        <td>{q.messages_ready.toLocaleString()}</td>
                        <td>
                          {q.messages_unacknowledged > 0 ? (
                            <span className="badge yellow">{q.messages_unacknowledged}</span>
                          ) : (
                            q.messages_unacknowledged
                          )}
                        </td>
                        <td>{q.consumers}</td>
                        <td>
                          <span className={`badge ${q.state === 'running' ? 'green' : 'red'}`}>
                            {q.state}
                          </span>
                        </td>
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
