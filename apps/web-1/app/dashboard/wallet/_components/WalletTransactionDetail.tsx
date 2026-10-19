"use client";

import Link from "next/link";
import { Skeleton } from "@mantine/core";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { CopyIconButton } from "@/components/ui/CopyIconButton";
import { formatVndAmount } from "@/lib/pricing";
import { depositDetailHref } from "@/lib/deposit-display";
import type { WalletTransactionItem } from "./wallet-transaction.types";
import { formatDateTimeFull } from "./wallet-transaction.types";
import { describeWalletRow } from "./wallet-row";
import { useDepositSummary } from "../hooks/useDepositSummary";
import { useOrderSummary } from "@/hooks/useOrderSummary";
import styles from "../wallet.module.css";

interface Props {
  transaction: WalletTransactionItem;
}

export function WalletTransactionDetail({ transaction: tx }: Props) {
  const { typeLabel, canOpenDeposit, canOpenOrder } = describeWalletRow(tx);
  const isPositive = tx.amount > 0;

  const depositQuery = useDepositSummary(canOpenDeposit ? tx.source_id : null);
  const orderQuery = useOrderSummary(canOpenOrder ? tx.source_id : null);

  return (
    <div className={styles.txd}>
      <p className={styles.kvh}>Giao dịch</p>
      <dl className={styles.kv}>
        <dt>Thời gian</dt>
        <dd>{formatDateTimeFull(tx.created_at)}</dd>

        <dt>Loại giao dịch</dt>
        <dd>{typeLabel}</dd>

        <dt>Biến động số dư</dt>
        <dd className={isPositive ? styles.amtPlus : styles.amtMinus}>
          {formatVndAmount(tx.amount, { signed: true })}
        </dd>

        <dt>Số dư trước giao dịch</dt>
        <dd>{formatVndAmount(tx.balance_before)}</dd>

        <dt>Số dư sau giao dịch</dt>
        <dd>{formatVndAmount(tx.balance_after)}</dd>

        <dt>ID giao dịch</dt>
        <dd>
          <span className={styles.codeBox}>{tx.id}</span>
          <CopyIconButton value={tx.id} label="Sao chép ID giao dịch" />
        </dd>

        {tx.reference_id && (
          <>
            <dt>Mã tham chiếu</dt>
            <dd>
              <span className={styles.codeBox}>{tx.reference_id}</span>
              <CopyIconButton value={tx.reference_id} label="Sao chép mã tham chiếu" />
            </dd>
          </>
        )}
      </dl>

      {canOpenDeposit && (
        <div className="mt-4 pt-3 border-t border-border-app">
          <p className={styles.kvh}>Thanh toán &amp; Ngân hàng</p>
          {depositQuery.isLoading ? (
            <div className="space-y-2 py-2">
              <Skeleton height={20} radius="xs" />
              <Skeleton height={20} radius="xs" width="70%" />
            </div>
          ) : depositQuery.isError ? (
            <p className="text-xs text-red-600">Không thể tải thông tin đối soát nạp tiền.</p>
          ) : depositQuery.deposit ? (
            <>
              <dl className={styles.kv}>
                <dt>Phương thức</dt>
                <dd>Chuyển khoản ngân hàng (VietQR)</dd>

                <dt>Nội dung chuyển khoản</dt>
                <dd>
                  <span className={styles.codeBox}>{depositQuery.deposit.transfer_content}</span>
                  <CopyIconButton
                    value={depositQuery.deposit.transfer_content}
                    label="Sao chép nội dung chuyển khoản"
                  />
                </dd>

                {depositQuery.deposit.bank_transaction_id && (
                  <>
                    <dt>Mã GD ngân hàng</dt>
                    <dd>
                      <span className={styles.codeBox}>{depositQuery.deposit.bank_transaction_id}</span>
                      <CopyIconButton
                        value={depositQuery.deposit.bank_transaction_id}
                        label="Sao chép mã GD ngân hàng"
                      />
                    </dd>
                  </>
                )}

                <dt>Thời điểm ghi có</dt>
                <dd>
                  {depositQuery.deposit.bank_credited_at
                    ? formatDateTimeFull(depositQuery.deposit.bank_credited_at)
                    : "Đang xử lý"}
                </dd>

                <dt>Cơ chế xác minh</dt>
                <dd>
                  {depositQuery.deposit.verification_source === "auto"
                    ? "Tự động (VietQR/Webhook)"
                    : "Thủ công"}
                </dd>
              </dl>

              <div className="mt-3">
                <Link
                  href={depositDetailHref(depositQuery.deposit.id)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                >
                  <span>Xem chi tiết nạp tiền</span>
                  <ArrowSquareOut size={15} />
                </Link>
              </div>
            </>
          ) : null}
        </div>
      )}

      {canOpenOrder && (
        <div className="mt-4 pt-3 border-t border-border-app">
          <p className={styles.kvh}>Đơn hàng</p>
          {orderQuery.isLoading ? (
            <div className="space-y-2 py-2">
              <Skeleton height={20} radius="xs" />
              <Skeleton height={20} radius="xs" width="60%" />
            </div>
          ) : orderQuery.isError ? (
            <p className="text-xs text-red-600">Không thể tải thông tin đơn hàng.</p>
          ) : orderQuery.order ? (
            <dl className={styles.kv}>
              <dt>Mã đơn hàng</dt>
              <dd>
                <span className={styles.codeBox}>{orderQuery.order.id}</span>
                <CopyIconButton value={orderQuery.order.id} label="Sao chép mã đơn hàng" />
              </dd>

              <dt>Trạng thái</dt>
              <dd>{orderQuery.order.status}</dd>

              <dt>Tổng tiền</dt>
              <dd className="font-medium">{formatVndAmount(orderQuery.order.total_amount)}</dd>
            </dl>
          ) : null}
        </div>
      )}
    </div>
  );
}
