import { Skeleton, Stack, Text } from "@mantine/core";
import { STAGES } from "@app/shared/stages";
import { formatVndAmount } from "@/lib/pricing";
import { useOrderSummary } from "@/hooks/useOrderSummary";
import s from "./credit-history.module.css";

const FALLBACK_SERVICE_NAME = "Lượt chấm";

function serviceName(code: string): string {
  return STAGES.find((st) => st.serviceType === code)?.name ?? FALLBACK_SERVICE_NAME;
}

/** Order detail, fetched only once the row is opened (orderId stays null until then). */
export default function TxOrderBlock({ orderId }: { orderId: string | null }) {
  const { order, isLoading, isError } = useOrderSummary(orderId);
  if (!orderId) return null;

  return (
    <div className={s.orderBlock}>
      <Text fw={500} mb="xs">Đơn hàng</Text>
      {isLoading && (
        <Stack gap="xs">
          <Skeleton height={20} />
          <Skeleton height={20} />
          <Skeleton height={20} />
        </Stack>
      )}
      {isError && <Text c="red.8">Không tải được chi tiết đơn hàng</Text>}
      {order && (
        <div>
          {order.items.map((item) => (
            <div key={item.id} className={s.orderRow}>
              <div>
                <Text>{serviceName(item.service_type)}</Text>
                <Text size="sm" c="dimmed">{`${item.quantity} x ${formatVndAmount(item.unit_price)}`}</Text>
              </div>
              <Text className={s.nums}>{formatVndAmount(item.amount)}</Text>
            </div>
          ))}
          <div className={`${s.orderRow} ${s.orderTotal}`}>
            <Text fw={500}>Tổng tiền</Text>
            <Text fw={500} className={s.nums}>{formatVndAmount(order.total_amount)}</Text>
          </div>
        </div>
      )}
    </div>
  );
}
