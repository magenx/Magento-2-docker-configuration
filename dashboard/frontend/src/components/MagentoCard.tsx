import React from 'react';
import { useMetrics } from '../hooks/useMetrics';

interface RecentOrder {
  increment_id: string;
  status: string;
  customer_email: string;
  grand_total: string | number;
  base_currency_code: string;
  created_at: string;
}

interface MagentoData {
  status: string;
  error?: string;
  orders?: {
    orders_24h: number | null;
    orders_7d: number | null;
    orders_30d: number | null;
    orders_pending: number | null;
    orders_processing: number | null;
    orders_total: number | null;
  };
  recent_orders?: RecentOrder[];
  users_online?: {
    total: number;
    online_count?: number;
    total_visitors?: number;
    logged_in?: number;
    guests?: number;
  };
}

function getOrderStatusBadge(status: string) {
  const colorMap: Record<string, string> = {
    pending: 'yellow',
    processing: 'blue',
    complete: 'green',
    closed: 'gray',
    canceled: 'red',
    holded: 'yellow',
  };
  return (
    <span className={`badge ${colorMap[status] || 'gray'}`}>{status}</span>
  );
}

export default function MagentoCard() {
  const { data, loading, error } = useMetrics<MagentoData>('/magento');

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
          <span className="card-icon">🛒</span>
          <div>
            <div>Magento</div>
            <div className="card-subtitle">Orders &amp; Visitors</div>
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
          {data?.users_online && (
            <>
              <div className="section-heading">Visitors Online (last 15 min)</div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="value">{data.users_online.total || data.users_online.online_count || 0}</div>
                  <div className="label">Total</div>
                </div>
                <div className="stat-item">
                  <div className="value">{data.users_online.logged_in || 0}</div>
                  <div className="label">Logged In</div>
                </div>
                <div className="stat-item">
                  <div className="value">{data.users_online.guests || 0}</div>
                  <div className="label">Guests</div>
                </div>
              </div>
            </>
          )}

          {data?.orders && (
            <>
              <div className="section-heading">Orders</div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="value">{data.orders.orders_24h ?? '—'}</div>
                  <div className="label">Last 24h</div>
                </div>
                <div className="stat-item">
                  <div className="value">{data.orders.orders_7d ?? '—'}</div>
                  <div className="label">Last 7d</div>
                </div>
                <div className="stat-item">
                  <div className="value">{data.orders.orders_30d ?? '—'}</div>
                  <div className="label">Last 30d</div>
                </div>
                <div className="stat-item">
                  <div className="value">{data.orders.orders_total ?? '—'}</div>
                  <div className="label">Total</div>
                </div>
              </div>
              <div className="metric-row">
                <span className="metric-label">Pending</span>
                <span className={`metric-value ${(data.orders.orders_pending || 0) > 0 ? 'yellow' : ''}`}>
                  {data.orders.orders_pending ?? 0}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Processing</span>
                <span className="metric-value highlight">{data.orders.orders_processing ?? 0}</span>
              </div>
            </>
          )}

          {data?.recent_orders && data.recent_orders.length > 0 && (
            <>
              <div className="section-heading">Recent Orders</div>
              <div className="scrollable-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_orders.map((order) => (
                      <tr key={order.increment_id}>
                        <td>{order.increment_id}</td>
                        <td>{getOrderStatusBadge(order.status)}</td>
                        <td>
                          {(Number(order.grand_total) || 0).toFixed(2)} {order.base_currency_code}
                        </td>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
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
