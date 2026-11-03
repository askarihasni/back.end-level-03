import { withTransaction } from '../config/db.js';
import { ApiError } from '../utils/errors.js';
import { getAdminOrderDetail } from './orderService.js';

/**
 * Allowed status transitions. Terminal states cannot be changed.
 * Payment is NOT integrated: "paid" is a manual admin action in this demo.
 */
export const ALLOWED_TRANSITIONS = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: [],
  cancelled: [],
};

export function allowedNextStatuses(currentStatus) {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

/**
 * Updates status inside a transaction with a row lock, so two admins cannot
 * race a cancellation and restore inventory twice.
 *
 * Inventory policy:
 *   - stock is deducted at checkout;
 *   - cancelling a pending or paid order restores inventory exactly once;
 *   - no real payment provider exists, so a paid -> cancelled transition only
 *     flags a manual refund as required. It never claims a refund was processed.
 */
export async function updateOrderStatus(orderId, newStatus) {
  const transition = await withTransaction(async (client) => {
    const orderResult = await client.query(
      `SELECT id, status FROM orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    );
    const order = orderResult.rows[0];
    if (!order) throw new ApiError(404, 'Order not found.');

    if (order.status === newStatus) {
      throw new ApiError(409, `Order is already marked as ${newStatus}.`);
    }

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new ApiError(
        409,
        `Invalid status transition: ${order.status} -> ${newStatus}. Allowed from ${order.status}: ${
          allowed.length ? allowed.join(', ') : 'none (terminal state)'
        }.`
      );
    }

    let inventoryRestored = false;
    if (newStatus === 'cancelled') {
      const restoreResult = await client.query(
        `WITH quantities AS (
           SELECT product_id, SUM(quantity)::INTEGER AS quantity
           FROM order_items
           WHERE order_id = $1
           GROUP BY product_id
         )
         UPDATE products p
         SET stock_quantity = p.stock_quantity + q.quantity
         FROM quantities q
         WHERE p.id = q.product_id
         RETURNING p.id`,
        [orderId]
      );
      inventoryRestored = restoreResult.rowCount > 0;
    }

    await client.query(
      `UPDATE orders SET status = $1 WHERE id = $2`,
      [newStatus, orderId]
    );

    return {
      from: order.status,
      to: newStatus,
      inventoryRestored,
      refundRequired: order.status === 'paid' && newStatus === 'cancelled',
      refundProcessed: false,
      note:
        order.status === 'paid' && newStatus === 'cancelled'
          ? 'Inventory was restored. No payment provider is integrated, so a refund must be handled manually; no refund has been processed by this system.'
          : newStatus === 'cancelled'
            ? 'Inventory was restored. No payment had been captured for this pending order.'
            : 'Status updated manually. This demo does not process real payments.',
    };
  });

  const order = await getAdminOrderDetail(orderId);
  return { order, transition };
}
