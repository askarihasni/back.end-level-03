import {
  createProduct,
  deactivateProduct,
  getProductById,
  listCategories,
  listProducts,
  updateProduct,
} from '../services/productService.js';
import { asyncHandler } from '../utils/errors.js';
import { positiveInteger } from '../validators/common.js';
import {
  validateProductCreate,
  validateProductListQuery,
  validateProductUpdate,
} from '../validators/product.validators.js';

export const getProducts = asyncHandler(async (req, res) => {
  const params = validateProductListQuery(req.query);
  const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'admin';
  const result = await listProducts({ ...params, includeInactive });
  res.json(result);
});

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await listCategories();
  res.json({ categories });
});

export const getProduct = asyncHandler(async (req, res) => {
  const id = positiveInteger(req.params.id, 'product id');
  const includeInactive = req.user?.role === 'admin';
  const product = await getProductById(id, { includeInactive });
  res.json({ product });
});

export const postProduct = asyncHandler(async (req, res) => {
  const input = validateProductCreate(req.body);
  const product = await createProduct(input);
  res.status(201).json({ product });
});

export const putProduct = asyncHandler(async (req, res) => {
  const id = positiveInteger(req.params.id, 'product id');
  const input = validateProductUpdate(req.body, { partial: false });
  const product = await updateProduct(id, input);
  res.json({ product });
});

export const patchProduct = asyncHandler(async (req, res) => {
  const id = positiveInteger(req.params.id, 'product id');
  const input = validateProductUpdate(req.body, { partial: true });
  const product = await updateProduct(id, input);
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const id = positiveInteger(req.params.id, 'product id');
  const product = await deactivateProduct(id);
  res.json({
    product,
    message: 'Product deactivated. Historical order records were preserved.',
  });
});
