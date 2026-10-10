"use client";

import { Badge, Card, Stack, Switch, Table, Text } from "@mantine/core";
import { useAdminDiscountCodes } from "../hooks/useAdminDiscountCodes";
import DiscountCodeForm from "./DiscountCodeForm";

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN");

export default function AdminDiscountCodes() {
  const { codes, serviceTypes, isLoading, createCode, isCreating, updateCode, isUpdating } = useAdminDiscountCodes();

  return (
    <Card withBorder padding="md" radius="md" style={{ width: "100%" }}>
      <Stack gap="md">
        <div>
          <Text fw={700}>Mã giảm giá</Text>
          <Text size="sm" c="dimmed">Mã không xóa được để giữ lịch sử; tắt mã khi không dùng nữa.</Text>
        </div>

        <DiscountCodeForm serviceTypes={serviceTypes} isSubmitting={isCreating} onSubmit={createCode} />

        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Mã</Table.Th>
              <Table.Th>Giảm</Table.Th>
              <Table.Th>Dịch vụ</Table.Th>
              <Table.Th>Đã dùng</Table.Th>
              <Table.Th>Hết hạn</Table.Th>
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
                  {item.redeemed_count}/{item.max_redemptions ?? "∞"}
                </Table.Td>
                <Table.Td>{item.expires_at ? DATE_FORMATTER.format(new Date(item.expires_at)) : "Không hết hạn"}</Table.Td>
                <Table.Td>
                  <Switch
                    checked={item.is_active}
                    disabled={isUpdating}
                    onChange={(e) => updateCode({ id: item.id, is_active: e.currentTarget.checked })}
                    aria-label={`Bật/tắt mã ${item.code}`}
                  />
                </Table.Td>
              </Table.Tr>
            ))}
            {!isLoading && codes.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}><Text c="dimmed" ta="center">Chưa có mã giảm giá nào.</Text></Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Stack>
    </Card>
  );
}
