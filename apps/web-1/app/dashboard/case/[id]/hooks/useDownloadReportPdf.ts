"use client";

import { useMutation } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { apiClient } from "@/lib/api-client";

function triggerBlobDownload(blobData: Blob, filename: string) {
  const url = window.URL.createObjectURL(blobData);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function extractFilename(headers: Record<string, string | undefined>, fallback: string): string {
  const disposition = headers["content-disposition"];
  if (disposition && disposition.includes("filename=")) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) {
      return match[1].replace(/['"]/g, "").trim();
    }
  }
  return fallback;
}

export function useDownloadReportPdf(caseId: string) {
  return useMutation({
    mutationFn: async (overrideFilename?: string | void) => {
      const response = await apiClient.get(`/reports/${caseId}/pdf`, {
        responseType: "blob",
      });

      const filename = overrideFilename || extractFilename(
        response.headers as Record<string, string | undefined>,
        `Bao_cao_phan_bien_${caseId.slice(0, 8)}.pdf`,
      );

      triggerBlobDownload(new Blob([response.data], { type: "application/pdf" }), filename);
      return filename;
    },
    onSuccess: (filename) => {
      notifications.show({
        title: "Tải báo cáo thành công",
        message: `Đã tải xuống file ${filename}`,
        color: "teal",
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      notifications.show({
        title: "Không thể tải báo cáo PDF",
        message: err?.response?.data?.message || err?.message || "Có lỗi xảy ra. Vui lòng thử lại sau.",
        color: "red",
      });
    },
  });
}

export function useDownloadReportPdfById() {
  return useMutation({
    mutationFn: async ({ reportId, caseShort, versionNo }: { reportId: string; caseShort?: string; versionNo?: number | null }) => {
      const response = await apiClient.get(`/reports/${reportId}/download`, {
        responseType: "blob",
      });

      const versionSuffix = versionNo != null ? `_v${String(versionNo).padStart(2, "0")}` : "";
      const fallback = `Bao_cao_phan_bien_${(caseShort || reportId).slice(0, 8)}${versionSuffix}.pdf`;

      const resolvedFilename = extractFilename(
        response.headers as Record<string, string | undefined>,
        fallback,
      );

      triggerBlobDownload(new Blob([response.data], { type: "application/pdf" }), resolvedFilename);
      return resolvedFilename;
    },
    onSuccess: (filename) => {
      notifications.show({
        title: "Tải báo cáo thành công",
        message: `Đã tải xuống file ${filename}`,
        color: "teal",
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      notifications.show({
        title: "Không thể tải báo cáo PDF",
        message: err?.response?.data?.message || err?.message || "Có lỗi xảy ra. Vui lòng thử lại sau.",
        color: "red",
      });
    },
  });
}
