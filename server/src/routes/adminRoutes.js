import { Router } from 'express';
import { dashboard, lowStock, revenue, topSpenders } from '../controllers/analyticsController.js';
import { getOrder, getOrders, patchStatus } from '../controllers/adminOrderController.js';
import { uploadImage } from '../controllers/uploadController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

// Every admin route requires a valid admin session. CSRF is checked on writes.
router.use(requireAuth, requireAdmin, verifyCsrf);

router.get('/dashboard', dashboard);
router.get('/analytics/dashboard', dashboard);
router.get('/analytics/top-spenders', topSpenders);
router.get('/analytics/revenue', revenue);
router.get('/analytics/low-stock', lowStock);

router.get('/orders', getOrders);
router.get('/orders/:id', getOrder);
router.patch('/orders/:id/status', patchStatus);

router.post('/upload', uploadImage);

export default router;
