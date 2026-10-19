"use client";

import { Stack, Text } from "@mantine/core";
import StageBalanceCards from "./StageBalanceCards";
import CreditHistorySection from "./credit-history/CreditHistorySection";
import type { CreditBalances } from "@/lib/credit-balances";
import type { CreditEntry } from "../credit-history.types";

interface BillingTabProps {
  caseId: string;
  balances?: CreditBalances | null;
  creditLedger?: CreditEntry[];
  isLoading?: boolean;
}

export default function BillingTab({ caseId, balances, creditLedger, isLoading = false }: BillingTabProps) {
  return (
    <Stack gap="xl">
      <div>
        <Text fz="var(--ui-text-title)" fw={500}>Lượt chấm và thanh toán</Text>
        <Text c="dimmed">Mỗi lần bấm chấm trừ 1 lượt của đúng giai đoạn đó.</Text>
      </div>

      <Stack gap="sm">
        <div>
          <Text fz="var(--ui-text-section)" fw={500}>Lượt chấm từng giai đoạn</Text>
          <Text c="dimmed">Mỗi giai đoạn giữ lượt riêng. Hết lượt thì bấm Mua thêm, tiền trừ vào ví của bạn.</Text>
        </div>
        <StageBalanceCards caseId={caseId} balances={balances} />
      </Stack>

      <Stack gap="sm">
        <div>
          <Text fz="var(--ui-text-section)" fw={500}>Lịch sử giao dịch</Text>
          <Text c="dimmed">Mọi lần mua, dùng và hoàn lượt chấm của dự án này.</Text>
        </div>
        <CreditHistorySection entries={creditLedger} isLoading={isLoading} />
      </Stack>
    </Stack>
  );
}
