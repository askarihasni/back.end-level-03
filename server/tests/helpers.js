import { once } from 'node:events';
import app from '../src/app.js';
import { query } from '../src/config/db.js';

/**
 * Starts the real Express app on an ephemeral port. No mocks: every request
 * goes through the actual middleware stack, controllers and PostgreSQL.
 */
export async function startTestServer() {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}/api`,
    async close() {
      server.closeAllConnections?.();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

/**
 * Minimal cookie-aware HTTP client. Node's fetch does not persist cookies, so
 * this reproduces browser behaviour for the HttpOnly JWT and CSRF cookies.
 */
export class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = new Map();
    this.csrfToken = null;
  }

  storeCookies(response) {
    const setCookies =
      typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : [];
    for (const header of setCookies) {
      const [pair] = header.split(';');
      const separator = pair.indexOf('=');
      if (separator < 0) continue;
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      if (!name) continue;
      if (/expires=thu, 01 jan 1970/i.test(header) || value === '') {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  cookieHeader() {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  async request(path, { method = 'GET', body, headers = {}, includeCsrf = true } = {}) {
    const upper = method.toUpperCase();
    const requestHeaders = { ...headers };
    if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
    const cookie = this.cookieHeader();
    if (cookie) requestHeaders.Cookie = cookie;
    if (includeCsrf && this.csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(upper)) {
      requestHeaders['X-CSRF-Token'] = this.csrfToken;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: upper,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    this.storeCookies(response);
    const text = await response.text();
    let parsed = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    if (parsed && typeof parsed === 'object' && parsed.csrfToken) {
      this.csrfToken = parsed.csrfToken;
    }
    return { status: response.status, body: parsed, headers: response.headers };
  }

  get(path, options) {
    return this.request(path, { ...options, method: 'GET' });
  }

  post(path, body, options) {
    return this.request(path, { ...options, method: 'POST', body });
  }

  patch(path, body, options) {
    return this.request(path, { ...options, method: 'PATCH', body });
  }

  delete(path, options) {
    return this.request(path, { ...options, method: 'DELETE' });
  }
}

export const SEEDED = {
  admin: { email: 'admin@shop.pk', password: 'Admin@12345' },
  ayesha: { email: 'ayesha@example.com', password: 'Customer@123' },
  bilal: { email: 'bilal@example.com', password: 'Customer@123' },
  sara: { email: 'sara@example.com', password: 'Customer@123' },
};

export async function loginClient(baseUrl, credentials) {
  const client = new ApiClient(baseUrl);
  const response = await client.post('/auth/login', credentials);
  if (response.status !== 200) {
    throw new Error(`Login failed for ${credentials.email}: ${JSON.stringify(response.body)}`);
  }
  return { client, user: response.body.user };
}

export async function createProduct(adminClient, overrides = {}) {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const payload = {
    name: `Test Product ${unique}`,
    description: 'Created by the automated test suite.',
    current_price: 1000,
    stock_quantity: 10,
    category: 'Test Category',
    image_url: '/images/fallback.svg',
    is_active: true,
    ...overrides,
  };
  const response = await adminClient.post('/products', payload);
  if (response.status !== 201) {
    throw new Error(`Could not create product: ${JSON.stringify(response.body)}`);
  }
  return response.body.product;
}

export async function getProductRow(id) {
  const { rows } = await query(
    'SELECT id, current_price, stock_quantity, is_active FROM products WHERE id = $1',
    [id]
  );
  return rows[0];
}

export async function countOrders() {
  const { rows } = await query('SELECT COUNT(*)::INTEGER AS total FROM orders');
  return rows[0].total;
}

export async function deleteTestProducts() {
  await query("DELETE FROM products WHERE category = 'Test Category'");
}
