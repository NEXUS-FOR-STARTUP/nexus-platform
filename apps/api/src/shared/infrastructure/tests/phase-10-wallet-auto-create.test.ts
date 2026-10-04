import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../../db.js';
import { walletService } from '../../../modules/wallet/application/wallet.service.js';
import { InsufficientBalanceError } from '../../../modules/wallet/domain/wallet.types.js';

process.env.NODE_ENV = 'test';

// ---------------------------------------------------------------------------
// Wallet auto-create: user chưa có ví thì withdraw/refund/payForOrder TỰ TẠO
// ví balance 0 (get-or-create) thay vì throw WALLET_NOT_FOUND.
// Mock prisma singleton bằng direct assignment (Prisma Proxy không t.mock được).
// ---------------------------------------------------------------------------

type FakeTx = {
  $queryRaw: (...args: unknown[]) => Promise<unknown>;
  userWallet: {
    create: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
  walletTransaction: { create: (args: unknown) => Promise<unknown> };
  domainEventOutbox: { create: (args: unknown) => Promise<unknown> };
};

type MockablePrisma = {
  $transaction: (cb: (tx: unknown) => Promise<unknown>) => Promise<unknown>;
};

const mockablePrisma = prisma as unknown as MockablePrisma;

function makeFakeTx(initialWallet: { id: string; balance: number } | null) {
  const createCalls: Array<{ data: Record<string, unknown> }> = [];
  const txnCalls: Array<{ data: Record<string, unknown> }> = [];
  const updateCalls: Array<{ data: Record<string, unknown> }> = [];
  const fakeTx: FakeTx = {
    $queryRaw: async () => (initialWallet ? [initialWallet] : []),
    userWallet: {
      create: async (args: unknown) => {
        createCalls.push(args as { data: Record<string, unknown> });
        return { id: 'w-new', balance: 0 };
      },
      update: async (args: unknown) => {
        updateCalls.push(args as { data: Record<string, unknown> });
        return { id: 'w-1', balance: 0 };
      },
    },
    walletTransaction: {
      create: async (args: unknown) => {
        txnCalls.push(args as { data: Record<string, unknown> });
        return { id: 't-1' };
      },
    },
    domainEventOutbox: {
      create: async () => ({ id: 'ev-1' }),
    },
  };
  return { fakeTx, createCalls, txnCalls, updateCalls };
}

test('wallet auto-create — withdraw user chưa có ví: tự tạo ví rồi InsufficientBalance (không còn WALLET_NOT_FOUND)', async () => {
  const { fakeTx, createCalls } = makeFakeTx(null);
  const originalTransaction = mockablePrisma.$transaction;
  mockablePrisma.$transaction = (cb: (tx: unknown) => Promise<unknown>) => cb(fakeTx);
  try {
    await assert.rejects(
      () => walletService.withdraw('user-1', 39000, 'key-1'),
      (err: unknown) => {
        assert.ok(err instanceof InsufficientBalanceError);
        assert.equal((err as InsufficientBalanceError).code, 'INSUFFICIENT_BALANCE');
        assert.deepEqual((err as InsufficientBalanceError).details, { current: 0, required: 39000 });
        return true;
      },
    );
  } finally {
    mockablePrisma.$transaction = originalTransaction;
  }

  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0].data.user_id, 'user-1');
  assert.equal(createCalls[0].data.balance, 0);
});

test('wallet auto-create — withdraw ví đủ tiền: không tạo ví, trừ tiền đúng', async () => {
  const { fakeTx, createCalls, txnCalls, updateCalls } = makeFakeTx({ id: 'w-1', balance: 50000 });
  const originalTransaction = mockablePrisma.$transaction;
  mockablePrisma.$transaction = (cb: (tx: unknown) => Promise<unknown>) => cb(fakeTx);
  try {
    await walletService.withdraw('user-1', 39000, 'key-2');
  } finally {
    mockablePrisma.$transaction = originalTransaction;
  }

  assert.equal(createCalls.length, 0);
  assert.equal(txnCalls.length, 1);
  assert.equal(txnCalls[0].data.type, 'withdrawal');
  assert.equal(txnCalls[0].data.balance_before, 50000);
  assert.equal(txnCalls[0].data.balance_after, 11000);
  assert.equal(updateCalls[0].data.balance, 11000);
});

test('wallet auto-create — refund (tx path) user chưa có ví: tự tạo ví, không throw', async () => {
  const { fakeTx, createCalls, txnCalls } = makeFakeTx(null);
  const tx = fakeTx as unknown as Prisma.TransactionClient;

  await walletService.refund('user-1', 5000, 'admin_veto', 'case-1', 'key-3', tx);

  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0].data.user_id, 'user-1');
  assert.equal(txnCalls.length, 1);
  assert.equal(txnCalls[0].data.type, 'refund');
  assert.equal(txnCalls[0].data.balance_after, 5000);
});

test('wallet auto-create — payForOrder (tx path) user chưa có ví: tự tạo ví rồi InsufficientBalanceError', async () => {
  const { fakeTx, createCalls } = makeFakeTx(null);
  const tx = fakeTx as unknown as Prisma.TransactionClient;

  await assert.rejects(
    () => walletService.payForOrder('user-1', 39000, 'order-1', 'key-pay-1', tx),
    (err: unknown) => {
      assert.ok(err instanceof InsufficientBalanceError);
      assert.equal(err.code, 'INSUFFICIENT_BALANCE');
      assert.deepEqual(err.details, { current: 0, required: 39000 });
      return true;
    },
  );

  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0].data.user_id, 'user-1');
});

test('wallet auto-create — payForOrder (tx path) ví đủ tiền: trừ tiền đúng và tạo transaction service_payment', async () => {
  const { fakeTx, createCalls, txnCalls, updateCalls } = makeFakeTx({ id: 'w-1', balance: 50000 });
  const tx = fakeTx as unknown as Prisma.TransactionClient;

  await walletService.payForOrder('user-1', 39000, 'order-1', 'key-pay-2', tx);

  assert.equal(createCalls.length, 0);
  assert.equal(txnCalls.length, 1);
  assert.equal(txnCalls[0].data.type, 'service_payment');
  assert.equal(txnCalls[0].data.amount, -39000);
  assert.equal(txnCalls[0].data.balance_before, 50000);
  assert.equal(txnCalls[0].data.balance_after, 11000);
  assert.equal(updateCalls[0].data.balance, 11000);
});

test('wallet auto-create — payForOrder (non-tx path) ví đủ tiền: chạy qua prisma.$transaction', async () => {
  const { fakeTx, createCalls, txnCalls, updateCalls } = makeFakeTx({ id: 'w-1', balance: 100000 });
  const originalTransaction = mockablePrisma.$transaction;
  mockablePrisma.$transaction = (cb: (tx: unknown) => Promise<unknown>) => cb(fakeTx);

  try {
    await walletService.payForOrder('user-1', 39000, 'order-2', 'key-pay-3');
  } finally {
    mockablePrisma.$transaction = originalTransaction;
  }

  assert.equal(createCalls.length, 0);
  assert.equal(txnCalls.length, 1);
  assert.equal(txnCalls[0].data.type, 'service_payment');
  assert.equal(txnCalls[0].data.amount, -39000);
  assert.equal(txnCalls[0].data.balance_after, 61000);
  assert.equal(updateCalls[0].data.balance, 61000);
});
