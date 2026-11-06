/**
 * Store-wide commercial rules. Keep these values in sync with
 * client/src/utils/shipping.js; the server remains the source of truth when an
 * order is placed.
 */
export const DELIVERY_FEE = 450;
export const FREE_DELIVERY_THRESHOLD = 10000;

export const DELIVERY_FEE_CENTS = Math.round(DELIVERY_FEE * 100);
export const FREE_DELIVERY_THRESHOLD_CENTS = Math.round(FREE_DELIVERY_THRESHOLD * 100);

export function calculateDeliveryFeeCents(subtotalCents) {
  return subtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS ? 0 : DELIVERY_FEE_CENTS;
}
