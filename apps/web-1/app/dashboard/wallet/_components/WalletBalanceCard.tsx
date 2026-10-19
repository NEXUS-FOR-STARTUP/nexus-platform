"use client";

import { Wallet } from "@phosphor-icons/react";
import { Skeleton } from "@mantine/core";
import { formatVndAmount } from "@/lib/pricing";
import { useWalletBalance } from "../hooks/useWallet";
import styles from "../wallet.module.css";

export function WalletBalanceCard() {
  const { data, isLoading, isError, refetch } = useWalletBalance();

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="text-sm font-medium">Không thể tải số dư ví. Vui lòng thử lại sau.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-xs font-medium underline hover:no-underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const balance = data?.balance ?? 0;
  const totalDeposited = data?.total_deposited ?? 0;
  const totalSpent = data?.total_spent ?? 0;
  const totalRefunded = data?.total_refunded ?? 0;

  return (
    <div className={styles.balanceCard}>
      <div className={styles.balanceTop}>
        <div className={styles.balanceLabel}>
          <Wallet size={18} className="text-text-muted" />
          <span>Số dư ví Nexus</span>
        </div>
        <span className={`${styles.chip} ${styles.chipGreen}`}>Đang hoạt động</span>
      </div>

      {isLoading ? (
        <Skeleton height={42} width={220} radius="sm" className="my-2" />
      ) : (
        <div className={styles.balanceFigure}>
          {balance.toLocaleString("en-US")}
          <span className={styles.balanceUnit}>VND</span>
        </div>
      )}

      <p className={styles.balanceNote}>
        Dùng để thanh toán các gói đánh giá dự án.
      </p>

      <div className={styles.balanceMeta}>
        <div className={styles.metaItem}>
          <div className={styles.metaLbl}>Tổng tiền đã nạp</div>
          <div className={styles.metaVal}>{formatVndAmount(totalDeposited)}</div>
        </div>
        <div className={styles.metaItem}>
          <div className={styles.metaLbl}>Tổng tiền đã dùng</div>
          <div className={styles.metaVal}>{formatVndAmount(totalSpent)}</div>
        </div>
        <div className={styles.metaItem}>
          <div className={styles.metaLbl}>Tiền đã hoàn</div>
          <div className={styles.metaVal}>{formatVndAmount(totalRefunded)}</div>
        </div>
      </div>
    </div>
  );
}
