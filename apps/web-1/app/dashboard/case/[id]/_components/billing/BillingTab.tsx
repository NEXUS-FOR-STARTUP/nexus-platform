 "use client";

 import { Stack, Text } from "@mantine/core";
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
        <Text fw={700} size="xl">Lượt chấm & tiền</Text>
        <Text size="sm" c="dimmed">
          Mỗi lần bấm chấm trừ 1 lượt của đúng giai đoạn đó.
        </Text>
      </div>

      <Stack gap="xs">
        <div>
          <Text fw={700} size="lg">Lượt chấm từng giai đoạn</Text>
          <Text size="sm" c="dimmed">Mỗi giai đoạn giữ lượt riêng. Hết lượt thì bấm Mua thêm, tiền trừ vào ví của bạn.</Text>
        </div>
        <StageBalanceTable caseId={caseId} balances={balances} />
      </Stack>
      <Stack gap="xs">
        <div>
          <Text fw={700} size="lg">Lịch sử lượt chấm</Text>
          <Text size="sm" c="dimmed">Mọi lần mua, dùng và hoàn lượt chấm của dự án này.</Text>
        </div>
        <CreditTransactionHistory
          entries={creditLedger}
          orders={orders}
          isLoading={isLoading}
        />
      </Stack>
    </Stack>
  );
}
