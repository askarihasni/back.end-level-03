import { oneOf, positiveInteger, validationError } from './common.js';

export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'cancelled'];

export function validateOrderId(value) {
  return positiveInteger(value, 'order id', { min: 1 });
}

export function validateStatus(value) {
  return oneOf(value, 'status', ORDER_STATUSES);
}

export function validateOrderListQuery(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  const status = query.status && query.status !== 'all' ? validateStatus(query.status) : '';
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 120) : '';
  return { page, limit, status, q };
}

export function validateStatusUpdate(body) {
  if (!body || typeof body !== 'object') {
    throw validationError('body', 'A JSON request body is required.');
  }
  return { status: validateStatus(body.status) };
}
