"use client";

import React, { useMemo, useState } from "react";
import { Table, Badge, Text, Select, Loader } from "@mantine/core";
import {
  CreditTransactionHistoryProps,
  DateFilter,
  TypeFilter,
  SortField,
  SortState,
  transformToUnifiedItems,
} from "./credit-history.types";

const QUICK_FILTER_TABS: Array<{ id: TypeFilter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "purchase", label: "Nạp credit" },
  { id: "consumption", label: "Trừ credit" },
  { id: "refund", label: "Hoàn credit" },
  { id: "order", label: "Đơn mua" },
];

export default function CreditTransactionHistory({
  entries,
  orders,
  isLoading,
}: CreditTransactionHistoryProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortState>({
    field: "created_at",
    order: "desc",
  });

  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const renderSortIndicator = (field: SortField) => {
    if (sort.field !== field) return <span className="opacity-30 ml-1">↕</span>;
    return <span className="ml-1 text-text-app">{sort.order === "asc" ? "↑" : "↓"}</span>;
  };

  const unifiedItems = useMemo(() => {
    return transformToUnifiedItems(entries, orders);
  }, [entries, orders]);

  // Tab counts for quick filter pills
  const tabCounts = useMemo(() => {
    const counts: Record<TypeFilter, number> = {
      all: unifiedItems.length,
      purchase: 0,
      consumption: 0,
      refund: 0,
      order: 0,
    };
    unifiedItems.forEach((item) => {
      if (item.typeKey in counts) {
        counts[item.typeKey]++;
      }
    });
    return counts;
  }, [unifiedItems]);

  const filteredAndSortedItems = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const sevenDaysStart = todayStart - 7 * 86400000;
    const thirtyDaysStart = todayStart - 30 * 86400000;

    const filtered = unifiedItems.filter((item) => {
      // Date filter
      if (dateFilter === "today" && item.timestamp < todayStart) return false;
      if (dateFilter === "7days" && item.timestamp < sevenDaysStart) return false;
      if (dateFilter === "30days" && item.timestamp < thirtyDaysStart) return false;

      // Type filter
      if (typeFilter !== "all" && item.typeKey !== typeFilter) return false;

      return true;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sort.field === "created_at") {
        comparison = a.timestamp - b.timestamp;
      } else if (sort.field === "amount") {
        comparison = a.amountValue - b.amountValue;
      }
      return sort.order === "asc" ? comparison : -comparison;
    });
  }, [unifiedItems, dateFilter, typeFilter, sort]);

  if (isLoading) {
    return (
      <div className="bg-surface-app border border-border-app rounded-xl p-10 flex items-center justify-center">
        <Loader size="md" color="teal" />
      </div>
    );
  }

  if (unifiedItems.length === 0) {
    return (
      <div className="bg-surface-app border border-border-app rounded-xl p-8 text-center">
        <p className="text-base font-medium text-text-app">Chưa có giao dịch</p>
        <p className="text-base text-text-muted mt-1">
          Lịch sử mua và sử dụng credit sẽ xuất hiện tại đây
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-app border border-border-app rounded-xl overflow-hidden">
      {/* Modern Filter Toolbar */}
      <div className="px-4 py-3.5 border-b border-border-app flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface-app">
        {/* Quick Filter Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {QUICK_FILTER_TABS.map((tab) => {
            const isActive = typeFilter === tab.id;
            const count = tabCounts[tab.id];

            if (tab.id !== "all" && count === 0) return null;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`px-3.5 py-1.5 text-base font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "bg-brand text-white font-semibold"
                    : "text-text-muted hover:text-text-app hover:bg-surface-soft"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] font-semibold px-1.5 py-0.2 rounded-full leading-tight ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-surface-soft text-text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Select
            value={dateFilter}
            onChange={(val) => setDateFilter((val as DateFilter) || "all")}
            size="sm"
            radius="md"
            w={180}
            data={[
              { label: "Tất cả thời gian", value: "all" },
              { label: "Hôm nay", value: "today" },
              { label: "7 ngày gần nhất", value: "7days" },
              { label: "30 ngày gần nhất", value: "30days" },
            ]}
          />
        </div>
      </div>

      {/* Table Body */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-base font-medium text-text-muted">
            Không có giao dịch nào phù hợp với bộ lọc đã chọn
          </p>
        </div>
      ) : (
        <Table.ScrollContainer minWidth={740}>
          <Table
            highlightOnHover
            verticalSpacing="sm"
            horizontalSpacing="md"
            className="w-full"
          >
            <Table.Thead className="bg-surface-soft/40 border-b border-border-app">
              <Table.Tr>
                <Table.Th
                  onClick={() => handleSort("created_at")}
                  className="text-base font-medium text-text-muted py-3.5 w-[160px] cursor-pointer select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    Thời gian {renderSortIndicator("created_at")}
                  </span>
                </Table.Th>

                <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[130px]">
                  Loại giao dịch
                </Table.Th>

                <Table.Th className="text-base font-medium text-text-muted py-3.5">
                  Nội dung giao dịch
                </Table.Th>

                <Table.Th
                  ta="right"
                  style={{ textAlign: "right" }}
                  onClick={() => handleSort("amount")}
                  className="text-base font-medium text-text-muted py-3.5 w-[150px] cursor-pointer select-none"
                >
                  <span className="inline-flex items-center justify-end gap-1">
                    Biến động {renderSortIndicator("amount")}
                  </span>
                </Table.Th>

                <Table.Th
                  ta="right"
                  style={{ textAlign: "right" }}
                  className="text-base font-medium text-text-muted py-3.5 w-[150px]"
                >
                  Số dư sau giao dịch
                </Table.Th>

                <Table.Th
                  ta="center"
                  style={{ textAlign: "center" }}
                  className="text-base font-medium text-text-muted py-3.5 w-[150px]"
                >
                  Trạng thái
                </Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {filteredAndSortedItems.map((item) => (
                <Table.Tr
                  key={item.id}
                  className="transition-colors hover:bg-surface-soft/60"
                >
                  {/* Thời gian */}
                  <Table.Td className="py-3.5">
                    <Text className="font-medium text-text-app text-base leading-tight">
                      {item.date}
                    </Text>
                    <Text c="dimmed" className="text-base mt-0.5">
                      {item.time}
                    </Text>
                  </Table.Td>

                  {/* Loại giao dịch */}
                  <Table.Td className="py-3.5">
                    <Badge
                      variant="light"
                      color={item.badgeColor}
                      size="md"
                      radius="xl"
                      className="font-medium text-base whitespace-nowrap"
                    >
                      {item.typeLabel}
                    </Badge>
                  </Table.Td>

                  {/* Nội dung giao dịch */}
                  <Table.Td className="py-3.5">
                    <Text className="text-text-app text-base font-medium line-clamp-1">
                      {item.description}
                    </Text>
                    {item.subDescription && (
                      <Text c="dimmed" className="text-base font-mono mt-0.5">
                        {item.subDescription}
                      </Text>
                    )}
                  </Table.Td>

                  {/* Biến động */}
                  <Table.Td
                    ta="right"
                    style={{ textAlign: "right" }}
                    className="py-3.5"
                  >
                    <span
                      className={`text-base font-semibold tabular-nums ${item.amountDisplay.colorClass}`}
                    >
                      {item.amountDisplay.text}
                    </span>
                  </Table.Td>

                  {/* Số dư sau giao dịch */}
                  <Table.Td
                    ta="right"
                    style={{ textAlign: "right" }}
                    className="py-3.5"
                  >
                    <Text c="dimmed" className="text-base tabular-nums font-normal">
                      {item.balanceAfterDisplay}
                    </Text>
                  </Table.Td>

                  {/* Trạng thái */}
                  <Table.Td
                    ta="center"
                    style={{ textAlign: "center" }}
                    className="py-3.5"
                  >
                    <Badge
                      variant="light"
                      color={item.statusColor}
                      size="md"
                      radius="xl"
                      className="font-medium text-base whitespace-nowrap"
                    >
                      {item.statusLabel}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </div>
  );
}
