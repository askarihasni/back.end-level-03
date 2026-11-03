import { query } from '../config/db.js';

function mapRecentOrder(row) {
  return {
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    orderDate: row.order_date,
    status: row.status,
    totalAmount: Number(row.total_amount),
    itemCount: row.item_count,
  };
}

function mapTopSpender(row) {
  return {
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    totalSpent: Number(row.total_spent),
    qualifyingOrders: row.qualifying_orders,
  };
}

function mapRevenueRow(row) {
  return {
    revenueMonth: row.revenue_month,
    monthlyRevenue: Number(row.monthly_revenue),
    previousMonthRevenue:
      row.previous_month_revenue === null ? null : Number(row.previous_month_revenue),
    monthOverMonthGrowthPct:
      row.month_over_month_growth_pct === null ? null : Number(row.month_over_month_growth_pct),
    cumulativeRevenue: Number(row.cumulative_revenue),
  };
}

function mapLowStock(row) {
  return {
    productId: row.product_id,
    productName: row.product_name,
    category: row.category,
    stockQuantity: row.stock_quantity,
    currentPrice: Number(row.current_price),
    isActive: row.is_active,
    imageUrl: row.image_url,
    stockStatus: row.stock_status,
  };
}

export async function getDashboard() {
  const [metricsResult, recentResult, lowStockResult] = await Promise.all([
    query('SELECT * FROM vw_dashboard_metrics'),
    query('SELECT * FROM vw_recent_orders ORDER BY order_date DESC, id DESC'),
    query('SELECT * FROM vw_low_stock ORDER BY stock_quantity ASC, product_name ASC LIMIT 5'),
  ]);

  const metrics = metricsResult.rows[0];
  return {
    metrics: {
      realizedRevenue: Number(metrics.realized_revenue),
      totalOrders: metrics.total_orders,
      pendingOrders: metrics.pending_orders,
      shippedOrders: metrics.shipped_orders,
      paidOrders: metrics.paid_orders,
      activeProducts: metrics.active_products,
      totalCustomers: metrics.total_customers,
      averageQualifyingOrderValue: Number(metrics.average_qualifying_order_value),
      lowStockProducts: metrics.low_stock_products,
    },
    revenueRule: 'Realized revenue includes paid and shipped orders only; pending and cancelled orders are excluded.',
    recentOrders: recentResult.rows.map(mapRecentOrder),
    lowStock: lowStockResult.rows.map(mapLowStock),
  };
}

export async function getTopSpenders() {
  const { rows } = await query(
    `SELECT * FROM vw_top_spenders ORDER BY total_spent DESC, customer_id ASC`
  );
  return rows.map(mapTopSpender);
}

export async function getMonthlyRevenue() {
  const { rows } = await query(
    `SELECT * FROM vw_monthly_revenue ORDER BY revenue_month ASC`
  );
  return rows.map(mapRevenueRow);
}

export async function getLowStock() {
  const { rows } = await query(
    `SELECT * FROM vw_low_stock ORDER BY stock_quantity ASC, product_name ASC`
  );
  return rows.map(mapLowStock);
}
