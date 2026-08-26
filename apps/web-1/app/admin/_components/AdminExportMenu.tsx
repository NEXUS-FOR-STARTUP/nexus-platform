"use client";

import { Button, Menu } from "@mantine/core";
import { Download } from "lucide-react";
import type { AdminExportResource } from "@repo/validation";
import { useAdminExport } from "../hooks/useAdminExport";

const OPTIONS: Array<{ value: AdminExportResource; label: string }> = [
  { value: "cases", label: "Hồ sơ (cases)" },
  { value: "deposits", label: "Nạp tiền (deposits)" },
  { value: "transactions", label: "Giao dịch ví (transactions)" },
  { value: "orders", label: "Đơn hàng (orders)" },
];

export default function AdminExportMenu() {
  const { exportResource, isExporting } = useAdminExport();

  return (
    <Menu shadow="md" width={240} position="bottom-end">
      <Menu.Target>
        <Button
          variant="default"
          size="sm"
          loading={isExporting}
          leftSection={<Download className="w-3.5 h-3.5" />}
          className="cursor-pointer"
        >
          Xuất dữ liệu
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {OPTIONS.map((option) => (
          <Menu.Item
            key={option.value}
            onClick={() => exportResource(option.value)}
            className="cursor-pointer"
          >
            {option.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
