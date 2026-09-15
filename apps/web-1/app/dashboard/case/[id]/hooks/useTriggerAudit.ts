import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { notifications } from "@mantine/notifications";
import { apiClient } from "@/lib/api-client";

export type SubmissionType = "initial" | "resubmit" | "logic_check";

interface TriggerAuditPayload {
  submission_type: SubmissionType;
  lifecycle_unit_id?: string;
}

interface TriggerAuditErrorResponse {
  code?: string;
  message?: string;
}

export function useTriggerAudit(caseId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: TriggerAuditPayload) => {
      const response = await apiClient.post(`/cases/${caseId}/ai-retry`, {
        submission_type: payload.submission_type,
        ...(payload.lifecycle_unit_id ? { lifecycle_unit_id: payload.lifecycle_unit_id } : {}),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["case-ai-status", caseId] });
      notifications.show({
        title: "Đã gửi đánh giá",
        message: "Hệ thống đang tiến hành thẩm định. Kết quả sẽ có trong vài phút.",
        color: "teal",
      });
    },
    onError: (error: unknown) => {
      const errData = isAxiosError<TriggerAuditErrorResponse>(error)
        ? error.response?.data
        : undefined;
      const status = isAxiosError(error) ? error.response?.status : undefined;

      if (status === 402 || errData?.code === "NO_CREDITS") {
        notifications.show({
          title: "Không đủ credit",
          message: "Bạn đã hết credit đánh giá. Vui lòng mua thêm credit để tiếp tục.",
          color: "orange",
        });
        return;
      }

      if (status === 409 && errData?.code === "RESUBMIT_REQUIRES_UPLOAD") {
        notifications.show({
          title: "Cần tải tài liệu sửa đổi",
          message: "Vui lòng tải lên tài liệu đã sửa trước khi gửi đánh giá lại.",
          color: "orange",
        });
        return;
      }

      if (status === 409 && errData?.code === "AUDIT_IN_PROGRESS") {
        notifications.show({
          title: "Đánh giá đang diễn ra",
          message: "Hệ thống đang thẩm định. Vui lòng chờ kết quả trước khi gửi lại.",
          color: "blue",
        });
        return;
      }

      notifications.show({
        title: "Gửi đánh giá thất bại",
        message: errData?.message || "Đã xảy ra lỗi. Vui lòng thử lại sau.",
        color: "red",
      });
    },
  });

  return {
    triggerAudit: mutation.mutateAsync,
    isTriggering: mutation.isPending,
    error: mutation.error,
  };
}
