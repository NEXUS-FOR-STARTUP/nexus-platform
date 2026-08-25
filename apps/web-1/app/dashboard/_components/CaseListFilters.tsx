"use client";

import { Group, Select, TextInput } from "@mantine/core";
import { Search } from "lucide-react";

export const STUDENT_STAGE_OPTIONS = [
  { value: "intake_pending", label: "Chờ kích hoạt" },
  { value: "intake_ready", label: "Sẵn sàng cập nhật" },
  { value: "submitted", label: "Chờ xét duyệt" },
  { value: "need_more_information", label: "Cần bổ sung" },
  { value: "under_review", label: "Đang phản biện" },
  { value: "report_ready", label: "Báo cáo sẵn sàng" },
  { value: "waiting_for_revision", label: "Chờ bản sửa" },
  { value: "revision_submitted", label: "Đã nộp bản sửa" },
  { value: "completed", label: "Hoàn thành" },
  { value: "rejected", label: "Bị từ chối" },
  { value: "closed", label: "Đã đóng" },
];

export const STUDENT_SORT_OPTIONS = [
  { value: "created_at_desc", label: "Mới nhất" },
  { value: "created_at_asc", label: "Cũ nhất" },
  { value: "case_code_asc", label: "Mã hồ sơ (A-Z)" },
  { value: "case_code_desc", label: "Mã hồ sơ (Z-A)" },
  { value: "team_name_asc", label: "Tên nhóm (A-Z)" },
  { value: "team_name_desc", label: "Tên nhóm (Z-A)" },
];

interface CaseListFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  stage: string | null;
  onStageChange: (value: string | null) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
}

export default function CaseListFilters({
  search,
  onSearchChange,
  stage,
  onStageChange,
  sortValue,
  onSortChange,
}: CaseListFiltersProps) {
  return (
    <Group gap="sm" align="flex-end" wrap="wrap">
      <TextInput
        label="Tìm kiếm"
        placeholder="Tìm theo mã hồ sơ hoặc tên nhóm..."
        leftSection={<Search className="w-4 h-4 text-text-muted" />}
        value={search}
        onChange={(event) => onSearchChange(event.currentTarget.value)}
        radius="md"
        style={{ flexGrow: 1, minWidth: 200 }}
      />
      <Select
        label="Trạng thái"
        placeholder="Tất cả"
        data={STUDENT_STAGE_OPTIONS}
        value={stage}
        onChange={onStageChange}
        clearable
        radius="md"
        style={{ width: 208 }}
      />
      <Select
        label="Sắp xếp"
        data={STUDENT_SORT_OPTIONS}
        value={sortValue}
        onChange={(value) => onSortChange(value || "created_at_desc")}
        allowDeselect={false}
        radius="md"
        style={{ width: 192 }}
      />
    </Group>
  );
}
