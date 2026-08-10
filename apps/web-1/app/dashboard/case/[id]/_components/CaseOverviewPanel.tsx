"use client";

import React from "react";
import { Case } from "@/types";
import {
  Building2,
  Target,
  Lightbulb,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  UserCheck,
  Layers,
  MessageSquareCode,
  Send,
  HelpCircle,
  FileText,
} from "lucide-react";

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
  const currentBlocker = intake.current_blocker || teamCtx.team_status_summary || (caseData as any).current_blocker || "";

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
    <div className="space-y-6 animate-fade-in font-body pb-8 text-text-app">
      {guidanceCard && <div className="shrink-0">{guidanceCard}</div>}

      {/* ── 1. Grid 2 Cột: Bối cảnh Đội ngũ & Thông tin Người liên hệ ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Team Context */}
        <div className="bg-surface-app border border-border-app rounded-xl p-5.5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-border-app/60">
            <Building2 className="w-5 h-5 text-brand shrink-0" />
            <h3 className="font-heading text-lg font-semibold text-text-app leading-snug">Thông tin Đội ngũ & Trường học</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <div>
              <span className="text-text-muted text-base font-medium block leading-normal">Tên nhóm / Tên đề tài:</span>
              <p className="font-semibold text-text-app text-base mt-1 leading-snug">{groupName}</p>
            </div>
            <div>
              <span className="text-text-muted text-base font-medium block leading-normal">Số thứ tự nhóm (Group No):</span>
              <p className="font-semibold text-text-app text-base mt-1 leading-snug">{groupNo || "Chưa cập nhật"}</p>
            </div>
            <div>
              <span className="text-text-muted text-base font-medium block leading-normal">Trường đại học / Viện đào tạo:</span>
              <p className="font-semibold text-text-app text-base mt-1 leading-snug">{schoolName}</p>
            </div>
            <div>
              <span className="text-text-muted text-base font-medium block leading-normal">Lớp học / Môn học / Cuộc thi:</span>
              <p className="font-semibold text-text-app text-base mt-1 leading-snug">{courseContext}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Contact Person */}
        <div className="bg-surface-app border border-border-app rounded-xl p-5.5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-border-app/60">
            <UserCheck className="w-5 h-5 text-brand shrink-0" />
            <h3 className="font-heading text-lg font-semibold text-text-app leading-snug">Thông tin Người đại diện / Trưởng nhóm</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <div>
              <span className="text-text-muted text-base font-medium block leading-normal">Họ và tên:</span>
              <p className="font-semibold text-text-app text-base mt-1 leading-snug">{contactName}</p>
            </div>
            <div>
              <span className="text-text-muted text-base font-medium block leading-normal">Mã số sinh viên (MSSV):</span>
              <p className="font-semibold text-text-app text-base mt-1 leading-snug">{studentCode}</p>
            </div>
            <div>
              <span className="text-text-muted text-base font-medium block leading-normal">Email liên hệ:</span>
              <p className="font-semibold text-text-app text-base mt-1 flex items-center gap-1.5 truncate leading-snug">
                <Mail className="w-4 h-4 text-text-muted shrink-0" />
                <span className="truncate">{contactEmail}</span>
              </p>
            </div>
            <div>
              <span className="text-text-muted text-base font-medium block leading-normal">Số điện thoại / Zalo:</span>
              <p className="font-semibold text-text-app text-base mt-1 flex items-center gap-1.5 leading-snug">
                <Phone className="w-4 h-4 text-text-muted shrink-0" />
                <span>{contactPhone}</span>
              </p>
            </div>
            <div>
              <span className="text-text-muted text-base font-medium block leading-normal">Vai trò trong nhóm:</span>
              <p className="font-semibold text-text-app text-base mt-1 leading-snug">{teamRole}</p>
            </div>
            <div>
              <span className="text-text-muted text-base font-medium block leading-normal">Telegram Username:</span>
              <p className="font-semibold text-text-app text-base mt-1 flex items-center gap-1.5 leading-snug">
                <Send className="w-4 h-4 text-brand shrink-0" />
                <span>{contactTelegram || "Chưa cập nhật"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Nhóm đang kẹt ở đâu? ── */}
      <div className="bg-surface-app border border-border-app rounded-xl p-5.5 space-y-3.5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-border-app/60">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <h3 className="font-heading text-lg font-semibold text-text-app leading-snug">Nhóm đang kẹt ở đâu?</h3>
        </div>

        <div>
          <span className="text-text-muted text-base font-medium block mb-1.5 leading-normal">Điểm kẹt hiện tại:</span>
          <p className="font-medium text-text-app text-base leading-relaxed bg-surface-soft/60 p-4 rounded-xl border border-border-app/60">
            {currentBlocker || "Chưa cập nhật điểm kẹt hiện tại."}
          </p>
        </div>
      </div>

      {/* ── 3. Startup Idea Detailed Breakdown ── */}
      <div className="bg-surface-app border border-border-app rounded-xl p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-border-app/60">
          <Lightbulb className="w-5 h-5 text-brand shrink-0" />
          <h3 className="font-heading text-lg font-semibold text-text-app leading-snug">Chi tiết Ý tưởng Khởi nghiệp</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 bg-surface-soft/40 p-4.5 rounded-lg border border-border-app/60">
            <div>
              <div className="flex items-center gap-1.5 text-brand font-bold mb-1.5 text-base">
                <Layers className="w-4.5 h-4.5" />
                <span>Lĩnh vực hoạt động:</span>
              </div>
              <p className="text-text-app font-medium text-base leading-relaxed pl-6">{field}</p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-brand font-bold mb-1.5 text-base">
                <Target className="w-4.5 h-4.5" />
                <span>Khách hàng mục tiêu:</span>
              </div>
              <p className="text-text-app font-medium text-base leading-relaxed pl-6">{targetCustomer}</p>
            </div>
          </div>

          <div className="space-y-4 bg-surface-soft/40 p-4.5 rounded-lg border border-border-app/60">
            <div>
              <div className="flex items-center gap-1.5 text-danger font-bold mb-1.5 text-base">
                <AlertTriangle className="w-4.5 h-4.5" />
                <span>Vấn đề cốt lõi (Problem):</span>
              </div>
              <p className="text-text-app font-medium text-base leading-relaxed pl-6">{problem}</p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-success font-bold mb-1.5 text-base">
                <CheckCircle2 className="w-4.5 h-4.5" />
                <span>Giải pháp đề xuất (Solution):</span>
              </div>
              <p className="text-text-app font-medium text-base leading-relaxed pl-6">{solution}</p>
            </div>
          </div>
        </div>

        {mvp && (
          <div className="bg-brand-soft/10 border border-brand/20 p-4.5 rounded-lg space-y-1.5">
            <span className="font-bold text-brand text-base flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5" />
              Sản phẩm khả thi tối thiểu (MVP):
            </span>
            <p className="text-text-app text-base leading-relaxed pl-6 font-medium">{mvp}</p>
          </div>
        )}
      </div>

      {/* ── 4. Nhu cầu hỗ trợ chuyên môn & Kỳ vọng Supporter ── */}
      <div className="bg-surface-app border border-border-app rounded-xl p-6 space-y-4.5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-border-app/60">
          <MessageSquareCode className="w-5 h-5 text-brand shrink-0" />
          <h3 className="font-heading text-lg font-semibold text-text-app leading-snug">Nhu cầu hỗ trợ chuyên môn</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-brand-soft/20 border border-brand/20 p-4.5 rounded-lg space-y-1.5">
            <span className="font-bold text-brand text-base flex items-center gap-1.5">
              <CheckCircle2 className="w-4.5 h-4.5" />
              Nhu cầu hỗ trợ chính:
            </span>
            <p className="text-text-app font-semibold text-base leading-relaxed pl-6">
              {primaryNeedText || "Cần phản biện để làm rõ khách hàng mục tiêu và vấn đề cốt lõi"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
            <div className="bg-surface-soft/60 border border-border-app/80 p-4.5 rounded-lg space-y-1.5">
              <span className="font-bold text-text-app text-base flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-brand" />
                Kết quả mong đợi sau phản biện:
              </span>
              <p className="text-text-app text-base font-medium leading-relaxed pl-6">{expectedOutputs || "Chưa nhập ghi chú kỳ vọng"}</p>
            </div>

            <div className="bg-surface-soft/60 border border-border-app/80 p-4.5 rounded-lg space-y-1.5">
              <span className="font-bold text-text-app text-base flex items-center gap-1.5">
                <HelpCircle className="w-4.5 h-4.5 text-brand" />
                Ghi chú thêm cho Supporter:
              </span>
              <p className="text-text-app text-base font-medium leading-relaxed pl-6">{extraNotes || "Chưa nhập ghi chú thêm"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
