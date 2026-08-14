"use client";

import { Select, Group, Button } from "@mantine/core";
import { TYPE_OPTIONS } from "./wallet-transaction.types";

interface Props {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  isFetching: boolean;
  onRefresh: () => void;
}

export function WalletTransactionFilters({
  selectedType,
  onTypeChange,
  isFetching,
  onRefresh,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-border-app bg-surface-app">
      <Group gap="sm" wrap="nowrap" justify="flex-end" className="w-full sm:w-auto sm:ml-auto">
        <Select
          data={TYPE_OPTIONS}
          value={selectedType}
          onChange={onTypeChange}
          placeholder="Tất cả giao dịch"
          clearable
          size="sm"
          w={240}
          aria-label="Lọc theo loại giao dịch"
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
