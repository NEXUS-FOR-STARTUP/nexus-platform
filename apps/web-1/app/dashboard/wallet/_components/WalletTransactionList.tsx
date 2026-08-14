"use client";

import { useState } from "react";
import { Paper, Center, Text, Pagination, Skeleton, Button, Stack, Divider } from "@mantine/core";
import { useWalletHistory } from "../hooks/useWallet";
import {
  WalletTransactionItem,
  SortField,
  SortState,
  QuickFilterTab,
} from "./wallet-transaction.types";
import { WalletTransactionFilters } from "./WalletTransactionFilters";
import { WalletTransactionTable } from "./WalletTransactionTable";
import { WalletTransactionCardList } from "./WalletTransactionCardList";

export function WalletTransactionList() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<QuickFilterTab>("all");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>({ field: "created_at", order: "desc" });

  const effectiveType = selectedType || (activeTab === "all" ? null : activeTab);
  const limit = 10;
  const { data, isLoading, isFetching, isError, refetch } = useWalletHistory(
    page,
    limit,
    effectiveType,
    sort.field,
    sort.order,
  );

  const handleTabChange = (tab: QuickFilterTab) => {
    setActiveTab(tab);
    setSelectedType(null);
    setPage(1);
  };

  const handleTypeChange = (value: string | null) => {
    setSelectedType(value);
    setPage(1);
  };

  const handleSort = (field: SortField) => {
    setSort((prev) =>
      prev.field === field
        ? { field, order: prev.order === "asc" ? "desc" : "asc" }
        : { field, order: "desc" },
    );
    setPage(1);
  };

  const transactions = (data?.transactions ?? []) as WalletTransactionItem[];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <Paper withBorder radius="md" className="bg-surface-app overflow-hidden">
      <WalletTransactionFilters
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedType={selectedType}
        onTypeChange={handleTypeChange}
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />

      {isLoading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={38} radius="sm" />
          ))}
        </div>
      ) : isError ? (
        <Center p="xl">
          <Stack align="center" gap="sm">
            <Text className="text-text-app text-base">
              Không thể tải lịch sử giao dịch.
            </Text>
            <Button size="sm" variant="default" onClick={() => refetch()} className="text-base">
              Thử lại
            </Button>
          </Stack>
        </Center>
      ) : total === 0 ? (
        <Center p="xl">
          <Stack align="center" gap="sm" ta="center">
            <Text fw={500} className="text-text-app text-base">
              {effectiveType ? "Không có giao dịch phù hợp" : "Chưa có giao dịch nào"}
            </Text>
            <Text c="dimmed" className="text-base">
              {effectiveType
                ? "Thử chuyển bộ lọc để tìm kiếm các giao dịch khác."
                : "Các biến động số dư ví sẽ được ghi nhận tại đây."}
            </Text>
            {effectiveType && (
              <Button size="sm" variant="subtle" color="gray" onClick={() => handleTabChange("all")} className="text-base">
                Xem tất cả giao dịch
              </Button>
            )}
          </Stack>
        </Center>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <WalletTransactionTable
              transactions={transactions}
              sort={sort}
              onSort={handleSort}
            />
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden">
            <WalletTransactionCardList
              transactions={transactions}
            />
          </div>

          {/* Footer Pagination & Count */}
          <Divider />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface-app">
            <Text c="dimmed" className="text-base">
              Hiển thị {transactions.length} trên tổng số {total.toLocaleString("vi-VN")} giao dịch
            </Text>
            {totalPages > 1 && (
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
                size="md"
                radius="sm"
              />
            )}
          </div>
        </>
      )}
    </Paper>
  );
}
