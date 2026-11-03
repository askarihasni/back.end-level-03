import { checkout } from '../services/checkoutService.js';
import { asyncHandler } from '../utils/errors.js';
import { validateCheckout } from '../validators/checkout.validators.js';

export const postCheckout = asyncHandler(async (req, res) => {
  const items = validateCheckout(req.body);
  const shippingAddress = req.body?.shippingAddress || req.body?.shipping_address || null;
  const order = await checkout(req.user.id, items, shippingAddress);
  res.status(201).json({ order });
});
