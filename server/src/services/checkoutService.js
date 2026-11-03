import { pool } from '../config/db.js';
import { ApiError } from '../utils/errors.js';

function moneyToCents(value) {
  return Math.round(Number(value) * 100);
}

/**
 * ACID checkout using ONE checked-out PostgreSQL connection.
 *
 * The entire operation is one transaction:
 *   1. lock all requested product rows in ascending id order (consistent lock
 *      order avoids deadlocks between concurrent checkouts);
 *   2. re-read price and stock from the database;
 *   3. create the order;
 *   4. insert items using the database price, never a client price;
 *   5. conditionally decrement stock (guaranteed >= 0);
 *   6. let the database trigger calculate orders.total_amount;
 *   7. commit only when every statement and row count check succeeds.
 *
 * Any failure rolls back the order, items, trigger-generated total and every
 * stock deduction together.
 */
export async function checkout(userId, items, shippingAddress = null) {
  const client = await pool.connect();
  let inTransaction = false;

  try {
    await client.query('BEGIN');
    inTransaction = true;

    const productIds = items.map((item) => item.productId);

    // Single statement locks all required rows in a deterministic order.
    const productResult = await client.query(
      `SELECT id, name, current_price, stock_quantity, is_active
       FROM products
       WHERE id = ANY($1::BIGINT[])
       ORDER BY id ASC
       FOR UPDATE`,
      [productIds]
    );

    const products = new Map(productResult.rows.map((row) => [row.id, row]));

    for (const item of items) {
      const product = products.get(item.productId);
      if (!product) {
        throw new ApiError(400, `Product with id ${item.productId} was not found.`);
      }
      if (!product.is_active) {
        throw new ApiError(409, `${product.name} is no longer available.`);
      }
      if (product.stock_quantity < item.quantity) {
        throw new ApiError(
          409,
          `Insufficient stock for ${product.name}. Only ${product.stock_quantity} left in stock.`
        );
      }
    }

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, status, shipping_address)
       VALUES ($1, 'pending', $2)
       RETURNING id, order_date, status, shipping_address`,
      [userId, shippingAddress]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      const product = products.get(item.productId);

      // The actual current database price is snapshotted into history.
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.productId, item.quantity, product.current_price]
      );

      // Row is already locked; the WHERE guard is a second, atomic line of
      // defence so stock can never become negative even if locking changes.
      const stockResult = await client.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1
         WHERE id = $2 AND stock_quantity >= $1
         RETURNING stock_quantity`,
        [item.quantity, item.productId]
      );
      if (stockResult.rowCount !== 1) {
        throw new ApiError(
          409,
          `Insufficient stock for ${product.name}. Another customer may have purchased the remaining units.`
        );
      }
      product.stock_quantity = stockResult.rows[0].stock_quantity;
    }

    // The trigger is authoritative for the total. Read it back from PostgreSQL.
    const totalResult = await client.query(
      `SELECT total_amount FROM orders WHERE id = $1`,
      [order.id]
    );
    const totalAmount = totalResult.rows[0].total_amount;

    const expectedCents = items.reduce(
      (sum, item) => sum + moneyToCents(products.get(item.productId).current_price) * item.quantity,
      0
    );
    if (moneyToCents(totalAmount) !== expectedCents) {
      throw new Error('Order total invariant failed after trigger recalculation.');
    }

    const itemResult = await client.query(
      `SELECT
         oi.id, oi.product_id, p.name AS product_name, p.image_url, p.category,
         oi.quantity, oi.unit_price_at_purchase,
         (oi.quantity::NUMERIC * oi.unit_price_at_purchase)::NUMERIC(12, 2) AS line_total
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1
       ORDER BY oi.id ASC`,
      [order.id]
    );

    await client.query('COMMIT');
    inTransaction = false;

    return {
      id: order.id,
      orderDate: order.order_date,
      status: order.status,
      totalAmount: Number(totalAmount),
      items: itemResult.rows.map((row) => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        productImageUrl: row.image_url,
        category: row.category,
        quantity: row.quantity,
        unitPriceAtPurchase: Number(row.unit_price_at_purchase),
        lineTotal: Number(row.line_total),
      })),
    };
  } catch (error) {
    if (inTransaction) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('[checkout] Rollback failed:', rollbackError.message);
      }
    }
    throw error;
  } finally {
    client.release();
  }
}
