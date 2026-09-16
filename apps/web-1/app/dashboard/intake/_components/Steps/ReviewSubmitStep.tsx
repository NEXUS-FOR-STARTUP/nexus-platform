"use client";

import React from "react";
import { ServicePackage } from "@/types";
import dayjs from "dayjs";
import { formatPrice } from "@/lib/pricing";
import { Alert, Badge } from "@mantine/core";
import { Bot } from "lucide-react";
import { docCategoryLabel } from "@repo/validation";
import { IntakeData } from "../../_types/intake.types";

interface ReviewSubmitStepProps {
  values: Partial<IntakeData> & Record<string, unknown>;
  packages: ServicePackage[] | undefined;
  error: string | null;
  isAiOnlyPackage?: boolean;
}

const PRIMARY_NEEDS_MAP: Record<string, string> = {
  filter_select_idea: "Cần hỗ trợ chọn hướng ý tưởng phù hợp để phát triển tiếp",
  clarify_customer_pain: "Cần phản biện để làm rõ khách hàng mục tiêu và vấn đề cốt lõi",
  critique_feasibility: "Cần phản biện để đánh giá giải pháp hiện tại có hợp lý và khả thi không",
  audit_cp1_draft: "Cần rà soát báo cáo Checkpoint 1 và chỉ ra điểm cần chỉnh sửa",
  improve_rejected_idea: "Cần góp ý để cải thiện ý tưởng sau phản hồi chưa tốt từ giảng viên",
};

const getPrimaryNeedLabel = (needCode?: string): string => {
  if (!needCode || !needCode.trim()) {
    return "Chưa xác định";
  }
  const trimmed = needCode.trim();
  if (PRIMARY_NEEDS_MAP[trimmed]) {
    return PRIMARY_NEEDS_MAP[trimmed];
  }
  if (!trimmed.includes("_")) {
    return trimmed;
  }
  const fallbackMap: Record<string, string> = {
    general_feedback: "Góp ý chung cho ý tưởng và dự án",
    pitching_practice: "Luyện tập thuyết trình và phản biện",
    market_validation: "Thẩm định thị trường và đối thủ",
    financial_model: "Hỗ trợ xây dựng kế hoạch tài chính",
    other: "Nhu cầu hỗ trợ khác",
  };
  return fallbackMap[trimmed] ?? `Hỗ trợ chuyên đề: ${trimmed.replace(/_/g, " ")}`;
};

const getDisplayBlocker = (values: Partial<IntakeData> & Record<string, unknown>) => {
  if (typeof values.current_blocker === "string" && values.current_blocker.trim()) {
    return values.current_blocker.trim();
  }
  if (typeof values.case_summary === "string" && values.case_summary.trim()) {
    return values.case_summary.trim();
  }
  if (Array.isArray(values.current_situations) && values.current_situations.length > 0) {
    return values.current_situations.join("\n");
  }
  return "Chưa cung cấp";
};

export default function ReviewSubmitStep({
  values,
  packages,
  error,
  isAiOnlyPackage,
}: ReviewSubmitStepProps) {
  const isAiOnly = Boolean(isAiOnlyPackage ?? (values?.package_id === "pkg_ai_audit"));
  const selectedPackage = packages?.find((p) => p.id === values.package_id);


  const formatDate = (dateVal: any) => {
    if (!dateVal) return "Chưa chọn";
    const d = dayjs(dateVal);
    return d.isValid() ? d.format("DD/MM/YYYY") : "Chưa chọn";
  };

  return (
    <div className="font-body text-text-app max-w-3xl mx-auto space-y-10">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-text-app">Xác nhận thông tin hồ sơ</h2>
        <p className="text-sm text-text-muted">
          {isAiOnly
            ? "Đây là hồ sơ bàn giao để OMP Engine bắt đầu thẩm định. Kiểm tra lại trước khi xác nhận."
            : "Đây là gói bàn giao để Supporter bắt đầu xử lý. Kiểm tra lại trước khi xác nhận."}
        </p>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger-soft/20 p-3 rounded-lg">
          Lỗi: {error}
        </div>
      )}

      <div className="space-y-10">
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-brand uppercase tracking-wider">1. Điểm kẹt hiện tại</h3>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-y-4 gap-x-6 text-sm pl-4">
            <div className="font-semibold text-text-app">Nhóm đang cần gỡ gì lúc này:</div>
            <div className="text-text-app leading-relaxed whitespace-pre-wrap">{getDisplayBlocker(values)}</div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-brand uppercase tracking-wider">
            {isAiOnly ? "2. Hình thức & Kỳ vọng thẩm định" : "2. Nhu cầu hỗ trợ"}
          </h3>
          <div className="space-y-4 pl-4 text-sm">
            {isAiOnly ? (
              <Alert
                variant="light"
                color="indigo"
                radius="md"
                icon={<Bot className="w-5 h-5 text-brand" />}
                title={
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-brand">
                      Hình thức thẩm định: Đánh giá tự động bằng AI
                    </span>
                    <Badge color="brand" variant="filled" size="sm">
                      OMP Engine - 5 Tiêu chí Rubric
                    </Badge>
                  </div>
                }
                className="border border-brand/20 bg-brand-soft/20"
              >
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Hồ sơ sẽ được chấm điểm và phân tích tự động dựa trên 5 tiêu chí: Problem-Solution Fit, Market Opportunity, Financial Logic, Feasibility và Executive Summary. Kết quả sẵn sàng trong vòng 1 phút.
                </p>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-y-4 gap-x-6">
                <div className="font-semibold text-text-app">Nhu cầu hỗ trợ chính:</div>
                <div className="text-text-app">
                  {getPrimaryNeedLabel(values.support_needs?.primary_need)}
                </div>
              </div>
            )}

            {values.expected_outputs && (
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-y-4 gap-x-6">
                <div className="font-semibold text-text-app">Kết quả mong đợi:</div>
                <div className="text-text-app leading-relaxed whitespace-pre-wrap">{values.expected_outputs}</div>
              </div>
            )}

            {!isAiOnly && values.support_needs?.extra_notes && (
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-y-4 gap-x-6">
                <div className="font-semibold text-text-app">Ghi chú thêm cho Supporter:</div>
                <div className="text-text-app leading-relaxed whitespace-pre-wrap">
                  {values.support_needs.extra_notes}
                </div>
              </div>
            )}

            {values.lecturer_feedback && (
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-y-4 gap-x-6">
                <div className="font-semibold text-text-app">Phản hồi của giảng viên hướng dẫn:</div>
                <div className="text-text-app leading-relaxed whitespace-pre-wrap">{values.lecturer_feedback}</div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-brand uppercase tracking-wider">3. Tài liệu đính kèm</h3>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-y-5 gap-x-6 text-sm pl-4">
            {values.documents && values.documents.length > 0 ? (
              values.documents.map((doc: { document_type?: string; file_url?: string; original_name?: string; extension?: string }, index: number) => (
                <React.Fragment key={index}>
                  <div className="font-semibold text-text-app">
                    {docCategoryLabel(doc.document_type || "") || "Tài liệu"}:
                  </div>
                  <div className="space-y-1">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-blue-600 hover:underline break-all block"
                    >
                      {doc.original_name || doc.file_url}
                    </a>
                    {doc.extension && (
                      <span className="text-xs bg-surface-hover rounded px-1.5 py-0.5 text-text-muted font-mono">
                        .{doc.extension}
                      </span>
                    )}
                  </div>
                </React.Fragment>
              ))
            ) : (
              <>
                <div className="font-semibold text-text-app">Tài liệu đính kèm:</div>
                <div className="text-text-muted italic">Không có tài liệu đính kèm</div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-brand uppercase tracking-wider">4. Hạn chót & gói dịch vụ</h3>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-y-4 gap-x-6 text-sm pl-4">
            <div className="font-semibold text-text-app">Gói phản biện đã chọn:</div>
            <div className="text-text-app">
              {selectedPackage
                ? `${selectedPackage.name} (${formatPrice(selectedPackage.price)})`
                : (isAiOnly
                  ? "Đánh giá ý tưởng tự động bằng AI (OMP Engine)"
                  : "Gói phản biện tiêu chuẩn")}
            </div>

            <div className="font-semibold text-text-app">Hạn nộp bài mong muốn:</div>
            <div className="text-text-app">{formatDate(values.deadline)}</div>

            <div className="font-semibold text-text-app">Mức độ ưu tiên xử lý:</div>
            <div className="text-text-app">
              {isAiOnly
                ? "Tự động phản hồi tức thì (trong 1 phút)"
                : (values.urgency === "urgent" ? "Gấp (trong 24h)" : "Bình thường")}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-brand uppercase tracking-wider">5. Liên hệ</h3>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-y-4 gap-x-6 text-sm pl-4">
            <div className="font-semibold text-text-app">Họ tên & vai trò:</div>
            <div className="text-text-app">
              {values.contact?.full_name || "N/A"}
              {values.contact?.team_role ? ` (${values.contact.team_role})` : ""}
            </div>

            <div className="font-semibold text-text-app">Mã sinh viên:</div>
            <div className="text-text-app">{values.contact?.student_code || "N/A"}</div>

            <div className="font-semibold text-text-app">Số điện thoại Zalo:</div>
            <div className="text-text-app">{values.contact?.zalo || "N/A"}</div>

            <div className="font-semibold text-text-app">Email liên hệ:</div>
            <div className="text-text-app break-all">{values.contact?.email || "N/A"}</div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-brand uppercase tracking-wider">6. Metadata nhóm / môn học</h3>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-y-4 gap-x-6 text-sm pl-4">
            <div className="font-semibold text-text-app">Tên đề tài:</div>
            <div className="text-text-app">{values.team_context?.project_name || "N/A"}</div>

            <div className="font-semibold text-text-app">Trường học:</div>
            <div className="text-text-app">{values.school || "N/A"}</div>

            <div className="font-semibold text-text-app">Môn học & nhóm lớp:</div>
            <div className="text-text-app">
              {values.course_context || "N/A"}
              {values.team_context?.group_no ? ` - Nhóm ${values.team_context.group_no}` : ""}
            </div>

            {values.team_context?.team_status_summary && (
              <>
                <div className="font-semibold text-text-app">Hiện trạng hoạt động của nhóm:</div>
                <div className="text-text-app leading-relaxed whitespace-pre-wrap">
                  {values.team_context.team_status_summary}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
