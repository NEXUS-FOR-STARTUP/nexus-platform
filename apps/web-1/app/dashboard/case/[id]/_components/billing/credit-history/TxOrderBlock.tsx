import { STAGES } from "@app/shared/stages";
import { formatVndAmount } from "@/lib/pricing";
import { useOrderSummary } from "@/hooks/useOrderSummary";
import h from "./credit-history.module.css";
import s from "./credit-tx.module.css";

const FALLBACK_SERVICE_NAME = "Lượt chấm";

function serviceName(code: string): string {
  return STAGES.find((st) => st.serviceType === code)?.name ?? FALLBACK_SERVICE_NAME;
}

/** Order detail, fetched only once the row is opened (orderId stays null until then). */
export default function TxOrderBlock({ orderId }: { orderId: string | null }) {
  const { order, isLoading, isError } = useOrderSummary(orderId);
  if (!orderId) return null;

  return (
    <>
      <p className={s.kvh}>Đơn hàng</p>
      {isLoading && <div className={h.skeleton} aria-hidden />}
      {isError && <p className={s.err}>Không tải được chi tiết đơn hàng</p>}
      {order && (
        <div className={s.tw}>
          <table className={s.items}>
            <thead>
              <tr>
                <th>Dịch vụ</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{serviceName(item.service_type)}</td>
                  <td>{item.quantity}</td>
                  <td>{formatVndAmount(item.unit_price)}</td>
                  <td>{formatVndAmount(item.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Tổng tiền</td>
                <td>{formatVndAmount(order.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </>
  );
}
