import React, { useState, useEffect, useCallback } from 'react';
import RedisCard from './components/RedisCard';
import OpenSearchCard from './components/OpenSearchCard';
import RabbitMQCard from './components/RabbitMQCard';
import MariaDBCard from './components/MariaDBCard';
import WebServerCard from './components/WebServerCard';
import VarnishCard from './components/VarnishCard';
import MagentoCard from './components/MagentoCard';
import LinuxCard from './components/LinuxCard';
import ProfilerCard from './components/ProfilerCard';
import AuditdCard from './components/AuditdCard';
import LoginPage from './components/LoginPage';
import DemoDashboard from './demo/DemoDashboard';

const REFRESH_INTERVAL = 30000; // 30 seconds
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function MainDashboard() {
  // null = checking auth state; true = authenticated; false = not authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);

  // On mount, verify whether an existing session cookie is still valid
  useEffect(() => {
    fetch(`${API_BASE}/auth/check`, { credentials: 'include' })
      .then((res) => setIsAuthenticated(res.ok))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      // Ignore network errors — clear client state regardless
    }
    setIsAuthenticated(false);
  }, []);

  // Listen for 401 events dispatched by useMetrics
  useEffect(() => {
    const onUnauthorized = () => setIsAuthenticated(false);
    window.addEventListener('dashboard:unauthorized', onUnauthorized);
    return () => window.removeEventListener('dashboard:unauthorized', onUnauthorized);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    setLastUpdated(new Date());
    setCountdown(REFRESH_INTERVAL / 1000);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setLastUpdated(new Date());
          return REFRESH_INTERVAL / 1000;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (isAuthenticated === null) {
    // Still checking the session cookie — render nothing to avoid flash
    return null;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <span className="title-icon">⚡</span>
          <span className="title-text">Webstack Dashboard</span>
        </div>
        <div className="dashboard-meta">
          <span className="meta-time">Updated: {formatTime(lastUpdated)}</span>
          <span className="meta-countdown">↻ {countdown}s</span>
          <button
            className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>

      {/* Row 1: Redis Cache + Redis Sessions */}
      <div className="grid grid-2" style={{ marginBottom: '18px' }} key={`redis-${refreshKey}`}>
        <RedisCard />
      </div>

      {/* Row 2: OpenSearch + RabbitMQ */}
      <div className="grid grid-2" style={{ marginBottom: '18px' }} key={`os-rmq-${refreshKey}`}>
        <OpenSearchCard />
        <RabbitMQCard />
      </div>

      {/* Row 3: MariaDB + Varnish */}
      <div className="grid grid-2" style={{ marginBottom: '18px' }} key={`db-varnish-${refreshKey}`}>
        <MariaDBCard />
        <VarnishCard />
      </div>

      {/* Row 4: Nginx + PHP-FPM */}
      <div className="grid grid-2" style={{ marginBottom: '18px' }} key={`web-${refreshKey}`}>
        <WebServerCard />
      </div>

      {/* Row 5: Magento + Linux/Docker */}
      <div className="grid grid-2" style={{ marginBottom: '18px' }} key={`magento-linux-${refreshKey}`}>
        <MagentoCard />
        <LinuxCard />
      </div>

      {/* Row 6: Profiler + Audit Log */}
      <div className="grid grid-2" style={{ marginBottom: '18px' }} key={`profiler-auditd-${refreshKey}`}>
        <ProfilerCard />
        <AuditdCard />
      </div>
    </div>
  );
}

export default function App() {
  const isDemoMode = new URLSearchParams(window.location.search).has('demo');
  return isDemoMode ? <DemoDashboard /> : <MainDashboard />;
}
