import {
  allowedNextStatuses,
  updateOrderStatus,
} from '../services/adminOrderService.js';
import { getAdminOrderDetail, listAdminOrders } from '../services/orderService.js';
import { asyncHandler } from '../utils/errors.js';
import { validateOrderId, validateOrderListQuery, validateStatusUpdate } from '../validators/order.validators.js';

export const getOrders = asyncHandler(async (req, res) => {
  const params = validateOrderListQuery(req.query);
  const result = await listAdminOrders(params);
  res.json(result);
});

export const getOrder = asyncHandler(async (req, res) => {
  const orderId = validateOrderId(req.params.id);
  const order = await getAdminOrderDetail(orderId);
  res.json({ order, allowedNextStatuses: allowedNextStatuses(order.status) });
});

export const patchStatus = asyncHandler(async (req, res) => {
  const orderId = validateOrderId(req.params.id);
  const { status } = validateStatusUpdate(req.body);
  const result = await updateOrderStatus(orderId, status);
  res.json({
    ...result,
    allowedNextStatuses: allowedNextStatuses(result.order.status),
  });
});
