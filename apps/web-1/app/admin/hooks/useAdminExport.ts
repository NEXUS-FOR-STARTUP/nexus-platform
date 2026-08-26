import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { apiClient } from "@/lib/api-client";
import type { AdminExportResource } from "@repo/validation";

const LABELS: Record<AdminExportResource, string> = {
  cases: "hồ sơ",
  deposits: "nạp tiền",
  transactions: "giao dịch ví",
  orders: "đơn hàng",
};

function filenameFromHeader(header: string | undefined, resource: AdminExportResource): string {
  const match = header?.match(/filename="?([^"]+)"?/i);
  if (match?.[1]) {
    return match[1];
  }
  return `nexus-${resource}.csv`;
}

export function useAdminExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportResource = async (resource: AdminExportResource) => {
    setIsExporting(true);
    try {
      const response = await apiClient.get("/admin/exports", {
        params: { resource },
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFromHeader(
        response.headers["content-disposition"],
        resource,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      let message = `Không tải được báo cáo ${LABELS[resource]}.`;
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data instanceof Blob) {
        try {
          const parsed = JSON.parse(await data.text()) as { message?: string };
          if (parsed.message) {
            message = parsed.message;
          }
        } catch {
          /* keep default */
        }
      }
      notifications.show({
        color: "red",
        title: "Xuất dữ liệu thất bại",
        message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportResource, isExporting };
}
