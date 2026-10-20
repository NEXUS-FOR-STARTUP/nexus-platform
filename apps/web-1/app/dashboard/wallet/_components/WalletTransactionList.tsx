"use client";

import { useState } from "react";
import { Skeleton } from "@mantine/core";
import { CaretDown } from "@phosphor-icons/react";
import { useWalletHistory } from "../hooks/useWallet";
import { formatVndAmount } from "@/lib/pricing";
import type { QuickFilterTab, SortState } from "./wallet-transaction.types";
import { formatDateTime } from "./wallet-transaction.types";
import { describeWalletRow } from "./wallet-row";
import { WalletHistoryFilters } from "./WalletHistoryFilters";
import { WalletTransactionDetail } from "./WalletTransactionDetail";
import { WalletHistoryPagination } from "./WalletHistoryPagination";
import styles from "../wallet.module.css";

const LIMIT = 10;

export function WalletTransactionList() {
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<QuickFilterTab>("all");
  const [sort, setSort] = useState<SortState>({ field: "created_at", order: "desc" });

  const effectiveType = selectedType === "all" ? null : selectedType;
  const { data, isLoading, isFetching, isError, refetch } = useWalletHistory(
    page,
    LIMIT,
    effectiveType,
    sort.field,
    sort.order,
  );

  const handleTypeChange = (type: QuickFilterTab) => {
    setSelectedType(type);
    setPage(1);
  };

  const handleSortChange = (newSort: SortState) => {
    setSort(newSort);
    setPage(1);
  };

  const transactions = data?.transactions ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <WalletHistoryFilters
        selectedType={selectedType}
        onTypeChange={handleTypeChange}
        sort={sort}
        onSortChange={handleSortChange}
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
            Không thể tải lịch sử giao dịch. Vui lòng thử lại sau.
          </p>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnQuiet} ${styles.btnSm} mt-3`}
            onClick={() => refetch()}
          >
            Thử lại
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-lg border border-border-app bg-surface-app p-10 text-center">
          <p className="text-sm font-medium text-text-app">
            Chưa có giao dịch nào
          </p>
          <p className="text-xs text-text-muted mt-1">
            {selectedType !== "all"
              ? "Không có giao dịch phù hợp với bộ lọc đã chọn."
              : "Các biến động số dư ví khi nạp tiền hoặc thanh toán dịch vụ sẽ hiển thị tại đây."}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.rows}>
            {transactions.map((tx) => {
              const { title, subtitle, typeTone, typeLabel } = describeWalletRow(tx);
              const { date, time } = formatDateTime(tx.created_at);
              const isPositive = tx.amount > 0;
              const chipClass =
                typeTone === "ok"
                  ? styles.chipGreen
                  : typeTone === "error"
                    ? styles.chipRed
                    : typeTone === "draft"
                      ? styles.chipBlue
                      : typeTone === "warn"
                        ? styles.chipOrange
                        : "";

              return (
                <details key={tx.id} className={styles.tx}>
                  <summary className={styles.txRow}>
                    <span className={styles.dt}>
                      {date} <span className="opacity-75">{time}</span>
                    </span>
                    <div className={styles.tt}>
                      <div className={styles.titleText}>{title}</div>
                      {subtitle && <div className={styles.subtitleText}>{subtitle}</div>}
                    </div>
                    <span className={`${styles.amt} ${isPositive ? styles.amtPlus : styles.amtMinus}`}>
                      {formatVndAmount(tx.amount, { signed: true })}
                    </span>
                    <span className={`${styles.chip} ${chipClass}`}>{typeLabel}</span>
                    <span className={styles.cv}>
                      <CaretDown size={16} className={styles.txChevron} />
                    </span>
                  </summary>
                  <WalletTransactionDetail transaction={tx} />
                </details>
              );
            })}
          </div>
          <WalletHistoryPagination
            page={page}
            total={total}
            limit={LIMIT}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
