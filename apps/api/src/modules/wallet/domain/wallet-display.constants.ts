export const SOURCE_DESCRIPTIONS: Record<string, string> = {
  deposit: "Nạp tiền qua chuyển khoản ngân hàng",
  topup: "Nạp tiền qua chuyển khoản ngân hàng",
  credit_purchase: "Mua credit phản biện",
  case_consume: "Sử dụng credit cho hồ sơ",
  admin_refund: "Admin hoàn tiền vào ví",
  platform_bonus: "Hệ thống tặng thưởng",
  migration: "Chuyển đổi dữ liệu hệ thống",
  service_payment: "Thanh toán dịch vụ",
  adjustment: "Điều chỉnh số dư",
  order: "Thanh toán đơn hàng",
  refund: "Hoàn tiền",
  case_refund: "Hoàn tiền vào ví",
  admin_veto: "Hoàn tiền do hồ sơ bị từ chối",
  withdrawal: "Rút tiền",
}

/** `detail` (what the money was spent on / returned for) replaces the generic label when known. */
export function describeTransaction(sourceType: string | null, amount: number, detail?: string): string {
  const label = detail
    ?? (sourceType && SOURCE_DESCRIPTIONS[sourceType]
      ? SOURCE_DESCRIPTIONS[sourceType]
      : sourceType ?? "Không xác định")
  const sign = amount > 0 ? "+" : ""
  return `${label} (${sign}${amount.toLocaleString("vi-VN")} VND)`
}
