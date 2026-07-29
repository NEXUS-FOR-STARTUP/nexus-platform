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
  GraduationCap,
  MessageSquareCode,
  Send,
  HelpCircle,
  Hash,
  FileText
} from "lucide-react";
import { Badge } from "@mantine/core";
import { statusThemeMap } from "@/types";

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

export default function CaseOverviewPanel({ caseData, intakeSnapshot, onSelectTab, onEditIntake, guidanceCard }: CaseOverviewPanelProps) {
  const statusTheme = statusThemeMap[caseData.user_facing_stage] || {
    label: caseData.user_facing_stage,
    color: "default",
  };

  const intake = (intakeSnapshot as any) || {};
  const contact = intake.contact || {};
  const idea = intake.idea_context || intake.idea || intake.idea_snapshot || {};
  const teamCtx = intake.team_context || {};
  const supportNeeds = intake.support_needs || {};

  // 1. Core Team & School Context
  const schoolName = caseData.school || teamCtx.school || intake.school || "Chưa cập nhật";
  const groupName = caseData.team_name || teamCtx.project_name || intake.project_name || intake.team_name || "Chưa cập nhật";
  const courseContext = caseData.course_context || teamCtx.course_context || intake.course_context || "Chưa cập nhật";
  const groupNo = caseData.group_no || teamCtx.group_no || "";
  const teamStatusSummary = teamCtx.team_status_summary || intake.current_blocker || "";

  // 2. Contact Person Details
  const contactName = contact.full_name || (caseData.owner as any)?.name || "Chưa cập nhật";
  const studentCode = contact.student_code || "Chưa cập nhật";
  const teamRole = contact.team_role || contact.role || "Trưởng nhóm";
  const contactEmail = contact.email || (caseData.owner as any)?.email || "Chưa cập nhật";
  const contactPhone = contact.zalo || contact.phone || "Chưa cập nhật";
  const contactTelegram = contact.telegram || "";

  // 3. Idea Details
  const field = idea.field || intake.field || "Chưa cập nhật";
  const targetCustomer = idea.target_customer || idea.targetCustomer || intake.target_customer || intake.targetCustomer || "Chưa cập nhật";
  const problem = idea.problem || intake.problem || "Chưa cập nhật";
  const solution = idea.solution || intake.solution || "Chưa cập nhật";
  const mvp = idea.mvp || intake.mvp || "";

  // 4. Support Needs Details
  const rawPrimaryNeed = supportNeeds.primary_need || "";
  const primaryNeedText = rawPrimaryNeed ? (PRIMARY_NEEDS_MAP[rawPrimaryNeed] || rawPrimaryNeed) : "";
  const expectedOutputs = intake.expected_outputs || supportNeeds.expected_outputs || "";
  const extraNotes = supportNeeds.extra_notes || "";

  return (
    <div className="space-y-6 animate-fade-in font-body pb-8">
      {/* ── 1. Hero Header Banner Card (Tối ưu bố cục tiêu đề & metadata) ── */}
      <div className="bg-gradient-to-r from-brand-soft/40 via-surface-app to-surface-app border border-brand/20 rounded-xl p-6 shadow-xs relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-brand uppercase tracking-wider bg-brand-soft/60 px-2.5 py-1 rounded-md">
              Hồ Sơ Dự Án Khởi Nghiệp
            </span>
            <Badge variant="dot" color="blue" size="sm" className="font-semibold">
              Mã: {caseData.case_code}
            </Badge>
            {(() => {
              const badgeColorMap: Record<string, string> = {
                success: "teal",
                warning: "yellow",
                danger: "red",
                primary: "brand",
              };
              const badgeColor = badgeColorMap[statusTheme.color] || "gray";
              return (
                <Badge variant="light" color={badgeColor} size="sm" className="font-semibold">
                  {statusTheme.label}
                </Badge>
              );
            })()}
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-heading text-text-app">
              {groupName !== "Chưa cập nhật" ? groupName : `Dự án ${caseData.case_code}`}
            </h3>

            {/* Quick Metadata Tags Row */}
            <div className="flex items-center gap-4 flex-wrap text-xs text-text-muted mt-2 font-medium">
              <span className="flex items-center gap-1.5 bg-surface-app/80 px-2.5 py-1 rounded-md border border-border-app/60">
                <Building2 className="w-3.5 h-3.5 text-brand shrink-0" />
                <span>{schoolName}</span>
              </span>

              <span className="flex items-center gap-1.5 bg-surface-app/80 px-2.5 py-1 rounded-md border border-border-app/60">
                <GraduationCap className="w-3.5 h-3.5 text-brand shrink-0" />
                <span>{courseContext}</span>
              </span>

              {groupNo && groupNo !== "Khác" && (
                <span className="flex items-center gap-1.5 bg-surface-app/80 px-2.5 py-1 rounded-md border border-border-app/60">
                  <Hash className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>Nhóm: {groupNo}</span>
                </span>
              )}

              <span className="flex items-center gap-1.5 bg-surface-app/80 px-2.5 py-1 rounded-md border border-border-app/60">
                <UserCheck className="w-3.5 h-3.5 text-brand shrink-0" />
                <span>{contactName} ({studentCode})</span>
              </span>
            </div>
          </div>

          {/* Structured Summary Quote Box if available */}
          {teamStatusSummary && (
            <div className="mt-3 p-3.5 bg-surface-app/90 border border-brand/15 rounded-lg text-xs text-text-app space-y-1">
              <span className="font-semibold text-brand text-[11px] uppercase tracking-wider block">
                Hiện trạng & Nút thắt nhóm:
              </span>
              <p className="text-text-app/90 leading-relaxed font-normal">{teamStatusSummary}</p>
            </div>
          )}
        </div>
      </div>

      {guidanceCard && <div className="shrink-0">{guidanceCard}</div>}

      {/* ── 2. Grid 2 Cột: Bối cảnh Đội ngũ & Thông tin Người liên hệ ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Team & School Context */}
        <div className="bg-surface-app border border-border-app rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border-app">
            <Building2 className="w-5 h-5 text-brand shrink-0" />
            <h4 className="font-bold text-sm text-text-app">1. Thông tin Đội ngũ & Trường học</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-text-muted text-[11px] block">Tên nhóm / Tên đề tài:</span>
              <p className="font-semibold text-text-app mt-0.5">{groupName}</p>
            </div>
            <div>
              <span className="text-text-muted text-[11px] block">Số thứ tự nhóm (Group No):</span>
              <p className="font-semibold text-text-app mt-0.5">{groupNo || "Chưa cập nhật"}</p>
            </div>
            <div>
              <span className="text-text-muted text-[11px] block">Trường đại học / Viện đào tạo:</span>
              <p className="font-semibold text-text-app mt-0.5">{schoolName}</p>
            </div>
            <div>
              <span className="text-text-muted text-[11px] block">Lớp học / Môn học / Cuộc thi:</span>
              <p className="font-semibold text-text-app mt-0.5">{courseContext}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Contact Person Info */}
        <div className="bg-surface-app border border-border-app rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border-app">
            <UserCheck className="w-5 h-5 text-brand shrink-0" />
            <h4 className="font-bold text-sm text-text-app">2. Thông tin Người đại diện / Trưởng nhóm</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-text-muted text-[11px] block">Họ và tên:</span>
              <p className="font-semibold text-text-app mt-0.5">{contactName}</p>
            </div>
            <div>
              <span className="text-text-muted text-[11px] block">Mã số sinh viên (MSSV):</span>
              <p className="font-semibold text-text-app mt-0.5">{studentCode}</p>
            </div>
            <div>
              <span className="text-text-muted text-[11px] block">Email liên hệ:</span>
              <p className="font-semibold text-text-app mt-0.5 flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="truncate">{contactEmail}</span>
              </p>
            </div>
            <div>
              <span className="text-text-muted text-[11px] block">Số điện thoại / Zalo:</span>
              <p className="font-semibold text-text-app mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span>{contactPhone}</span>
              </p>
            </div>
            <div>
              <span className="text-text-muted text-[11px] block">Vai trò trong nhóm:</span>
              <p className="font-semibold text-text-app mt-0.5">{teamRole}</p>
            </div>
            <div>
              <span className="text-text-muted text-[11px] block">Telegram Username:</span>
              <p className="font-semibold text-text-app mt-0.5 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-brand shrink-0" />
                <span>{contactTelegram || "Chưa cập nhật"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Startup Idea Detailed Breakdown ── */}
      <div className="bg-surface-app border border-border-app rounded-xl p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border-app">
          <Lightbulb className="w-5 h-5 text-brand shrink-0" />
          <h4 className="font-bold text-base text-text-app">3. Chi tiết Ý tưởng Khởi nghiệp</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Field & Target Customer */}
          <div className="space-y-4 bg-surface-soft/40 p-4 rounded-lg border border-border-app/60">
            <div>
              <div className="flex items-center gap-1.5 text-brand font-bold mb-1">
                <Layers className="w-4 h-4" />
                <span>Lĩnh vực hoạt động:</span>
              </div>
              <p className="text-text-app font-medium leading-relaxed pl-5">{field}</p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-brand font-bold mb-1">
                <Target className="w-4 h-4" />
                <span>Khách hàng mục tiêu:</span>
              </div>
              <p className="text-text-app font-medium leading-relaxed pl-5">{targetCustomer}</p>
            </div>
          </div>

          {/* Problem & Solution */}
          <div className="space-y-4 bg-surface-soft/40 p-4 rounded-lg border border-border-app/60">
            <div>
              <div className="flex items-center gap-1.5 text-danger font-bold mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Vấn đề cốt lõi (Problem):</span>
              </div>
              <p className="text-text-app font-medium leading-relaxed pl-5">{problem}</p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-success font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Giải pháp đề xuất (Solution):</span>
              </div>
              <p className="text-text-app font-medium leading-relaxed pl-5">{solution}</p>
            </div>
          </div>
        </div>

        {/* MVP Product Model */}
        {mvp && (
          <div className="bg-brand-soft/10 border border-brand/20 p-4 rounded-lg space-y-1 text-xs">
            <span className="font-bold text-brand flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Sản phẩm khả thi tối thiểu (MVP):
            </span>
            <p className="text-text-app leading-relaxed pl-5 font-medium">{mvp}</p>
          </div>
        )}
      </div>

      {/* ── 4. Nhu cầu hỗ trợ chuyên môn & Kỳ vọng Supporter ── */}
      <div className="bg-surface-app border border-border-app rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border-app">
          <MessageSquareCode className="w-5 h-5 text-brand shrink-0" />
          <h4 className="font-bold text-base text-text-app">4. Nhu cầu hỗ trợ chuyên môn</h4>
        </div>

        <div className="space-y-4 text-xs">
          <div className="bg-brand-soft/20 border border-brand/20 p-4 rounded-lg space-y-1">
            <span className="font-bold text-brand flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Nhu cầu hỗ trợ chính:
            </span>
            <p className="text-text-app font-semibold leading-relaxed pl-5">
              {primaryNeedText || "Cần phản biện để làm rõ khách hàng mục tiêu và vấn đề cốt lõi"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-soft/60 border border-border-app/80 p-4 rounded-lg space-y-1">
              <span className="font-bold text-text-app flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-brand" />
                Kết quả mong đợi sau phản biện:
              </span>
              <p className="text-text-muted leading-relaxed pl-5">
                {expectedOutputs || "Chưa nhập ghi chú kỳ vọng"}
              </p>
            </div>

            <div className="bg-surface-soft/60 border border-border-app/80 p-4 rounded-lg space-y-1">
              <span className="font-bold text-text-app flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-brand" />
                Ghi chú thêm cho Supporter:
              </span>
              <p className="text-text-muted leading-relaxed pl-5">
                {extraNotes || "Chưa nhập ghi chú thêm"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
