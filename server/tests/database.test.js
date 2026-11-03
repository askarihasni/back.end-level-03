import test, { after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { closePool, pool, query } from '../src/config/db.js';

/**
 * These tests exercise the real PostgreSQL database: native ENUMs, CHECK/FK/
 * UNIQUE constraints, the order-total trigger (INSERT/UPDATE/DELETE/move and
 * concurrent writers), the low-stock view and the analytics views.
 *
 * Every fixture created here is tracked and removed again in `after`, so the
 * file is safe to run after the API suite against the same test database.
 */

const tag = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
let sequence = 0;

const created = {
  users: [],
  products: [],
  orders: [],
};

function nextTag() {
  sequence += 1;
  return `${tag}-${sequence}`;
}

async function insertUser({ role = 'customer', name = 'DB Test User' } = {}) {
  const unique = nextTag();
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, role`,
    [name, `db.test.${unique}@example.com`, '$2b$10$not-a-real-hash-but-not-blank', role]
  );
  created.users.push(rows[0].id);
  return rows[0];
}

async function insertProduct({
  price = 100,
  stock = 10,
  isActive = true,
  name = 'DB Test Product',
} = {}) {
  const unique = nextTag();
  const { rows } = await query(
    `INSERT INTO products (name, description, current_price, stock_quantity, category, image_url, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, current_price, stock_quantity, is_active`,
    [
      `${name} ${unique}`,
      'Created by the database test suite.',
      price,
      stock,
      'DB Test Category',
      '/images/fallback.svg',
      isActive,
    ]
  );
  created.products.push(rows[0].id);
  return rows[0];
}

async function insertOrder({
  userId,
  status = 'pending',
  orderDate = null,
} = {}) {
  const { rows } = await query(
    `INSERT INTO orders (user_id, status, order_date)
     VALUES ($1, $2, COALESCE($3::timestamptz, CURRENT_TIMESTAMP))
     RETURNING id, user_id, status, total_amount, order_date`,
    [userId, status, orderDate]
  );
  created.orders.push(rows[0].id);
  return rows[0];
}

async function insertItem({ orderId, productId, quantity, unitPrice }) {
  const { rows } = await query(
    `INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [orderId, productId, quantity, unitPrice]
  );
  return rows[0];
}

async function orderTotal(orderId) {
  const { rows } = await query('SELECT total_amount FROM orders WHERE id = $1', [orderId]);
  return Number(rows[0].total_amount);
}

function monthKey(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 7);
  return String(value).slice(0, 7);
}

after(async () => {
  try {
    if (created.orders.length) {
      await query('DELETE FROM order_items WHERE order_id = ANY($1::bigint[])', [created.orders]);
      await query('DELETE FROM orders WHERE id = ANY($1::bigint[])', [created.orders]);
    }
    if (created.products.length) {
      await query('DELETE FROM products WHERE id = ANY($1::bigint[])', [created.products]);
    }
    if (created.users.length) {
      await query('DELETE FROM users WHERE id = ANY($1::bigint[])', [created.users]);
    }
  } finally {
    await closePool();
  }
});

describe('Schema: native ENUMs, constraints, keys, indexes and views', () => {
  test('user_role_enum and order_status_enum exist with the exact allowed labels', async () => {
    const { rows } = await query(
      `SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
       FROM pg_type t
       JOIN pg_enum e ON e.enumtypid = t.oid
       WHERE t.typname IN ('user_role_enum', 'order_status_enum')
       GROUP BY t.typname`
    );
    const byName = Object.fromEntries(rows.map((row) => [row.typname, row.labels]));
    assert.deepEqual(byName.user_role_enum, ['customer', 'admin']);
    assert.deepEqual(byName.order_status_enum, ['pending', 'paid', 'shipped', 'cancelled']);
  });

  test('named CHECK, UNIQUE and foreign-key constraints are present', async () => {
    const expected = [
      'users_email_unique',
      'users_email_is_lowercase',
      'users_name_not_blank',
      'products_price_non_negative',
      'products_stock_non_negative',
      'orders_total_non_negative',
      'order_items_quantity_positive',
      'order_items_unit_price_non_negative',
      'order_items_order_product_unique',
    ];
    const { rows } = await query(
      'SELECT conname FROM pg_constraint WHERE conname = ANY($1)',
      [expected]
    );
    assert.deepEqual(
      rows.map((row) => row.conname).sort(),
      [...expected].sort()
    );

    const { rows: foreignKeys } = await query(
      `SELECT c.conname, c.confdeltype
       FROM pg_constraint c
       WHERE c.contype = 'f'
         AND c.conrelid IN ('orders'::regclass, 'order_items'::regclass)`
    );
    assert.equal(foreignKeys.length, 3);
    assert.ok(foreignKeys.every((key) => key.confdeltype === 'r'), 'all FKs must use ON DELETE RESTRICT');
  });

  test('performance indexes and the analytics/low-stock views exist', async () => {
    const indexes = [
      'uq_users_email_lower',
      'idx_products_stock',
      'idx_products_active_name',
      'idx_orders_user_date',
      'idx_order_items_order_id',
      'idx_order_items_product_id',
    ];
    const { rows: indexRows } = await query(
      'SELECT indexname FROM pg_indexes WHERE schemaname = $1 AND indexname = ANY($2)',
      ['public', indexes]
    );
    assert.deepEqual(
      indexRows.map((row) => row.indexname).sort(),
      [...indexes].sort()
    );

    const views = [
      'vw_low_stock',
      'vw_top_spenders',
      'vw_monthly_revenue',
      'vw_dashboard_metrics',
      'vw_recent_orders',
    ];
    const { rows: viewRows } = await query(
      `SELECT table_name
       FROM information_schema.views
       WHERE table_schema = $1 AND table_name = ANY($2)`,
      ['public', views]
    );
    assert.deepEqual(
      viewRows.map((row) => row.table_name).sort(),
      [...views].sort()
    );
  });

  test('the order-total trigger is installed on order_items', async () => {
    const { rows } = await query(
      `SELECT tgname
       FROM pg_trigger
       WHERE tgname = 'trg_order_items_sync_order_total'
         AND tgrelid = 'order_items'::regclass
         AND NOT tgisinternal`
    );
    assert.equal(rows.length, 1);
  });
});

describe('Constraints reject invalid data', () => {
  test('email uniqueness is case-insensitive and uppercase storage is rejected', async () => {
    const user = await insertUser();

    await assert.rejects(
      query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ('Upper Case', $1, 'hash')`,
        [`DB.Test.${tag}@Example.com`]
      ),
      (error) => error.code === '23514' // users_email_is_lowercase
    );

    await assert.rejects(
      query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ('Duplicate', $1, 'hash')`,
        [user.email]
      ),
      (error) => error.code === '23505' // users_email_unique / uq_users_email_lower
    );
  });

  test('unknown ENUM values are rejected by PostgreSQL', async () => {
    await assert.rejects(
      query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ('Bad Role', $1, 'hash', 'superadmin')`,
        [`bad.role.${tag}@example.com`]
      ),
      (error) => error.code === '22P02'
    );

    const user = await insertUser();
    await assert.rejects(
      query('INSERT INTO orders (user_id, status) VALUES ($1, $2)', [user.id, 'archived']),
      (error) => error.code === '22P02'
    );
  });

  test('products reject negative prices and negative stock', async () => {
    await assert.rejects(
      query(
        `INSERT INTO products (name, current_price, stock_quantity, category)
         VALUES ('Negative price', -1, 1, 'DB Test Category')`
      ),
      (error) => error.code === '23514'
    );

    await assert.rejects(
      query(
        `INSERT INTO products (name, current_price, stock_quantity, category)
         VALUES ('Negative stock', 1, -1, 'DB Test Category')`
      ),
      (error) => error.code === '23514'
    );
  });

  test('order items reject non-positive quantity and duplicate product lines', async () => {
    const user = await insertUser();
    const productA = await insertProduct();
    const productB = await insertProduct();
    const order = await insertOrder({ userId: user.id });

    await assert.rejects(
      insertItem({ orderId: order.id, productId: productA.id, quantity: 0, unitPrice: 10 }),
      (error) => error.code === '23514'
    );

    await assert.rejects(
      insertItem({ orderId: order.id, productId: productA.id, quantity: 1, unitPrice: -1 }),
      (error) => error.code === '23514'
    );

    await insertItem({ orderId: order.id, productId: productA.id, quantity: 1, unitPrice: 10 });
    await assert.rejects(
      insertItem({ orderId: order.id, productId: productA.id, quantity: 2, unitPrice: 10 }),
      (error) => error.code === '23505'
    );

    // A different product in the same order is allowed.
    await insertItem({ orderId: order.id, productId: productB.id, quantity: 1, unitPrice: 20 });
    assert.equal(await orderTotal(order.id), 30);
  });

  test('foreign keys prevent deleting users/products with order history', async () => {
    const user = await insertUser();
    const product = await insertProduct();
    const order = await insertOrder({ userId: user.id });
    await insertItem({ orderId: order.id, productId: product.id, quantity: 1, unitPrice: 10 });

    await assert.rejects(
      query('DELETE FROM users WHERE id = $1', [user.id]),
      (error) => error.code === '23503'
    );
    await assert.rejects(
      query('DELETE FROM products WHERE id = $1', [product.id]),
      (error) => error.code === '23503'
    );
    await assert.rejects(
      query('DELETE FROM orders WHERE id = $1', [order.id]),
      (error) => error.code === '23503'
    );
  });

  test('total_amount still cannot be forced negative by a direct update', async () => {
    const user = await insertUser();
    const order = await insertOrder({ userId: user.id });
    await assert.rejects(
      query('UPDATE orders SET total_amount = -0.01 WHERE id = $1', [order.id]),
      (error) => error.code === '23514'
    );
  });
});

describe('Trigger: authoritative order totals', () => {
  test('INSERT, UPDATE and DELETE keep total_amount in exact NUMERIC sync', async () => {
    const user = await insertUser();
    const productA = await insertProduct({ price: 125.5 });
    const productB = await insertProduct({ price: 99.99 });
    const order = await insertOrder({ userId: user.id });

    assert.equal(await orderTotal(order.id), 0, 'new order starts at zero');

    const itemA = await insertItem({
      orderId: order.id,
      productId: productA.id,
      quantity: 2,
      unitPrice: 125.5,
    });
    assert.equal(await orderTotal(order.id), 251);

    await insertItem({
      orderId: order.id,
      productId: productB.id,
      quantity: 3,
      unitPrice: 99.99,
    });
    assert.equal(await orderTotal(order.id), 550.97);

    await query('UPDATE order_items SET quantity = 4 WHERE id = $1', [itemA.id]);
    assert.equal(await orderTotal(order.id), 801.97);

    await query('UPDATE order_items SET unit_price_at_purchase = 100.25 WHERE product_id = $1', [
      productB.id,
    ]);
    assert.equal(await orderTotal(order.id), 802.75);

    await query('DELETE FROM order_items WHERE product_id = $1', [productB.id]);
    assert.equal(await orderTotal(order.id), 502);

    await query('DELETE FROM order_items WHERE order_id = $1', [order.id]);
    assert.equal(await orderTotal(order.id), 0, 'empty order total is exact zero, not NULL');
  });

  test('moving an item between orders recalculates both totals', async () => {
    const user = await insertUser();
    const product = await insertProduct();
    const first = await insertOrder({ userId: user.id });
    const second = await insertOrder({ userId: user.id });
    const item = await insertItem({
      orderId: first.id,
      productId: product.id,
      quantity: 3,
      unitPrice: 40.25,
    });

    assert.equal(await orderTotal(first.id), 120.75);
    assert.equal(await orderTotal(second.id), 0);

    await query('UPDATE order_items SET order_id = $1 WHERE id = $2', [second.id, item.id]);
    assert.equal(await orderTotal(first.id), 0);
    assert.equal(await orderTotal(second.id), 120.75);

    // Moving it back and changing the quantity in the same statement must also
    // leave both orders consistent.
    await query('UPDATE order_items SET order_id = $1, quantity = 2 WHERE id = $2', [
      first.id,
      item.id,
    ]);
    assert.equal(await orderTotal(first.id), 80.5);
    assert.equal(await orderTotal(second.id), 0);
  });

  test('concurrent inserts on the same order serialize and produce no lost total', async () => {
    const user = await insertUser();
    const productA = await insertProduct({ price: 10 });
    const productB = await insertProduct({ price: 20 });
    const order = await insertOrder({ userId: user.id });

    const clientA = await pool.connect();
    const clientB = await pool.connect();
    let bInsert;
    try {
      await clientA.query('BEGIN');
      await clientA.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
         VALUES ($1, $2, 1, 10)`,
        [order.id, productA.id]
      );

      await clientB.query('BEGIN');
      bInsert = clientB.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
         VALUES ($1, $2, 2, 20)`,
        [order.id, productB.id]
      );

      // While client A holds the order row lock, client B must wait.
      const winner = await Promise.race([
        bInsert.then(() => 'finished'),
        new Promise((resolve) => setTimeout(() => resolve('waiting'), 200)),
      ]);
      assert.equal(winner, 'waiting', 'second writer must block on the order row lock');

      await clientA.query('COMMIT');
      await bInsert;
      await clientB.query('COMMIT');
    } finally {
      // `ROLLBACK` is harmless if the transaction has already been committed.
      await emailSafeRollback(clientA);
      await emailSafeRollback(clientB);
      clientA.release();
      clientB.release();
    }

    assert.equal(await orderTotal(order.id), 50, 'total must include both concurrent items');
  });
});

async function emailSafeRollback(client) {
  try {
    await client.query('ROLLBACK');
  } catch {
    // Ignore: the connection may have no active transaction.
  }
}

describe('vw_low_stock reflects current stock below 5', () => {
  test('stock 0 and 4 appear, stock 5 disappears after an update', async () => {
    const low = await insertProduct({ stock: 4 });
    const out = await insertProduct({ stock: 0 });
    const healthy = await insertProduct({ stock: 5 });

    const { rows } = await query(
      `SELECT product_id, stock_quantity, stock_status
       FROM vw_low_stock
       WHERE product_id = ANY($1::bigint[])`,
      [[low.id, out.id, healthy.id]]
    );
    const byId = Object.fromEntries(rows.map((row) => [row.product_id, row]));

    assert.equal(byId[low.id].stock_quantity, 4);
    assert.equal(byId[low.id].stock_status, 'low_stock');
    assert.equal(byId[out.id].stock_status, 'out_of_stock');
    assert.equal(byId[healthy.id], undefined, 'stock 5 is not low stock');

    await query('UPDATE products SET stock_quantity = 5 WHERE id = $1', [low.id]);
    const afterRestock = await query('SELECT 1 FROM vw_low_stock WHERE product_id = $1', [low.id]);
    assert.equal(afterRestock.rowCount, 0);

    await query('UPDATE products SET stock_quantity = 0 WHERE id = $1', [low.id]);
    const afterSellOut = await query('SELECT stock_status FROM vw_low_stock WHERE product_id = $1', [
      low.id,
    ]);
    assert.equal(afterSellOut.rows[0].stock_status, 'out_of_stock');
  });
});

describe('Analytics views follow the realized-revenue rule', () => {
  test('dashboard revenue includes only paid/shipped orders and historical prices', async () => {
    const user = await insertUser({ name: 'Revenue Rule Customer' });
    const product = await insertProduct({ price: 1000 });

    const { rows: beforeRows } = await query(
      'SELECT realized_revenue, total_orders, pending_orders, paid_orders, shipped_orders FROM vw_dashboard_metrics'
    );
    const before = beforeRows[0];

    const paid = await insertOrder({ userId: user.id, status: 'paid' });
    await insertItem({ orderId: paid.id, productId: product.id, quantity: 2, unitPrice: 100 });

    const shipped = await insertOrder({ userId: user.id, status: 'shipped' });
    await insertItem({ orderId: shipped.id, productId: product.id, quantity: 1, unitPrice: 300 });

    const pending = await insertOrder({ userId: user.id, status: 'pending' });
    await insertItem({ orderId: pending.id, productId: product.id, quantity: 5, unitPrice: 999 });

    const cancelled = await insertOrder({ userId: user.id, status: 'cancelled' });
    await insertItem({ orderId: cancelled.id, productId: product.id, quantity: 10, unitPrice: 888 });

    // Changing the live product price must not rewrite historical revenue.
    await query('UPDATE products SET current_price = 9999 WHERE id = $1', [product.id]);

    const { rows: afterRows } = await query(
      'SELECT realized_revenue, total_orders, pending_orders, paid_orders, shipped_orders FROM vw_dashboard_metrics'
    );
    const after = afterRows[0];

    assert.equal(Number(after.realized_revenue) - Number(before.realized_revenue), 500);
    assert.equal(after.total_orders - before.total_orders, 4);
    assert.equal(after.pending_orders - before.pending_orders, 1);
    assert.equal(after.paid_orders - before.paid_orders, 1);
    assert.equal(after.shipped_orders - before.shipped_orders, 1);

    const { rows: expectedRows } = await query(
      `SELECT COALESCE(SUM(q.order_total), 0)::NUMERIC(14, 2) AS expected
       FROM (
         SELECT o.id, SUM(oi.quantity::NUMERIC * oi.unit_price_at_purchase) AS order_total
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         WHERE o.status IN ('paid', 'shipped')
         GROUP BY o.id
       ) q`
    );
    assert.equal(Number(after.realized_revenue), Number(expectedRows[0].expected));
  });

  test('top spenders ranks paid+shipped spend and excludes pending/cancelled', async () => {
    const mega = await insertUser({ name: 'Mega Spender' });
    const decoy = await insertUser({ name: 'Pending Decoy' });
    const product = await insertProduct({ price: 5 });

    const megaPaid = await insertOrder({ userId: mega.id, status: 'paid' });
    await insertItem({
      orderId: megaPaid.id,
      productId: product.id,
      quantity: 1,
      unitPrice: 10_000_000,
    });
    const megaShipped = await insertOrder({ userId: mega.id, status: 'shipped' });
    await insertItem({
      orderId: megaShipped.id,
      productId: product.id,
      quantity: 1,
      unitPrice: 1_000_000,
    });

    // Both are deliberately large enough to rank first if they were counted.
    const decoyPending = await insertOrder({ userId: decoy.id, status: 'pending' });
    await insertItem({
      orderId: decoyPending.id,
      productId: product.id,
      quantity: 1,
      unitPrice: 9_000_000,
    });
    const decoyCancelled = await insertOrder({ userId: decoy.id, status: 'cancelled' });
    await insertItem({
      orderId: decoyCancelled.id,
      productId: product.id,
      quantity: 1,
      unitPrice: 8_000_000,
    });

    const { rows } = await query(
      `SELECT customer_id, customer_name, customer_email, total_spent, qualifying_orders
       FROM vw_top_spenders`
    );

    assert.ok(rows.length <= 5);
    assert.equal(rows[0].customer_id, mega.id);
    assert.equal(Number(rows[0].total_spent), 11_000_000);
    assert.equal(rows[0].qualifying_orders, 2);
    assert.ok(
      rows.every((row) => row.customer_email !== decoy.email),
      'pending/cancelled-only customers must not rank'
    );

    for (let index = 1; index < rows.length; index += 1) {
      const previous = Number(rows[index - 1].total_spent);
      const current = Number(rows[index].total_spent);
      assert.ok(previous >= current, 'spenders must be sorted by total descending');
      if (previous === current) {
        assert.ok(rows[index - 1].customer_id < rows[index].customer_id, 'ties break by id');
      }
    }
  });

  test('monthly revenue ignores pending/cancelled, tracks LAG growth and a running total', async () => {
    const user = await insertUser({ name: 'Monthly Revenue Customer' });
    const product = await insertProduct({ price: 777.77 });

    const { rows: beforeRows } = await query(
      'SELECT revenue_month, monthly_revenue FROM vw_monthly_revenue ORDER BY revenue_month'
    );
    assert.ok(beforeRows.length > 0);

    const targetMonth = monthKey(beforeRows[beforeRows.length - 1].revenue_month);
    const orderDate = `${targetMonth}-15T12:00:00Z`;

    const paid = await insertOrder({ userId: user.id, status: 'paid', orderDate });
    await insertItem({ orderId: paid.id, productId: product.id, quantity: 1, unitPrice: 777.77 });

    const pending = await insertOrder({ userId: user.id, status: 'pending', orderDate });
    await insertItem({ orderId: pending.id, productId: product.id, quantity: 2, unitPrice: 50_000 });

    const cancelled = await insertOrder({ userId: user.id, status: 'cancelled', orderDate });
    await insertItem({ orderId: cancelled.id, productId: product.id, quantity: 2, unitPrice: 60_000 });

    const { rows } = await query(
      `SELECT revenue_month, monthly_revenue, previous_month_revenue,
              month_over_month_growth_pct, cumulative_revenue
       FROM vw_monthly_revenue
       ORDER BY revenue_month`
    );

    assert.equal(rows.length, beforeRows.length, 'adding orders inside existing bounds adds no month');
    const beforeByMonth = new Map(
      beforeRows.map((row) => [monthKey(row.revenue_month), Number(row.monthly_revenue)])
    );
    const targetRow = rows.find((row) => monthKey(row.revenue_month) === targetMonth);
    assert.ok(targetRow);
    assert.equal(
      Number((Number(targetRow.monthly_revenue) - beforeByMonth.get(targetMonth)).toFixed(2)),
      777.77,
      'only the paid order adds revenue in that month'
    );

    let running = 0;
    rows.forEach((row, index) => {
      const monthly = Number(row.monthly_revenue);
      running += monthly;
      assert.ok(
        Math.abs(Number(row.cumulative_revenue) - running) < 0.005,
        'cumulative revenue is the running monthly total'
      );

      if (index === 0) {
        assert.equal(row.previous_month_revenue, null);
        assert.equal(row.month_over_month_growth_pct, null);
      } else {
        const previous = Number(rows[index - 1].monthly_revenue);
        assert.equal(Number(row.previous_month_revenue), previous);
        if (previous === 0) {
          assert.equal(row.month_over_month_growth_pct, null);
        } else {
          const expected = Math.round(((monthly - previous) / previous) * 10000) / 100;
          assert.equal(Number(row.month_over_month_growth_pct), expected);
        }
      }
    });
  });
});
