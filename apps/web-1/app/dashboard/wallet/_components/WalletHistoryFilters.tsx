"use client";

import { Select } from "@mantine/core";
import { ArrowsClockwise } from "@phosphor-icons/react";
import type { QuickFilterTab, SortState } from "./wallet-transaction.types";
import { WALLET_SORT_OPTIONS, toSortValue, parseSortValue } from "./wallet-sort";
import styles from "../wallet.module.css";

const FILTER_TABS: Array<{ value: QuickFilterTab; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "deposit", label: "Nạp tiền" },
  { value: "service_payment", label: "Mua gói" },
  { value: "refund", label: "Hoàn tiền" },
  { value: "adjustment", label: "Điều chỉnh" },
];

interface Props {
  selectedType: QuickFilterTab;
  onTypeChange: (tab: QuickFilterTab) => void;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  isFetching: boolean;
  onRefresh: () => void;
}

export function WalletHistoryFilters({
  selectedType,
  onTypeChange,
  sort,
  onSortChange,
  isFetching,
  onRefresh,
}: Props) {
  return (
    <div className={styles.filterBar}>
      <div className={styles.filterTabs}>
        {FILTER_TABS.map((tab) => {
          const isActive = selectedType === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              className={`${styles.filterTab} ${isActive ? styles.filterTabActive : ""}`}
              onClick={() => onTypeChange(tab.value)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Select
          data={WALLET_SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={toSortValue(sort)}
          onChange={(val) => onSortChange(parseSortValue(val))}
          size="sm"
          w={180}
          aria-label="Sắp xếp danh sách giao dịch"
          classNames={{ input: "font-normal text-sm" }}
        />

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
    </div>
  );
}
