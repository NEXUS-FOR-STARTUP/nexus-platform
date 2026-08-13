import React, { useState } from "react";
import { ServicePackage } from "@/types";
import { Table, NumberInput, Card, Stack, Text, Badge, Switch, Menu, ActionIcon } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { MoreVertical, Save } from "lucide-react";
import { formatPrice } from "@/lib/pricing";

interface AdminPackagesSettingsProps {
  packages: ServicePackage[];
  onUpdatePrice: (args: { packageId: string; price: number }) => Promise<any>;
  onUpdateStatus: (args: { packageId: string; isActive: boolean }) => Promise<any>;
  isUpdatingPrice: boolean;
  isUpdatingStatus: boolean;
}

export default function AdminPackagesSettings({
  packages,
  onUpdatePrice,
  onUpdateStatus,
  isUpdatingPrice,
  isUpdatingStatus,
}: AdminPackagesSettingsProps) {
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});

  const getPrice = (pkg: ServicePackage) => {
    return editingPrices[pkg.id] !== undefined ? editingPrices[pkg.id] : pkg.price;
  };

  const handlePriceChange = (id: string, value: string | number) => {
    const numValue = typeof value === "number" ? value : parseFloat(value as string) || 0;
    setEditingPrices((prev) => ({ ...prev, [id]: numValue }));
  };

  const handleUpdatePrice = async (pkg: ServicePackage) => {
    const price = getPrice(pkg);
    if (price < 0) {
      notifications.show({
        title: "Lỗi",
        message: "Giá tiền phải lớn hơn hoặc bằng 0",
        color: "red",
      });
      return;
    }

    try {
      await onUpdatePrice({ packageId: pkg.id, price });
      notifications.show({
        title: "Thành công",
        message: `Đã cập nhật đơn giá cho gói "${pkg.name}" thành ${formatPrice(price)}`,
        color: "green",
      });
    } catch (e: any) {
      notifications.show({
        title: "Lỗi",
        message: e?.response?.data?.message || e?.message || "Gặp lỗi khi cập nhật giá gói.",
        color: "red",
      });
    }
  };

  const handleToggleStatus = async (pkg: ServicePackage) => {
    const nextIsActive = !pkg.is_active;

    try {
      await onUpdateStatus({ packageId: pkg.id, isActive: nextIsActive });
      notifications.show({
        title: "Thành công",
        message: nextIsActive
          ? `Đã bật gói "${pkg.name}" cho khách hàng mới.`
          : `Đã tắt gói "${pkg.name}" khỏi luồng đăng ký mới.`,
        color: "green",
      });
    } catch (e: any) {
      notifications.show({
        title: "Lỗi",
        message: e?.response?.data?.message || e?.message || "Gặp lỗi khi cập nhật trạng thái gói.",
        color: "red",
      });
    }
  };

  if (packages.length === 0) {
    return (
      <Card withBorder padding="xl" radius="md">
        <Text ta="center" c="dimmed">
          Không có gói dịch vụ nào trên hệ thống.
        </Text>
      </Card>
    );
  }

  return (
    <Card withBorder padding="md" radius="md" style={{ width: "100%" }}>
      <Table.ScrollContainer minWidth={860}>
        <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
          <Table.Thead className="bg-brand-soft">
            <Table.Tr>
              <Table.Th className="text-left">Tên gói dịch vụ</Table.Th>
              <Table.Th className="text-left w-36">Trạng thái</Table.Th>
              <Table.Th className="text-left w-52">Hiển thị với khách mới</Table.Th>
              <Table.Th className="text-left w-56">Đơn giá hiện tại (VNĐ)</Table.Th>
              <Table.Th className="text-left w-56">Thiết lập giá mới (VNĐ)</Table.Th>
              <Table.Th className="text-center w-20">Thao tác</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {packages.map((pkg) => {
              const currentInputVal = getPrice(pkg);
              const isModified = currentInputVal !== pkg.price;

              return (
                <Table.Tr key={pkg.id} className="hover:bg-surface-soft/30 transition-colors">
                  <Table.Td>
                    <Stack gap="xs">
                      <Text fw={600} className="text-text-app">
                        {pkg.name}
                      </Text>
                      {pkg.features && Array.isArray(pkg.features) && (
                        <Text size="xs" c="dimmed">
                          {pkg.features.join(" • ")}
                        </Text>
                      )}
                      {pkg.last_price_changed_at && (
                        <Text size="xs" c="dimmed">
                          Cập nhật lần cuối: {new Date(pkg.last_price_changed_at).toLocaleString("vi-VN")}
                          {pkg.previous_price !== null && pkg.previous_price !== undefined
                            ? ` (từ ${formatPrice(pkg.previous_price)})`
                            : ""}
                        </Text>
                      )}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={pkg.is_active ? "green" : "gray"} variant="light" size="lg">
                      {pkg.is_active ? "Đang bật" : "Đã tắt"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Switch
                      checked={pkg.is_active}
                      onChange={() => handleToggleStatus(pkg)}
                      disabled={isUpdatingStatus}
                      label={pkg.is_active ? "Đang hiển thị" : "Đang ẩn"}
                      color="brand"
                    />
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600} c="red">{formatPrice(pkg.price)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={currentInputVal}
                      onChange={(val) => handlePriceChange(pkg.id, val)}
                      min={0}
                      thousandSeparator="."
                      decimalSeparator=","
                      suffix=" VNĐ"
                      placeholder="Nhập giá mới..."
                      radius="md"
                    />
                  </Table.Td>
                  <Table.Td className="text-center">
                    <Menu shadow="md" width={180} position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" className="cursor-pointer mx-auto">
                          <MoreVertical className="w-4 h-4" />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown className="bg-surface-app border border-border-app p-1 rounded-lg">
                        <Menu.Item
                          leftSection={<Save className="w-3.5 h-3.5 text-brand" />}
                          onClick={() => handleUpdatePrice(pkg)}
                          disabled={isUpdatingPrice || !isModified}
                          className="text-text-app hover:bg-surface-soft cursor-pointer text-xs font-semibold"
                        >
                          Cập nhật giá
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  );
}
