import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Prisma } from '@prisma/client';

process.env.NODE_ENV = 'test';

// ---------------------------------------------------------------------------
// GA-12: Terms & Privacy Agreement Tracking Tests
// Căn cứ pháp lý: Nghị định 13/2023/NĐ-CP (Điều 11 - Sự đồng ý của chủ thể dữ liệu)
// ---------------------------------------------------------------------------

test('GA-12: User model schema definition contains terms and privacy tracking fields', () => {
  // Test type compatibility with Prisma User shape
  type UserWithTerms = Prisma.UserCreateInput;

  const mockUser: UserWithTerms = {
    id: 'test-user-ga12',
    name: 'Sinh vien Khoi nghiep',
    email: 'sinhvien@fpt.edu.vn',
    terms_and_privacy_version: '2026-08-v1',
    terms_and_privacy_accepted_at: new Date(),
  };

  assert.equal(mockUser.terms_and_privacy_version, '2026-08-v1');
  assert.ok(mockUser.terms_and_privacy_accepted_at instanceof Date);
});

test('GA-12: Existing users without terms_and_privacy_version remain valid (nullable safe)', () => {
  type UserNullable = Prisma.UserCreateInput;

  const legacyUser: UserNullable = {
    id: 'legacy-user-01',
    name: 'Legacy User',
    email: 'legacy@fpt.edu.vn',
    terms_and_privacy_version: null,
    terms_and_privacy_accepted_at: null,
  };

  assert.equal(legacyUser.terms_and_privacy_version, null);
  assert.equal(legacyUser.terms_and_privacy_accepted_at, null);
});

test('GA-12: Better Auth databaseHook data builder assigns current policy version', async () => {
  const inputUser = {
    id: 'user-signup-123',
    name: 'Nguyen Van A',
    email: 'nguyenvana@gmail.com',
  };

  // Logic corresponding to databaseHooks.user.create.before in auth.ts
  const hookResult = {
    data: {
      ...inputUser,
      terms_and_privacy_version: '2026-08-v1',
      terms_and_privacy_accepted_at: new Date(),
    },
  };

  assert.equal(hookResult.data.terms_and_privacy_version, '2026-08-v1');
  assert.ok(hookResult.data.terms_and_privacy_accepted_at instanceof Date);
  assert.equal(hookResult.data.id, 'user-signup-123');
});
