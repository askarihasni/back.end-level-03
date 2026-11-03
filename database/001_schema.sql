-- ===========================================================================
-- 001_schema.sql
-- Smart E-Commerce & Order Fulfillment System
-- Core schema: ENUMs, tables, constraints, foreign keys and indexes.
--
-- This script is idempotent where practical. It never deletes existing data.
-- Run with: npm run db:init  (from the server folder)
-- ===========================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Native PostgreSQL ENUM types
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE user_role_enum AS ENUM ('customer', 'admin');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE order_status_enum AS ENUM ('pending', 'paid', 'shipped', 'cancelled');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ---------------------------------------------------------------------------
-- users
-- Email addresses are stored lower-case and are additionally protected by a
-- UNIQUE index on lower(email), so case-only duplicates cannot be created.
-- password_hash stores a bcrypt hash. Plain-text passwords are never stored.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name           VARCHAR(120) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  password_hash  TEXT NOT NULL,
  role           user_role_enum NOT NULL DEFAULT 'customer',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_email_not_blank CHECK (length(trim(email)) > 0),
  CONSTRAINT users_email_is_lowercase CHECK (email = lower(email)),
  CONSTRAINT users_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT users_password_hash_not_blank CHECK (length(password_hash) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower
  ON users (lower(email));

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  current_price   NUMERIC(12, 2) NOT NULL,
  stock_quantity  INTEGER NOT NULL DEFAULT 0,
  category        VARCHAR(100) NOT NULL,
  image_url       TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT products_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT products_category_not_blank CHECK (length(trim(category)) > 0),
  CONSTRAINT products_price_non_negative CHECK (current_price >= 0),
  CONSTRAINT products_stock_non_negative CHECK (stock_quantity >= 0)
);

CREATE INDEX IF NOT EXISTS idx_products_name_lower ON products (lower(name));
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_active_name ON products (is_active, lower(name));
CREATE INDEX IF NOT EXISTS idx_products_active_price ON products (is_active, current_price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products (stock_quantity);

-- ---------------------------------------------------------------------------
-- orders
-- One user can have many orders. Orders are never hard-deleted by the app.
-- total_amount is authoritative and maintained by the trigger in 002.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_date    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_amount  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status        order_status_enum NOT NULL DEFAULT 'pending',
  shipping_address TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT orders_total_non_negative CHECK (total_amount >= 0)
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders (order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_date ON orders (user_id, order_date DESC);

-- ---------------------------------------------------------------------------
-- order_items
-- unit_price_at_purchase is a historical snapshot of products.current_price at
-- checkout time. It must never be derived from the current product price when
-- reporting revenue.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id                BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  product_id              BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity                INTEGER NOT NULL,
  unit_price_at_purchase  NUMERIC(12, 2) NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT order_items_unit_price_non_negative CHECK (unit_price_at_purchase >= 0),
  -- A product can appear only once per order. The checkout service merges
  -- repeated cart entries for the same product before inserting.
  CONSTRAINT order_items_order_product_unique UNIQUE (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);

COMMIT;
