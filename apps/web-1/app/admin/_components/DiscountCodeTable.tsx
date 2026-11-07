"use client";

import { Badge, Switch, Table, Text } from "@mantine/core";
import type { AdminDiscountCode, AdminDiscountCodeStatus } from "@repo/validation";

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN");
const CASE_ID_PREVIEW_LENGTH = 8;
const COLUMN_COUNT = 7;

export const STATUS_META: Record<AdminDiscountCodeStatus, { label: string; color: string }> = {
  available: { label: "Đang hiệu lực", color: "teal" },
  used: { label: "Đã dùng hết", color: "gray" },
  expired: { label: "Hết hạn", color: "orange" },
  disabled: { label: "Đã tắt", color: "red" },
};

interface DiscountCodeTableProps {
  codes: AdminDiscountCode[];
  isLoading: boolean;
  isUpdating: boolean;
  onToggle: (id: string, isActive: boolean) => void;
}

export default function DiscountCodeTable({ codes, isLoading, isUpdating, onToggle }: DiscountCodeTableProps) {
  return (
    <Table highlightOnHover verticalSpacing="sm">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Mã</Table.Th>
          <Table.Th>Giảm</Table.Th>
          <Table.Th>Dịch vụ</Table.Th>
          <Table.Th>Chủ mã</Table.Th>
          <Table.Th>Đã dùng</Table.Th>
          <Table.Th>Hạn dùng</Table.Th>
          <Table.Th>Trạng thái</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {codes.map((item) => (
          <Table.Tr key={item.id}>
            <Table.Td><Text fw={600} ff="monospace">{item.code}</Text></Table.Td>
            <Table.Td><Badge variant="light">{item.percent_off}%</Badge></Table.Td>
            <Table.Td>{item.service_type_code}</Table.Td>
            <Table.Td>
              {item.owner_user_id ? (
                <>
                  <Text size="sm">{item.owner_email ?? item.owner_user_id}</Text>
                  {item.case_id && <Text size="xs" c="dimmed">{`Dự án ${item.case_id.slice(0, CASE_ID_PREVIEW_LENGTH)}`}</Text>}
                </>
              ) : (
                <Text size="sm" c="dimmed">Mã chung</Text>
              )}
            </Table.Td>
            <Table.Td>{item.redeemed_count}/{item.max_redemptions ?? "∞"}</Table.Td>
            <Table.Td>{item.expires_at ? DATE_FORMATTER.format(new Date(item.expires_at)) : "Không hết hạn"}</Table.Td>
            <Table.Td>
              <Badge color={STATUS_META[item.status].color} variant="light" mb={4}>{STATUS_META[item.status].label}</Badge>
              <Switch
                checked={item.is_active}
                disabled={isUpdating || item.status === "used"}
                onChange={(e) => onToggle(item.id, e.currentTarget.checked)}
                aria-label={`Bật/tắt mã ${item.code}`}
              />
            </Table.Td>
          </Table.Tr>
        ))}
        {!isLoading && codes.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={COLUMN_COUNT}><Text c="dimmed" ta="center">Không có mã giảm giá nào.</Text></Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
