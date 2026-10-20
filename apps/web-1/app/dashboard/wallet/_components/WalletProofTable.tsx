"use client";

import { useState, useMemo } from "react";
import { Skeleton } from "@mantine/core";
import { CaretDown } from "@phosphor-icons/react";
import { useMyDeposits } from "../hooks/useWallet";
import { formatVndAmount } from "@/lib/pricing";
import { getDepositDisplay } from "@/lib/deposit-display";
import { formatDateTime } from "./wallet-transaction.types";
import { toChipTone } from "./wallet-proof";
import { WalletProofFilters, type ProofStatusFilter } from "./WalletProofFilters";
import { WalletProofDetail } from "./WalletProofDetail";
import styles from "../wallet.module.css";

export function WalletProofTable() {
  const { data, isLoading, isFetching, isError, refetch } = useMyDeposits();
  const [statusFilter, setStatusFilter] = useState<ProofStatusFilter>("all");

  const rawDeposits = data?.deposits;
  const deposits = useMemo(() => rawDeposits ?? [], [rawDeposits]);

  const filteredDeposits = useMemo(() => {
    if (statusFilter === "all") return deposits;
    return deposits.filter((d) => d.status === statusFilter);
  }, [deposits, statusFilter]);

  return (
    <div>
      <WalletProofFilters
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={52} radius="sm" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">
            Không thể tải danh sách ảnh minh chứng. Vui lòng thử lại sau.
          </p>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnQuiet} ${styles.btnSm} mt-3`}
            onClick={() => refetch()}
          >
            Thử lại
          </button>
        </div>
      ) : deposits.length === 0 ? (
        <div className="rounded-lg border border-border-app bg-surface-app p-10 text-center">
          <p className="text-sm font-medium text-text-app">
            Chưa có yêu cầu nạp tiền nào
          </p>
          <p className="text-xs text-text-muted mt-1">
            Mã chuyển khoản và ảnh minh chứng sẽ hiển thị tại đây khi bạn thực hiện nạp tiền vào ví.
          </p>
        </div>
      ) : filteredDeposits.length === 0 ? (
        <div className="rounded-lg border border-border-app bg-surface-app p-10 text-center">
          <p className="text-sm font-medium text-text-app">
            Không tìm thấy ảnh minh chứng
          </p>
          <p className="text-xs text-text-muted mt-1">
            Không có yêu cầu nạp tiền nào phù hợp với bộ lọc đã chọn.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.rows}>
            {filteredDeposits.map((d) => {
              const display = getDepositDisplay(d.status, Boolean(d.proof_file_url));
              const tone = toChipTone(display);
              const { date, time } = formatDateTime(d.created_at);
              const chipClass =
                tone === "ok"
                  ? styles.chipGreen
                  : tone === "error"
                    ? styles.chipRed
                    : tone === "draft"
                      ? styles.chipBlue
                      : tone === "warn"
                        ? styles.chipOrange
                        : "";

              return (
                <details key={d.id} className={styles.tx}>
                  <summary className={styles.txRow}>
                    <span className={styles.dt}>
                      {date} <span className="opacity-75">{time}</span>
                    </span>
                    <div className={styles.tt}>
                      <div className={styles.titleText}>
                        Yêu cầu nạp tiền #{d.id.slice(0, 8)}
                      </div>
                      <div className={styles.subtitleText}>
                        Nội dung CK: {d.transfer_content}
                      </div>
                    </div>
                    <span className={`${styles.amt} ${styles.amtPlus}`}>
                      +{formatVndAmount(d.amount)}
                    </span>
                    <span className={`${styles.chip} ${chipClass}`}>{display.label}</span>
                    <span className={styles.cv}>
                      <CaretDown size={16} className={styles.txChevron} />
                    </span>
                  </summary>
                  <WalletProofDetail deposit={d} />
                </details>
              );
            })}
          </div>
          <div className="pt-3">
            <span className="text-xs text-text-muted">
              Hiển thị {filteredDeposits.length} trên tổng số {deposits.length} yêu cầu nạp tiền
              {deposits.length >= 20 ? " (trong 20 yêu cầu gần nhất)" : ""}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
