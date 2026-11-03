import { Router } from 'express';
import { postCheckout } from '../controllers/checkoutController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole('customer'),
  verifyCsrf,
  postCheckout
);

export default router;
