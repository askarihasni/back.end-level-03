-- ===========================================================================
-- 002_triggers.sql
-- Updated-at triggers and the authoritative order-total trigger.
--
-- Concurrency strategy for order totals
-- -------------------------------------
-- Every recalculation first takes a row-level lock on the affected `orders`
-- row (SELECT ... FOR UPDATE), then computes
--   SUM(order_items.quantity * order_items.unit_price_at_purchase)
-- and writes the result back to orders.total_amount.
--
-- Because the order row is the serialization point, two concurrent
-- transactions that insert/update/delete items for the same order cannot
-- produce a stale total: the second trigger waits for the first transaction,
-- then re-reads all committed items before writing its own total. When an item
-- moves between two orders, both order rows are locked in ascending id order
-- to avoid deadlocks.
-- ===========================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Keep updated_at current on mutable tables.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON users;
CREATE TRIGGER trg_users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_products_set_updated_at ON products;
CREATE TRIGGER trg_products_set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_set_updated_at ON orders;
CREATE TRIGGER trg_orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- Recalculate one order total from its items.
-- The SUM uses NUMERIC arithmetic (never floating point). If no items remain,
-- COALESCE turns the empty SUM into exact zero.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_recalculate_order_total(p_order_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_total NUMERIC(12, 2);
BEGIN
  -- Serialization point for concurrent item changes on this order.
  PERFORM 1
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Orders are never hard-deleted by the application, but guard anyway.
    RETURN;
  END IF;

  SELECT COALESCE(SUM(quantity::NUMERIC * unit_price_at_purchase), 0)::NUMERIC(12, 2)
  INTO v_total
  FROM order_items
  WHERE order_id = p_order_id;

  UPDATE orders
  SET total_amount = v_total
  WHERE id = p_order_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Single trigger function for INSERT, relevant UPDATE and DELETE.
-- The trigger definition below limits UPDATE firing to monetary/identity
-- columns so unrelated updates do not cause needless recalculation.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_order_items_sync_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM fn_recalculate_order_total(NEW.order_id);
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    PERFORM fn_recalculate_order_total(OLD.order_id);
    RETURN OLD;

  ELSE -- UPDATE
    IF NEW.order_id = OLD.order_id THEN
      PERFORM fn_recalculate_order_total(NEW.order_id);
    ELSE
      -- Lock both rows in a deterministic order to prevent deadlocks.
      IF OLD.order_id < NEW.order_id THEN
        PERFORM fn_recalculate_order_total(OLD.order_id);
        PERFORM fn_recalculate_order_total(NEW.order_id);
      ELSE
        PERFORM fn_recalculate_order_total(NEW.order_id);
        PERFORM fn_recalculate_order_total(OLD.order_id);
      END IF;
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_sync_order_total ON order_items;
CREATE TRIGGER trg_order_items_sync_order_total
  AFTER INSERT OR DELETE OR UPDATE OF order_id, product_id, quantity, unit_price_at_purchase
  ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_order_items_sync_order_total();

COMMIT;
