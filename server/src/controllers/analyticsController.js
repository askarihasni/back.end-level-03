import {
  getDashboard,
  getLowStock,
  getMonthlyRevenue,
  getTopSpenders,
} from '../services/analyticsService.js';
import { asyncHandler } from '../utils/errors.js';

export const dashboard = asyncHandler(async (_req, res) => {
  res.json(await getDashboard());
});

export const topSpenders = asyncHandler(async (_req, res) => {
  res.json({
    spenders: await getTopSpenders(),
    revenueRule: 'Paid and shipped orders only; cancelled and pending orders are excluded.',
  });
});

export const revenue = asyncHandler(async (_req, res) => {
  res.json({
    months: await getMonthlyRevenue(),
    revenueRule: 'Realized revenue: paid and shipped orders, historical purchase prices, by order date.',
  });
});

export const lowStock = asyncHandler(async (_req, res) => {
  res.json({ products: await getLowStock() });
});
