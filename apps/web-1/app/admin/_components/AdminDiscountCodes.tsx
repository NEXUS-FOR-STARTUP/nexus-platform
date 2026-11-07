"use client";

import { useState } from "react";
import { Card, Group, SegmentedControl, Select, Stack, Text } from "@mantine/core";
import { useAdminDiscountCodes, type DiscountCodeFilters, type DiscountScope } from "../hooks/useAdminDiscountCodes";
import DiscountCodeForm from "./DiscountCodeForm";
import DiscountCodeSummary from "./DiscountCodeSummary";
import DiscountCodeTable, { STATUS_META } from "./DiscountCodeTable";

const SCOPE_OPTIONS: { value: DiscountScope; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "shared", label: "Mã chung" },
  { value: "personal", label: "Mã tặng" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Mọi trạng thái" },
  ...Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
];

export default function AdminDiscountCodes() {
  const [filters, setFilters] = useState<DiscountCodeFilters>({ scope: "all", status: "all" });
  const { codes, summary, serviceTypes, isLoading, createCode, isCreating, updateCode, isUpdating } = useAdminDiscountCodes(filters);

  return (
    <Card withBorder padding="md" radius="md" style={{ width: "100%" }}>
      <Stack gap="md">
        <div>
          <Text fw={700}>Mã giảm giá</Text>
          <Text size="sm" c="dimmed">
            Mã không xóa được để giữ lịch sử; tắt mã khi không dùng nữa. Mã tặng sau lần mua đầu tự sinh, hạn 30 ngày.
          </Text>
        </div>

        <DiscountCodeSummary summary={summary} />
        <DiscountCodeForm serviceTypes={serviceTypes} isSubmitting={isCreating} onSubmit={createCode} />

        <Group justify="space-between">
          <SegmentedControl
            value={filters.scope}
            onChange={(scope) => setFilters((f) => ({ ...f, scope: scope as DiscountScope }))}
            data={SCOPE_OPTIONS}
          />
          <Select
            aria-label="Lọc theo trạng thái"
            value={filters.status}
            onChange={(status) => setFilters((f) => ({ ...f, status: (status ?? "all") as DiscountCodeFilters["status"] }))}
            data={STATUS_OPTIONS}
            allowDeselect={false}
            w={200}
          />
        </Group>

        <DiscountCodeTable
          codes={codes}
          isLoading={isLoading}
          isUpdating={isUpdating}
          onToggle={(id, isActive) => updateCode({ id, is_active: isActive })}
        />
      </Stack>
    </Card>
  );
}
