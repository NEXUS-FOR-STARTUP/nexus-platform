"use client";

import { ArrowsClockwise } from "@phosphor-icons/react";
import styles from "../wallet.module.css";

export type ProofStatusFilter = "all" | "pending" | "verified" | "rejected" | "amount_mismatch";

interface Props {
  statusFilter: ProofStatusFilter;
  onFilterChange: (status: ProofStatusFilter) => void;
  isFetching: boolean;
  onRefresh: () => void;
}

const FILTER_OPTIONS: Array<{ value: ProofStatusFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "verified", label: "Đã vào ví" },
  { value: "pending", label: "Chờ xác minh" },
  { value: "rejected", label: "Bị từ chối" },
  { value: "amount_mismatch", label: "Sai số tiền" },
];

export function WalletProofFilters({
  statusFilter,
  onFilterChange,
  isFetching,
  onRefresh,
}: Props) {
  return (
    <div className={styles.filterBar}>
      <div className={styles.filterTabs}>
        {FILTER_OPTIONS.map((opt) => {
          const isActive = statusFilter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              className={`${styles.filterTab} ${isActive ? styles.filterTabActive : ""}`}
              onClick={() => onFilterChange(opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isFetching}
        className={`${styles.btn} ${styles.btnQuiet} ${styles.btnSm}`}
        title="Làm mới danh sách"
      >
        <ArrowsClockwise size={16} className={isFetching ? "animate-spin" : ""} />
        <span>{isFetching ? "Đang tải..." : "Làm mới"}</span>
      </button>
    </div>
  );
}
