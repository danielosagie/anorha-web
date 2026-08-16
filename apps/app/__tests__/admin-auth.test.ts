import { describe, expect, it } from 'vitest';
import { isAdminClerkUserId, parseAdminClerkUserIds } from '../lib/admin-auth';

describe('admin allowlist', () => {
  it('fails closed when unset or empty', () => {
    expect(isAdminClerkUserId('user_founder', undefined)).toBe(false);
    expect(isAdminClerkUserId('user_founder', '')).toBe(false);
    expect(isAdminClerkUserId('user_founder', ' , ')).toBe(false);
  });

  it('requires an exact Clerk user id match', () => {
    expect(
      isAdminClerkUserId('user_founder', 'user_other, user_founder ')
    ).toBe(true);
    expect(isAdminClerkUserId('user_found', 'user_founder')).toBe(false);
    expect(isAdminClerkUserId(null, 'user_founder')).toBe(false);
  });

  it('trims and removes blank entries', () => {
    expect([...parseAdminClerkUserIds(' user_one, ,user_two ')]).toEqual([
      'user_one',
      'user_two',
    ]);
  });
});
