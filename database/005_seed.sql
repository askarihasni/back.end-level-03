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
      ('Nike Air Max 270',
       'Max Air 270 unit delivers unrivaled, all-day comfort. Sleek, running-inspired design roots you to iconic Nike sport heritage.',
       12400.00, 12, 'Lifestyle', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Ultraboost 5x Performance',
       'Engineered for maximum energy return with Light BOOST midsole, Primeknit upper, and Continental Rubber outsole.',
       11400.00, 25, 'Running', 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80', TRUE),

      ('PUMA Pounce LiteRoad',
       'Lightweight responsive road running shoe with NITRO foam cushioning and aerodynamic breathable mesh.',
       10990.00, 8, 'Running', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Air Jordan 14 Retro Ferrari',
       'Ferrari-inspired design with dual Zoom Air units and premium full-grain leather for explosive court cuts.',
       25700.00, 3, 'Basketball', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80', TRUE),

      ('New Balance 530 Classic White',
       'Classic 2000s running shoe aesthetic with ABZORB heel cushioning for everyday retro streetwear.',
       7000.00, 18, 'Lifestyle', 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Nike Zoom Fly 5 Carbon',
       'Carbon-infused flyplate with ZoomX foam for durable tempo runs and race-day marathon pacing.',
       14500.00, 40, 'Running', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80', TRUE),

      ('NEXORA Aeroflow Flagship Sneaker',
       'Dynamic cushion propulsion, breathable engineered upper, and high-impact energy return with neon sole accents.',
       12400.00, 4, 'Running', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Nike Dunk Low Retro Panda',
       'Iconic two-tone black and white leather upper with padded collar and grippy skate rubber traction.',
       13500.00, 0, 'Skateboarding', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Asics Gel-Kayano 30 Stability',
       '4D GUIDANCE SYSTEM for adaptive stability and PureGEL cushioning for smooth long-distance runs.',
       16800.00, 35, 'Running', 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Under Armour Curry 11 Flow',
       'Dual-density UA Flow cushioning for super-light ground feel, bounce, and insane court grip.',
       18900.00, 14, 'Basketball', 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Vans Knu Skool Puffy Skate',
       '90s reissue with puffy tongue, 3D molded Sidestripe, and signature waffle gum traction soles.',
       7500.00, 30, 'Skateboarding', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Salomon XT-6 Gore-Tex Trail',
       'Ultra-distance trail running shoe with waterproof GORE-TEX membrane and Agile Chassis System.',
       19800.00, 2, 'Lifestyle', 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Nike Pro Dri-FIT Compression Top',
       'Tight, stretchy compression layer with Dri-FIT moisture-wicking technology for intense gym training.',
       4200.00, 22, 'Training', 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Adidas Tiro 24 Track Pants',
       'Slim-fit athletic pants with AEROREADY moisture fabric and ankle zips for football and gym training.',
       5600.00, 5, 'Training', 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Puma Velocity Nitro 3 Sprint',
       'Versatile daily trainer with explosive NITRO foam and durable PUMAGRIP all-weather traction.',
       11800.00, 6, 'Running', 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Jordan Jumpman Pro Gym Backpack',
       'Water-resistant durable 25 L basketball gym backpack with dedicated ball/sneaker compartment.',
       6900.00, 16, 'Accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Garmin Forerunner 265 GPS Watch',
       'Brilliant AMOLED touchscreen sports watch with training readiness metrics and multi-band GPS.',
       48900.00, 9, 'Wearables', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Nike Elite Crew Basketball Socks',
       'Targeted cushioning at key pressure points with arch band support and Dri-FIT ventilation.',
       1800.00, 28, 'Accessories', 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Theragun Mini 2.0 Recovery Device',
       'Pocket-sized portable percussive therapy device for post-run muscle recovery and athletic relief.',
       19900.00, 4, 'Training', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Hydro Flask 32 oz Trail Flask',
       'Ultralight double-wall vacuum insulated stainless steel water bottle for runners and gym sessions.',
       4500.00, 11, 'Accessories', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80', TRUE),

      ('Air Jordan 1 High OG Chicago',
       'The legendary 1985 classic high-top basketball sneaker in full-grain leather. Currently retired from storefront.',
       32000.00, 7, 'Lifestyle', 'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?auto=format&fit=crop&w=800&q=80', FALSE);
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
    SELECT v_order, p.id, 1, 12000.00 FROM products p WHERE p.name = 'Nike Air Max 270';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 2, 6800.00 FROM products p WHERE p.name = 'New Balance 530 Classic White';

    -- 2. Bilal - Feb 2026 - paid
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-02-25 14:40:00+05', 'paid'
    FROM users WHERE email = 'bilal@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 11400.00 FROM products p WHERE p.name = 'Ultraboost 5x Performance';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 2, 16500.00 FROM products p WHERE p.name = 'Asics Gel-Kayano 30 Stability';

    -- 3. Sara - Mar 2026 - shipped
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-03-08 09:05:00+05', 'shipped'
    FROM users WHERE email = 'sara@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 2, 10990.00 FROM products p WHERE p.name = 'PUMA Pounce LiteRoad';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 18900.00 FROM products p WHERE p.name = 'Under Armour Curry 11 Flow';

    -- 4. Usman - Mar 2026 - cancelled (excluded from revenue analytics)
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-03-19 18:20:00+05', 'cancelled'
    FROM users WHERE email = 'usman@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 7000.00 FROM products p WHERE p.name = 'New Balance 530 Classic White';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 12400.00 FROM products p WHERE p.name = 'NEXORA Aeroflow Flagship Sneaker';

    -- 5. Zara - Apr 2026 - paid
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-04-04 12:10:00+05', 'paid'
    FROM users WHERE email = 'zara@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 3, 14500.00 FROM products p WHERE p.name = 'Nike Zoom Fly 5 Carbon';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 48900.00 FROM products p WHERE p.name = 'Garmin Forerunner 265 GPS Watch';

    -- 6. Ayesha - May 2026 - shipped
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-05-17 16:30:00+05', 'shipped'
    FROM users WHERE email = 'ayesha@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 25700.00 FROM products p WHERE p.name = 'Air Jordan 14 Retro Ferrari';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 7500.00 FROM products p WHERE p.name = 'Vans Knu Skool Puffy Skate';

    -- 7. Bilal - Jun 2026 - pending (not realized revenue)
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-06-02 11:45:00+05', 'pending'
    FROM users WHERE email = 'bilal@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 2, 6900.00 FROM products p WHERE p.name = 'Jordan Jumpman Pro Gym Backpack';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 3, 4200.00 FROM products p WHERE p.name = 'Nike Pro Dri-FIT Compression Top';

    -- 8. Sara - Jun 2026 - shipped
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-06-21 15:20:00+05', 'shipped'
    FROM users WHERE email = 'sara@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 11800.00 FROM products p WHERE p.name = 'Puma Velocity Nitro 3 Sprint';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 2, 5600.00 FROM products p WHERE p.name = 'Adidas Tiro 24 Track Pants';

    -- 9. Usman - Jul 2026 - paid
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-07-09 13:05:00+05', 'paid'
    FROM users WHERE email = 'usman@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 11400.00 FROM products p WHERE p.name = 'Ultraboost 5x Performance';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 16800.00 FROM products p WHERE p.name = 'Asics Gel-Kayano 30 Stability';

    -- 10. Zara - Jul 2026 - shipped
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-07-28 10:50:00+05', 'shipped'
    FROM users WHERE email = 'zara@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 2, 19900.00 FROM products p WHERE p.name = 'Theragun Mini 2.0 Recovery Device';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 6900.00 FROM products p WHERE p.name = 'Jordan Jumpman Pro Gym Backpack';

    -- 11. Ayesha - Aug 2026 - paid
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-08-15 17:35:00+05', 'paid'
    FROM users WHERE email = 'ayesha@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 12400.00 FROM products p WHERE p.name = 'Nike Air Max 270';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 19800.00 FROM products p WHERE p.name = 'Salomon XT-6 Gore-Tex Trail';

    -- 12. Bilal - Sep 2026 - shipped
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-09-06 09:25:00+05', 'shipped'
    FROM users WHERE email = 'bilal@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 7000.00 FROM products p WHERE p.name = 'New Balance 530 Classic White';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 13500.00 FROM products p WHERE p.name = 'Nike Dunk Low Retro Panda';

    -- 13. Sara - Sep 2026 - pending
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-09-24 14:15:00+05', 'pending'
    FROM users WHERE email = 'sara@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 48900.00 FROM products p WHERE p.name = 'Garmin Forerunner 265 GPS Watch';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 1800.00 FROM products p WHERE p.name = 'Nike Elite Crew Basketball Socks';

    -- 14. Usman - Oct 2026 - shipped
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-10-03 11:40:00+05', 'shipped'
    FROM users WHERE email = 'usman@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 10990.00 FROM products p WHERE p.name = 'PUMA Pounce LiteRoad';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 18900.00 FROM products p WHERE p.name = 'Under Armour Curry 11 Flow';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 7500.00 FROM products p WHERE p.name = 'Vans Knu Skool Puffy Skate';

    -- 15. Zara - Oct 2026 - paid
    INSERT INTO orders (user_id, order_date, status)
    SELECT id, TIMESTAMPTZ '2026-10-18 19:00:00+05', 'paid'
    FROM users WHERE email = 'zara@example.com'
    RETURNING id INTO v_order;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 2, 14500.00 FROM products p WHERE p.name = 'Nike Zoom Fly 5 Carbon';
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_at_purchase)
    SELECT v_order, p.id, 1, 12400.00 FROM products p WHERE p.name = 'NEXORA Aeroflow Flagship Sneaker';

  END IF;
END $$;

ANALYZE users;
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;

COMMIT;
