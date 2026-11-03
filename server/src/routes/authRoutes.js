import { Router } from 'express';
import {
  csrf,
  login,
  logout,
  me,
  register,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.get('/csrf', csrf);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', verifyCsrf, logout);
router.get('/me', requireAuth, me);

export default router;
