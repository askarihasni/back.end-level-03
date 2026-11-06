/**
 * Store-wide shipping rules shown in the storefront. The server applies the
 * same rules when it creates an order, so these values are an estimate only.
 */
export const DELIVERY_FEE = 450;
export const FREE_DELIVERY_THRESHOLD = 10000;

export function calculateDeliveryFee(subtotal) {
  const value = Number(subtotal);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}
