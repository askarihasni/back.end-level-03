import { positiveInteger, validationError } from './common.js';

/**
 * Validates only product IDs and quantities. Any client-supplied price,
 * unit_price_at_purchase or total_amount is intentionally ignored.
 * Duplicate product entries are merged, and the result is sorted by product ID
 * so database row locks are always acquired in a consistent order.
 */
export function validateCheckout(body) {
  if (!body || !Array.isArray(body.items)) {
    throw validationError('items', 'Cart items must be an array.');
  }
  if (body.items.length === 0) {
    throw validationError('items', 'Your cart is empty.');
  }
  if (body.items.length > 50) {
    throw validationError('items', 'A single order can contain at most 50 distinct products.');
  }

  const merged = new Map();
  for (let index = 0; index < body.items.length; index += 1) {
    const item = body.items[index];
    if (!item || typeof item !== 'object') {
      throw validationError(`items[${index}]`, 'Each cart item must be an object.');
    }
    const productId = positiveInteger(item.productId ?? item.product_id, `items[${index}].productId`);
    const quantity = positiveInteger(item.quantity, `items[${index}].quantity`, { min: 1, max: 999 });
    const existing = merged.get(productId) ?? 0;
    const combined = existing + quantity;
    if (combined > 999) {
      throw validationError(
        `items[${index}].quantity`,
        `Total quantity for product ${productId} cannot exceed 999.`
      );
    }
    merged.set(productId, combined);
  }

  return Array.from(merged.entries())
    .map(([productId, quantity]) => ({ productId, quantity }))
    .sort((a, b) => a.productId - b.productId);
}
