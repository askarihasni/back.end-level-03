import { query } from '../config/db.js';
import { notFoundError } from '../utils/errors.js';
import { paginationMeta } from '../utils/pagination.js';

function mapOrderSummary(row) {
  return {
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    orderDate: row.order_date,
    totalAmount: Number(row.total_amount),
    status: row.status,
    shippingAddress: row.shipping_address,
    itemCount: row.item_count,
    lineCount: row.line_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrderItem(row) {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productImageUrl: row.product_image_url,
    category: row.category,
    quantity: row.quantity,
    unitPriceAtPurchase: Number(row.unit_price_at_purchase),
    lineTotal: Number(row.line_total),
    currentProductPrice: Number(row.current_product_price),
  };
}

async function fetchOrderItems(orderId) {
  const { rows } = await query(
    `SELECT
       oi.id,
       oi.product_id,
       p.name AS product_name,
       p.image_url AS product_image_url,
       p.category,
       oi.quantity,
       oi.unit_price_at_purchase,
       (oi.quantity::NUMERIC * oi.unit_price_at_purchase)::NUMERIC(12, 2) AS line_total,
       p.current_price AS current_product_price
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1
     ORDER BY oi.id ASC`,
    [orderId]
  );
  return rows.map(mapOrderItem);
}

export async function listMyOrders(userId, { page, limit, status }) {
  const conditions = ['o.user_id = $1'];
  const params = [userId];
  if (status) {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }
  const whereSql = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await query(
    `SELECT COUNT(*)::INTEGER AS total FROM orders o ${whereSql}`,
    params
  );

  const dataParams = [...params, limit, (page - 1) * limit];
  const { rows } = await query(
    `SELECT
       o.id, o.user_id, o.order_date, o.total_amount, o.status,
       o.shipping_address,
       o.created_at, o.updated_at,
       u.name AS customer_name,
       u.email AS customer_email,
       COALESCE(SUM(oi.quantity), 0)::INTEGER AS item_count,
       COUNT(oi.id)::INTEGER AS line_count
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     ${whereSql}
     GROUP BY o.id, u.name, u.email, o.shipping_address
     ORDER BY o.order_date DESC, o.id DESC
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  const total = countResult.rows[0].total;
  return {
    orders: rows.map(mapOrderSummary),
    pagination: paginationMeta({ page, limit, total }),
  };
}

export async function getOrderForUser(userId, orderId) {
  const { rows } = await query(
    `SELECT
       o.id, o.user_id, o.order_date, o.total_amount, o.status,
       o.shipping_address,
       o.created_at, o.updated_at,
       u.name AS customer_name, u.email AS customer_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.id = $1 AND o.user_id = $2`,
    [orderId, userId]
  );

  // 404 (not 403) prevents leaking whether another customer's order exists.
  if (!rows[0]) throw notFoundError('Order not found.');

  const items = await fetchOrderItems(orderId);
  return {
    ...mapOrderSummary({
      ...rows[0],
      item_count: items.reduce((sum, item) => sum + item.quantity, 0),
      line_count: items.length,
    }),
    items,
  };
}

export async function listAdminOrders({ page, limit, status, q }) {
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    conditions.push(
      `(CAST(o.id AS TEXT) ILIKE $${params.length} OR u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`
    );
  }
  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::INTEGER AS total
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ${whereSql}`,
    params
  );

  const dataParams = [...params, limit, (page - 1) * limit];
  const { rows } = await query(
    `SELECT
       o.id, o.user_id, o.order_date, o.total_amount, o.status,
       o.shipping_address,
       o.created_at, o.updated_at,
       u.name AS customer_name, u.email AS customer_email,
       COALESCE(SUM(oi.quantity), 0)::INTEGER AS item_count,
       COUNT(oi.id)::INTEGER AS line_count
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     ${whereSql}
     GROUP BY o.id, u.name, u.email, o.shipping_address
     ORDER BY o.order_date DESC, o.id DESC
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  const total = countResult.rows[0].total;
  return {
    orders: rows.map(mapOrderSummary),
    pagination: paginationMeta({ page, limit, total }),
  };
}

export async function getAdminOrderDetail(orderId) {
  const { rows } = await query(
    `SELECT
       o.id, o.user_id, o.order_date, o.total_amount, o.status,
       o.shipping_address,
       o.created_at, o.updated_at,
       u.name AS customer_name, u.email AS customer_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.id = $1`,
    [orderId]
  );
  if (!rows[0]) throw notFoundError('Order not found.');

  const items = await fetchOrderItems(orderId);
  return {
    ...mapOrderSummary({
      ...rows[0],
      item_count: items.reduce((sum, item) => sum + item.quantity, 0),
      line_count: items.length,
    }),
    items,
  };
}
