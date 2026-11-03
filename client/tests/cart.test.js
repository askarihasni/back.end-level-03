import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CART_STORAGE_KEY,
  addToCart,
  cartTotals,
  hasUnavailableItems,
  normalizeStoredItems,
  removeFromCart,
  toCheckoutItems,
  updateCartQuantity,
} from '../src/utils/cart.js';

function product(overrides = {}) {
  return {
    id: 10,
    name: 'Test Product',
    currentPrice: 1500,
    imageUrl: '/images/fallback.svg',
    category: 'Test',
    stockQuantity: 8,
    ...overrides,
  };
}

describe('normalizeStoredItems', () => {
  test('returns an empty array for non-array input', () => {
    assert.deepEqual(normalizeStoredItems(null), []);
    assert.deepEqual(normalizeStoredItems({}), []);
    assert.deepEqual(normalizeStoredItems('[]'), []);
  });

  test('drops malformed entries, missing names and duplicate product ids', () => {
    const items = normalizeStoredItems([
      null,
      'nope',
      { productId: 1 },
      { productId: 0, name: 'Zero id' },
      { productId: 2, name: '' },
      { productId: 3, name: 'First', price: 10, stockQuantity: 5, quantity: 2 },
      { productId: 3, name: 'Duplicate', price: 99, stockQuantity: 5, quantity: 4 },
    ]);

    assert.equal(items.length, 1);
    assert.equal(items[0].productId, 3);
    assert.equal(items[0].name, 'First');
    assert.equal(items[0].quantity, 2);
  });

  test('sanitises numeric fields, defaults and clamps quantities to stock', () => {
    const [item] = normalizeStoredItems([
      {
        productId: '7',
        name: 'Sanitised',
        price: '-12.5',
        stockQuantity: '4',
        quantity: '99',
        imageUrl: 123,
        category: 42,
      },
    ]);

    assert.equal(item.productId, 7);
    assert.equal(item.price, 0, 'negative prices become zero');
    assert.equal(item.stockQuantity, 4);
    assert.equal(item.quantity, 4, 'quantity is capped at available stock');
    assert.equal(item.imageUrl, null);
    assert.equal(item.category, 'General');
  });

  test('invalid quantities become one and out-of-stock entries keep quantity one', () => {
    const items = normalizeStoredItems([
      { productId: 1, name: 'Bad qty', price: 5, stockQuantity: 10, quantity: 'abc' },
      { productId: 2, name: 'Sold out', price: 5, stockQuantity: 0, quantity: 5 },
      { productId: 3, name: 'Huge stock', price: 5, stockQuantity: 5000, quantity: 5000 },
    ]);

    assert.equal(items[0].quantity, 1);
    assert.equal(items[1].quantity, 1);
    assert.equal(items[2].quantity, 999, 'hard cap of 999 per line');
  });

  test('truncates over-long names to 200 characters', () => {
    const [item] = normalizeStoredItems([
      { productId: 1, name: 'x'.repeat(500), stockQuantity: 5, quantity: 1 },
    ]);
    assert.equal(item.name.length, 200);
  });

  test('exposes a stable storage key', () => {
    assert.equal(CART_STORAGE_KEY, 'nexa_cart_v1');
  });
});

describe('addToCart', () => {
  test('refuses to add an out-of-stock product without changing the cart', () => {
    const items = [];
    const result = addToCart(items, product({ stockQuantity: 0 }));
    assert.equal(result.added, 0);
    assert.equal(result.items, items);
    assert.match(result.message, /out of stock/i);
  });

  test('adds a new line with a numeric price and defaults quantity to one', () => {
    const items = [];
    const result = addToCart(items, product({ currentPrice: '2500' }), 0);

    assert.equal(result.added, 1);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].productId, 10);
    assert.equal(result.items[0].price, 2500);
    assert.equal(result.items[0].quantity, 1);
    assert.equal(result.items[0].category, 'Test');
    assert.equal(items.length, 0, 'input array must not be mutated');
  });

  test('increments an existing line but never above available stock', () => {
    const first = addToCart([], product({ stockQuantity: 5 }), 3);
    const second = addToCart(first.items, product({ stockQuantity: 5 }), 99);

    assert.equal(second.items[0].quantity, 5);
    assert.equal(second.added, 2);

    const third = addToCart(second.items, product({ stockQuantity: 5 }), 1);
    assert.equal(third.added, 0);
    assert.match(third.message, /maximum available stock/i);
  });

  test('accepts fractional quantity strings by parsing their integer part', () => {
    const result = addToCart([], product({ stockQuantity: 10 }), '2.9');
    assert.equal(result.items[0].quantity, 2);
  });
});

describe('updateCartQuantity and removeFromCart', () => {
  const base = [
    { productId: 1, price: 10, stockQuantity: 5, quantity: 2 },
    { productId: 2, price: 20, stockQuantity: 3, quantity: 1 },
  ];

  test('updates only the matching line and clamps to 1..stock', () => {
    const high = updateCartQuantity(base, 1, 99);
    assert.equal(high[0].quantity, 5);
    assert.equal(high[1].quantity, 1);
    assert.equal(base[0].quantity, 2, 'input array must not be mutated');

    const low = updateCartQuantity(base, 2, 0);
    assert.equal(low[1].quantity, 1);

    const invalid = updateCartQuantity(base, 2, 'abc');
    assert.equal(invalid[1].quantity, 1);
  });

  test('unknown product ids leave the cart untouched', () => {
    const next = updateCartQuantity(base, 999, 4);
    assert.deepEqual(next, base);
  });

  test('removes the matching line only', () => {
    const next = removeFromCart(base, 1);
    assert.equal(next.length, 1);
    assert.equal(next[0].productId, 2);
    assert.deepEqual(removeFromCart(base, 999), base);
  });
});

describe('cartTotals', () => {
  test('returns zeros for an empty cart', () => {
    assert.deepEqual(cartTotals([]), { itemCount: 0, lineCount: 0, subtotal: 0 });
  });

  test('sums quantities and line totals with two-decimal rounding', () => {
    const totals = cartTotals([
      { productId: 1, price: 19.99, quantity: 3 },
      { productId: 2, price: 0.1, quantity: 3 },
    ]);

    assert.equal(totals.itemCount, 6);
    assert.equal(totals.lineCount, 2);
    assert.equal(totals.subtotal, 60.27, '59.97 + 0.3 rounded to two decimals');
  });

  test('coerces string prices and missing quantities safely', () => {
    const totals = cartTotals([
      { productId: 1, price: '100', quantity: '2' },
      { productId: 2, price: 'bad', quantity: 1 },
    ]);
    assert.equal(totals.itemCount, 3);
    assert.equal(totals.subtotal, 200);
  });
});

describe('toCheckoutItems', () => {
  test('merges duplicate product lines and sends only id + quantity', () => {
    const payload = toCheckoutItems([
      { productId: 4, quantity: 2, price: 100, name: 'A' },
      { productId: 4, quantity: 3, price: 1, name: 'A tampered' },
      { productId: 5, quantity: 1, price: 999 },
    ]);

    assert.deepEqual(payload, [
      { productId: 4, quantity: 5 },
      { productId: 5, quantity: 1 },
    ]);
    assert.ok(payload.every((line) => Object.keys(line).sort().join(',') === 'productId,quantity'));
  });
});

describe('hasUnavailableItems', () => {
  test('detects out-of-stock lines and quantities above stock', () => {
    assert.equal(hasUnavailableItems([]), false);
    assert.equal(
      hasUnavailableItems([{ stockQuantity: 5, quantity: 5 }]),
      false
    );
    assert.equal(
      hasUnavailableItems([{ stockQuantity: 0, quantity: 1 }]),
      true
    );
    assert.equal(
      hasUnavailableItems([{ stockQuantity: 2, quantity: 3 }]),
      true
    );
  });
});
