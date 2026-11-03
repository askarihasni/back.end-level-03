-- ===========================================================================
-- 004_analytics.sql
-- Advanced SQL analytics: CTEs, window functions and reusable views.
--
-- REVENUE RULE (used consistently across the application)
-- -------------------------------------------------------
-- Realized sales revenue = orders with status 'paid' or 'shipped'.
--   * 'pending' orders have not been paid and are excluded.
--   * 'cancelled' orders are excluded.
-- Revenue is calculated from order_items.quantity *
-- order_items.unit_price_at_purchase (the historical purchase price), never
-- from products.current_price, so later price changes cannot rewrite history.
-- The business date is orders.order_date.
--
-- Revenue is first aggregated to one row per order (or per month) before any
-- joins/window functions are applied, preventing duplicated order-item rows.
-- All money uses NUMERIC arithmetic and is rounded only for display.
-- ===========================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- A. TOP 5 SPENDERS
-- Customers ranked by realized spend (paid + shipped orders only).
-- Tie-breaker: customer_id ascending, so results are deterministic.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_top_spenders AS
WITH realized_orders AS (
  SELECT
    o.id AS order_id,
    o.user_id,
    SUM(oi.quantity::NUMERIC * oi.unit_price_at_purchase)::NUMERIC(14, 2) AS order_total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY o.id, o.user_id
),
customer_totals AS (
  SELECT
    u.id AS customer_id,
    u.name AS customer_name,
    u.email AS customer_email,
    COALESCE(SUM(r.order_total), 0)::NUMERIC(14, 2) AS total_spent,
    COUNT(r.order_id)::INTEGER AS qualifying_orders
  FROM users u
  LEFT JOIN realized_orders r ON r.user_id = u.id
  WHERE u.role = 'customer'
  GROUP BY u.id, u.name, u.email
)
SELECT
  customer_id,
  customer_name,
  customer_email,
  total_spent,
  qualifying_orders
FROM customer_totals
ORDER BY total_spent DESC, customer_id ASC
LIMIT 5;

-- ---------------------------------------------------------------------------
-- B. MONTH-BY-MONTH REVENUE, PREVIOUS MONTH, GROWTH AND RUNNING TOTAL
-- generate_series fills calendar months that have no qualifying orders with
-- zero. Cumulative revenue is calculated from the monthly aggregate CTE, not
-- from individual order-item rows. First month growth is NULL instead of a
-- division-by-zero error.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_monthly_revenue AS
WITH bounds AS (
  SELECT
    date_trunc('month', COALESCE(MIN(order_date), CURRENT_DATE))::DATE AS start_month,
    date_trunc(
      'month',
      GREATEST(COALESCE(MAX(order_date), CURRENT_DATE), CURRENT_DATE)
    )::DATE AS end_month
  FROM orders
),
month_series AS (
  SELECT generate_series(start_month, end_month, INTERVAL '1 month')::DATE AS revenue_month
  FROM bounds
),
monthly_aggregate AS (
  SELECT
    date_trunc('month', o.order_date)::DATE AS revenue_month,
    SUM(oi.quantity::NUMERIC * oi.unit_price_at_purchase)::NUMERIC(14, 2) AS monthly_revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY date_trunc('month', o.order_date)::DATE
),
joined AS (
  SELECT
    ms.revenue_month,
    COALESCE(ma.monthly_revenue, 0)::NUMERIC(14, 2) AS monthly_revenue
  FROM month_series ms
  LEFT JOIN monthly_aggregate ma ON ma.revenue_month = ms.revenue_month
),
with_previous AS (
  SELECT
    revenue_month,
    monthly_revenue,
    LAG(monthly_revenue) OVER (ORDER BY revenue_month) AS previous_month_revenue
  FROM joined
)
SELECT
  revenue_month,
  monthly_revenue,
  previous_month_revenue,
  CASE
    WHEN previous_month_revenue IS NULL OR previous_month_revenue = 0 THEN NULL
    ELSE ROUND(
      ((monthly_revenue - previous_month_revenue) / previous_month_revenue) * 100,
      2
    )
  END AS month_over_month_growth_pct,
  SUM(monthly_revenue) OVER (
    ORDER BY revenue_month
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  )::NUMERIC(14, 2) AS cumulative_revenue
FROM with_previous
ORDER BY revenue_month;

-- ---------------------------------------------------------------------------
-- D. ADMIN DASHBOARD METRICS
-- One row, all values derived from the database. Revenue/average use paid +
-- shipped orders only. Active products = is_active TRUE. Low stock count comes
-- from vw_low_stock (stock_quantity < 5).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_dashboard_metrics AS
SELECT
  (SELECT COUNT(*)::INTEGER FROM products WHERE is_active = TRUE) AS active_products,
  (SELECT COUNT(*)::INTEGER FROM users WHERE role = 'customer') AS total_customers,
  (SELECT COUNT(*)::INTEGER FROM orders) AS total_orders,
  (SELECT COUNT(*)::INTEGER FROM orders WHERE status = 'pending') AS pending_orders,
  (SELECT COUNT(*)::INTEGER FROM orders WHERE status = 'shipped') AS shipped_orders,
  (SELECT COUNT(*)::INTEGER FROM orders WHERE status = 'paid') AS paid_orders,
  (
    SELECT COALESCE(SUM(q.order_total), 0)::NUMERIC(14, 2)
    FROM (
      SELECT
        o.id,
        SUM(oi.quantity::NUMERIC * oi.unit_price_at_purchase) AS order_total
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status IN ('paid', 'shipped')
      GROUP BY o.id
    ) q
  ) AS realized_revenue,
  (
    SELECT COALESCE(AVG(q.order_total), 0)::NUMERIC(14, 2)
    FROM (
      SELECT
        o.id,
        SUM(oi.quantity::NUMERIC * oi.unit_price_at_purchase) AS order_total
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status IN ('paid', 'shipped')
      GROUP BY o.id
    ) q
  ) AS average_qualifying_order_value,
  (SELECT COUNT(*)::INTEGER FROM vw_low_stock) AS low_stock_products;

-- Recent orders for the dashboard, with item count aggregated safely.
CREATE OR REPLACE VIEW vw_recent_orders AS
SELECT
  o.id,
  o.user_id,
  u.name AS customer_name,
  u.email AS customer_email,
  o.order_date,
  o.status,
  o.total_amount,
  COALESCE(SUM(oi.quantity), 0)::INTEGER AS item_count
FROM orders o
JOIN users u ON u.id = o.user_id
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.user_id, u.name, u.email, o.order_date, o.status, o.total_amount
ORDER BY o.order_date DESC, o.id DESC
LIMIT 10;

COMMIT;
