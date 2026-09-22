import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotal, formatOrderStatus } from '../src/utils/orderUtils.js';

test('calculateOrderTotal sums item totals correctly', () => {
  const items = [
    { price: 20, quantity: 2 },
    { price: 15, quantity: 1 },
  ];

  assert.equal(calculateOrderTotal(items), 55);
});

test('formatOrderStatus returns a readable label', () => {
  assert.equal(formatOrderStatus('paid'), 'Paid');
  assert.equal(formatOrderStatus('shipped'), 'Shipped');
});
