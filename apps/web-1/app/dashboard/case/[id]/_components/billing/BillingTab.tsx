"use client";

import { Stack, Text } from "@mantine/core";
import WalletSummaryCard from "./WalletSummaryCard";
import StageBalanceTable from "./StageBalanceTable";
import CreditTransactionHistory from "../CreditTransactionHistory";
import type { CreditBalances } from "@/lib/credit-balances";
import type { CreditEntry } from "../credit-history.types";
import type { Order } from "@/types/payment";

interface BillingTabProps {
  caseId: string;
  balances?: CreditBalances | null;
  creditLedger?: CreditEntry[];
  orders?: Order[];
  isLoading?: boolean;
}

export default function BillingTab({
  caseId,
  balances,
  creditLedger,
  orders,
  isLoading = false,
}: BillingTabProps) {
  return (
    <Stack gap="lg">
      <div>
        <Text fw={700} size="xl">Lượt chấm bài & thanh toán</Text>
        <Text size="sm" c="dimmed">
          Quản lý số lượt chấm của từng giai đoạn và lịch sử giao dịch của dự án.
        </Text>
      </div>

      <WalletSummaryCard />

      <StageBalanceTable caseId={caseId} balances={balances} />

      <CreditTransactionHistory
        entries={creditLedger}
        orders={orders}
        isLoading={isLoading}
      />
    </Stack>
  );
}
