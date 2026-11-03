# NEXORA — Smart E-Commerce & Order Fulfillment System

> **Brand**: NEXORA  
> **Tagline**: *Technology. Quality. Delivered.*  
> **Core Architecture**: React 18 + Vite Frontend • Node.js / Express.js REST API • PostgreSQL 16+ Database Engine with ACID Transactions, Triggers, Views & Window-Function Analytics.

---

## Table of Contents
1. [Project Overview & Philosophy](#1-project-overview--philosophy)
2. [Reference Visual Experience & Design Language](#2-reference-visual-experience--design-language)
3. [Architecture & Technology Stack](#3-architecture--technology-stack)
4. [Folder Structure](#4-folder-structure)
5. [Prerequisites & Software Setup](#5-prerequisites--software-setup)
6. [Database Setup & Migration Order](#6-database-setup--migration-order)
7. [Environment Configuration (.env)](#7-environment-configuration-env)
8. [Seed Data & Initial Admin Account](#8-seed-data--initial-admin-account)
9. [Starting the Application (Frontend & Backend)](#9-starting-the-application-frontend--backend)
10. [Automated Test Suite (100% Pass)](#10-automated-test-suite-100-pass)
11. [REST API Documentation](#11-rest-api-documentation)
12. [PostgreSQL Schema & Historical Pricing Architecture](#12-postgresql-schema--historical-pricing-architecture)
13. [ACID Checkout Transaction Engine](#13-acid-checkout-transaction-engine)
14. [Automated Database Triggers (`order_items` ➔ `orders`)](#14-automated-database-triggers-order_items--orders)
15. [Advanced SQL Analytics (CTEs, Window Functions & Views)](#15-advanced-sql-analytics-ctes-window-functions--views)
16. [Security Architecture & CSRF/Cookie Handling](#16-security-architecture--csrfcookie-handling)

---

## 1. Project Overview & Philosophy

**NEXORA** is a production-grade full-stack electronics e-commerce platform and order fulfillment system. Unlike typical student mock projects that rely on client-side state, unverified cart totals, or fake orders, NEXORA strictly enforces:
- **Zero-trust pricing**: Client-submitted prices and totals are completely ignored. All prices are snapshotted directly from locked PostgreSQL rows at the exact instant of purchase.
- **Historical purchase invariance**: Order totals are permanently bound to `unit_price_at_purchase`. Future price updates never rewrite historical sales records.
- **Authoritative SQL triggers**: Total calculation (`SUM(quantity * unit_price_at_purchase)`) is executed exclusively by PostgreSQL triggers on `order_items` with row-level locks, eliminating lost-update race conditions.
- **Row-level concurrency locks**: High-concurrency purchases lock target product rows via `SELECT ... FOR UPDATE` in deterministic ID order to prevent deadlocks and negative inventory.
- **Pure SQL analytics**: Executive dashboard KPIs, low-stock alerts, MoM revenue growth percentages, and top customer rankings are computed entirely by PostgreSQL views and window functions.

---

## 2. Reference Visual Experience & Design Language

NEXORA's visual interface is modelled after high-end cinematic technology hardware showcases:
- **Palette**: Deep Navy (`#081426`, `#050B14`, `#10233F`), Electric Blue (`#3478F6`), Accent Cyan (`#39C6E8`), and Ambient Neon Lime (`#10B981`).
- **Typography**: Editorial luxury serif headings (`Instrument Serif`, `Playfair Display`) paired with clean geometric sans-serif (`Plus Jakarta Sans`, `Inter`).
- **Interactive Hero & Hotspots**:
  - Sculpted dark organic wave pedestal showcasing the flagship cylindrical acoustic speaker.
  - Interactive pulsating hotspot marker on the speaker that dynamically expands to reveal price (`$430 / Rs. 119,999`), description, and quick-add actions.
  - Social proof rating pill with verified purchaser avatars, 5 stars, and `18,921 (reviews)`.
- **"Advantages You Won't Find Elsewhere"**:
  - Editorial headline with interactive carousel arrows (`<` `>`) and glowing metric cards (`38 hrs` non-stop playback, `1.8m` acoustic spatial calibration points, `0.02s` ultra-low latency).
- **"Buyers On Our Products"**:
  - Corporate partner testimonials (`Softshift`, `Lightbox`, `Spherule`) with interactive outline glowing focus states.
- **Dual Acoustic Showcase**:
  - Giant "Amplified" typography backdrop, dual angled speakers with green illuminated LED rings, and floating spec cards (`42 Hrs`, `60Hz - 20kHz`).
- **"Words From Our Partners" (Feature Selector)**:
  - Vertical interactive tabs (`audio performance`, `battery life`, `durability`, `connectivity`), center 3D monolith tower with glowing cyan light bar, and dynamic spec cards.
- **Slide-In Cart Drawer**:
  - Accessible slide-over cart drawer with animated backdrop, live free-shipping progress meter (threshold Rs. 50,000), quantity steppers, and subtotal calculation.
- **Ethereal Horizon Footer**:
  - Dot matrix background grid, newsletter subscription input, and a giant "NEXORA" typography watermark sinking into an ambient cyan horizon glow.

---

## 3. Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, React Router DOM 6, Lucide React, Custom Responsive CSS Design System |
| **Backend** | Node.js (v20+ ES Modules), Express.js 4, `pg` (PostgreSQL Connection Pool), `bcryptjs`, `jsonwebtoken` |
| **Security** | HttpOnly JWT Cookies, Double-Submit CSRF, Helmet, Express Rate Limiting, Input Sanitization |
| **Database** | PostgreSQL 14+ (tested on PostgreSQL 16), Native ENUMs, PL/pgSQL Triggers, Window Functions, Views |

---

## 4. Folder Structure

```
smart-ecommerce/
├── client/                      # React 18 + Vite Frontend
│   ├── public/images/           # High-resolution vector assets (speakers, towers, mark, electronics)
│   ├── src/
│   │   ├── components/          # ProductCard, QuickViewModal, CartDrawer, AnnouncementBar, Modal
│   │   │   └── home/            # HeroShowcase, AdvantagesSection, BuyersSection, DualShowcase, DeepDive
│   │   ├── context/             # AuthContext, CartContext (with Drawer control), ToastContext
│   │   ├── hooks/               # useProducts, useCategories, useDebouncedValue
│   │   ├── layouts/             # StoreLayout, AdminLayout, Header, Footer
│   │   ├── pages/               # HomePage, CartPage, CheckoutPage, OrderConfirmationPage, OrdersPage
│   │   │   └── admin/           # DashboardPage, AdminProductsPage, AdminOrdersPage, AdminAnalyticsPage
│   │   ├── services/            # api.js fetch wrapper with credentials and CSRF injection
│   │   ├── styles/              # tokens.css, base.css, components.css, store.css, admin.css, responsive.css
│   │   └── utils/               # cart.js, format.js, validation.js
│   ├── tests/                   # 44 Client unit tests
│   ├── package.json
│   └── vite.config.js
├── database/                    # Pure PostgreSQL DDL & Migration Scripts
│   ├── 001_schema.sql           # Core tables, constraints, enums, indexes, shipping_address
│   ├── 002_triggers.sql         # Authoritative order total recalculation trigger with row lock
│   ├── 003_views.sql            # Low-stock monitoring view (vw_low_stock < 5 units)
│   ├── 004_analytics.sql        # Top spenders, MoM revenue growth (LAG), running total views
│   └── 005_seed.sql             # 21 products, admin account, customers, sample orders
├── server/                      # Express.js REST API Backend
│   ├── scripts/                 # db-init.js, db-seed.js, prepare-test-db.js, run-tests.js
│   ├── src/
│   │   ├── config/              # db.js (pg Pool & withTransaction), env.js
│   │   ├── controllers/         # authController, productController, checkoutController, orderController
│   │   ├── middleware/          # auth.js, csrf.js, errorHandler.js
│   │   ├── routes/              # authRoutes, productRoutes, checkoutRoutes, orderRoutes, adminRoutes
│   │   ├── services/            # checkoutService, orderService, productService, analyticsService
│   │   ├── utils/               # cookies.js, errors.js, pagination.js, security.js
│   │   ├── validators/          # Input validation schemas (checkout, products, auth)
│   │   ├── app.js               # Express application pipeline
│   │   └── server.js            # HTTP listener & connection teardown
│   ├── tests/                   # 48 Backend & Database integration tests
│   └── package.json
├── .env.example                 # Configuration template
├── package.json                 # Monorepo management scripts
└── README.md                    # System documentation
```

---

## 5. Prerequisites & Software Setup

- **Node.js**: Version 20.x or higher (`node -v`)
- **npm**: Version 10.x or higher (`npm -v`)
- **PostgreSQL**: Version 14 or higher running on `localhost:5432`

---

## 6. Database Setup & Migration Order

The database scripts execute in strict dependency order:
1. `database/001_schema.sql`: Creates native ENUMs (`user_role_enum`, `order_status_enum`), core tables (`users`, `products`, `orders`, `order_items`), constraints, and performance indexes.
2. `database/002_triggers.sql`: Installs `fn_maintain_order_total()` trigger on `order_items` for atomic order total synchronization.
3. `database/003_views.sql`: Creates `vw_low_stock` filtering active products with `stock_quantity < 5`.
4. `database/004_analytics.sql`: Creates `vw_top_spenders`, `vw_monthly_revenue` (with `LAG()` and cumulative window function), and `vw_dashboard_metrics`.
5. `database/005_seed.sql`: Populates realistic products across Audio, Electronics, Computing, and Accessories, plus customer accounts and order history.

To initialize the database automatically:
```powershell
npm run db:init
```

To seed development data:
```powershell
npm run db:seed
```

Or run both in one step:
```powershell
npm run db:setup
```

---

## 7. Environment Configuration (.env)

The root `.env` configures both server and database connection:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smart_ecommerce
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smart_ecommerce_test
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=78439bf6c156b26490c38fd98fd81bf29385bd67c76714177a4ccf35e8629baab78f40684791f1548d627eb6fb823774
JWT_EXPIRES_IN=7d
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
DB_SSL=false
TRUST_PROXY=0
```

---

## 8. Seed Data & Initial Admin Account

The seed script loads pre-configured accounts:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@shop.pk` | `Admin@12345` | Full Admin Dashboard, Catalog CRUD, Order Fulfillment |
| **Customer** | `ayesha@example.com` | `Customer@123` | Storefront, Cart, Checkout, Order Tracking |
| **Customer** | `bilal@example.com` | `Customer@123` | Storefront, Cart, Checkout, Order Tracking |
| **Customer** | `sara@example.com` | `Customer@123` | Storefront, Cart, Checkout, Order Tracking |

*Passwords are securely hashed using bcrypt (cost factor 10).*

---

## 9. Starting the Application (Frontend & Backend)

### Start Backend Server
```powershell
npm run dev:server
```
*API runs on `http://localhost:5000`.*

### Start Frontend Client
```powershell
npm run dev:client
```
*Vite dev server runs on `http://localhost:5173`.*

---

## 10. Automated Test Suite (100% Pass)

Run all 92 automated tests across the backend and frontend:
```powershell
npm test
```

### Server & Database Tests (48 passing):
- Real HTTP + PostgreSQL health, catalogue, authentication, session isolation
- CSRF protection and role-based access control
- ACID checkout row locking (`SELECT FOR UPDATE`), stock deduction, price snapshotting
- Rollback verification upon partial failure and zero stock
- Concurrent checkout race condition safety
- Database trigger recalculation on INSERT, UPDATE, DELETE
- Native ENUM and CHECK constraint enforcement
- `vw_low_stock` real-time reaction
- Analytics CTEs: realized revenue rule, top spenders, monthly revenue growth with `LAG()`

### Client Unit Tests (44 passing):
- Cart normalization, storage resilience, item clamping to stock
- Stepper updates, subtotal, and tax calculations
- Currency formatting (`Rs.` PKR format)
- Form validation (email, password complexity, name boundary limits)

---

## 11. REST API Documentation

### Authentication
- `POST /api/auth/register` — Register a customer account (`{ name, email, password }`).
- `POST /api/auth/login` — Sign in; sets HttpOnly JWT cookie and issues double-submit CSRF cookie.
- `POST /api/auth/logout` — Securely invalidates user session cookies.
- `GET /api/auth/me` — Fetches current authenticated user session.
- `GET /api/auth/csrf` — Provides fresh CSRF token for state-changing requests.

### Products
- `GET /api/products` — Paginated catalog with keyword search (`q`), category, stock availability (`in_stock`, `out_of_stock`), and sort options.
- `GET /api/products/categories` — Distinct categories with real-time product count.
- `GET /api/products/:id` — Product detail by ID.
- `POST /api/admin/products` *(Admin)* — Create product.
- `PUT /api/admin/products/:id` *(Admin)* — Replace product.
- `PATCH /api/admin/products/:id` *(Admin)* — Update price or inventory.
- `DELETE /api/admin/products/:id` *(Admin)* — Soft deactivation (`is_active = FALSE`).

### Checkout & Orders
- `POST /api/checkout` *(Customer)* — ACID transactional purchase. Accepts `{ items: [{ productId, quantity }], shippingAddress }`.
- `GET /api/orders/my-orders` *(Customer)* — Paginated order history for authenticated user.
- `GET /api/orders/:id` *(Customer)* — Invoice breakdown (strict customer ownership verification).

### Admin Order Fulfillment & Analytics
- `GET /api/admin/orders` *(Admin)* — List all orders with search and status filters.
- `GET /api/admin/orders/:id` *(Admin)* — Full order invoice and transition options.
- `PATCH /api/admin/orders/:id/status` *(Admin)* — Move status (`pending` ➔ `paid` ➔ `shipped` or `cancelled`).
- `GET /api/admin/dashboard` *(Admin)* — Executive metrics from `vw_dashboard_metrics`.
- `GET /api/admin/analytics/revenue` *(Admin)* — Monthly revenue with MoM growth and running totals.
- `GET /api/admin/analytics/top-spenders` *(Admin)* — Top 5 customer spenders.
- `GET /api/admin/analytics/low-stock` *(Admin)* — Active items with stock < 5.

---

## 12. PostgreSQL Schema & Historical Pricing Architecture

```sql
-- Native ENUMs
CREATE TYPE user_role_enum AS ENUM ('customer', 'admin');
CREATE TYPE order_status_enum AS ENUM ('pending', 'paid', 'shipped', 'cancelled');

-- Users
CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  current_price NUMERIC(12, 2) NOT NULL CHECK (current_price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  category VARCHAR(100) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status order_status_enum NOT NULL DEFAULT 'pending',
  shipping_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Order Items (Historical Snapshot)
CREATE TABLE order_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_at_purchase NUMERIC(12, 2) NOT NULL CHECK (unit_price_at_purchase >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (order_id, product_id)
);
```

---

## 13. ACID Checkout Transaction Engine

Checkout is executed in `server/src/services/checkoutService.js` inside a strict PostgreSQL transaction:

```
  1. BEGIN TRANSACTION
  2. SELECT ... FROM products WHERE id = ANY(...) ORDER BY id ASC FOR UPDATE;
     --> Locks product rows deterministically, preventing race conditions.
  3. Validate product existence, active status, and requested quantities <= stock_quantity.
  4. INSERT INTO orders (user_id, status, shipping_address) VALUES (...);
  5. For each item:
     - INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
       VALUES (..., current_price_from_database);
     - UPDATE products SET stock_quantity = stock_quantity - quantity
       WHERE id = ... AND stock_quantity >= quantity;
  6. PostgreSQL trigger recalculates orders.total_amount atomically.
  7. Verify total matches expected cents invariant.
  8. COMMIT TRANSACTION
```

If any check fails (e.g. stock shortfall or inactive product), a `ROLLBACK` is immediately executed. Zero partial orders or orphaned inventory deductions can ever occur.

---

## 14. Automated Database Triggers (`order_items` ➔ `orders`)

Order totals are maintained exclusively by PostgreSQL PL/pgSQL triggers:

```sql
CREATE OR REPLACE FUNCTION fn_maintain_order_total()
RETURNS TRIGGER AS $$
DECLARE
  v_target_order_id BIGINT;
  v_old_order_id    BIGINT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_target_order_id := OLD.order_id;
  ELSE
    v_target_order_id := NEW.order_id;
  END IF;

  -- Lock the order row to serialize concurrent order item modifications
  PERFORM 1 FROM orders WHERE id = v_target_order_id FOR UPDATE;

  UPDATE orders
  SET
    total_amount = COALESCE(
      (SELECT SUM(quantity::NUMERIC * unit_price_at_purchase)::NUMERIC(12, 2)
       FROM order_items
       WHERE order_id = v_target_order_id),
      0
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_target_order_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_maintain_order_total
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION fn_maintain_order_total();
```

---

## 15. Advanced SQL Analytics (CTEs, Window Functions & Views)

### Top Spenders View (`vw_top_spenders`)
Calculates customer lifetime spend across realized sales (`paid` and `shipped`), strictly using historical purchase prices:
```sql
CREATE OR REPLACE VIEW vw_top_spenders AS
WITH realized_orders AS (
  SELECT o.id AS order_id, o.user_id,
    SUM(oi.quantity::NUMERIC * oi.unit_price_at_purchase)::NUMERIC(14, 2) AS order_total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY o.id, o.user_id
),
customer_totals AS (
  SELECT u.id AS customer_id, u.name AS customer_name, u.email AS customer_email,
    COALESCE(SUM(r.order_total), 0)::NUMERIC(14, 2) AS total_spent,
    COUNT(r.order_id)::INTEGER AS qualifying_orders
  FROM users u
  LEFT JOIN realized_orders r ON r.user_id = u.id
  WHERE u.role = 'customer'
  GROUP BY u.id, u.name, u.email
)
SELECT customer_id, customer_name, customer_email, total_spent, qualifying_orders
FROM customer_totals
ORDER BY total_spent DESC, customer_id ASC
LIMIT 5;
```

### Monthly Revenue Growth View (`vw_monthly_revenue`)
Employs `generate_series`, `LAG()`, and running window totals:
```sql
CREATE OR REPLACE VIEW vw_monthly_revenue AS
...
SELECT
  revenue_month,
  monthly_revenue,
  previous_month_revenue,
  CASE
    WHEN previous_month_revenue IS NULL OR previous_month_revenue = 0 THEN NULL
    ELSE ROUND(((monthly_revenue - previous_month_revenue) / previous_month_revenue) * 100, 2)
  END AS month_over_month_growth_pct,
  SUM(monthly_revenue) OVER (
    ORDER BY revenue_month
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  )::NUMERIC(14, 2) AS cumulative_revenue
FROM with_previous
ORDER BY revenue_month;
```

### Low Stock View (`vw_low_stock`)
```sql
CREATE OR REPLACE VIEW vw_low_stock AS
SELECT id, name, category, stock_quantity, current_price, is_active, updated_at
FROM products
WHERE is_active = TRUE AND stock_quantity < 5
ORDER BY stock_quantity ASC, name ASC;
```

---

## 16. Security Architecture & CSRF/Cookie Handling

- **Authentication**: JWT token signed with HMAC-SHA256, transmitted in an `HttpOnly`, `SameSite=Lax` cookie. JavaScript cannot access the session token.
- **CSRF Defense**: Double-Submit Cookie Pattern. A cryptographically random token is generated on login and verified on all state-changing endpoints (`POST`, `PUT`, `PATCH`, `DELETE`).
- **Role Verification**: Server-side middleware verifies `req.user.role === 'admin'` before allowing product modifications, stock updates, or order status changes.
- **SQL Injection Immunization**: 100% of queries use parameterized placeholders (`$1`, `$2`). No dynamic SQL string concatenation is permitted.
