import { Router } from 'express';
import {
  deleteProduct,
  getCategories,
  getProduct,
  getProducts,
  patchProduct,
  postProduct,
  putProduct,
} from '../controllers/productController.js';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js';
import { verifyCsrf } from '../middleware/csrf.js';
import { uploadImage } from '../controllers/uploadController.js';

const router = Router();
const adminOnly = [requireAuth, requireAdmin, verifyCsrf];

router.get('/', optionalAuth, getProducts);
router.get('/categories', getCategories);
router.get('/:id', optionalAuth, getProduct);

router.post('/upload', ...adminOnly, uploadImage);
router.post('/', ...adminOnly, postProduct);
router.put('/:id', ...adminOnly, putProduct);
router.patch('/:id', ...adminOnly, patchProduct);
router.delete('/:id', ...adminOnly, deleteProduct);

export default router;
