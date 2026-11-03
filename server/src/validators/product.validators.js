import {
  money,
  nonNegativeInteger,
  optionalBoolean,
  optionalString,
  requiredString,
  safeImageUrl,
  validationError,
} from './common.js';

export function validateProductCreate(body) {
  return {
    name: requiredString(body?.name, 'name', { min: 2, max: 200 }),
    description: optionalString(body?.description, 'description', { max: 5000 }),
    current_price: money(body?.current_price, 'current_price'),
    stock_quantity: nonNegativeInteger(body?.stock_quantity, 'stock_quantity'),
    category: requiredString(body?.category, 'category', { min: 2, max: 100 }),
    image_url: safeImageUrl(body?.image_url),
    is_active: optionalBoolean(body?.is_active, 'is_active') ?? true,
  };
}

const FIELD_MAP = {
  name: 'name',
  description: 'description',
  current_price: 'current_price',
  stock_quantity: 'stock_quantity',
  category: 'category',
  image_url: 'image_url',
  is_active: 'is_active',
};

export function validateProductUpdate(body, { partial = true } = {}) {
  if (!body || typeof body !== 'object') {
    throw validationError('body', 'A JSON request body is required.');
  }

  const parsed = {};
  if (!partial) {
    const full = validateProductCreate(body);
    return full;
  }

  if (body.name !== undefined) parsed.name = requiredString(body.name, 'name', { min: 2, max: 200 });
  if (body.description !== undefined) {
    parsed.description = optionalString(body.description, 'description', { max: 5000 });
  }
  if (body.current_price !== undefined) parsed.current_price = money(body.current_price, 'current_price');
  if (body.stock_quantity !== undefined) {
    parsed.stock_quantity = nonNegativeInteger(body.stock_quantity, 'stock_quantity');
  }
  if (body.category !== undefined) {
    parsed.category = requiredString(body.category, 'category', { min: 2, max: 100 });
  }
  if (body.image_url !== undefined) parsed.image_url = safeImageUrl(body.image_url);
  if (body.is_active !== undefined) parsed.is_active = optionalBoolean(body.is_active, 'is_active');

  const keys = Object.keys(parsed);
  if (!keys.length) {
    throw validationError('body', 'At least one editable product field is required.');
  }
  for (const key of keys) {
    if (!(key in FIELD_MAP)) delete parsed[key];
  }
  return parsed;
}

const PRODUCT_SORTS = ['newest', 'name_asc', 'name_desc', 'price_asc', 'price_desc'];
const AVAILABILITY = ['all', 'in_stock', 'out_of_stock'];

export function validateProductListQuery(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 12));
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 200) : '';
  const category = typeof query.category === 'string' ? query.category.trim().slice(0, 100) : '';
  const sort = PRODUCT_SORTS.includes(query.sort) ? query.sort : 'newest';
  const availability = AVAILABILITY.includes(query.availability) ? query.availability : 'all';
  return { page, limit, q, category, sort, availability };
}

export { PRODUCT_SORTS, AVAILABILITY };
