import React from 'react';
import { useMetrics, getProgressColor } from '../hooks/useMetrics';

interface IndexInfo {
  index: string;
  health: string;
  status: string;
  uuid: string;
  pri: string;
  rep: string;
  'docs.count': string;
  'docs.deleted': string;
  'store.size': string;
  'pri.store.size': string;
}

interface NodeHeap {
  name: string;
  heap_used_percent: number;
  heap_used: string;
  heap_max: string;
  cpu_percent: number;
}

interface ClusterHealth {
  cluster_name: string;
  status: string;
  number_of_nodes: number;
  number_of_data_nodes: number;
  active_primary_shards: number;
  active_shards: number;
  relocating_shards: number;
  initializing_shards: number;
  unassigned_shards: number;
  active_shards_percent_as_number: number;
  active_shards_percent: string;
}

interface OpenSearchData {
  status: string;
  error?: string;
  cluster: ClusterHealth | null;
  nodes_heap: NodeHeap[] | null;
  indices: IndexInfo[] | null;
}

const UUID_DISPLAY_LENGTH = 8;

function getClusterStatusColor(status: string): string {
  if (status === 'green') return 'green';
  if (status === 'yellow') return 'yellow';
  return 'red';
}

function getIndexHealthBadge(health: string) {
  const color = health === 'green' ? 'green' : health === 'yellow' ? 'yellow' : 'red';
  return <span className={`badge ${color}`}>{health}</span>;
}

export default function OpenSearchCard() {
  const { data, loading, error } = useMetrics<OpenSearchData>('/opensearch');

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
          <span className="card-icon">🔍</span>
          <div>
            <div>OpenSearch</div>
            <div className="card-subtitle">Port 9200</div>
          </div>
        </div>
        {isError ? (
          <span className="status-badge error">
            <span className="status-dot" />
            Error
          </span>
        ) : (
          <span className={`status-badge ${getClusterStatusColor(data?.cluster?.status || 'red')}`}>
            <span className="status-dot pulse" />
            {data?.cluster?.status?.toUpperCase() || 'UNKNOWN'}
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
          {data?.cluster && (
            <>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="value">{data.cluster.number_of_nodes}</div>
                  <div className="label">Nodes</div>
                </div>
                <div className="stat-item">
                  <div className="value">{data.cluster.active_primary_shards}</div>
                  <div className="label">Pri Shards</div>
                </div>
                <div className="stat-item">
                  <div className="value">{data.cluster.active_shards}</div>
                  <div className="label">Shards</div>
                </div>
                <div className="stat-item">
                  <div className={`value ${data.cluster.unassigned_shards > 0 ? 'red' : ''}`}>
                    {data.cluster.unassigned_shards}
                  </div>
                  <div className="label">Unassigned</div>
                </div>
              </div>

              <div className="metric-row">
                <span className="metric-label">Cluster</span>
                <span className="metric-value">{data.cluster.cluster_name}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Active Shards</span>
                <span className="metric-value">
                  {data.cluster.active_shards_percent || '—'}
                </span>
              </div>
              {data.cluster.relocating_shards > 0 && (
                <div className="metric-row">
                  <span className="metric-label">Relocating</span>
                  <span className="metric-value yellow">{data.cluster.relocating_shards}</span>
                </div>
              )}
            </>
          )}

          {data?.nodes_heap && data.nodes_heap.length > 0 && (
            <>
              <div className="section-heading">JVM Heap per Node</div>
              {data.nodes_heap.map((node) => (
                <div key={node.name} className="progress-bar-container">
                  <div className="progress-bar-label">
                    <span>{node.name}</span>
                    <span>
                      {node.heap_used} / {node.heap_max} ({node.heap_used_percent}%) · CPU {node.cpu_percent}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-bar-fill ${getProgressColor(node.heap_used_percent)}`}
                      style={{ width: `${Math.min(node.heap_used_percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </>
          )}

          {data?.indices && data.indices.length > 0 && (
            <>
              <div className="section-heading">Indices by Size</div>
              <div className="scrollable-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Index</th>
                      <th>Health</th>
                      <th>Status</th>
                      <th>UUID</th>
                      <th>Pri</th>
                      <th>Rep</th>
                      <th>Docs</th>
                      <th>Docs Del</th>
                      <th>Size</th>
                      <th>Pri Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.indices.map((idx) => (
                      <tr key={idx.uuid || idx.index}>
                        <td title={idx.index}>{idx.index}</td>
                        <td>{getIndexHealthBadge(idx.health)}</td>
                        <td>{idx.status || '—'}</td>
                        <td title={idx.uuid}>{idx.uuid ? idx.uuid.slice(0, UUID_DISPLAY_LENGTH) + '…' : '—'}</td>
                        <td>{idx.pri}</td>
                        <td>{idx.rep}</td>
                        <td>{parseInt(idx['docs.count'] || '0', 10).toLocaleString()}</td>
                        <td>{parseInt(idx['docs.deleted'] || '0', 10).toLocaleString()}</td>
                        <td>{idx['store.size'] || '—'}</td>
                        <td>{idx['pri.store.size'] || '—'}</td>
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
