"use client";

import React from "react";
import { Modal, Button, Badge, Loader } from "@mantine/core";
import { FileText } from "lucide-react";
import { useAdminCaseDetail } from "../hooks/useAdminCases";
import { statusThemeMap } from "@/types";
import { filterTransitions } from "@/_types/transitions";

interface AdminCaseDetailModalProps {
  caseId: string | null;
  onClose: () => void;
  onReject: (caseId: string) => void;
  onApprove: (caseId: string) => void;
  onAssign: (caseId: string) => void;
}

const PRIMARY_NEED_LABELS: Record<string, string> = {
  filter_select_idea: "Cần hỗ trợ chọn hướng ý tưởng phù hợp để phát triển tiếp",
  clarify_customer_pain: "Cần phản biện để làm rõ khách hàng mục tiêu và vấn đề cốt lõi",
  critique_feasibility: "Cần phản biện để đánh giá giải pháp hiện tại có hợp lý và khả thi không",
  audit_cp1_draft: "Cần rà soát báo cáo Checkpoint 1 và chỉ ra điểm cần chỉnh sửa",
  improve_rejected_idea: "Cần góp ý để cải thiện ý tưởng sau phản hồi chưa tốt từ giảng viên",
};

const getPrimaryNeedLabel = (key: string) => {
  return PRIMARY_NEED_LABELS[key] || key;
};

export default function AdminCaseDetailModal({
  caseId,
  onClose,
  onReject,
  onApprove,
  onAssign,
}: AdminCaseDetailModalProps) {
  const { data: detailData, isLoading: isFetchingDetail, error: queryError } = useAdminCaseDetail(caseId);

  const error = queryError
    ? (queryError as any)?.response?.data?.error || (queryError as any)?.message || "Không thể tải chi tiết hồ sơ."
    : null;

  const filteredTransitions = filterTransitions(detailData?.allowed_transitions ?? [], {
    role: "admin",
    isOwner: false,
    isAssignedSupporter: false,
  });
  const hasNoIntake = !!detailData && !detailData.intake_snapshot;
  const canAccept = !hasNoIntake && filteredTransitions.includes("T5_ACCEPT");
  const canReject = !hasNoIntake && filteredTransitions.includes("T12_REJECT");
  const canAssign = !hasNoIntake && filteredTransitions.includes("T6_ASSIGN_SUPPORTER");

  return (
    <Modal
      opened={caseId !== null}
      onClose={onClose}
      title={
        <span className="font-heading font-semibold text-base text-text-app">
          Hồ sơ phản biện: {detailData?.case?.case_code || (isFetchingDetail ? "Đang tải..." : "")}
        </span>
      }
      size="lg"
      centered
    >
      <div className="space-y-6 font-body text-sm text-text-app max-h-[70vh] overflow-y-auto pr-1">
        {isFetchingDetail ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-muted">
            <Loader size="md" color="blue" />
            <p className="text-xs">Đang tải hồ sơ phản biện...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-danger font-semibold text-xs">{error}</div>
        ) : !detailData ? null : (
          <div className="space-y-6">
            <div>
              <h4 className="font-heading font-semibold text-sm text-text-app mb-3">Thông tin chung</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-surface-app p-5 rounded-xl border border-border-app shadow-sm">
                <div className="space-y-1">
                  <span className="font-semibold text-xs text-text-subtle">Tên nhóm / Đề tài</span>
                  <p className="text-sm text-text-app font-normal">{detailData.case.team_name || "Chưa đặt tên"}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-xs text-text-subtle">Gói dịch vụ</span>
                  <p className="text-sm text-brand font-normal">{detailData.case.package?.name || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-xs text-text-subtle">Trường học</span>
                  <p className="text-sm text-text-app font-normal">{detailData.case.school || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-xs text-text-subtle">Bối cảnh môn học</span>
                  <p className="text-sm text-text-app font-normal">{detailData.case.course_context || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-xs text-text-subtle">Ngày tạo</span>
                  <p className="text-sm text-text-app font-normal">
                    {new Date(detailData.case.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-xs text-text-subtle">Trạng thái nội bộ</span>
                  <div className="pt-0.5 font-normal">
                    <Badge
                      color={
                        statusThemeMap[detailData.case.internal_status]?.color === "primary" ? "brand"
                        : statusThemeMap[detailData.case.internal_status]?.color === "warning" ? "yellow"
                        : statusThemeMap[detailData.case.internal_status]?.color === "danger" ? "red"
                        : statusThemeMap[detailData.case.internal_status]?.color === "success" ? "teal"
                        : "gray"
                      }
                      variant="light"
                      size="md"
                    >
                      {statusThemeMap[detailData.case.internal_status]?.label || detailData.case.internal_status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {hasNoIntake ? (
              <div className="bg-surface-app border border-border-app rounded-lg p-8 md:p-12 text-center flex flex-col items-center justify-center gap-4 animate-fade-in font-body">
                <div className="w-12 h-12 rounded-full bg-surface-soft border border-border-app text-text-subtle flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h4 className="font-heading font-semibold text-sm text-text-app">
                    Sinh viên đã thanh toán nhưng chưa nộp hồ sơ
                  </h4>
                  <p className="font-body text-xs text-text-muted leading-relaxed">
                    Nội dung hồ sơ phản biện sẽ hiển thị ở đây sau khi sinh viên hoàn thành bước nộp hồ sơ.
                  </p>
                </div>
              </div>
            ) : (
              <>
            {detailData.intake_snapshot?.contact && (
              <div>
                <h4 className="font-heading font-semibold text-sm text-text-app mb-3">Người liên hệ chính (Đại diện nhóm)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-surface-app p-5 rounded-xl border border-border-app shadow-sm">
                  <div className="space-y-1">
                    <span className="font-semibold text-xs text-text-subtle">Họ tên</span>
                    <p className="text-sm text-text-app font-normal">{detailData.intake_snapshot.contact.full_name || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-xs text-text-subtle">Mã sinh viên</span>
                    <p className="text-sm text-text-app font-normal">{detailData.intake_snapshot.contact.student_code || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-xs text-text-subtle">Email</span>
                    <p className="text-sm text-text-app font-normal">{detailData.intake_snapshot.contact.email || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-xs text-text-subtle">Zalo / Telegram</span>
                    <p className="text-sm text-text-app font-normal">
                      Zalo: {detailData.intake_snapshot.contact.zalo || "N/A"}
                      {detailData.intake_snapshot.contact.telegram && (
                        <span className="text-text-muted font-normal"> | Telegram: {detailData.intake_snapshot.contact.telegram}</span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <span className="font-semibold text-xs text-text-subtle">Vai trò trong nhóm</span>
                    <p className="text-sm text-text-app font-normal">{detailData.intake_snapshot.contact.team_role || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-heading font-semibold text-sm text-text-app mb-3">Yêu cầu hiện tại</h4>
              <div className="space-y-4 bg-surface-app p-5 rounded-xl border border-border-app shadow-sm">
                {detailData.intake_snapshot?.current_blocker && (
                  <div className="space-y-1">
                    <span className="font-semibold text-xs text-text-subtle">Điểm kẹt hiện tại</span>
                    <p className="text-sm text-text-app leading-relaxed whitespace-pre-wrap font-normal">
                      {detailData.intake_snapshot.current_blocker}
                    </p>
                  </div>
                )}

                {detailData.intake_snapshot?.support_needs?.primary_need && (
                  <div className="space-y-1">
                    <span className="font-semibold text-xs text-text-subtle">Nhu cầu hỗ trợ chính</span>
                    <p className="text-sm text-text-app leading-relaxed font-normal">
                      {getPrimaryNeedLabel(detailData.intake_snapshot.support_needs.primary_need)}
                    </p>
                  </div>
                )}

                {detailData.intake_snapshot?.expected_outputs && (
                  <div className="space-y-1">
                    <span className="font-semibold text-xs text-text-subtle">Kỳ vọng đầu ra</span>
                    <p className="text-sm text-text-app leading-relaxed whitespace-pre-wrap font-normal">
                      {detailData.intake_snapshot.expected_outputs}
                    </p>
                  </div>
                )}

                {detailData.intake_snapshot?.support_needs?.extra_notes && (
                  <div className="space-y-1">
                    <span className="font-semibold text-xs text-text-subtle">Ghi chú thêm cho Supporter</span>
                    <p className="text-sm text-text-app leading-relaxed whitespace-pre-wrap font-normal">
                      {detailData.intake_snapshot.support_needs.extra_notes}
                    </p>
                  </div>
                )}

                {detailData.intake_snapshot?.lecturer_feedback && (
                  <div className="space-y-1">
                    <span className="font-semibold text-xs text-text-subtle">Góp ý từ giảng viên (nếu có)</span>
                    <p className="text-sm text-text-app leading-relaxed whitespace-pre-wrap font-normal">
                      {detailData.intake_snapshot.lecturer_feedback}
                    </p>
                  </div>
                )}

                {!detailData.intake_snapshot?.current_blocker && detailData.intake_snapshot?.case_summary && (
                  <div className="space-y-1">
                    <span className="font-semibold text-xs text-text-subtle">Tóm tắt ý tưởng đề tài (legacy)</span>
                    <p className="text-sm text-text-app leading-relaxed whitespace-pre-wrap font-normal">
                      {detailData.intake_snapshot.case_summary}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {detailData.intake_snapshot?.documents && detailData.intake_snapshot.documents.length > 0 && (
              <div>
                <h4 className="font-heading font-semibold text-sm text-text-app mb-3">Tài liệu minh chứng hồ sơ</h4>
                <div className="bg-surface-app p-5 rounded-xl border border-border-app shadow-sm divide-y divide-border-app/40 space-y-3">
                  {detailData.intake_snapshot.documents.map((doc: any, idx: number) => (
                    <div key={idx} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-1.5">
                      <span className="font-semibold text-xs text-text-subtle">{doc.document_type || "Tài liệu đính kèm"}</span>
                      {(doc.drive_url || doc.file_url) ? (
                        <a
                          href={doc.drive_url || doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-brand hover:text-brand-hover underline break-all font-normal"
                        >
                          {doc.drive_url || doc.file_url}
                        </a>
                      ) : (
                        <p className="text-sm text-text-muted italic font-normal">Chưa có liên kết</p>
                      )}
                      {doc.role_description && <p className="text-sm text-text-muted font-normal">{doc.role_description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
              </>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-border-app gap-3">
          <Button onClick={onClose} variant="default">
            Đóng
          </Button>

          <div className="flex gap-2">
            {detailData && canReject && (
              <Button
                onClick={() => onReject(detailData.case.id)}
                variant="outline"
                color="red"
                className="font-semibold cursor-pointer"
              >
                Từ chối
              </Button>
            )}
            {detailData && canAccept && (
              <Button
                onClick={() => onApprove(detailData.case.id)}
                color="green"
                className="font-semibold cursor-pointer"
              >
                Duyệt hồ sơ
              </Button>
            )}
            {detailData && canAssign && (
              <Button
                onClick={() => onAssign(detailData.case.id)}
                color="brand"
                className="font-semibold cursor-pointer"
              >
                {detailData.case.internal_status === "assigned" ? "Phân công lại" : "Phân công Supporter"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
