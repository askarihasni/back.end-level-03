import { getOrderForUser, listMyOrders } from '../services/orderService.js';
import { asyncHandler } from '../utils/errors.js';
import { validateOrderId, validateOrderListQuery } from '../validators/order.validators.js';

export const getMyOrders = asyncHandler(async (req, res) => {
  const params = validateOrderListQuery(req.query);
  const result = await listMyOrders(req.user.id, params);
  res.json(result);
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const orderId = validateOrderId(req.params.id);
  const order = await getOrderForUser(req.user.id, orderId);
  res.json({ order });
});
