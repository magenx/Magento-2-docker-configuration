import React, { useState } from 'react';
import { formatBytes, formatUptime, getProgressColor } from '../hooks/useMetrics';

// ─── Sample data ────────────────────────────────────────────────────────────

const REDIS_SAMPLE = [
  {
    name: 'cache',
    status: 'ok',
    version: '7.2.4',
    role: 'master',
    uptime_seconds: 864231,
    connected_clients: 18,
    blocked_clients: 0,
    used_memory: 134217728,
    used_memory_human: '128.0 MB',
    used_memory_peak: 163577856,
    used_memory_peak_human: '156.0 MB',
    maxmemory: 536870912,
    maxmemory_human: '512.0 MB',
    mem_fragmentation_ratio: 1.08,
    total_keys: 84312,
    keyspace: { db0: { keys: 84312, expires: 72100, avg_ttl: 3600000 } },
    total_commands_processed: 42817503,
    instantaneous_ops_per_sec: 1430,
    keyspace_hits: 38127452,
    keyspace_misses: 2203881,
    evicted_keys: 0,
    expired_keys: 198400,
  },
  {
    name: 'sessions',
    status: 'ok',
    version: '7.2.4',
    role: 'master',
    uptime_seconds: 864183,
    connected_clients: 9,
    blocked_clients: 0,
    used_memory: 41943040,
    used_memory_human: '40.0 MB',
    used_memory_peak: 54525952,
    used_memory_peak_human: '52.0 MB',
    maxmemory: 1073741824,
    maxmemory_human: '1.00 GB',
    mem_fragmentation_ratio: 1.04,
    total_keys: 12740,
    keyspace: { db0: { keys: 12740, expires: 12740, avg_ttl: 7200000 } },
    total_commands_processed: 8193021,
    instantaneous_ops_per_sec: 280,
    keyspace_hits: 7419887,
    keyspace_misses: 312941,
    evicted_keys: 0,
    expired_keys: 44120,
  },
];

const OPENSEARCH_SAMPLE = {
  status: 'ok',
  cluster: {
    cluster_name: 'magento-cluster',
    status: 'green',
    number_of_nodes: 2,
    number_of_data_nodes: 2,
    active_primary_shards: 22,
    active_shards: 44,
    relocating_shards: 0,
    initializing_shards: 0,
    unassigned_shards: 0,
    active_shards_percent_as_number: 100,
    active_shards_percent: '100.0%',
  },
  nodes_heap: [
    { name: 'node-1', heap_used_percent: 42, heap_used: '1.7 GB', heap_max: '4.0 GB', cpu_percent: 12 },
    { name: 'node-2', heap_used_percent: 38, heap_used: '1.5 GB', heap_max: '4.0 GB', cpu_percent: 8 },
  ],
  indices: [
    { index: 'magento2_product_1', health: 'green', status: 'open', uuid: 'a1b2c3d4e5f67890', pri: '5', rep: '1', 'docs.count': '48321', 'docs.deleted': '120', 'store.size': '312.4 MB', 'pri.store.size': '156.2 MB' },
    { index: 'magento2_category_1', health: 'green', status: 'open', uuid: 'b2c3d4e5f6789012', pri: '3', rep: '1', 'docs.count': '4218', 'docs.deleted': '14', 'store.size': '28.1 MB', 'pri.store.size': '14.0 MB' },
    { index: 'magento2_cms_page_1', health: 'green', status: 'open', uuid: 'c3d4e5f678901234', pri: '2', rep: '1', 'docs.count': '312', 'docs.deleted': '2', 'store.size': '4.2 MB', 'pri.store.size': '2.1 MB' },
    { index: 'magento2_order_1', health: 'green', status: 'open', uuid: 'd4e5f67890123456', pri: '5', rep: '1', 'docs.count': '1182470', 'docs.deleted': '4800', 'store.size': '2.8 GB', 'pri.store.size': '1.4 GB' },
  ],
};

const RABBITMQ_SAMPLE = {
  status: 'ok',
  overview: {
    rabbitmq_version: '3.12.13',
    erlang_version: '26.2.3',
    queue_totals: { messages: 1842, messages_ready: 1784, messages_unacknowledged: 58 },
    object_totals: { channels: 24, connections: 12, consumers: 18, exchanges: 14, queues: 8 },
    node: 'rabbit@mq01',
  },
  queues: [
    { name: 'async.operations.all', vhost: '/', state: 'running', messages: 842, messages_ready: 812, messages_unacknowledged: 30, consumers: 5, memory: 10485760, publish_rate: 42.3 },
    { name: 'product.indexer.queue', vhost: '/', state: 'running', messages: 612, messages_ready: 598, messages_unacknowledged: 14, consumers: 4, memory: 6291456, publish_rate: 18.7 },
    { name: 'inventory.reservations.update', vhost: '/', state: 'running', messages: 248, messages_ready: 248, messages_unacknowledged: 0, consumers: 3, memory: 3145728, publish_rate: 8.1 },
    { name: 'order.processor', vhost: '/', state: 'running', messages: 80, messages_ready: 76, messages_unacknowledged: 4, consumers: 2, memory: 2097152, publish_rate: 3.2 },
    { name: 'email.send', vhost: '/', state: 'running', messages: 60, messages_ready: 50, messages_unacknowledged: 10, consumers: 4, memory: 1048576, publish_rate: 1.8 },
  ],
  nodes: [
    { name: 'rabbit@mq01', running: true, mem_used: 314572800, mem_limit: 1073741824, disk_free: 21474836480, fd_used: 78, fd_total: 1024, sockets_used: 24, sockets_total: 920, proc_used: 482, proc_total: 1048576 },
  ],
};

const MARIADB_SAMPLE = {
  status: 'ok',
  version: '10.11.7-MariaDB',
  version_comment: 'mariadb.org binary distribution',
  uptime_seconds: 1728400,
  connections: { current: 28, running: 6, max_used: 42, max_allowed: 500, aborted: 3 },
  memory: { innodb_buffer_pool_size: 4294967296, key_buffer_size: 33554432 },
  queries: { total: 84127340, slow: 12, select: 48321480, insert: 18120321, update: 12341820, delete: 3210050 },
  innodb: { buffer_pool_read_requests: 312841720, buffer_pool_reads: 1248321, row_lock_waits: 42 },
  databases: [
    { database: 'magento_db', size_mb: 8420.8, table_count: 342 },
    { database: 'magento_staging', size_mb: 1240.4, table_count: 342 },
    { database: 'information_schema', size_mb: 0.2, table_count: 78 },
  ],
  top_tables: [
    { database: 'magento_db', table_name: 'cataloginventory_stock_status_idx', size_mb: 892.4, table_rows: 4821320, data_mb: 712.3, index_mb: 180.1 },
    { database: 'magento_db', table_name: 'quote_item', size_mb: 684.2, table_rows: 3120481, data_mb: 540.8, index_mb: 143.4 },
    { database: 'magento_db', table_name: 'sales_order', size_mb: 512.1, table_rows: 1182470, data_mb: 420.2, index_mb: 91.9 },
    { database: 'magento_db', table_name: 'sales_order_item', size_mb: 482.8, table_rows: 2841230, data_mb: 389.4, index_mb: 93.4 },
    { database: 'magento_db', table_name: 'catalog_product_entity_varchar', size_mb: 380.3, table_rows: 18421042, data_mb: 298.1, index_mb: 82.2 },
  ],
  processlist: [
    { id: 1482, user: 'magento', host: '10.0.1.12:51234', db: 'magento_db', command: 'Query', time: 0, state: 'executing', query_preview: 'SELECT e.entity_id FROM catalog_product_entity e' },
    { id: 1483, user: 'magento', host: '10.0.1.12:51235', db: 'magento_db', command: 'Query', time: 1, state: 'Sending data', query_preview: 'SELECT COUNT(*) FROM quote WHERE is_active = 1' },
    { id: 1484, user: 'root', host: 'localhost', db: 'information_schema', command: 'Query', time: 0, state: 'executing', query_preview: 'SHOW PROCESSLIST' },
  ],
  top_queries: [
    { query: 'SELECT `e`.* FROM `catalog_product_entity` AS `e` WHERE ...', exec_count: 1842301, total_time_sec: 921.15, avg_time_sec: 0.0005, rows_examined: 4821302, rows_sent: 1842301 },
    { query: 'SELECT `main_table`.* FROM `sales_order` AS `main_table` WHERE ...', exec_count: 984210, total_time_sec: 786.28, avg_time_sec: 0.0008, rows_examined: 1182470, rows_sent: 984210 },
    { query: 'UPDATE `cataloginventory_stock_item` SET `qty` = ? WHERE ...', exec_count: 482103, total_time_sec: 241.05, avg_time_sec: 0.0005, rows_examined: 482103, rows_sent: 0 },
    { query: 'SELECT `quote`.* FROM `quote` WHERE (`quote`.`entity_id` = ?) LIMIT 1', exec_count: 312841, total_time_sec: 125.14, avg_time_sec: 0.0004, rows_examined: 312841, rows_sent: 312841 },
    { query: 'INSERT INTO `customer_log` (`customer_id`, `last_login_at`) VALUES ...', exec_count: 198420, total_time_sec: 99.21, avg_time_sec: 0.0005, rows_examined: 0, rows_sent: 0 },
  ],
};

const NGINX_SAMPLE = {
  status: 'ok',
  active_connections: 342,
  accepts: 18421302,
  handled: 18421302,
  requests: 48213042,
  reading: 4,
  writing: 28,
  waiting: 310,
};

const PHPFPM_SAMPLE = {
  status: 'ok',
  pool: 'magento',
  process_manager: 'dynamic',
  start_since: 864231,
  accepted_conn: 48213042,
  listen_queue: 0,
  max_listen_queue: 2,
  idle_processes: 28,
  active_processes: 12,
  total_processes: 40,
  max_active_processes: 36,
  max_children_reached: 0,
  slow_requests: 0,
  processes: [
    { pid: 4201, state: 'Running', requests: 18421, 'request duration': 120400, 'request method': 'GET', 'request uri': '/catalogsearch/result/?q=shoes', 'last request cpu': 12.4, 'last request memory': 4194304, user: 'www-data', script: '/var/www/html/index.php' },
    { pid: 4202, state: 'Running', requests: 14820, 'request duration': 84210, 'request method': 'POST', 'request uri': '/checkout/cart/add/uenc/', 'last request cpu': 8.2, 'last request memory': 3145728, user: 'www-data', script: '/var/www/html/index.php' },
    { pid: 4203, state: 'Idle', requests: 21042, 'request duration': 0, 'request method': 'GET', 'request uri': '/', 'last request cpu': 4.1, 'last request memory': 2097152, user: 'www-data', script: '/var/www/html/index.php' },
    { pid: 4204, state: 'Idle', requests: 9841, 'request duration': 0, 'request method': 'GET', 'request uri': '/catalog/category/view/id/12', 'last request cpu': 3.8, 'last request memory': 2097152, user: 'www-data', script: '/var/www/html/index.php' },
    { pid: 4205, state: 'Running', requests: 12483, 'request duration': 64100, 'request method': 'GET', 'request uri': '/customer/account/', 'last request cpu': 6.9, 'last request memory': 3670016, user: 'www-data', script: '/var/www/html/index.php' },
  ],
};

const VARNISH_SAMPLE = {
  status: 'ok',
  file_mtime: new Date(Date.now() - 25000).toISOString(),
  hit_rate_pct: 84.3,
  miss_rate_pct: 15.7,
  cache_hit: 40821340,
  cache_miss: 7603921,
  cache_hitpass: 12840,
  total_requests: 48425261,
  purge: [
    { key: 'VBE.boot.default.bereq_hdrbytes', description: 'Request header bytes', value: 184213042 },
  ],
  counters: [
    { key: 'MAIN.uptime', description: 'Child process uptime', value: 864231 },
    { key: 'MAIN.sess_conn', description: 'Sessions accepted', value: 48425261 },
    { key: 'MAIN.sess_drop', description: 'Sessions dropped', value: 0 },
    { key: 'MAIN.sess_fail', description: 'Session accept failures', value: 0 },
    { key: 'MAIN.client_req', description: 'Good client requests received', value: 48413042 },
    { key: 'MAIN.backend_conn', description: 'Backend conn. success', value: 7603921 },
    { key: 'MAIN.backend_unhealthy', description: 'Backend conn. not attempted', value: 0 },
    { key: 'MAIN.backend_busy', description: 'Backend conn. too many', value: 12 },
    { key: 'MAIN.backend_fail', description: 'Backend conn. failures', value: 4 },
    { key: 'MAIN.backend_reuse', description: 'Backend conn. reuses', value: 7410382 },
    { key: 'MAIN.backend_recycle', description: 'Backend conn. recycles', value: 7590121 },
    { key: 'MAIN.fetch_head', description: 'Fetch no body (HEAD)', value: 48203 },
    { key: 'MAIN.fetch_length', description: 'Fetch with Length', value: 7120482 },
    { key: 'MAIN.pools', description: 'Number of thread pools', value: 2 },
    { key: 'MAIN.threads', description: 'Total number of threads', value: 400 },
    { key: 'MAIN.threads_created', description: 'Threads created', value: 402 },
    { key: 'MAIN.threads_failed', description: 'Thread creation failed', value: 0 },
    { key: 'MAIN.threads_limited', description: 'Threads hit max', value: 0 },
    { key: 'MAIN.n_object', description: 'object structs made', value: 184321 },
    { key: 'MAIN.n_expired', description: 'Number of expired objects', value: 38421 },
    { key: 'MAIN.n_lru_nuked', description: 'Number of LRU nuked objects', value: 0 },
  ],
};

const MAGENTO_SAMPLE = {
  status: 'ok',
  orders: {
    orders_24h: 184,
    orders_7d: 1284,
    orders_30d: 5421,
    orders_pending: 28,
    orders_processing: 142,
    orders_total: 1182470,
  },
  recent_orders: [
    { increment_id: '100048213', status: 'processing', customer_email: 'j.smith@example.com', grand_total: '249.99', base_currency_code: 'USD', created_at: new Date(Date.now() - 120000).toISOString() },
    { increment_id: '100048212', status: 'complete', customer_email: 'a.jones@example.com', grand_total: '89.50', base_currency_code: 'USD', created_at: new Date(Date.now() - 480000).toISOString() },
    { increment_id: '100048211', status: 'pending', customer_email: 'b.martin@example.com', grand_total: '412.00', base_currency_code: 'USD', created_at: new Date(Date.now() - 840000).toISOString() },
    { increment_id: '100048210', status: 'processing', customer_email: 'c.white@example.com', grand_total: '178.25', base_currency_code: 'USD', created_at: new Date(Date.now() - 1200000).toISOString() },
    { increment_id: '100048209', status: 'complete', customer_email: 'd.brown@example.com', grand_total: '65.00', base_currency_code: 'USD', created_at: new Date(Date.now() - 1800000).toISOString() },
    { increment_id: '100048208', status: 'canceled', customer_email: 'e.davis@example.com', grand_total: '320.00', base_currency_code: 'USD', created_at: new Date(Date.now() - 3600000).toISOString() },
  ],
  users_online: { total: 248, online_count: 248, total_visitors: 248, logged_in: 84, guests: 164 },
};

const LINUX_SAMPLE = {
  status: 'ok',
  top_mtime: new Date(Date.now() - 18000).toISOString(),
  linux: {
    time: '12:30:00',
    uptime_seconds: 1209600,
    users: 2,
    cpu: { usage_pct: 34, user: 20.4, system: 8.2, idle: 64.2, iowait: 3.8, steal: 0.0 },
    memory: {
      total_mb: 32768,
      used_mb: 18432,
      free_mb: 2048,
      buff_cache_mb: 11520,
      available_mb: 13312,
      swap_total_mb: 4096,
      swap_used_mb: 128,
      usage_pct: 58,
    },
    load: { load1: 1.42, load5: 1.18, load15: 0.97, running_procs: 3, total_procs: 312 },
    tasks: { total: 312, running: 3, sleeping: 304, stopped: 5, zombie: 0 },
  },
  docker: {
    status: 'ok',
    services: [
      { Service: 'nginx', State: 'running', Status: 'Up 14 days', Health: 'healthy', Ports: '0.0.0.0:80->80/tcp' },
      { Service: 'phpfpm', State: 'running', Status: 'Up 14 days', Health: 'healthy', Ports: '' },
      { Service: 'mariadb', State: 'running', Status: 'Up 14 days (healthy)', Health: 'healthy', Ports: '127.0.0.1:3306->3306/tcp' },
      { Service: 'redis-cache', State: 'running', Status: 'Up 14 days', Health: '', Ports: '127.0.0.1:6380->6379/tcp' },
      { Service: 'redis-session', State: 'running', Status: 'Up 14 days', Health: '', Ports: '127.0.0.1:6379->6379/tcp' },
      { Service: 'opensearch', State: 'running', Status: 'Up 14 days (healthy)', Health: 'healthy', Ports: '127.0.0.1:9200->9200/tcp' },
      { Service: 'rabbitmq', State: 'running', Status: 'Up 14 days (healthy)', Health: 'healthy', Ports: '127.0.0.1:5672->5672/tcp' },
      { Service: 'varnish', State: 'running', Status: 'Up 14 days', Health: '', Ports: '0.0.0.0:8080->8080/tcp' },
    ],
  },
};

const AUDITD_SAMPLE = {
  status: 'ok',
  date: '2026-03-18',
  availableDates: ['2026-03-17', '2026-03-16', '2026-03-15'],
  rows: [
    { date: '2026-03-18', time: '10:42:18', user: 'root', group: 'root', operation: 'opened-file', result: 'success', path: '/etc/nginx/nginx.conf', exec: '/usr/sbin/nginx' },
    { date: '2026-03-18', time: '10:38:05', user: 'magento', group: 'magento', operation: 'opened-file', result: 'success', path: '/var/www/html/app/etc/config.php', exec: '/usr/bin/php' },
    { date: '2026-03-18', time: '10:21:44', user: 'root', group: 'root', operation: 'deleted', result: 'success', path: '/tmp/magento_session_abc123', exec: '/usr/bin/find' },
    { date: '2026-03-18', time: '09:58:22', user: 'magento', group: 'magento', operation: 'opened-file', result: 'success', path: '/var/www/html/vendor/magento/module-catalog/Model/Product.php', exec: '/usr/bin/php' },
    { date: '2026-03-18', time: '09:30:11', user: 'root', group: 'root', operation: 'opened-file', result: 'success', path: '/etc/mysql/my.cnf', exec: '/usr/sbin/mysqld' },
    { date: '2026-03-18', time: '08:45:33', user: 'root', group: 'root', operation: 'deleted', result: 'success', path: '/var/cache/magento/mview.json', exec: '/usr/bin/php' },
  ],
};

const PROFILER_SAMPLE = {
  status: 'ok',
  lastRun: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  rows: [
    { timer: 'magento', time: '198.34 ms', avg: '201.12 ms', count: 4821, emalloc: '18.4 MB', realMem: '24.0 MB' },
    { timer: 'db_query_select', time: '48.21 ms', avg: '49.18 ms', count: 18420, emalloc: '2.1 MB', realMem: '3.2 MB' },
    { timer: 'cache_load', time: '12.84 ms', avg: '13.02 ms', count: 42103, emalloc: '512 KB', realMem: '768 KB' },
    { timer: 'catalog_product_collection_load_before', time: '8.42 ms', avg: '8.64 ms', count: 9841, emalloc: '384 KB', realMem: '512 KB' },
    { timer: 'observer_dispatch_catalog_product_load_after', time: '3.21 ms', avg: '3.38 ms', count: 21042, emalloc: '128 KB', realMem: '192 KB' },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getOrderStatusBadge(status: string) {
  const colorMap: Record<string, string> = {
    pending: 'yellow', processing: 'blue', complete: 'green',
    closed: 'gray', canceled: 'red', holded: 'yellow',
  };
  return <span className={`badge ${colorMap[status] || 'gray'}`}>{status}</span>;
}

function getIndexHealthBadge(health: string) {
  const color = health === 'green' ? 'green' : health === 'yellow' ? 'yellow' : 'red';
  return <span className={`badge ${color}`}>{health}</span>;
}

// ─── Redis cards ──────────────────────────────────────────────────────────────

function DemoRedisCard({ instance }: { instance: typeof REDIS_SAMPLE[0] }) {
  const hasMaxMemory = instance.maxmemory > 0;
  const memPct = hasMaxMemory
    ? Math.round((instance.used_memory / instance.maxmemory) * 100) : 0;
  const hasPeakMemory = !hasMaxMemory && instance.used_memory_peak > 0;
  const peakPct = hasPeakMemory
    ? Math.round((instance.used_memory / instance.used_memory_peak) * 100) : 0;
  const hitRate = (instance.keyspace_hits + instance.keyspace_misses) > 0
    ? Math.round((instance.keyspace_hits / (instance.keyspace_hits + instance.keyspace_misses)) * 100) : 0;

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
          Up {formatUptime(instance.uptime_seconds)}
        </span>
      </div>
      <div className="stats-grid">
        <div className="stat-item"><div className="value">{instance.total_keys.toLocaleString()}</div><div className="label">Keys</div></div>
        <div className="stat-item"><div className="value">{instance.connected_clients}</div><div className="label">Clients</div></div>
        <div className="stat-item"><div className="value">{instance.instantaneous_ops_per_sec.toLocaleString()}</div><div className="label">Ops/sec</div></div>
        <div className="stat-item"><div className="value">{hitRate}%</div><div className="label">Hit Rate</div></div>
      </div>
      {hasMaxMemory && (
        <div className="progress-bar-container">
          <div className="progress-bar-label">
            <span>Memory</span>
            <span>{instance.used_memory_human} / {instance.maxmemory_human} ({memPct < 1 ? '<1' : memPct}%)</span>
          </div>
          <div className="progress-bar">
            <div className={`progress-bar-fill ${getProgressColor(memPct)}`} style={{ width: `${Math.min(memPct, 100)}%` }} />
          </div>
        </div>
      )}
      {!hasMaxMemory && hasPeakMemory && (
        <div className="progress-bar-container">
          <div className="progress-bar-label">
            <span>Memory</span>
            <span>{instance.used_memory_human} / {instance.used_memory_peak_human} peak ({peakPct}%)</span>
          </div>
          <div className="progress-bar">
            <div className={`progress-bar-fill ${getProgressColor(peakPct)}`} style={{ width: `${Math.min(peakPct, 100)}%` }} />
          </div>
        </div>
      )}
      {!hasMaxMemory && !hasPeakMemory && (
        <div className="metric-row">
          <span className="metric-label">Memory Used</span>
          <span className="metric-value highlight">{instance.used_memory_human}</span>
        </div>
      )}
      <div className="metric-row"><span className="metric-label">Peak Memory</span><span className="metric-value">{instance.used_memory_peak_human}</span></div>
      <div className="metric-row"><span className="metric-label">Fragmentation</span><span className="metric-value">{instance.mem_fragmentation_ratio.toFixed(2)}</span></div>
      <div className="metric-row">
        <span className="metric-label">Evicted Keys</span>
        <span className={`metric-value ${instance.evicted_keys > 0 ? 'yellow' : ''}`}>{instance.evicted_keys.toLocaleString()}</span>
      </div>
      <div className="metric-row"><span className="metric-label">Expired Keys</span><span className="metric-value">{instance.expired_keys.toLocaleString()}</span></div>
      {Object.keys(instance.keyspace).length > 0 && (
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

// ─── OpenSearch card ──────────────────────────────────────────────────────────

function DemoOpenSearchCard() {
  const d = OPENSEARCH_SAMPLE;
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🔍</span>
          <div><div>OpenSearch</div><div className="card-subtitle">Port 9200</div></div>
        </div>
        <span className="status-badge green">
          <span className="status-dot pulse" />
          {d.cluster.status.toUpperCase()}
        </span>
      </div>
      <div className="stats-grid">
        <div className="stat-item"><div className="value">{d.cluster.number_of_nodes}</div><div className="label">Nodes</div></div>
        <div className="stat-item"><div className="value">{d.cluster.active_primary_shards}</div><div className="label">Pri Shards</div></div>
        <div className="stat-item"><div className="value">{d.cluster.active_shards}</div><div className="label">Shards</div></div>
        <div className="stat-item"><div className="value">{d.cluster.unassigned_shards}</div><div className="label">Unassigned</div></div>
      </div>
      <div className="metric-row"><span className="metric-label">Cluster</span><span className="metric-value">{d.cluster.cluster_name}</span></div>
      <div className="metric-row"><span className="metric-label">Active Shards</span><span className="metric-value">{d.cluster.active_shards_percent}</span></div>
      <div className="section-heading">JVM Heap per Node</div>
      {d.nodes_heap.map(node => (
        <div key={node.name} className="progress-bar-container">
          <div className="progress-bar-label">
            <span>{node.name}</span>
            <span>{node.heap_used} / {node.heap_max} ({node.heap_used_percent}%) · CPU {node.cpu_percent}%</span>
          </div>
          <div className="progress-bar">
            <div className={`progress-bar-fill ${getProgressColor(node.heap_used_percent)}`} style={{ width: `${node.heap_used_percent}%` }} />
          </div>
        </div>
      ))}
      <div className="section-heading">Indices by Size</div>
      <div className="scrollable-table">
        <table className="data-table">
          <thead>
            <tr><th>Index</th><th>Health</th><th>Status</th><th>UUID</th><th>Pri</th><th>Rep</th><th>Docs</th><th>Docs Del</th><th>Size</th><th>Pri Size</th></tr>
          </thead>
          <tbody>
            {d.indices.map(idx => (
              <tr key={idx.uuid}>
                <td title={idx.index}>{idx.index}</td>
                <td>{getIndexHealthBadge(idx.health)}</td>
                <td>{idx.status}</td>
                <td title={idx.uuid}>{idx.uuid.slice(0, 8)}…</td>
                <td>{idx.pri}</td>
                <td>{idx.rep}</td>
                <td>{parseInt(idx['docs.count'], 10).toLocaleString()}</td>
                <td>{parseInt(idx['docs.deleted'], 10).toLocaleString()}</td>
                <td>{idx['store.size']}</td>
                <td>{idx['pri.store.size']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── RabbitMQ card ────────────────────────────────────────────────────────────

function DemoRabbitMQCard() {
  const d = RABBITMQ_SAMPLE;
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🐇</span>
          <div>
            <div>RabbitMQ</div>
            <div className="card-subtitle">Port 5672 · Mgmt 15672 · v{d.overview.rabbitmq_version}</div>
          </div>
        </div>
        <span className="status-badge connected">
          <span className="status-dot pulse" />
          Online
        </span>
      </div>
      <div className="stats-grid">
        <div className="stat-item"><div className="value">{d.overview.object_totals.queues}</div><div className="label">Queues</div></div>
        <div className="stat-item"><div className="value">{d.overview.queue_totals.messages.toLocaleString()}</div><div className="label">Messages</div></div>
        <div className="stat-item"><div className="value">{d.overview.object_totals.consumers}</div><div className="label">Consumers</div></div>
        <div className="stat-item"><div className="value">{d.overview.object_totals.connections}</div><div className="label">Connections</div></div>
      </div>
      <div className="metric-row"><span className="metric-label">Ready Messages</span><span className="metric-value highlight">{d.overview.queue_totals.messages_ready.toLocaleString()}</span></div>
      <div className="metric-row"><span className="metric-label">Unacknowledged</span><span className={`metric-value ${d.overview.queue_totals.messages_unacknowledged > 0 ? 'yellow' : ''}`}>{d.overview.queue_totals.messages_unacknowledged}</span></div>
      <div className="metric-row"><span className="metric-label">Channels</span><span className="metric-value">{d.overview.object_totals.channels}</span></div>
      <div className="section-heading">Nodes</div>
      {d.nodes.map(node => {
        const memPct = node.mem_limit > 0 ? Math.round((node.mem_used / node.mem_limit) * 100) : 0;
        return (
          <div key={node.name} className="progress-bar-container">
            <div className="progress-bar-label">
              <span>{node.name.split('@').pop()}</span>
              <span>{formatBytes(node.mem_used)} / {formatBytes(node.mem_limit)} ({memPct}%) · {node.running ? <span style={{ color: 'var(--accent-green)' }}>Running</span> : <span style={{ color: 'var(--accent-red)' }}>Stopped</span>}</span>
            </div>
              <div className="progress-bar">
              <div className={`progress-bar-fill ${memPct >= 80 ? 'red' : memPct >= 60 ? 'yellow' : 'purple'}`} style={{ width: `${memPct}%` }} />
            </div>
          </div>
        );
      })}
      <div className="section-heading">Queues by Message Count</div>
      <div className="scrollable-table">
        <table className="data-table">
          <thead>
            <tr><th>Queue</th><th>Ready</th><th>Unacked</th><th>Consumers</th><th>State</th></tr>
          </thead>
          <tbody>
            {d.queues.map(q => (
              <tr key={q.name}>
                <td title={q.name}>{q.name}</td>
                <td>{q.messages_ready.toLocaleString()}</td>
                <td>{q.messages_unacknowledged > 0 ? <span className="badge yellow">{q.messages_unacknowledged}</span> : 0}</td>
                <td>{q.consumers}</td>
                <td><span className="badge green">{q.state}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MariaDB card ─────────────────────────────────────────────────────────────

function DemoMariaDBCard() {
  const d = MARIADB_SAMPLE;
  const connPct = Math.round((d.connections.current / d.connections.max_allowed) * 100);
  const bufHit = Math.round(((d.innodb.buffer_pool_read_requests - d.innodb.buffer_pool_reads) / d.innodb.buffer_pool_read_requests) * 100);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🐬</span>
          <div>
            <div>MariaDB</div>
            <div className="card-subtitle">Port 3306 · {d.version}</div>
          </div>
        </div>
        <span className="status-badge connected">
          <span className="status-dot pulse" />
          Up {formatUptime(d.uptime_seconds)}
        </span>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar-label">
          <span>Connections</span>
          <span>{d.connections.current} / {d.connections.max_allowed} ({connPct}%)</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill blue" style={{ width: `${connPct}%` }} />
        </div>
      </div>
      <div className="metric-row"><span className="metric-label">Active / Max Used</span><span className="metric-value">{d.connections.running} running / {d.connections.max_used} peak</span></div>
      <div className="metric-row"><span className="metric-label">InnoDB Buffer Pool</span><span className="metric-value highlight">{formatBytes(d.memory.innodb_buffer_pool_size)}</span></div>
      <div className="metric-row"><span className="metric-label">Buffer Pool Hit Rate</span><span className={`metric-value ${bufHit < 95 ? 'yellow' : 'green'}`}>{bufHit}%</span></div>
      <div className="section-heading">Query Stats</div>
      <div className="metric-cols">
        <div className="metric-row"><span className="metric-label">Total</span><span className="metric-value">{d.queries.total.toLocaleString()}</span></div>
        <div className="metric-row"><span className="metric-label">Slow</span><span className="metric-value yellow">{d.queries.slow}</span></div>
        <div className="metric-row"><span className="metric-label">SELECT</span><span className="metric-value">{d.queries.select.toLocaleString()}</span></div>
        <div className="metric-row"><span className="metric-label">INSERT</span><span className="metric-value">{d.queries.insert.toLocaleString()}</span></div>
        <div className="metric-row"><span className="metric-label">UPDATE</span><span className="metric-value">{d.queries.update.toLocaleString()}</span></div>
        <div className="metric-row"><span className="metric-label">DELETE</span><span className="metric-value">{d.queries.delete.toLocaleString()}</span></div>
      </div>
      <div className="section-heading">Databases by Size</div>
      <table className="data-table">
        <thead><tr><th>Database</th><th>Size</th><th>Tables</th></tr></thead>
        <tbody>
          {d.databases.map(db => (
            <tr key={db.database}><td>{db.database}</td><td>{db.size_mb} MB</td><td>{db.table_count}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="section-heading">Top 10 Tables by Size</div>
      <table className="data-table">
        <thead><tr><th>Table</th><th>Size</th><th>Rows</th></tr></thead>
        <tbody>
          {d.top_tables.map(t => (
            <tr key={`${t.database}.${t.table_name}`}>
              <td title={`${t.database}.${t.table_name}`}>{t.database}.{t.table_name}</td>
              <td>{t.size_mb} MB</td>
              <td>{t.table_rows.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="section-heading">Active Queries</div>
      <table className="data-table">
        <thead><tr><th>User</th><th>DB</th><th>Time</th><th>Query</th></tr></thead>
        <tbody>
          {d.processlist.map(p => (
            <tr key={p.id}>
              <td>{p.user}</td>
              <td>{p.db}</td>
              <td><span className={p.time > 10 ? 'badge red' : 'badge gray'}>{p.time}s</span></td>
              <td title={p.query_preview}>{p.query_preview}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="section-heading">Top 5 Most Executed Queries</div>
      <table className="data-table">
        <thead><tr><th>Query</th><th>Count</th><th>Avg</th></tr></thead>
        <tbody>
          {d.top_queries.map((q, i) => (
            <tr key={i}>
              <td title={q.query}>{q.query}</td>
              <td>{q.exec_count.toLocaleString()}</td>
              <td>{q.avg_time_sec.toFixed(4)}s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// ─── Nginx card ───────────────────────────────────────────────────────────────

function DemoNginxCard() {
  const d = NGINX_SAMPLE;
  const reqPerConn = d.accepts > 0 ? (d.requests / d.accepts).toFixed(2) : '—';
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🌐</span>
          <div><div>Nginx</div><div className="card-subtitle">Stub Status</div></div>
        </div>
        <span className="status-badge connected"><span className="status-dot pulse" />Online</span>
      </div>
      <div className="stats-grid">
        <div className="stat-item"><div className="value">{d.active_connections.toLocaleString()}</div><div className="label">Active</div></div>
        <div className="stat-item"><div className="value">{d.reading}</div><div className="label">Reading</div></div>
        <div className="stat-item"><div className="value">{d.writing}</div><div className="label">Writing</div></div>
        <div className="stat-item"><div className="value">{d.waiting}</div><div className="label">Waiting</div></div>
      </div>
      <div className="metric-row"><span className="metric-label">Total Requests</span><span className="metric-value highlight">{d.requests.toLocaleString()}</span></div>
      <div className="metric-row"><span className="metric-label">Accepts / Handled</span><span className="metric-value">{d.accepts.toLocaleString()} / {d.handled.toLocaleString()}</span></div>
      <div className="metric-row"><span className="metric-label">Req/Connection</span><span className="metric-value">{reqPerConn}</span></div>
    </div>
  );
}

// ─── Profiler card ────────────────────────────────────────────────────────────

function DemoProfilerCard() {
  const d = PROFILER_SAMPLE;
  const [search, setSearch] = useState('');
  const filtered = d.rows.filter(r =>
    search === '' || r.timer.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">⚡</span>
          <div>
            <div>Profiler</div>
            <div className="card-subtitle">Magento CSV Profiler</div>
          </div>
        </div>
        <span className="status-badge connected">
          <span className="status-dot pulse" />
          Active
        </span>
      </div>
      {d.lastRun && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
          Last run: {new Date(d.lastRun).toLocaleTimeString()}
        </div>
      )}
      <input
        className="filter-input"
        type="text"
        placeholder="🔍 Fuzzy search timers…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="scrollable-table">
        <table className="data-table">
          <thead>
            <tr><th>Timer</th><th>Time</th><th>Avg</th><th>Cnt</th><th>Emalloc</th><th>RealMem</th></tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.timer || i}>
                <td title={row.timer}>{row.timer}</td>
                <td>{row.time}</td>
                <td>{row.avg}</td>
                <td>{row.count}</td>
                <td>{row.emalloc}</td>
                <td>{row.realMem}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && search && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 0' }}>
          No matching timers for &ldquo;{search}&rdquo;
        </div>
      )}
      {filtered.length === 0 && !search && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 0' }}>
          No profiler data available.
        </div>
      )}
    </div>
  );
}

// ─── PHP-FPM card ─────────────────────────────────────────────────────────────

function DemoPhpFpmCard() {
  const d = PHPFPM_SAMPLE;
  const procPct = d.total_processes > 0 ? Math.round((d.active_processes / d.total_processes) * 100) : 0;
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🐘</span>
          <div>
            <div>PHP-FPM</div>
            <div className="card-subtitle">Pool: {d.pool} · {d.process_manager}</div>
          </div>
        </div>
        <span className="status-badge connected"><span className="status-dot pulse" />Online</span>
      </div>
      <div className="stats-grid">
        <div className="stat-item"><div className="value">{d.active_processes}</div><div className="label">Active</div></div>
        <div className="stat-item"><div className="value">{d.idle_processes}</div><div className="label">Idle</div></div>
        <div className="stat-item"><div className="value">{d.total_processes}</div><div className="label">Total</div></div>
        <div className="stat-item"><div className="value">{d.listen_queue}</div><div className="label">Queue</div></div>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar-label">
          <span>Process Utilization</span>
          <span>{d.active_processes}/{d.total_processes} ({procPct}%)</span>
        </div>
        <div className="progress-bar">
          <div className={`progress-bar-fill ${procPct >= 90 ? 'red' : procPct >= 70 ? 'yellow' : 'blue'}`} style={{ width: `${procPct}%` }} />
        </div>
      </div>
      <div className="metric-row"><span className="metric-label">Accepted Connections</span><span className="metric-value highlight">{d.accepted_conn.toLocaleString()}</span></div>
      <div className="metric-row"><span className="metric-label">Max Listen Queue</span><span className={`metric-value ${d.max_listen_queue > 0 ? 'yellow' : ''}`}>{d.max_listen_queue}</span></div>
      <div className="metric-row"><span className="metric-label">Max Active Procs</span><span className="metric-value">{d.max_active_processes}</span></div>
      <div className="metric-row"><span className="metric-label">Max Children Reached</span><span className={`metric-value ${d.max_children_reached > 0 ? 'red' : ''}`}>{d.max_children_reached}</span></div>
      <div className="section-heading">Processes</div>
      <div className="scrollable-table">
        <table className="data-table">
          <thead><tr><th>PID</th><th>State</th><th>Reqs</th><th>Method</th><th>Duration (ms)</th><th>CPU %</th><th>Memory</th><th>User</th><th>Script</th><th>Last URI</th></tr></thead>
          <tbody>
            {d.processes.map(proc => (
              <tr key={proc.pid}>
                <td>{proc.pid}</td>
                <td><span className={`badge ${proc.state === 'Idle' ? 'green' : proc.state === 'Running' ? 'blue' : 'gray'}`}>{proc.state}</span></td>
                <td>{proc.requests}</td>
                <td>{proc['request method'] || '—'}</td>
                <td>{proc['request duration'] > 0 ? (proc['request duration'] / 1000).toFixed(1) : '—'}</td>
                <td>{proc['last request cpu'] > 0 ? `${proc['last request cpu'].toFixed(2)}%` : '—'}</td>
                <td>{proc['last request memory'] > 0 ? formatBytes(proc['last request memory']) : '—'}</td>
                <td>{proc.user || '—'}</td>
                <td title={proc.script}>{proc.script ? proc.script.split('/').pop() : '—'}</td>
                <td title={proc['request uri']}>{proc['request uri'] || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Varnish card ─────────────────────────────────────────────────────────────

function DemoVarnishCard() {
  const d = VARNISH_SAMPLE;
  const [counterSearch, setCounterSearch] = useState('');
  const hitPct = d.hit_rate_pct;
  const missPct = d.miss_rate_pct;
  const hitColor = hitPct >= 80 ? 'green' : hitPct >= 50 ? 'yellow' : 'red';
  const missColor = missPct >= 50 ? 'red' : missPct >= 20 ? 'yellow' : 'green';

  const query = counterSearch.trim().toLowerCase();
  const EXCLUDED = ['cache_hit', 'cache_miss'];
  const filtered = d.counters.filter(
    e => !EXCLUDED.some(p => e.key.toLowerCase().includes(p)) &&
      (query === '' || e.key.toLowerCase().includes(query) || e.description.toLowerCase().includes(query))
  );

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🔄</span>
          <div>
            <div>Varnish</div>
            <div className="card-subtitle">Stats JSON · shared volume · {new Date(d.file_mtime).toLocaleTimeString()}</div>
          </div>
        </div>
        <span className="status-badge connected"><span className="status-dot pulse" />Online</span>
      </div>
      <div className="stats-grid">
        <div className="stat-item"><div className="value" style={{ color: 'var(--accent-green)' }}>{hitPct.toFixed(1)}%</div><div className="label">Hit Rate</div></div>
        <div className="stat-item"><div className="value" style={{ color: missPct >= 50 ? 'var(--accent-red)' : missPct >= 20 ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>{missPct.toFixed(1)}%</div><div className="label">Miss Rate</div></div>
        <div className="stat-item"><div className="value">{d.cache_hit.toLocaleString()}</div><div className="label">Hits</div></div>
        <div className="stat-item"><div className="value">{d.cache_miss.toLocaleString()}</div><div className="label">Misses</div></div>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar-label"><span>Cache Hit</span><span>{d.cache_hit.toLocaleString()} ({hitPct.toFixed(1)}%)</span></div>
        <div className="progress-bar"><div className={`progress-bar-fill ${hitColor}`} style={{ width: `${hitPct}%` }} /></div>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar-label"><span>Cache Miss</span><span>{d.cache_miss.toLocaleString()} ({missPct.toFixed(1)}%)</span></div>
        <div className="progress-bar"><div className={`progress-bar-fill ${missColor}`} style={{ width: `${missPct}%` }} /></div>
      </div>
      {d.cache_hitpass > 0 && (
        <div className="metric-row"><span className="metric-label">Hit-for-Pass</span><span className="metric-value yellow">{d.cache_hitpass.toLocaleString()}</span></div>
      )}
      <div className="metric-row"><span className="metric-label">Total Requests</span><span className="metric-value highlight">{d.total_requests.toLocaleString()}</span></div>
      {filtered.length > 0 && (
        <>
          <div className="section-heading">Counters</div>
          <input type="text" className="filter-input" placeholder="Filter counters…" value={counterSearch} onChange={e => setCounterSearch(e.target.value)} />
          <div className="scrollable-list">
            {filtered.map(entry => (
              <div key={entry.key} className="metric-row">
                <span className="metric-label" title={entry.description}>{entry.key.replace(/^[^.]+\./, '')}</span>
                <span className="metric-value">{entry.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Magento card ─────────────────────────────────────────────────────────────

function DemoMagentoCard() {
  const d = MAGENTO_SAMPLE;
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🛒</span>
          <div><div>Magento</div><div className="card-subtitle">Orders &amp; Visitors</div></div>
        </div>
        <span className="status-badge connected"><span className="status-dot pulse" />Online</span>
      </div>
      <div className="section-heading">Visitors Online (last 15 min)</div>
      <div className="stats-grid">
        <div className="stat-item"><div className="value">{d.users_online.total}</div><div className="label">Total</div></div>
        <div className="stat-item"><div className="value">{d.users_online.logged_in}</div><div className="label">Logged In</div></div>
        <div className="stat-item"><div className="value">{d.users_online.guests}</div><div className="label">Guests</div></div>
      </div>
      <div className="section-heading">Orders</div>
      <div className="stats-grid">
        <div className="stat-item"><div className="value">{d.orders.orders_24h}</div><div className="label">Last 24h</div></div>
        <div className="stat-item"><div className="value">{d.orders.orders_7d.toLocaleString()}</div><div className="label">Last 7d</div></div>
        <div className="stat-item"><div className="value">{d.orders.orders_30d.toLocaleString()}</div><div className="label">Last 30d</div></div>
        <div className="stat-item"><div className="value">{d.orders.orders_total.toLocaleString()}</div><div className="label">Total</div></div>
      </div>
      <div className="metric-row"><span className="metric-label">Pending</span><span className="metric-value yellow">{d.orders.orders_pending}</span></div>
      <div className="metric-row"><span className="metric-label">Processing</span><span className="metric-value highlight">{d.orders.orders_processing}</span></div>
      <div className="section-heading">Recent Orders</div>
      <div className="scrollable-table">
        <table className="data-table">
          <thead><tr><th>Order #</th><th>Status</th><th>Total</th><th>Date</th></tr></thead>
          <tbody>
            {d.recent_orders.map(order => (
              <tr key={order.increment_id}>
                <td>{order.increment_id}</td>
                <td>{getOrderStatusBadge(order.status)}</td>
                <td>{Number(order.grand_total).toFixed(2)} {order.base_currency_code}</td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Auditd card ──────────────────────────────────────────────────────────────

function DemoAuditdCard() {
  const d = AUDITD_SAMPLE;
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const filtered = d.rows.filter(row =>
    search === '' || [row.time, row.user, row.group, row.operation, row.path, row.exec].some(
      s => s.toLowerCase().includes(search.toLowerCase())
    )
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
        <span className="status-badge connected">
          <span className="status-dot pulse" />
          {d.rows.length.toLocaleString()} events
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <select
          className="filter-input"
          style={{ marginBottom: 0, flex: 1 }}
          value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); setSearch(''); }}
        >
          <option value="">Today</option>
          {d.availableDates.map((date) => (
            <option key={date} value={date}>{date}</option>
          ))}
        </select>
      </div>
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
                  <span className={`badge ${row.operation === 'deleted' ? 'red' : row.operation === 'opened-file' ? 'blue' : 'gray'}`}>
                    {row.operation}
                  </span>
                </td>
                <td title={row.path} style={{ maxWidth: 260 }}>{row.path}</td>
                <td title={row.exec} style={{ maxWidth: 160 }}>{row.exec}</td>
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
    </div>
  );
}

// ─── Demo Dashboard ───────────────────────────────────────────────────────────

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

function DemoLinuxCard() {
  const d = LINUX_SAMPLE;
  const { linux, docker } = d;
  const MiB = 1024 * 1024;
  const swapPct =
    linux.memory.swap_total_mb > 0
      ? Math.round((linux.memory.swap_used_mb / linux.memory.swap_total_mb) * 100)
      : 0;
  const cpuColor =
    linux.cpu.usage_pct >= 90 ? 'var(--accent-red)' : linux.cpu.usage_pct >= 70 ? 'var(--accent-yellow)' : 'var(--accent-green)';
  const memColor =
    linux.memory.usage_pct >= 90 ? 'var(--accent-red)' : linux.memory.usage_pct >= 70 ? 'var(--accent-yellow)' : 'var(--accent-green)';
  const getProgressColor = (pct: number) => pct >= 90 ? 'red' : pct >= 70 ? 'yellow' : 'green';

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">🐧</span>
          <div>
            <div>Linux</div>
            <div className="card-subtitle">
              top.json · shared volume
              {d.top_mtime && ` · ${new Date(d.top_mtime).toLocaleTimeString()}`}
            </div>
          </div>
        </div>
        <span className="status-badge connected"><span className="status-dot pulse" />Online</span>
      </div>

      <div className="section-heading">CPU &amp; Memory</div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-item"><div className="value" style={{ color: cpuColor }}>{linux.cpu.usage_pct}%</div><div className="label">CPU</div></div>
        <div className="stat-item"><div className="value" style={{ color: memColor }}>{linux.memory.usage_pct}%</div><div className="label">Mem</div></div>
        <div className="stat-item"><div className="value">{linux.load.load1.toFixed(2)}</div><div className="label">Load 1m</div></div>
        <div className="stat-item"><div className="value">{formatUptime(linux.uptime_seconds)}</div><div className="label">Uptime</div></div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-label">
          <span>CPU Usage</span>
          <span>usr {linux.cpu.user.toFixed(1)}% · sys {linux.cpu.system.toFixed(1)}% · iow {linux.cpu.iowait.toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div className={`progress-bar-fill ${getProgressColor(linux.cpu.usage_pct)}`} style={{ width: `${linux.cpu.usage_pct}%` }} />
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-label">
          <span>Memory</span>
          <span>{formatBytes(linux.memory.used_mb * MiB)} / {formatBytes(linux.memory.total_mb * MiB)} ({linux.memory.usage_pct}%)</span>
        </div>
        <div className="progress-bar">
          <div className={`progress-bar-fill ${getProgressColor(linux.memory.usage_pct)}`} style={{ width: `${linux.memory.usage_pct}%` }} />
        </div>
      </div>

      {linux.memory.swap_total_mb > 0 && (
        <div className="progress-bar-container">
          <div className="progress-bar-label">
            <span>Swap</span>
            <span>{formatBytes(linux.memory.swap_used_mb * MiB)} / {formatBytes(linux.memory.swap_total_mb * MiB)}</span>
          </div>
          <div className="progress-bar">
            <div className={`progress-bar-fill ${getProgressColor(swapPct)}`} style={{ width: `${swapPct}%` }} />
          </div>
        </div>
      )}

      <div className="metric-row">
        <span className="metric-label">Load avg (1m / 5m / 15m)</span>
        <span className="metric-value highlight">{linux.load.load1.toFixed(2)} / {linux.load.load5.toFixed(2)} / {linux.load.load15.toFixed(2)}</span>
      </div>
      <div className="metric-row">
        <span className="metric-label">Tasks</span>
        <span className="metric-value">
          {linux.tasks.running} running / {linux.tasks.total} total
          {linux.tasks.zombie > 0 && (
            <span style={{ color: 'var(--accent-red)' }}> · {linux.tasks.zombie} zombie</span>
          )}
        </span>
      </div>
      <div className="metric-row">
        <span className="metric-label">Buff / Cache</span>
        <span className="metric-value">{formatBytes(linux.memory.buff_cache_mb * MiB)}</span>
      </div>

      <hr className="section-divider" />
      <div className="section-heading">Docker Compose</div>
      <div className="scrollable-table">
        <table className="data-table">
          <thead><tr><th>Service</th><th>State</th><th>Status</th><th>Ports</th></tr></thead>
          <tbody>
            {docker.services.map((svc, idx) => (
              <tr key={svc.Service || idx}>
                <td>{svc.Service || '—'}</td>
                <td>{serviceStateBadge(svc.State, svc.Health)}</td>
                <td>{svc.Status || '—'}</td>
                <td title={svc.Ports}>{svc.Ports || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DemoDashboard() {
  const now = new Date();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <span className="title-icon">⚡</span>
          <span className="title-text">Webstack Dashboard</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '3px',
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.4)',
              color: 'var(--accent-yellow)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginLeft: '4px',
              WebkitTextFillColor: 'var(--accent-yellow)',
            }}
          >
            Demo
          </span>
        </div>
        <div className="dashboard-meta">
          <span className="meta-time">Updated: {formatTime(now)}</span>
          <span className="meta-countdown">↻ Sample Data</span>
        </div>
      </div>

      {/* Row 1: Redis Cache + Redis Sessions */}
      <div className="grid grid-2" style={{ marginBottom: '18px' }}>
        {REDIS_SAMPLE.map(instance => (
          <DemoRedisCard key={instance.name} instance={instance} />
        ))}
      </div>

      {/* Row 2: OpenSearch + RabbitMQ */}
      <div className="grid grid-2" style={{ marginBottom: '18px' }}>
        <DemoOpenSearchCard />
        <DemoRabbitMQCard />
      </div>

      {/* Row 3: MariaDB + Varnish */}
      <div className="grid grid-2" style={{ marginBottom: '18px' }}>
        <DemoMariaDBCard />
        <DemoVarnishCard />
      </div>

      {/* Row 4: Nginx + PHP-FPM */}
      <div className="grid grid-2" style={{ marginBottom: '18px' }}>
        <DemoNginxCard />
        <DemoPhpFpmCard />
      </div>

      {/* Row 5: Magento + Linux/Docker */}
      <div className="grid grid-2" style={{ marginBottom: '18px' }}>
        <DemoMagentoCard />
        <DemoLinuxCard />
      </div>

      {/* Row 6: Profiler + Audit Log */}
      <div className="grid grid-2" style={{ marginBottom: '18px' }}>
        <DemoProfilerCard />
        <DemoAuditdCard />
      </div>
    </div>
  );
}
