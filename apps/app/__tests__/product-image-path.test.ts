import { expect, test } from 'vitest';
import { buildProductImagePath } from '../app/(authenticated)/products/new/product-image-path';

const INTERNAL_USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const RAW_CLERK_USER_ID = 'user_2abc123';

test('uses the internal user UUID as the product image prefix', () => {
  const path = buildProductImagePath({
    extension: 'jpg',
    index: 0,
    internalUserId: INTERNAL_USER_ID,
    now: 1_723_808_000_000,
    objectId: '987e6543-e21b-42d3-a456-426614174000',
  });
  const [prefix] = path.split('/');

  expect(prefix).toBe(INTERNAL_USER_ID);
  expect(prefix).not.toBe(RAW_CLERK_USER_ID);
  expect(path).not.toContain(RAW_CLERK_USER_ID);
});
