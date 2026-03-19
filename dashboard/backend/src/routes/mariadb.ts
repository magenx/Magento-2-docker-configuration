import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';

const router = Router();

async function getConnection() {
  return mysql.createConnection({
    host: process.env.MARIADB_HOST || 'mariadb',
    port: parseInt(process.env.MARIADB_PORT || '3306', 10),
    user: process.env.MARIADB_USER || 'root',
    password: process.env.MARIADB_PASSWORD || '',
    database: process.env.MARIADB_DATABASE || 'information_schema',
    connectTimeout: 5000,
  });
}

router.get('/', async (_req: Request, res: Response) => {
  let conn: mysql.Connection | null = null;
  try {
    conn = await getConnection();

    const [dbSizes] = await conn.execute<mysql.RowDataPacket[]>(`
      SELECT
        table_schema AS \`database\`,
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb,
        COUNT(*) AS table_count
      FROM information_schema.tables
      WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
      GROUP BY table_schema
      ORDER BY size_mb DESC
      LIMIT 20
    `);

    const [topTables] = await conn.execute<mysql.RowDataPacket[]>(`
      SELECT
        table_schema AS \`database\`,
        table_name,
        ROUND((data_length + index_length) / 1024 / 1024, 2) AS size_mb,
        table_rows,
        ROUND(data_length / 1024 / 1024, 2) AS data_mb,
        ROUND(index_length / 1024 / 1024, 2) AS index_mb
      FROM information_schema.tables
      WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
      ORDER BY (data_length + index_length) DESC
      LIMIT 10
    `);

    const [globalStatus] = await conn.execute<mysql.RowDataPacket[]>(`
      SHOW GLOBAL STATUS WHERE Variable_name IN (
        'Threads_connected', 'Threads_running', 'Max_used_connections',
        'Uptime', 'Questions', 'Slow_queries', 'Aborted_connects',
        'Bytes_sent', 'Bytes_received', 'Com_select', 'Com_insert',
        'Com_update', 'Com_delete', 'Innodb_buffer_pool_read_requests',
        'Innodb_buffer_pool_reads', 'Innodb_row_lock_waits',
        'Key_read_requests', 'Key_reads'
      )
    `);

    const [globalVars] = await conn.execute<mysql.RowDataPacket[]>(`
      SHOW GLOBAL VARIABLES WHERE Variable_name IN (
        'max_connections', 'innodb_buffer_pool_size', 'key_buffer_size',
        'query_cache_size', 'table_open_cache', 'version', 'version_comment'
      )
    `);

    const [processlist] = await conn.execute<mysql.RowDataPacket[]>(`
      SELECT
        id, user, host, db, command, time, state,
        SUBSTRING(info, 1, 100) AS query_preview
      FROM information_schema.processlist
      WHERE command != 'Sleep'
      ORDER BY time DESC
      LIMIT 10
    `);

    const [topQueries] = await conn.execute<mysql.RowDataPacket[]>(`
      SELECT
        SUBSTRING(DIGEST_TEXT, 1, 120) AS query,
        COUNT_STAR AS exec_count,
        ROUND(SUM_TIMER_WAIT / 1e12, 3) AS total_time_sec,
        ROUND(AVG_TIMER_WAIT / 1e12, 6) AS avg_time_sec,
        SUM_ROWS_EXAMINED AS rows_examined,
        SUM_ROWS_SENT AS rows_sent
      FROM performance_schema.events_statements_summary_by_digest
      WHERE DIGEST_TEXT IS NOT NULL
        AND SCHEMA_NAME NOT IN ('performance_schema', 'information_schema', 'mysql', 'sys')
      ORDER BY COUNT_STAR DESC
      LIMIT 5
    `).catch(() => [[]]);

    // Build maps from status/vars arrays
    const statusMap: Record<string, string> = {};
    (globalStatus as mysql.RowDataPacket[]).forEach((row) => {
      statusMap[row['Variable_name']] = row['Value'];
    });

    const varsMap: Record<string, string> = {};
    (globalVars as mysql.RowDataPacket[]).forEach((row) => {
      varsMap[row['Variable_name']] = row['Value'];
    });

    res.json({
      status: 'connected',
      version: varsMap['version'],
      version_comment: varsMap['version_comment'],
      uptime_seconds: parseInt(statusMap['Uptime'] || '0', 10),
      connections: {
        current: parseInt(statusMap['Threads_connected'] || '0', 10),
        running: parseInt(statusMap['Threads_running'] || '0', 10),
        max_used: parseInt(statusMap['Max_used_connections'] || '0', 10),
        max_allowed: parseInt(varsMap['max_connections'] || '0', 10),
        aborted: parseInt(statusMap['Aborted_connects'] || '0', 10),
      },
      memory: {
        innodb_buffer_pool_size: parseInt(varsMap['innodb_buffer_pool_size'] || '0', 10),
        key_buffer_size: parseInt(varsMap['key_buffer_size'] || '0', 10),
      },
      queries: {
        total: parseInt(statusMap['Questions'] || '0', 10),
        slow: parseInt(statusMap['Slow_queries'] || '0', 10),
        select: parseInt(statusMap['Com_select'] || '0', 10),
        insert: parseInt(statusMap['Com_insert'] || '0', 10),
        update: parseInt(statusMap['Com_update'] || '0', 10),
        delete: parseInt(statusMap['Com_delete'] || '0', 10),
      },
      innodb: {
        buffer_pool_read_requests: parseInt(statusMap['Innodb_buffer_pool_read_requests'] || '0', 10),
        buffer_pool_reads: parseInt(statusMap['Innodb_buffer_pool_reads'] || '0', 10),
        row_lock_waits: parseInt(statusMap['Innodb_row_lock_waits'] || '0', 10),
      },
      databases: dbSizes,
      top_tables: topTables,
      processlist,
      top_queries: Array.isArray(topQueries) ? topQueries : [],
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Connection failed',
    });
  } finally {
    if (conn) await conn.end();
  }
});

export default router;
