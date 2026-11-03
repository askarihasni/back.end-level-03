export const CART_STORAGE_KEY = 'nexa_cart_v1';
const MAX_QUANTITY = 999;

function toPositiveInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clampQuantity(quantity, stockQuantity) {
  const stock = Number.isFinite(Number(stockQuantity)) ? Math.max(0, Number(stockQuantity)) : 0;
  const upper = stock > 0 ? Math.min(stock, MAX_QUANTITY) : 1;
  return Math.max(1, Math.min(toPositiveInt(quantity, 1), upper));
}

export function normalizeStoredItems(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const items = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const productId = toPositiveInt(entry.productId);
    if (!productId || seen.has(productId)) continue;
    const name = typeof entry.name === 'string' ? entry.name.slice(0, 200) : '';
    if (!name) continue;
    seen.add(productId);
    items.push({
      productId,
      name,
      price: Math.max(0, Number(entry.price) || 0),
      imageUrl: typeof entry.imageUrl === 'string' ? entry.imageUrl : null,
      category: typeof entry.category === 'string' ? entry.category : 'General',
      stockQuantity: Math.max(0, Number(entry.stockQuantity) || 0),
      quantity: clampQuantity(entry.quantity, entry.stockQuantity),
    });
  }
  return items;
}

export function addToCart(items, product, quantity = 1) {
  const stock = Math.max(0, Number(product.stockQuantity) || 0);
  if (stock <= 0) {
    return { items, added: 0, message: 'This product is out of stock.' };
  }

  const index = items.findIndex((item) => item.productId === product.id);
  const existing = index >= 0 ? items[index] : null;
  const current = existing?.quantity ?? 0;
  const nextQuantity = Math.min(stock, current + Math.max(1, toPositiveInt(quantity, 1)));
  const added = nextQuantity - current;

  if (added <= 0) {
    return { items, added: 0, message: `You already have the maximum available stock in your cart.` };
  }

  const nextItem = {
    productId: product.id,
    name: product.name,
    price: Number(product.currentPrice) || 0,
    imageUrl: product.imageUrl || null,
    category: product.category || 'General',
    stockQuantity: stock,
    quantity: nextQuantity,
  };

  const nextItems = index >= 0
    ? items.map((item, itemIndex) => (itemIndex === index ? nextItem : item))
    : [...items, nextItem];

  return { items: nextItems, added };
}

export function updateCartQuantity(items, productId, quantity) {
  return items.map((item) => {
    if (item.productId !== productId) return item;
    return { ...item, quantity: clampQuantity(quantity, item.stockQuantity) };
  });
}

export function removeFromCart(items, productId) {
  return items.filter((item) => item.productId !== productId);
}

export function cartTotals(items) {
  const safeItems = Array.isArray(items) ? items : [];
  const totals = safeItems.reduce(
    (accumulator, item) => {
      const quantity = toPositiveInt(item?.quantity, 0);
      const rawPrice = Number(item?.price);
      const price = Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : 0;
      accumulator.itemCount += quantity;
      accumulator.lineCount += 1;
      accumulator.subtotal += price * quantity;
      return accumulator;
    },
    { itemCount: 0, lineCount: 0, subtotal: 0 }
  );
  return {
    ...totals,
    subtotal: Math.round(totals.subtotal * 100) / 100,
  };
}

/**
 * Sends only product IDs and quantities. Prices and totals are intentionally
 * omitted so the server can revalidate and use database values.
 */
export function toCheckoutItems(items) {
  const merged = new Map();
  for (const item of items) {
    merged.set(item.productId, (merged.get(item.productId) || 0) + item.quantity);
  }
  return Array.from(merged.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

export function hasUnavailableItems(items) {
  return items.some((item) => item.stockQuantity <= 0 || item.quantity > item.stockQuantity);
}
