-- ===========================================================================
-- 003_views.sql
-- Low-stock view used by the admin dashboard.
--
-- A PostgreSQL view does not guarantee row order, so API queries always add
-- ORDER BY stock_quantity ASC, name ASC. A view is used (rather than a table)
-- so the result is always current. Zero-stock products have stock_status
-- 'out_of_stock' for clear identification in the UI.
-- ===========================================================================

BEGIN;

CREATE OR REPLACE VIEW vw_low_stock AS
SELECT
  p.id              AS product_id,
  p.name            AS product_name,
  p.category        AS category,
  p.stock_quantity  AS stock_quantity,
  p.current_price   AS current_price,
  p.is_active       AS is_active,
  p.image_url       AS image_url,
  CASE
    WHEN p.stock_quantity = 0 THEN 'out_of_stock'
    ELSE 'low_stock'
  END               AS stock_status
FROM products p
WHERE p.stock_quantity < 5;

COMMIT;
