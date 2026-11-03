import { Router } from 'express';
import { getMyOrder, getMyOrders } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getMyOrders);
router.get('/my-orders', getMyOrders);
router.get('/:id', getMyOrder);

export default router;
