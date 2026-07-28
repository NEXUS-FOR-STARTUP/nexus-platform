import type { PaymentHistoryItem, PaymentHistoryStatus } from "@/types";
import { formatPrice } from "@/lib/pricing";
import { Alert, Badge, Card, Center, Loader, Paper, Stack, Text, Group } from "@mantine/core";

interface PaymentHistoryListProps {
  payments?: PaymentHistoryItem[];
  items?: PaymentHistoryItem[];
  isLoading?: boolean;
  error?: unknown;
}

const statusMap: Record<PaymentHistoryStatus, { label: string; color: string }> = {
  unpaid: { label: "Chưa thanh toán", color: "orange" },
  pending_verification: { label: "Chờ xác nhận", color: "blue" },
  paid: { label: "Đã thanh toán", color: "green" },
  rejected: { label: "Bị từ chối", color: "red" },
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatAmount(amount: number, currency: string) {
  if (currency.toUpperCase() === "VND") {
    return formatPrice(amount);
  }

  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(amount)} ${currency.toUpperCase()}`;
}

function resolveErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Không thể tải lịch sử thanh toán.";
}

export default function PaymentHistoryList({ payments, items, isLoading = false, error = null }: PaymentHistoryListProps) {
  const historyItems = payments ?? items ?? [];

  if (isLoading) {
    return (
      <Paper withBorder radius="md" p="xl" className="bg-surface-app">
        <Center>
          <Stack gap="sm" align="center">
            <Loader color="blue" size="md" />
            <Text size="sm" c="dimmed">
              Đang tải lịch sử thanh toán...
            </Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Không tải được lịch sử thanh toán" variant="light">
        {resolveErrorMessage(error)}
      </Alert>
    );
  }

  if (historyItems.length === 0) {
    return (
      <Paper withBorder radius="md" p="xl" className="bg-surface-app">
        <Stack gap="xs" align="center" ta="center">
          <Text fw={700} size="sm" className="text-text-app">
            Chưa có lịch sử thanh toán
          </Text>
          <Text size="sm" c="dimmed">
            Khi phát sinh giao dịch, trạng thái và thời gian sẽ hiển thị tại đây.
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="sm">
      {historyItems.map((item) => {
        const status = statusMap[item.status] ?? statusMap.unpaid;

        return (
          <Card key={item.id} withBorder radius="md" p="md" className="bg-surface-app">
            <Stack gap="xs">
              <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Text fw={700} size="sm" className="text-text-app">
                    {item.case_code}
                  </Text>
                  <Text size="xs" c="dimmed" className="truncate">
                    {item.package_name || "Gói dịch vụ"}
                  </Text>
                </Stack>

                <Badge variant="light" color={status.color} size="sm" className="shrink-0 font-semibold">
                  {status.label}
                </Badge>
              </Group>

              <Group justify="space-between" align="flex-end" gap="sm" wrap="wrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">
                    Số tiền
                  </Text>
                  <Text fw={700} size="sm" className="text-red-600">
                    {formatAmount(item.amount, item.currency)}
                  </Text>
                </Stack>

                <Stack gap={2} ta="right">
                  <Text size="xs" c="dimmed">
                    Ngày tạo
                  </Text>
                  <Text size="sm" className="text-text-app">
                    {formatDateTime(item.created_at)}
                  </Text>
                </Stack>
              </Group>

              {item.verified_at && (
                <Text size="xs" c="dimmed">
                  Xác minh lúc: {formatDateTime(item.verified_at)}
                </Text>
              )}

              {item.bank_transaction_id && (
                <Text size="xs" c="dimmed" className="font-mono break-all">
                  Mã giao dịch: {item.bank_transaction_id}
                </Text>
              )}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
