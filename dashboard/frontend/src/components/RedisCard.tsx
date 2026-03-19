import React from 'react';
import { useMetrics, formatBytes, formatUptime, getProgressColor } from '../hooks/useMetrics';

interface RedisInstance {
  name: string;
  status: string;
  error?: string;
  version?: string;
  uptime_seconds?: number;
  connected_clients?: number;
  blocked_clients?: number;
  used_memory?: number;
  used_memory_human?: string;
  used_memory_peak?: number;
  used_memory_peak_human?: string;
  maxmemory?: number;
  maxmemory_human?: string;
  mem_fragmentation_ratio?: number;
  total_keys?: number;
  keyspace?: Record<string, { keys: number; expires: number; avg_ttl: number }>;
  total_commands_processed?: number;
  instantaneous_ops_per_sec?: number;
  keyspace_hits?: number;
  keyspace_misses?: number;
  evicted_keys?: number;
  expired_keys?: number;
  role?: string;
}

function RedisInstance({ instance }: { instance: RedisInstance }) {
  const isError = instance.status === 'error';

  if (isError) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span className="card-icon">🗄</span>
            <div>
              <div>Redis {instance.name}</div>
              <div className="card-subtitle">
                {instance.name === 'cache' ? 'Port 6380' : 'Port 6379'}
              </div>
            </div>
          </div>
          <span className="status-badge error">
            <span className="status-dot" />
            Error
          </span>
        </div>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-msg">{instance.error}</div>
        </div>
      </div>
    );
  }

  const hasMaxMemory = (instance.maxmemory ?? 0) > 0;
  const memPct = hasMaxMemory && instance.used_memory
    ? Math.round((instance.used_memory / instance.maxmemory!) * 100)
    : 0;

  const hasPeakMemory = !hasMaxMemory && (instance.used_memory_peak ?? 0) > 0;
  const peakPct = hasPeakMemory
    ? Math.round((instance.used_memory! / instance.used_memory_peak!) * 100)
    : 0;

  const hitRate =
    (instance.keyspace_hits || 0) + (instance.keyspace_misses || 0) > 0
      ? Math.round(
          ((instance.keyspace_hits || 0) /
            ((instance.keyspace_hits || 0) + (instance.keyspace_misses || 0))) *
            100
        )
      : 0;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🗄</span>
          <div>
            <div>Redis {instance.name}</div>
            <div className="card-subtitle">
              {instance.name === 'cache' ? 'Port 6380' : 'Port 6379'} · v{instance.version} · {instance.role}
            </div>
          </div>
        </div>
        <span className="status-badge connected">
          <span className="status-dot pulse" />
          Up {formatUptime(instance.uptime_seconds || 0)}
        </span>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="value">{instance.total_keys?.toLocaleString() || 0}</div>
          <div className="label">Keys</div>
        </div>
        <div className="stat-item">
          <div className="value">{instance.connected_clients || 0}</div>
          <div className="label">Clients</div>
        </div>
        <div className="stat-item">
          <div className="value">{instance.instantaneous_ops_per_sec || 0}</div>
          <div className="label">Ops/sec</div>
        </div>
        <div className="stat-item">
          <div className="value">{hitRate}%</div>
          <div className="label">Hit Rate</div>
        </div>
      </div>

      {hasMaxMemory && (
        <div className="progress-bar-container">
          <div className="progress-bar-label">
            <span>Memory</span>
            <span>
              {instance.used_memory_human} / {instance.maxmemory_human} ({memPct < 1 ? '<1' : memPct}%)
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-bar-fill ${getProgressColor(memPct)}`}
              style={{ width: `${Math.min(memPct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {!hasMaxMemory && hasPeakMemory && (
        <div className="progress-bar-container">
          <div className="progress-bar-label">
            <span>Memory</span>
            <span>
              {instance.used_memory_human} / {instance.used_memory_peak_human} peak ({peakPct}%)
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-bar-fill ${getProgressColor(peakPct)}`}
              style={{ width: `${Math.min(peakPct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {!hasMaxMemory && !hasPeakMemory && instance.used_memory_human && (
        <div className="metric-row">
          <span className="metric-label">Memory Used</span>
          <span className="metric-value highlight">{instance.used_memory_human}</span>
        </div>
      )}

      <div className="metric-row">
        <span className="metric-label">Peak Memory</span>
        <span className="metric-value">{instance.used_memory_peak_human || '—'}</span>
      </div>
      <div className="metric-row">
        <span className="metric-label">Fragmentation</span>
        <span className="metric-value">{instance.mem_fragmentation_ratio?.toFixed(2) || '—'}</span>
      </div>
      <div className="metric-row">
        <span className="metric-label">Evicted Keys</span>
        <span className={`metric-value ${(instance.evicted_keys || 0) > 0 ? 'yellow' : ''}`}>
          {(instance.evicted_keys || 0).toLocaleString()}
        </span>
      </div>
      <div className="metric-row">
        <span className="metric-label">Expired Keys</span>
        <span className="metric-value">{(instance.expired_keys || 0).toLocaleString()}</span>
      </div>

      {instance.keyspace && Object.keys(instance.keyspace).length > 0 && (
        <>
          <div className="section-heading">Keyspace</div>
          {Object.entries(instance.keyspace).map(([db, info]) => (
            <div key={db} className="metric-row">
              <span className="metric-label">{db}</span>
              <span className="metric-value">
                {info.keys.toLocaleString()} keys · {info.expires} expiring
                {info.avg_ttl > 0 && ` · avg TTL ${Math.round(info.avg_ttl / 1000)}s`}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default function RedisCard() {
  const { data, loading, error } = useMetrics<RedisInstance[]>('/redis');

  if (loading && !data) {
    return (
      <>
        {[0, 1].map((i) => (
          <div key={i} className="card">
            <div className="skeleton" style={{ width: '60%', height: '16px', marginBottom: '12px' }} />
            <div className="skeleton" style={{ width: '40%' }} />
            <div className="skeleton" style={{ width: '80%', marginTop: '8px' }} />
            <div className="skeleton" style={{ width: '60%', marginTop: '8px' }} />
          </div>
        ))}
      </>
    );
  }

  if (error && !data) {
    return (
      <div className="card">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <div>Redis</div>
          <div className="error-msg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {(data || []).map((instance) => (
        <RedisInstance key={instance.name} instance={instance} />
      ))}
    </>
  );
}
