import { query } from '../config/db.js';
import { notFoundError } from '../utils/errors.js';
import { paginationMeta } from '../utils/pagination.js';

const PRODUCT_COLUMNS = `
  p.id, p.name, p.description, p.current_price, p.stock_quantity,
  p.category, p.image_url, p.is_active, p.created_at, p.updated_at
`;

export function mapProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    currentPrice: Number(row.current_price),
    stockQuantity: row.stock_quantity,
    category: row.category,
    imageUrl: row.image_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SORT_SQL = {
  newest: 'p.created_at DESC, p.id DESC',
  name_asc: 'lower(p.name) ASC, p.id ASC',
  name_desc: 'lower(p.name) DESC, p.id DESC',
  price_asc: 'p.current_price ASC, p.id ASC',
  price_desc: 'p.current_price DESC, p.id DESC',
};

export async function listProducts({ page, limit, q, category, sort, availability, includeInactive }) {
  const conditions = [];
  const params = [];

  if (!includeInactive) {
    conditions.push('p.is_active = TRUE');
  }
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR COALESCE(p.description, '') ILIKE $${params.length})`);
  }
  if (category) {
    if (category.toLowerCase() === 'streetwear') {
      conditions.push(`p.category IN ('Lifestyle', 'Skateboarding', 'Streetwear')`);
    } else {
      params.push(category);
      conditions.push(`p.category ILIKE $${params.length}`);
    }
  }
  if (availability === 'in_stock') {
    conditions.push('p.stock_quantity > 0');
  } else if (availability === 'out_of_stock') {
    conditions.push('p.stock_quantity = 0');
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::INTEGER AS total FROM products p ${whereSql}`,
    params
  );

  const dataParams = [...params, limit, (page - 1) * limit];
  const dataResult = await query(
    `SELECT ${PRODUCT_COLUMNS}
     FROM products p
     ${whereSql}
     ORDER BY ${SORT_SQL[sort] || SORT_SQL.newest}
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  const total = countResult.rows[0].total;
  return {
    products: dataResult.rows.map(mapProduct),
    pagination: paginationMeta({ page, limit, total }),
  };
}

export async function listCategories() {
  const { rows } = await query(
    `SELECT category, COUNT(*)::INTEGER AS product_count
     FROM products
     WHERE is_active = TRUE
     GROUP BY category
     ORDER BY category ASC`
  );
  return rows.map((row) => ({ name: row.category, productCount: row.product_count }));
}

export async function getProductById(id, { includeInactive = false } = {}) {
  const { rows } = await query(
    `SELECT ${PRODUCT_COLUMNS}
     FROM products p
     WHERE p.id = $1 ${includeInactive ? '' : 'AND p.is_active = TRUE'}`,
    [id]
  );
  if (!rows[0]) throw notFoundError('Product not found.');
  return mapProduct(rows[0]);
}

export async function createProduct(data) {
  const { rows } = await query(
    `INSERT INTO products
       (name, description, current_price, stock_quantity, category, image_url, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, description, current_price, stock_quantity, category,
               image_url, is_active, created_at, updated_at`,
    [
      data.name,
      data.description,
      data.current_price,
      data.stock_quantity,
      data.category,
      data.image_url,
      data.is_active,
    ]
  );
  return mapProduct(rows[0]);
}

export async function updateProduct(id, changes) {
  const entries = Object.entries(changes);
  const setSql = entries.map(([column], index) => `${column} = $${index + 1}`).join(', ');
  const params = entries.map(([, value]) => value);
  params.push(id);

  const { rows } = await query(
    `UPDATE products
     SET ${setSql}
     WHERE id = $${params.length}
     RETURNING id, name, description, current_price, stock_quantity, category,
               image_url, is_active, created_at, updated_at`,
    params
  );
  if (!rows[0]) throw notFoundError('Product not found.');
  return mapProduct(rows[0]);
}

/**
 * Soft delete: products referenced by historical order_items must never be
 * removed. Deactivation keeps history and revenue intact.
 */
export async function deactivateProduct(id) {
  const { rows } = await query(
    `UPDATE products
     SET is_active = FALSE
     WHERE id = $1
     RETURNING id, name, description, current_price, stock_quantity, category,
               image_url, is_active, created_at, updated_at`,
    [id]
  );
  if (!rows[0]) throw notFoundError('Product not found.');
  return mapProduct(rows[0]);
}
