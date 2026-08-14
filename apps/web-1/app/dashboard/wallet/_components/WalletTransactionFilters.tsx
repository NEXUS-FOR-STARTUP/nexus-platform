"use client";

import { Select, Group, Button } from "@mantine/core";
import { QuickFilterTab, TYPE_OPTIONS } from "./wallet-transaction.types";

interface Props {
  activeTab: QuickFilterTab;
  onTabChange: (tab: QuickFilterTab) => void;
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  isFetching: boolean;
  onRefresh: () => void;
}

const QUICK_TABS: Array<{ id: QuickFilterTab; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "deposit", label: "Nạp tiền" },
  { id: "withdrawal", label: "Chi tiêu" },
  { id: "refund", label: "Hoàn tiền" },
];

export function WalletTransactionFilters({
  activeTab,
  onTabChange,
  selectedType,
  onTypeChange,
  isFetching,
  onRefresh,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-border-app bg-surface-app">
      {/* Quick filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        {QUICK_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 py-1.5 text-base font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-text-app text-surface-app"
                  : "text-text-muted hover:text-text-app hover:bg-surface-soft"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Right controls: Detailed type select & count/refresh */}
      <Group gap="sm" wrap="nowrap" justify="space-between" className="sm:justify-end">
        <Select
          data={TYPE_OPTIONS}
          value={selectedType}
          onChange={onTypeChange}
          placeholder="Phân loại chi tiết"
          clearable
          size="sm"
          w={200}
          aria-label="Phân loại giao dịch chi tiết"
        />

        <Button
          variant="subtle"
          color="gray"
          size="sm"
          onClick={onRefresh}
          loading={isFetching}
          className="text-base font-medium"
        >
          Làm mới
        </Button>
      </Group>
    </div>
  );
}
