import test, { after, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiClient,
  SEEDED,
  countOrders,
  createProduct,
  getProductRow,
  loginClient,
  startTestServer,
} from './helpers.js';
import { checkout } from '../src/services/checkoutService.js';
import { closePool, query } from '../src/config/db.js';

let server;
let baseUrl;
let admin;
let ayesha;
let bilal;

before(async () => {
  const started = await startTestServer();
  server = started.server;
  baseUrl = started.baseUrl;
  admin = (await loginClient(baseUrl, SEEDED.admin)).client;
  ayesha = (await loginClient(baseUrl, SEEDED.ayesha)).client;
  bilal = (await loginClient(baseUrl, SEEDED.bilal)).client;
});

after(async () => {
  await server.close();
  await closePool();
});

describe('Health, catalogue and sessions (real HTTP + PostgreSQL)', () => {
  test('GET /api/health reports a live database connection', async () => {
    const response = await new ApiClient(baseUrl).get('/health');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'ok', database: 'connected' });
  });

  test('public product list excludes inactive products and is paginated', async () => {
    const response = await new ApiClient(baseUrl).get('/products?limit=100');
    assert.equal(response.status, 200);
    assert.ok(response.body.products.length > 0);
    assert.ok(response.body.products.every((product) => product.isActive === true));
    assert.equal(response.body.pagination.page, 1);
    assert.ok(response.body.pagination.total >= response.body.products.length);
    assert.ok('totalPages' in response.body.pagination);
  });

  test('even a spoofed includeInactive query cannot reveal inactive products to guests', async () => {
    const response = await new ApiClient(baseUrl).get('/products?includeInactive=true&limit=100');
    assert.equal(response.status, 200);
    assert.ok(response.body.products.every((product) => product.isActive === true));
  });

  test('admin can see the inactive product; guests receive 404 for its detail page', async () => {
    const list = await admin.get('/products?includeInactive=true&limit=100');
    const inactive = list.body.products.find((product) => product.isActive === false);
    assert.ok(inactive, 'seed data should contain one inactive product');

    const guest = await new ApiClient(baseUrl).get(`/products/${inactive.id}`);
    assert.equal(guest.status, 404);

    const adminView = await admin.get(`/products/${inactive.id}`);
    assert.equal(adminView.status, 200);
    assert.equal(adminView.body.product.id, inactive.id);
  });

  test('login sets an HttpOnly auth cookie and never exposes the password hash', async () => {
    const client = new ApiClient(baseUrl);
    const response = await client.post('/auth/login', SEEDED.ayesha);
    assert.equal(response.status, 200);
    assert.equal(response.body.user.email, SEEDED.ayesha.email);
    assert.equal(response.body.user.role, 'customer');
    assert.ok(!('password_hash' in response.body.user));
    assert.ok(!('passwordHash' in response.body.user));
    assert.ok(!JSON.stringify(response.body).includes('$2b$'));

    const setCookies = response.headers.getSetCookie();
    const authCookie = setCookies.find((cookie) => cookie.startsWith('se_access_token='));
    assert.ok(authCookie, 'auth cookie must be issued');
    assert.match(authCookie, /HttpOnly/i);
  });

  test('invalid credentials return 401 with a generic message', async () => {
    const response = await new ApiClient(baseUrl).post('/auth/login', {
      email: SEEDED.ayesha.email,
      password: 'definitely-wrong-password',
    });
    assert.equal(response.status, 401);
    assert.match(response.body.error.message, /invalid email or password/i);
  });

  test('GET /auth/me resolves the cookie session', async () => {
    const response = await ayesha.get('/auth/me');
    assert.equal(response.status, 200);
    assert.equal(response.body.user.email, SEEDED.ayesha.email);
    assert.ok(response.body.csrfToken);
  });

  test('registration always creates a customer even when a role is supplied', async () => {
    const client = new ApiClient(baseUrl);
    const email = `test.customer.${Date.now()}@example.com`;
    const response = await client.post('/auth/register', {
      name: 'Test Registrant',
      email,
      password: 'Password123',
      role: 'admin',
    });
    assert.equal(response.status, 201);
    assert.equal(response.body.user.role, 'customer');
    assert.equal(response.body.user.email, email);

    const me = await client.get('/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.user.role, 'customer');
  });

  test('duplicate email registration returns 409', async () => {
    const response = await new ApiClient(baseUrl).post('/auth/register', {
      name: 'Duplicate Ayesha',
      email: SEEDED.ayesha.email.toUpperCase(),
      password: 'Password123',
    });
    assert.equal(response.status, 409);
  });

  test('registration validation rejects weak passwords', async () => {
    const response = await new ApiClient(baseUrl).post('/auth/register', {
      name: 'Weak Password',
      email: `weak.${Date.now()}@example.com`,
      password: 'short',
    });
    assert.equal(response.status, 400);
    assert.equal(response.body.error.details[0].field, 'password');
  });
});

describe('Authorisation, CSRF and ownership', () => {
  test('state-changing requests without a CSRF token are rejected', async () => {
    const product = await createProduct(admin, { stock_quantity: 5 });
    const response = await ayesha.post(
      '/checkout',
      { items: [{ productId: product.id, quantity: 1 }] },
      { includeCsrf: false }
    );
    assert.equal(response.status, 403);
    assert.match(response.body.error.message, /csrf/i);
  });

  test('customers cannot access admin endpoints', async () => {
    const response = await ayesha.get('/admin/orders');
    assert.equal(response.status, 403);
  });

  test('admin endpoints reject guests', async () => {
    const response = await new ApiClient(baseUrl).get('/admin/dashboard');
    assert.equal(response.status, 401);
  });

  test('admin accounts cannot place customer orders', async () => {
    const product = await createProduct(admin, { stock_quantity: 5 });
    const response = await admin.post('/checkout', {
      items: [{ productId: product.id, quantity: 1 }],
    });
    assert.equal(response.status, 403);
  });

  test('a customer receives 404 for another customer\u2019s order', async () => {
    const mine = await ayesha.get('/orders/my-orders?limit=1');
    const orderId = mine.body.orders[0].id;

    const foreign = await bilal.get(`/orders/${orderId}`);
    assert.equal(foreign.status, 404);

    const owner = await ayesha.get(`/orders/${orderId}`);
    assert.equal(owner.status, 200);
    assert.equal(owner.body.order.id, orderId);
  });

  test('my-orders only returns the signed-in customer\u2019s own orders', async () => {
    const response = await ayesha.get('/orders/my-orders?limit=100');
    assert.equal(response.status, 200);
    assert.ok(response.body.orders.every((order) => order.userId === response.body.orders[0].userId));
    assert.ok(response.body.orders.every((order) => order.customerEmail === SEEDED.ayesha.email));
  });
});

describe('Checkout transaction and tamper resistance', () => {
  test('server ignores client prices/totals, snapshots DB price and decrements stock', async () => {
    const product = await createProduct(admin, { current_price: 1234.5, stock_quantity: 5 });
    const before = await countOrders();

    const response = await ayesha.post('/checkout', {
      items: [
        {
          productId: product.id,
          quantity: 2,
          price: 1,
          unit_price_at_purchase: 1,
        },
      ],
      total_amount: 1,
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.order.totalAmount, 2469);
    assert.equal(response.body.order.items.length, 1);
    assert.equal(response.body.order.items[0].unitPriceAtPurchase, 1234.5);
    assert.equal(response.body.order.items[0].lineTotal, 2469);
    assert.equal(await countOrders(), before + 1);

    const row = await getProductRow(product.id);
    assert.equal(row.stock_quantity, 3);
  });

  test('insufficient stock is rejected without creating an order or changing stock', async () => {
    const product = await createProduct(admin, { current_price: 500, stock_quantity: 2 });
    const before = await countOrders();

    const response = await ayesha.post('/checkout', {
      items: [{ productId: product.id, quantity: 3 }],
    });

    assert.equal(response.status, 409);
    assert.match(response.body.error.message, /insufficient stock/i);
    assert.equal(await countOrders(), before);
    assert.equal((await getProductRow(product.id)).stock_quantity, 2);
  });

  test('inactive products cannot be purchased', async () => {
    const product = await createProduct(admin, { stock_quantity: 4, is_active: false });
    const response = await ayesha.post('/checkout', {
      items: [{ productId: product.id, quantity: 1 }],
    });
    assert.equal(response.status, 409);
    assert.match(response.body.error.message, /no longer available/i);
  });

  test('missing products and empty carts are rejected by validation', async () => {
    const missing = await ayesha.post('/checkout', {
      items: [{ productId: 987654321, quantity: 1 }],
    });
    assert.equal(missing.status, 400);

    const empty = await ayesha.post('/checkout', { items: [] });
    assert.equal(empty.status, 400);

    const zero = await ayesha.post('/checkout', {
      items: [{ productId: 1, quantity: 0 }],
    });
    assert.equal(zero.status, 400);
  });

  test('a failure after partial writes rolls the whole transaction back', async () => {
    const product = await createProduct(admin, { current_price: 700, stock_quantity: 8 });
    const before = await countOrders();
    const userId = 2; // seeded customer Ayesha

    // Calling the service directly with a duplicated line bypasses the API
    // validator (which normally merges duplicates) and forces the second
    // INSERT to violate UNIQUE(order_id, product_id) after the order, the first
    // item and the first stock decrement have already been written.
    await assert.rejects(
      checkout(userId, [
        { productId: product.id, quantity: 1 },
        { productId: product.id, quantity: 1 },
      ]),
      (error) => error.code === '23505'
    );

    assert.equal(await countOrders(), before, 'rolled-back order must not exist');
    assert.equal((await getProductRow(product.id)).stock_quantity, 8, 'stock must be restored');
  });

  test('concurrent checkouts for the final unit allow exactly one order', async () => {
    const product = await createProduct(admin, { current_price: 2500, stock_quantity: 1 });

    const [first, second] = await Promise.all([
      ayesha.post('/checkout', { items: [{ productId: product.id, quantity: 1 }] }),
      bilal.post('/checkout', { items: [{ productId: product.id, quantity: 1 }] }),
    ]);

    const statuses = [first.status, second.status].sort((a, b) => a - b);
    assert.deepEqual(statuses, [201, 409]);
    assert.equal((await getProductRow(product.id)).stock_quantity, 0);

    const { rows } = await query(
      `SELECT COUNT(*)::INTEGER AS total
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.product_id = $1`,
      [product.id]
    );
    assert.equal(rows[0].total, 1);
  });
});

describe('Admin order fulfilment', () => {
  test('valid transitions succeed and terminal states reject further changes', async () => {
    const product = await createProduct(admin, { current_price: 300, stock_quantity: 10 });
    const created = await ayesha.post('/checkout', {
      items: [{ productId: product.id, quantity: 2 }],
    });
    const orderId = created.body.order.id;

    const paid = await admin.patch(`/admin/orders/${orderId}/status`, { status: 'paid' });
    assert.equal(paid.status, 200);
    assert.equal(paid.body.order.status, 'paid');
    assert.deepEqual(paid.body.allowedNextStatuses, ['shipped', 'cancelled']);

    const shipped = await admin.patch(`/admin/orders/${orderId}/status`, { status: 'shipped' });
    assert.equal(shipped.status, 200);
    assert.equal(shipped.body.order.status, 'shipped');
    assert.deepEqual(shipped.body.allowedNextStatuses, []);

    const reverse = await admin.patch(`/admin/orders/${orderId}/status`, { status: 'paid' });
    assert.equal(reverse.status, 409);
    assert.match(reverse.body.error.message, /invalid status transition/i);
  });

  test('cancelling a pending order restores inventory exactly once', async () => {
    const product = await createProduct(admin, { current_price: 450, stock_quantity: 10 });
    const created = await ayesha.post('/checkout', {
      items: [{ productId: product.id, quantity: 3 }],
    });
    assert.equal((await getProductRow(product.id)).stock_quantity, 7);

    const cancelled = await admin.patch(`/admin/orders/${created.body.order.id}/status`, {
      status: 'cancelled',
    });
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.body.order.status, 'cancelled');
    assert.equal(cancelled.body.transition.inventoryRestored, true);
    assert.equal(cancelled.body.transition.refundRequired, false);
    assert.equal((await getProductRow(product.id)).stock_quantity, 10);

    const again = await admin.patch(`/admin/orders/${created.body.order.id}/status`, {
      status: 'cancelled',
    });
    assert.equal(again.status, 409);
    assert.equal((await getProductRow(product.id)).stock_quantity, 10, 'stock restored only once');
  });

  test('cancelling a paid order restores stock and flags a manual refund without claiming one', async () => {
    const product = await createProduct(admin, { current_price: 800, stock_quantity: 6 });
    const created = await ayesha.post('/checkout', {
      items: [{ productId: product.id, quantity: 2 }],
    });
    await admin.patch(`/admin/orders/${created.body.order.id}/status`, { status: 'paid' });

    const cancelled = await admin.patch(`/admin/orders/${created.body.order.id}/status`, {
      status: 'cancelled',
    });
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.body.transition.refundRequired, true);
    assert.equal(cancelled.body.transition.refundProcessed, false);
    assert.match(cancelled.body.transition.note, /refund must be handled manually/i);
    assert.equal((await getProductRow(product.id)).stock_quantity, 6);
  });

  test('admin order list supports search and status filters', async () => {
    const response = await admin.get('/admin/orders?status=pending&limit=100');
    assert.equal(response.status, 200);
    assert.ok(response.body.orders.every((order) => order.status === 'pending'));

    const searched = await admin.get('/admin/orders?q=ayesha&limit=100');
    assert.equal(searched.status, 200);
    assert.ok(searched.body.orders.every((order) => /ayesha/i.test(order.customerEmail)));
  });

  test('invalid status values are rejected', async () => {
    const response = await admin.patch('/admin/orders/1/status', { status: 'archived' });
    assert.equal(response.status, 400);
  });
});

describe('Admin product management and validation', () => {
  test('products can be created, edited and soft-deleted without breaking history', async () => {
    const product = await createProduct(admin, { current_price: 999, stock_quantity: 5 });

    const patched = await admin.patch(`/products/${product.id}`, {
      current_price: 1099.5,
      stock_quantity: 7,
    });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.product.currentPrice, 1099.5);
    assert.equal(patched.body.product.stockQuantity, 7);

    const removed = await admin.delete(`/products/${product.id}`);
    assert.equal(removed.status, 200);
    assert.equal(removed.body.product.isActive, false);

    const guest = await new ApiClient(baseUrl).get(`/products/${product.id}`);
    assert.equal(guest.status, 404);

    const row = await getProductRow(product.id);
    assert.ok(row, 'soft delete must retain the database row');
    assert.equal(row.is_active, false);
  });

  test('negative prices and unknown fields are rejected', async () => {
    const negative = await admin.post('/products', {
      name: 'Invalid Product',
      current_price: -5,
      stock_quantity: 1,
      category: 'Test Category',
    });
    assert.equal(negative.status, 400);

    const unknown = await admin.patch('/products/1', { is_admin: true });
    assert.equal(unknown.status, 400);
  });

  test('customers cannot mutate products', async () => {
    const response = await ayesha.post('/products', {
      name: 'Customer Product',
      current_price: 10,
      stock_quantity: 1,
      category: 'Test Category',
    });
    assert.equal(response.status, 403);
  });
});

describe('Logout and session invalidation', () => {
  test('logout requires CSRF and clears the auth session', async () => {
    const { client } = await loginClient(baseUrl, SEEDED.sara);

    const withoutCsrf = await client.post('/auth/logout', {}, { includeCsrf: false });
    assert.equal(withoutCsrf.status, 403);

    const loggedOut = await client.post('/auth/logout', {});
    assert.equal(loggedOut.status, 200);

    const me = await client.get('/auth/me');
    assert.equal(me.status, 401);
  });
});
