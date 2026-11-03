-- ===========================================================================
-- 005_seed.sql
-- Development/demonstration data only.
--
-- Safe idempotency:
--   * users are inserted with ON CONFLICT (email) DO NOTHING;
--   * products are inserted only if the products table is empty;
--   * orders/order_items are inserted only if the orders table is empty.
-- No existing rows are deleted or updated.
--
-- Credentials (development only - never reuse in production):
--   Admin:    admin@shop.pk    / Admin@12345
--   Customer: ayesha@example.com / Customer@123
--   Customer: bilal@example.com  / Customer@123
--   Customer: sara@example.com   / Customer@123
--   Customer: usman@example.com  / Customer@123
--   Customer: zara@example.com   / Customer@123
--
-- The password hashes below are bcrypt cost-10 hashes of the passwords above.
-- Historical unit prices intentionally differ from some current prices to prove
-- that revenue is based on unit_price_at_purchase, not products.current_price.
-- ===========================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Hamza Malik',  'admin@shop.pk',       '$2b$10$stu/8KKWeFVhw.Kjz7s.buherwgSQrW9KkENvpl/7De0YzwJjrc0y', 'admin'),
  ('Ayesha Khan',  'ayesha@example.com',  '$2b$10$xUndkrMd7LLaX.MA/SPwz.Q/R.iNOXcwlRZVUvPC.0VVl.sU8kuBO', 'customer'),
  ('Bilal Ahmed',  'bilal@example.com',   '$2b$10$xUndkrMd7LLaX.MA/SPwz.Q/R.iNOXcwlRZVUvPC.0VVl.sU8kuBO', 'customer'),
  ('Sara Iqbal',   'sara@example.com',    '$2b$10$xUndkrMd7LLaX.MA/SPwz.Q/R.iNOXcwlRZVUvPC.0VVl.sU8kuBO', 'customer'),
  ('Usman Raza',   'usman@example.com',   '$2b$10$xUndkrMd7LLaX.MA/SPwz.Q/R.iNOXcwlRZVUvPC.0VVl.sU8kuBO', 'customer'),
  ('Zara Sheikh',  'zara@example.com',    '$2b$10$xUndkrMd7LLaX.MA/SPwz.Q/R.iNOXcwlRZVUvPC.0VVl.sU8kuBO', 'customer')
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Products (20 active + 1 inactive for admin demonstration)
-- Local SVG assets are served by the Vite frontend from /public/images.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products) THEN
    INSERT INTO products
      (name, description, current_price, stock_quantity, category, image_url, is_active)
    VALUES
      ('AeroBook Pro 14 Laptop',
       'A lightweight 14-inch productivity laptop with an aluminium chassis, 16 GB memory and an all-day battery.',
       289999.00, 12, 'Electronics', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Nova X Smartphone',
       'A 6.5-inch OLED smartphone with a dual camera system, 256 GB storage and fast charging.',
       189999.00, 25, 'Electronics', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80', TRUE),

      ('PixelView 27" Monitor',
       'A colour-accurate 27-inch QHD monitor with slim bezels and a height-adjustable stand.',
       74999.00, 8, 'Electronics', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80', TRUE),

      ('NanoStream Mini PC',
       'A compact desktop computer for home offices, media centres and light creative work.',
       135000.00, 3, 'Electronics', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Aurora Wireless Headphones',
       'Over-ear wireless headphones with active noise cancellation and 40-hour battery life.',
       34999.00, 18, 'Audio', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Pulse Buds Pro',
       'True wireless earbuds with transparency mode, wireless charging and a pocketable case.',
       18999.00, 40, 'Audio', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80', TRUE),

      ('EchoLite Bluetooth Speaker',
       'A portable water-resistant speaker with rich bass and a 12-hour battery.',
       12999.00, 4, 'Audio', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80', TRUE),

      ('StudioOne USB Microphone',
       'A cardioid USB condenser microphone for podcasting, streaming and voice recording.',
       21999.00, 0, 'Audio', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Volta 20K Power Bank',
       'A 20,000 mAh power bank with USB-C power delivery and dual-device charging.',
       8999.00, 35, 'Accessories', 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=800&q=80', TRUE),

      ('SwiftKey Mechanical Keyboard',
       'A hot-swappable mechanical keyboard with tactile switches and a compact 75% layout.',
       15999.00, 14, 'Accessories', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Glide Pro Wireless Mouse',
       'An ergonomic wireless mouse with silent switches and adjustable DPI.',
       7499.00, 30, 'Accessories', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80', TRUE),

      ('HubMaster USB-C Dock',
       'An 8-in-1 USB-C dock with HDMI, Ethernet, card readers and 100 W pass-through charging.',
       11999.00, 2, 'Accessories', 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Lumen Desk Lamp',
       'A dimmable LED desk lamp with warm-to-cool colour temperature control.',
       6499.00, 22, 'Home & Living', 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Aura Smart Diffuser',
       'A quiet ultrasonic diffuser with timer settings and a soft ambient light.',
       5499.00, 5, 'Home & Living', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80', TRUE),

      ('PureAir Mini Purifier',
       'A compact HEPA air purifier designed for bedrooms and small workspaces.',
       24999.00, 6, 'Home & Living', 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Urban Canvas Backpack',
       'A water-resistant 22 L backpack with a padded laptop sleeve and hidden pocket.',
       9999.00, 16, 'Fashion', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Meridian Steel Watch',
       'A minimalist stainless-steel watch with sapphire glass and a leather strap.',
       27999.00, 9, 'Fashion', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Everyday Linen Shirt',
       'A breathable relaxed-fit linen shirt for everyday wear.',
       4999.00, 28, 'Fashion', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80', TRUE),

      ('FlexFit Yoga Mat',
       'A non-slip 6 mm yoga mat with alignment markings and a carry strap.',
       3999.00, 4, 'Sports', 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80', TRUE),

      ('TrailRun Hydration Pack',
       'A lightweight 8 L running pack with a 1.5 L hydration bladder and reflective trim.',
       8499.00, 11, 'Sports', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Classic Leather Wallet',
       'A slim bifold wallet in full-grain leather. Currently retired from the storefront.',
       3999.00, 7, 'Accessories', 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80', FALSE);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Historical orders and order items.
-- Totals are NOT hard-coded: the trigger in 002 calculates them from items.
-- Multiple months and every order status are represented for analytics demos.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_order BIGINT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM orders) THEN

    -- 1. Ayesha - Feb 2026 - shipped
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-02-11 10:15:00+05', 'shipped'
    FROM users WHERE email = 'ayesha@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 274999.00 FROM products p WHERE p.name = 'AeroBook Pro 14 Laptop';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 2, 32999.00 FROM products p WHERE p.name = 'Aurora Wireless Headphones';

    -- 2. Bilal - Feb 2026 - paid
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-02-25 14:40:00+05', 'paid'
    FROM users WHERE email = 'bilal@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 184999.00 FROM products p WHERE p.name = 'Nova X Smartphone';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 2, 8499.00 FROM products p WHERE p.name = 'Volta 20K Power Bank';

    -- 3. Sara - Mar 2026 - shipped
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-03-08 09:05:00+05', 'shipped'
    FROM users WHERE email = 'sara@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 2, 71999.00 FROM products p WHERE p.name = 'PixelView 27" Monitor';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 14999.00 FROM products p WHERE p.name = 'SwiftKey Mechanical Keyboard';

    -- 4. Usman - Mar 2026 - cancelled (excluded from revenue analytics)
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-03-19 18:20:00+05', 'cancelled'
    FROM users WHERE email = 'usman@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 34999.00 FROM products p WHERE p.name = 'Aurora Wireless Headphones';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 12499.00 FROM products p WHERE p.name = 'EchoLite Bluetooth Speaker';

    -- 5. Zara - Apr 2026 - paid
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-04-04 12:10:00+05', 'paid'
    FROM users WHERE email = 'zara@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 3, 17999.00 FROM products p WHERE p.name = 'Pulse Buds Pro';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 26999.00 FROM products p WHERE p.name = 'Meridian Steel Watch';

    -- 6. Ayesha - May 2026 - shipped
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-05-17 16:30:00+05', 'shipped'
    FROM users WHERE email = 'ayesha@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 129999.00 FROM products p WHERE p.name = 'NanoStream Mini PC';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 6999.00 FROM products p WHERE p.name = 'Glide Pro Wireless Mouse';

    -- 7. Bilal - Jun 2026 - pending (not realized revenue)
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-06-02 11:45:00+05', 'pending'
    FROM users WHERE email = 'bilal@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 2, 9499.00 FROM products p WHERE p.name = 'Urban Canvas Backpack';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 3, 4499.00 FROM products p WHERE p.name = 'Everyday Linen Shirt';

    -- 8. Sara - Jun 2026 - shipped
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-06-21 15:20:00+05', 'shipped'
    FROM users WHERE email = 'sara@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 23999.00 FROM products p WHERE p.name = 'PureAir Mini Purifier';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 2, 6199.00 FROM products p WHERE p.name = 'Lumen Desk Lamp';

    -- 9. Usman - Jul 2026 - paid
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-07-09 13:05:00+05', 'paid'
    FROM users WHERE email = 'usman@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 189999.00 FROM products p WHERE p.name = 'Nova X Smartphone';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 8999.00 FROM products p WHERE p.name = 'Volta 20K Power Bank';

    -- 10. Zara - Jul 2026 - shipped
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-07-28 10:50:00+05', 'shipped'
    FROM users WHERE email = 'zara@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 2, 3799.00 FROM products p WHERE p.name = 'FlexFit Yoga Mat';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 9999.00 FROM products p WHERE p.name = 'Urban Canvas Backpack';

    -- 11. Ayesha - Aug 2026 - paid
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-08-15 17:35:00+05', 'paid'
    FROM users WHERE email = 'ayesha@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 289999.00 FROM products p WHERE p.name = 'AeroBook Pro 14 Laptop';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 11999.00 FROM products p WHERE p.name = 'HubMaster USB-C Dock';

    -- 12. Bilal - Sep 2026 - shipped
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-09-06 09:25:00+05', 'shipped'
    FROM users WHERE email = 'bilal@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 34999.00 FROM products p WHERE p.name = 'Aurora Wireless Headphones';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 21999.00 FROM products p WHERE p.name = 'StudioOne USB Microphone';

    -- 13. Sara - Sep 2026 - pending
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-09-24 14:15:00+05', 'pending'
    FROM users WHERE email = 'sara@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 27999.00 FROM products p WHERE p.name = 'Meridian Steel Watch';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 4999.00 FROM products p WHERE p.name = 'Everyday Linen Shirt';

    -- 14. Usman - Oct 2026 - shipped
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-10-03 11:40:00+05', 'shipped'
    FROM users WHERE email = 'usman@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 74999.00 FROM products p WHERE p.name = 'PixelView 27" Monitor';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 15999.00 FROM products p WHERE p.name = 'SwiftKey Mechanical Keyboard';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 7499.00 FROM products p WHERE p.name = 'Glide Pro Wireless Mouse';

    -- 15. Zara - Oct 2026 - paid
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-10-18 19:00:00+05', 'paid'
    FROM users WHERE email = 'zara@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 2, 18999.00 FROM products p WHERE p.name = 'Pulse Buds Pro';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 12999.00 FROM products p WHERE p.name = 'EchoLite Bluetooth Speaker';

  END IF;
END $$;

ANALYZE users;
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;

COMMIT;
