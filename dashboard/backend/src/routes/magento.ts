import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';

const router = Router();

async function getMagentoConnection() {
  return mysql.createConnection({
    host: process.env.MARIADB_HOST || 'mariadb',
    port: parseInt(process.env.MARIADB_PORT || '3306', 10),
    user: process.env.MARIADB_USER || 'root',
    password: process.env.MARIADB_PASSWORD || '',
    database: process.env.MARIADB_DATABASE || 'magento',
    connectTimeout: 5000,
  });
}

router.get('/', async (_req: Request, res: Response) => {
  let conn: mysql.Connection | null = null;
  try {
    conn = await getMagentoConnection();

    // Orders in last 24h, 7 days, 30 days
    const [orderStats] = await conn.execute<mysql.RowDataPacket[]>(`
      SELECT
        SUM(CASE WHEN created_at >= NOW() - INTERVAL 24 HOUR THEN 1 ELSE 0 END) AS orders_24h,
        SUM(CASE WHEN created_at >= NOW() - INTERVAL 7 DAY THEN 1 ELSE 0 END) AS orders_7d,
        SUM(CASE WHEN created_at >= NOW() - INTERVAL 30 DAY THEN 1 ELSE 0 END) AS orders_30d,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS orders_pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS orders_processing,
        COUNT(*) AS orders_total
      FROM sales_order
      WHERE created_at >= NOW() - INTERVAL 30 DAY
    `).catch(() => [[{ orders_24h: null, orders_7d: null, orders_30d: null, orders_pending: null, orders_processing: null, orders_total: null }]]);

    // Recent orders
    const [recentOrders] = await conn.execute<mysql.RowDataPacket[]>(`
      SELECT
        increment_id,
        status,
        customer_email,
        grand_total,
        base_currency_code,
        created_at
      FROM sales_order
      ORDER BY created_at DESC
      LIMIT 10
    `).catch(() => [[]]);

    // Users online (active sessions in the last 15 minutes)
    const [usersOnline] = await conn.execute<mysql.RowDataPacket[]>(`
      SELECT COUNT(*) AS online_count
      FROM customer_visitor
      WHERE last_visit_at >= NOW() - INTERVAL 15 MINUTE
    `).catch(() => [[{ online_count: 0 }]]);

    // Guest visitors (session table may vary by Magento version)
    const [guestVisitors] = await conn.execute<mysql.RowDataPacket[]>(`
      SELECT
        COUNT(*) AS total_visitors,
        SUM(CASE WHEN customer_id IS NOT NULL AND customer_id > 0 THEN 1 ELSE 0 END) AS logged_in,
        SUM(CASE WHEN customer_id IS NULL OR customer_id = 0 THEN 1 ELSE 0 END) AS guests
      FROM customer_visitor
      WHERE last_visit_at >= NOW() - INTERVAL 15 MINUTE
    `).catch(() => [[{ total_visitors: 0, logged_in: 0, guests: 0 }]]);

    res.json({
      status: 'connected',
      orders: orderStats[0] || {},
      recent_orders: recentOrders,
      users_online: {
        total: (usersOnline[0] as mysql.RowDataPacket)?.online_count || 0,
        ...(guestVisitors[0] as mysql.RowDataPacket || {}),
      },
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
