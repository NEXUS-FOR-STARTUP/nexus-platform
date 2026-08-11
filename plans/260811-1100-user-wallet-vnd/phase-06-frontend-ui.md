# Phase 06 — Frontend UI

- Priority: P2 | Status: Done | Effort: 3h
- Depends: Phase 02 (WalletService API), Phase 03 (top-up flow), Phase 04 (service catalog)
- Blocks: —

## Overview

Xây dựng trang Ví (Wallet) cho user: hiển thị số dư, lịch sử giao dịch, nạp tiền qua SePay.

**Nguyên tắc:** Mantine UI v9, Lucide React icons, TanStack Query, Vietnamese-first UI. Không hardcode giá.

## Pages & Components

```
apps/web-1/app/dashboard/wallet/
├── page.tsx                        # Trang chính
├── _components/
│   ├── WalletBalanceCard.tsx       # Card hiển thị số dư VND
│   ├── WalletTopupModal.tsx        # Modal nạp tiền (nhập amount → QR + bank info)
│   ├── WalletTransactionList.tsx   # Danh sách giao dịch (filter, pagination)
│   └── WalletTransactionItem.tsx   # 1 dòng giao dịch
```

## API Hooks

```typescript
// apps/web-1/app/dashboard/wallet/hooks/useWallet.ts

import { apiClient } from '@/lib/api-client';
import { useQuery, useMutation } from '@tanstack/react-query';

export function useWalletBalance() {
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => apiClient.get('/wallet/balance').then(r => r.data),
    refetchInterval: 30_000, // Poll 30s
  });
}

export function useWalletHistory(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['wallet', 'history', limit, offset],
    queryFn: () => apiClient.get('/wallet/history', { params: { limit, offset } }).then(r => r.data),
  });
}

export function useCreateTopup() {
  return useMutation({
    mutationFn: (amount: number) =>
      apiClient.post('/wallet/topups', { amount }).then(r => r.data),
  });
}
```

## WalletBalanceCard.tsx

```tsx
// Card hiển thị số dư — đơn giản, dùng Mantine Paper + Group + Text

import { Paper, Group, Text, Skeleton } from '@mantine/core';
import { Wallet } from 'lucide-react';
import { useWalletBalance } from '../hooks/useWallet';

export function WalletBalanceCard() {
  const { data, isLoading } = useWalletBalance();

  return (
    <Paper p="md" withBorder>
      <Group gap="xs">
        <Wallet size={24} />
        <Text size="sm" c="dimmed">Số dư ví</Text>
      </Group>
      {isLoading ? (
        <Skeleton height={40} mt="sm" />
      ) : (
        <Text size="xl" fw={700} mt="xs">
          {data?.balance?.toLocaleString('vi-VN') ?? 0} VND
        </Text>
      )}
    </Paper>
  );
}
```

## WalletTopupModal.tsx

```tsx
// Modal nạp tiền: nhập amount → gọi API → hiển thị QR + bank info

import { Modal, TextInput, Button, Stack, Text, CopyButton, ActionIcon } from '@mantine/core';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useCreateTopup } from '../hooks/useWallet';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function WalletTopupModal({ opened, onClose }: Props) {
  const [amount, setAmount] = useState('');
  const [topupResult, setTopupResult] = useState<any>(null);
  const createTopup = useCreateTopup();

  const handleCreate = async () => {
    const amountNum = Number(amount);
    if (amountNum < 10000) return; // Min 10k

    const result = await createTopup.mutateAsync(amountNum);
    setTopupResult(result);
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Nạp tiền vào ví">
      {!topupResult ? (
        <Stack>
          <TextInput
            label="Số tiền (VND)"
            placeholder="Tối thiểu 10,000đ"
            value={amount}
            onChange={(e) => setAmount(e.currentTarget.value)}
            type="number"
            min={10000}
            step={10000}
          />
          <Button
            onClick={handleCreate}
            loading={createTopup.isPending}
            disabled={Number(amount) < 10000}
          >
            Tạo mã nạp tiền
          </Button>
        </Stack>
      ) : (
        <Stack>
          <Text size="sm" fw={500}>
            Chuyển khoản {topupResult.amount.toLocaleString('vi-VN')} VND
          </Text>
          <Text size="sm">Ngân hàng: {topupResult.bankInfo.bankName}</Text>
          <Text size="sm">Số tài khoản: {topupResult.bankInfo.accountNumber}</Text>
          <Text size="sm">Chủ tài khoản: {topupResult.bankInfo.accountName}</Text>

          <Group gap="xs">
            <Text size="sm" fw={700} ff="monospace">
              Nội dung: {topupResult.transferContent}
            </Text>
            <CopyButton value={topupResult.transferContent}>
              {({ copied, copy }) => (
                <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </ActionIcon>
              )}
            </CopyButton>
          </Group>

          <Text size="xs" c="dimmed">
            Vui lòng nhập CHÍNH XÁC nội dung chuyển khoản. Hệ thống sẽ tự động xác nhận sau khi nhận được tiền.
          </Text>
        </Stack>
      )}
    </Modal>
  );
}
```

## WalletTransactionList.tsx

```tsx
// Danh sách giao dịch — dùng Mantine Table hoặc Stack

import { Stack, Text, Badge, Loader } from '@mantine/core';
import { useWalletHistory } from '../hooks/useWallet';

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Nạp tiền',
  withdrawal: 'Sử dụng',
  refund: 'Hoàn tiền',
  migration: 'Chuyển đổi',
};

const TYPE_COLORS: Record<string, string> = {
  deposit: 'green',
  withdrawal: 'red',
  refund: 'blue',
  migration: 'orange',
};

export function WalletTransactionList() {
  const { data, isLoading, fetchNextPage } = useWalletHistory();

  if (isLoading) return <Loader />;

  return (
    <Stack gap="xs">
      {data?.transactions?.map((tx: any) => (
        <WalletTransactionItem key={tx.id} transaction={tx} />
      ))}
    </Stack>
  );
}

export function WalletTransactionItem({ transaction }: { transaction: any }) {
  const isPositive = transaction.amount > 0;
  const label = TYPE_LABELS[transaction.type] ?? transaction.type;
  const color = TYPE_COLORS[transaction.type] ?? 'gray';

  return (
    <Paper p="sm" withBorder>
      <Group justify="space-between">
        <Stack gap={2}>
          <Group gap="xs">
            <Badge color={color} variant="light">{label}</Badge>
            <Text size="xs" c="dimmed">
              {new Date(transaction.createdAt).toLocaleString('vi-VN')}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            Số dư: {transaction.balanceAfter.toLocaleString('vi-VN')} VND
          </Text>
        </Stack>
        <Text size="sm" fw={600} c={isPositive ? 'green' : 'red'}>
          {isPositive ? '+' : ''}{transaction.amount.toLocaleString('vi-VN')} VND
        </Text>
      </Group>
    </Paper>
  );
}
```

## page.tsx

```tsx
// apps/web-1/app/dashboard/wallet/page.tsx

'use client';

import { Container, Title, Stack, Button } from '@mantine/core';
import { Plus } from 'lucide-react';
import { useDisclosure } from '@mantine/hooks';
import { WalletBalanceCard } from './_components/WalletBalanceCard';
import { WalletTransactionList } from './_components/WalletTransactionList';
import { WalletTopupModal } from './_components/WalletTopupModal';

export default function WalletPage() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={2}>Ví của tôi</Title>
        <WalletBalanceCard />
        <Button leftSection={<Plus size={16} />} onClick={open}>
          Nạp tiền
        </Button>
        <WalletTransactionList />
      </Stack>

      <WalletTopupModal opened={opened} onClose={close} />
    </Container>
  );
}
```

## Navigation

Thêm link vào layout/dashboard:

```tsx
// Trong apps/web-1/app/dashboard/layout.tsx
import { Wallet } from 'lucide-react';

// Thêm vào nav items
{
  label: 'Ví',
  href: '/dashboard/wallet',
  icon: Wallet,
}
```

## Lưu ý

- **Không dùng `apiClient` trực tiếp trong component** — tất cả qua hooks (useWalletBalance, useWalletHistory, useCreateTopup).
- **Không hardcode giá 39,000** — giá lấy từ `service_pricing` API (nếu cần hiển thị giá gói trong trang ví).
- **Không shadow** trên Card/Paper — dùng `withBorder` thay vì `shadow-sm`.

## Deliverables

- [x] `useWalletBalance` hook — TanStack Query, poll 30s
- [x] `useWalletHistory` hook — pagination
- [x] `useCreateTopup` mutation
- [x] `WalletBalanceCard.tsx` — số dư VND
- [x] `WalletTopupModal.tsx` — nạp tiền flow
- [x] `WalletTransactionList.tsx` + `WalletTransactionItem.tsx` — lịch sử giao dịch
- [x] `page.tsx` — trang chính wallet
- [x] Nav link "Ví" trong dashboard layout
- [ ] eslint web 0 warning <!-- chưa đạt toàn cục: web lint còn 197 problems (137 errors / 60 warnings) pre-existing ngoài scope wallet. File wallet + DashboardShell lint sạch 0 warning. -->
