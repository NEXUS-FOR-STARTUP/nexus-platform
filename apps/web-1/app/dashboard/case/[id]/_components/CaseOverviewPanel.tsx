"use client";

import React from "react";
import { Case } from "@/types";

interface CaseOverviewPanelProps {
  caseData: Case;
  intakeSnapshot?: any;
  onSelectTab?: (tab: "overview" | "documents" | "discussion" | "timeline" | "settings" | "credits") => void;
  onEditIntake?: () => void;
  guidanceCard?: React.ReactNode;
}

const PRIMARY_NEEDS_MAP: Record<string, string> = {
  filter_select_idea: "Cần hỗ trợ chọn hướng ý tưởng phù hợp để phát triển tiếp",
  clarify_customer_pain: "Cần phản biện để làm rõ khách hàng mục tiêu và vấn đề cốt lõi",
  critique_feasibility: "Cần phản biện để đánh giá giải pháp hiện tại có hợp lý và khả thi không",
  audit_cp1_draft: "Cần rà soát báo cáo Checkpoint 1 và chỉ ra điểm cần chỉnh sửa",
  improve_rejected_idea: "Cần góp ý để cải thiện ý tưởng sau phản hồi chưa tốt từ giảng viên",
};

export default function CaseOverviewPanel({ caseData, intakeSnapshot, guidanceCard }: CaseOverviewPanelProps) {
  const intake = (intakeSnapshot as any) || {};
  const contact = intake.contact || {};
  const idea = intake.idea_context || intake.idea || intake.idea_snapshot || {};
  const teamCtx = intake.team_context || {};
  const supportNeeds = intake.support_needs || {};

  const schoolName = caseData.school || teamCtx.school || intake.school || "Chưa cập nhật";
  const groupName = caseData.team_name || teamCtx.project_name || intake.project_name || intake.team_name || "Chưa cập nhật";
  const courseContext = caseData.course_context || teamCtx.course_context || intake.course_context || "Chưa cập nhật";
  const groupNo = caseData.group_no || teamCtx.group_no || "";
  const teamStatusSummary = teamCtx.team_status_summary || intake.current_blocker || "";

  const contactName = contact.full_name || (caseData.owner as any)?.name || "Chưa cập nhật";
  const studentCode = contact.student_code || "Chưa cập nhật";
  const teamRole = contact.team_role || contact.role || "Trưởng nhóm";
  const contactEmail = contact.email || (caseData.owner as any)?.email || "Chưa cập nhật";
  const contactPhone = contact.zalo || contact.phone || "Chưa cập nhật";
  const contactTelegram = contact.telegram || "";

  const field = idea.field || intake.field || "Chưa cập nhật";
  const targetCustomer = idea.target_customer || idea.targetCustomer || intake.target_customer || intake.targetCustomer || "Chưa cập nhật";
  const problem = idea.problem || intake.problem || "Chưa cập nhật";
  const solution = idea.solution || intake.solution || "Chưa cập nhật";
  const mvp = idea.mvp || intake.mvp || "";

  const rawPrimaryNeed = supportNeeds.primary_need || "";
  const primaryNeedText = rawPrimaryNeed ? PRIMARY_NEEDS_MAP[rawPrimaryNeed] || rawPrimaryNeed : "";
  const expectedOutputs = intake.expected_outputs || supportNeeds.expected_outputs || "";
  const extraNotes = supportNeeds.extra_notes || "";

  return (
    <div className="space-y-6 animate-fade-in font-body pb-8">
      {guidanceCard && <div className="shrink-0">{guidanceCard}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-app border border-border-app rounded-xl p-5 space-y-4 shadow-xs">
          <div className="pb-3 border-b border-border-app">
            <h4 className="font-semibold text-sm text-text-app">Thông tin Đội ngũ & Trường học</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-text-muted text-base">Tên nhóm / Tên đề tài:</span>
              <p className="font-semibold text-text-app mt-0.5">{groupName}</p>
            </div>
            <div>
              <span className="text-text-muted text-base">Số thứ tự nhóm (Group No):</span>
              <p className="font-semibold text-text-app mt-0.5">{groupNo || "Chưa cập nhật"}</p>
            </div>
            <div>
              <span className="text-text-muted text-base">Trường đại học / Viện đào tạo:</span>
              <p className="font-semibold text-text-app mt-0.5">{schoolName}</p>
            </div>
            <div>
              <span className="text-text-muted text-base">Lớp học / Môn học / Cuộc thi:</span>
              <p className="font-semibold text-text-app mt-0.5">{courseContext}</p>
            </div>
            {teamStatusSummary && (
              <div className="sm:col-span-2">
                <span className="text-text-muted text-base">Hiện trạng & nút thắt nhóm:</span>
                <p className="font-medium text-text-app mt-0.5 leading-relaxed">{teamStatusSummary}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface-app border border-border-app rounded-xl p-5 space-y-4 shadow-xs">
          <div className="pb-3 border-b border-border-app">
            <h4 className="font-semibold text-sm text-text-app">Thông tin Người đại diện / Trưởng nhóm</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-text-muted text-base">Họ và tên:</span>
              <p className="font-semibold text-text-app mt-0.5">{contactName}</p>
            </div>
            <div>
              <span className="text-text-muted text-base">Mã số sinh viên (MSSV):</span>
              <p className="font-semibold text-text-app mt-0.5">{studentCode}</p>
            </div>
            <div>
              <span className="text-text-muted text-base">Email liên hệ:</span>
              <p className="font-semibold text-text-app mt-0.5 truncate">{contactEmail}</p>
            </div>
            <div>
              <span className="text-text-muted text-base">Số điện thoại / Zalo:</span>
              <p className="font-semibold text-text-app mt-0.5">{contactPhone}</p>
            </div>
            <div>
              <span className="text-text-muted text-base">Vai trò trong nhóm:</span>
              <p className="font-semibold text-text-app mt-0.5">{teamRole}</p>
            </div>
            <div>
              <span className="text-text-muted text-base">Telegram Username:</span>
              <p className="font-semibold text-text-app mt-0.5">{contactTelegram || "Chưa cập nhật"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-app border border-border-app rounded-xl p-6 space-y-5 shadow-xs">
        <div className="pb-3 border-b border-border-app">
          <h4 className="font-semibold text-base text-text-app">Chi tiết Ý tưởng Khởi nghiệp</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-4 bg-surface-soft/40 p-4 rounded-lg border border-border-app/60">
            <div>
              <div className="text-brand font-semibold mb-1">
                <span>Lĩnh vực hoạt động:</span>
              </div>
              <p className="text-text-app font-medium leading-relaxed pl-5">{field}</p>
            </div>

            <div>
              <div className="text-brand font-semibold mb-1">
                <span>Khách hàng mục tiêu:</span>
              </div>
              <p className="text-text-app font-medium leading-relaxed pl-5">{targetCustomer}</p>
            </div>
          </div>

          <div className="space-y-4 bg-surface-soft/40 p-4 rounded-lg border border-border-app/60">
            <div>
              <div className="text-danger font-semibold mb-1">
                <span>Vấn đề cốt lõi (Problem):</span>
              </div>
              <p className="text-text-app font-medium leading-relaxed pl-5">{problem}</p>
            </div>

            <div>
              <div className="text-success font-semibold mb-1">
                <span>Giải pháp đề xuất (Solution):</span>
              </div>
              <p className="text-text-app font-medium leading-relaxed pl-5">{solution}</p>
            </div>
          </div>
        </div>

        {mvp && (
          <div className="bg-brand-soft/10 border border-brand/20 p-4 rounded-lg space-y-1 text-xs">
            <span className="font-semibold text-brand">Sản phẩm khả thi tối thiểu (MVP):</span>
            <p className="text-text-app leading-relaxed pl-5 font-medium">{mvp}</p>
          </div>
        )}
      </div>

      <div className="bg-surface-app border border-border-app rounded-xl p-6 space-y-4 shadow-xs">
        <div className="pb-3 border-b border-border-app">
          <h4 className="font-semibold text-base text-text-app">Nhu cầu hỗ trợ chuyên môn</h4>
        </div>

        <div className="space-y-4 text-xs">
          <div className="bg-brand-soft/20 border border-brand/20 p-4 rounded-lg space-y-1">
            <span className="font-semibold text-brand">Nhu cầu hỗ trợ chính:</span>
            <p className="text-text-app font-semibold leading-relaxed pl-5">
              {primaryNeedText || "Cần phản biện để làm rõ khách hàng mục tiêu và vấn đề cốt lõi"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-soft/60 border border-border-app/80 p-4 rounded-lg space-y-1">
              <span className="font-semibold text-text-app">Kết quả mong đợi sau phản biện:</span>
              <p className="text-text-muted leading-relaxed pl-5">{expectedOutputs || "Chưa nhập ghi chú kỳ vọng"}</p>
            </div>

            <div className="bg-surface-soft/60 border border-border-app/80 p-4 rounded-lg space-y-1">
              <span className="font-semibold text-text-app">Ghi chú thêm cho Supporter:</span>
              <p className="text-text-muted leading-relaxed pl-5">{extraNotes || "Chưa nhập ghi chú thêm"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
