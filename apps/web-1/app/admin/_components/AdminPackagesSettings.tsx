import React, { useState } from "react";
import { ServicePackage } from "@/types";
import { Table, NumberInput, Button, Card, Stack, Text, Badge, Switch } from "@mantine/core";
import { notifications } from "@mantine/notifications";
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
              <Table.Th className="text-left text-sm font-bold text-text-app">Tên gói dịch vụ</Table.Th>
              <Table.Th className="text-left w-36 text-sm font-bold text-text-app">Trạng thái</Table.Th>
              <Table.Th className="text-left w-52 text-sm font-bold text-text-app">Hiển thị với khách mới</Table.Th>
              <Table.Th className="text-left w-56 text-sm font-bold text-text-app">Đơn giá hiện tại (VNĐ)</Table.Th>
              <Table.Th className="text-left w-56 text-sm font-bold text-text-app">Thiết lập giá mới (VNĐ)</Table.Th>
              <Table.Th className="text-center w-44 text-sm font-bold text-text-app" style={{ textAlign: "center" }}>Thao tác</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {packages.map((pkg) => {
              const currentInputVal = getPrice(pkg);
              const isModified = currentInputVal !== pkg.price;

              return (
                <Table.Tr key={pkg.id} className="hover:bg-surface-soft/30 transition-colors">
                  <Table.Td className="text-sm">
                    <Stack gap="xs">
                      <Text fw={600} className="text-text-app text-sm">
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
                  <Table.Td className="text-sm">
                    <Badge color={pkg.is_active ? "green" : "gray"} variant="light" size="sm">
                      {pkg.is_active ? "Đang bật" : "Đã tắt"}
                    </Badge>
                  </Table.Td>
                  <Table.Td className="text-sm">
                    <Switch
                      checked={pkg.is_active}
                      onChange={() => handleToggleStatus(pkg)}
                      disabled={isUpdatingStatus}
                      label={<span className="text-sm font-medium">{pkg.is_active ? "Đang hiển thị" : "Đang ẩn"}</span>}
                      color="brand"
                      size="md"
                    />
                  </Table.Td>
                  <Table.Td className="text-sm">
                    <Text fw={600} c="red" size="sm">{formatPrice(pkg.price)}</Text>
                  </Table.Td>
                  <Table.Td className="text-sm">
                    <NumberInput
                      value={currentInputVal}
                      onChange={(val) => handlePriceChange(pkg.id, val)}
                      min={0}
                      thousandSeparator="."
                      decimalSeparator=","
                      suffix=" VNĐ"
                      placeholder="Nhập giá mới..."
                      radius="md"
                      size="md"
                    />
                  </Table.Td>
                  <Table.Td className="text-center text-sm">
                    <div className="flex items-center justify-center w-full">
                      <Button
                        onClick={() => handleUpdatePrice(pkg)}
                        disabled={isUpdatingPrice || !isModified}
                        loading={isUpdatingPrice}
                        variant="filled"
                        color="brand"
                        size="md"
                        radius="md"
                        className="font-semibold text-base h-10 px-4"
                      >
                        Cập nhật giá
                      </Button>
                    </div>
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
