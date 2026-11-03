import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatMonth,
  statusLabel,
  stockLabel,
} from '../src/utils/format.js';

describe('formatCurrency (PKR)', () => {
  test('uses the Rs. prefix with en-PK grouping', () => {
    assert.equal(formatCurrency(0), 'Rs. 0');
    assert.equal(formatCurrency(1234.5), 'Rs. 1,234.5');
    assert.equal(formatCurrency(1_681_467), 'Rs. 1,681,467');
  });

  test('rounds to at most two decimal places', () => {
    assert.equal(formatCurrency(19.999), 'Rs. 20');
    assert.equal(formatCurrency(19.994), 'Rs. 19.99');
  });

  test('falls back to Rs. 0 for null, undefined and non-numeric input', () => {
    assert.equal(formatCurrency(null), 'Rs. 0');
    assert.equal(formatCurrency(undefined), 'Rs. 0');
    assert.equal(formatCurrency('not-a-number'), 'Rs. 0');
  });

  test('accepts numeric strings from the API', () => {
    assert.equal(formatCurrency('1250.00'), 'Rs. 1,250');
  });
});

describe('date and month formatting', () => {
  test('formats a valid date as day, short month and year', () => {
    assert.equal(formatDate('2026-01-15T12:00:00'), '15 Jan 2026');
  });

  test('returns an em dash for empty or invalid dates', () => {
    assert.equal(formatDate(''), '—');
    assert.equal(formatDate(null), '—');
    assert.equal(formatDate('not-a-date'), '—');
  });

  test('formats date and time for admin tables', () => {
    const formatted = formatDateTime('2026-01-15T12:00:00');
    assert.match(formatted, /15 Jan 2026/);
    assert.match(formatted, /\d{1,2}:\d{2}/);
    assert.equal(formatDateTime('bad'), '—');
  });

  test('formats an ISO month value in UTC', () => {
    assert.equal(formatMonth('2026-01-15'), 'Jan 2026');
    assert.equal(formatMonth('2025-12-01'), 'Dec 2025');
    assert.equal(formatMonth(''), '—');
    assert.equal(formatMonth('2026-13-01'), '—');
  });
});

describe('statusLabel', () => {
  test('maps every database status to a display label', () => {
    assert.equal(statusLabel('pending'), 'Pending');
    assert.equal(statusLabel('paid'), 'Paid');
    assert.equal(statusLabel('shipped'), 'Shipped');
    assert.equal(statusLabel('cancelled'), 'Cancelled');
  });

  test('passes unknown values through unchanged', () => {
    assert.equal(statusLabel('archived'), 'archived');
  });
});

describe('stockLabel', () => {
  test('describes out-of-stock and low-stock thresholds', () => {
    assert.equal(stockLabel(0), 'Out of stock');
    assert.equal(stockLabel(-2), 'Out of stock');
    assert.equal(stockLabel(1), 'Only 1 left');
    assert.equal(stockLabel(4), 'Only 4 left');
    assert.equal(stockLabel(5), 'Low stock · 5 left');
    assert.equal(stockLabel(9), 'Low stock · 9 left');
    assert.equal(stockLabel(10), 'In stock');
  });

  test('treats missing values as out of stock', () => {
    assert.equal(stockLabel(undefined), 'Out of stock');
    assert.equal(stockLabel('abc'), 'Out of stock');
  });
});
