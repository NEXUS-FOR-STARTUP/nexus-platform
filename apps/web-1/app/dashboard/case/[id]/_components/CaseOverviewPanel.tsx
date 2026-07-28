"use client";

import React from "react";
import { Case } from "@/types";
import { 
  Building2, 
  Users, 
  Target, 
  Lightbulb, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  UserCheck, 
  Layers,
  GraduationCap,
  MessageSquareCode,
} from "lucide-react";

import { statusThemeMap } from "@/types";

interface CaseOverviewPanelProps {
  caseData: Case;
  intakeSnapshot?: any;
  onSelectTab?: (tab: "overview" | "documents" | "discussion" | "timeline" | "settings" | "credits") => void;
  onEditIntake?: () => void;
  guidanceCard?: React.ReactNode;
}

export default function CaseOverviewPanel({ caseData, intakeSnapshot, onSelectTab, onEditIntake, guidanceCard }: CaseOverviewPanelProps) {
  const statusTheme = statusThemeMap[caseData.user_facing_stage] || {
    label: caseData.user_facing_stage,
    color: "default",
  };
  const intake = intakeSnapshot || {};
  const contact = intake.contact || {};
  const idea = intake.idea_context || intake.idea || {};
  const teamCtx = intake.team_context || {};
  const situations = intake.current_situations || {};
  const members = intake.members || (caseData as any).members || [];
  const teamFit = intake.team_fit_snapshot || {};

  // Fallbacks from case root fields
  const schoolName = caseData.school || teamCtx.school || "Chưa cập nhật";
  const groupName = caseData.team_name || teamCtx.project_name || "Chưa cập nhật";
  const courseContext = caseData.course_context || teamCtx.course_context || "Chưa cập nhật";

  return (
    <div className="space-y-6 animate-fade-in font-body pb-8">


      {guidanceCard && <div className="shrink-0">{guidanceCard}</div>}

      {/* ── 2. Two-Column Grid: Contact & Team Context ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Info Card */}
        <div className="bg-surface-app border border-border-app rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border-app">
            <UserCheck className="w-5 h-5 text-brand shrink-0" />
            <h4 className="font-semibold text-sm text-text-app">Người đại diện / Trưởng nhóm</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-text-muted text-base">Họ và tên:</span>
              <p className="font-semibold text-text-app mt-0.5">{contact.full_name || "Chưa cập nhật"}</p>
            </div>
            <div>
              <span className="text-text-muted text-base">MSSV / Vai trò:</span>
              <p className="font-semibold text-text-app mt-0.5">
                {contact.student_code ? `${contact.student_code} (${contact.role || "Trưởng nhóm"})` : contact.role || "Chưa cập nhật"}
              </p>
            </div>
            <div>
              <span className="text-text-muted text-base">Email liên hệ:</span>
              <p className="font-semibold text-text-app mt-0.5 flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="truncate">{contact.email || "Chưa cập nhật"}</span>
              </p>
            </div>
            <div>
              <span className="text-text-muted text-base">SĐT / Zalo:</span>
              <p className="font-semibold text-text-app mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span>{contact.phone || contact.zalo || "Chưa cập nhật"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Team Context Card */}
        <div className="bg-surface-app border border-border-app rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border-app">
            <Building2 className="w-5 h-5 text-brand shrink-0" />
            <h4 className="font-semibold text-sm text-text-app">Bối cảnh Đội ngũ & Trường học</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-text-muted text-base">Tên nhóm / Dự án:</span>
              <p className="font-semibold text-text-app mt-0.5">{groupName}</p>
            </div>
            <div>
              <span className="text-text-muted text-base">Trường đại học / Cao đẳng:</span>
              <p className="font-semibold text-text-app mt-0.5">{schoolName}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-text-muted text-base">Lớp học / Môn học / Cuộc thi:</span>
              <p className="font-semibold text-text-app mt-0.5">{courseContext}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Startup Idea Detailed Breakdown ── */}
      <div className="bg-surface-app border border-border-app rounded-xl p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border-app">
          <Lightbulb className="w-5 h-5 text-brand shrink-0" />
          <h4 className="font-semibold text-base text-text-app">Chi tiết Ý tưởng Khởi nghiệp</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Field & Target Customer */}
          <div className="space-y-4 bg-surface-soft/40 p-4 rounded-lg border border-border-app/60">
            <div>
              <div className="flex items-center gap-1.5 text-brand font-semibold mb-1">
                <Layers className="w-4 h-4" />
                <span>Lĩnh vực hoạt động:</span>
              </div>
              <p className="text-text-app font-medium leading-relaxed pl-5">
                {idea.field || "Chưa xác định lĩnh vực"}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-brand font-semibold mb-1">
                <Target className="w-4 h-4" />
                <span>Khách hàng mục tiêu:</span>
              </div>
              <p className="text-text-app font-medium leading-relaxed pl-5">
                {idea.target_customer || idea.targetCustomer || "Chưa mô tả đối tượng mục tiêu"}
              </p>
            </div>
          </div>

          {/* Problem & Solution */}
          <div className="space-y-4 bg-surface-soft/40 p-4 rounded-lg border border-border-app/60">
            <div>
              <div className="flex items-center gap-1.5 text-danger font-semibold mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Vấn đề cốt lõi (Problem):</span>
              </div>
              <p className="text-text-app font-medium leading-relaxed pl-5">
                {idea.problem || "Chưa liệt kê vấn đề thực tế"}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-success font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Giải pháp đề xuất (Solution):</span>
              </div>
              <p className="text-text-app font-medium leading-relaxed pl-5">
                {idea.solution || "Chưa có mô tả giải pháp"}
              </p>
            </div>
          </div>
        </div>

        {/* MVP Product Model */}
        {idea.mvp && (
          <div className="bg-brand-soft/10 border border-brand/20 p-4 rounded-lg space-y-1 text-xs">
            <span className="font-semibold text-brand flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Sản phẩm khả thi tối thiểu (MVP):
            </span>
            <p className="text-text-app leading-relaxed pl-5 font-medium">{idea.mvp}</p>
          </div>
        )}
      </div>

      {/* ── 4. Team Members & Capability Breakdown ── */}
      {members && members.length > 0 && (
        <div className="bg-surface-app border border-border-app rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border-app">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-brand shrink-0" />
              <h4 className="font-semibold text-base text-text-app">Đội ngũ thành viên ({members.length} người)</h4>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m: any, idx: number) => (
              <div key={idx} className="bg-surface-soft/50 border border-border-app/80 p-4 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-app text-sm">{m.name || `Thành viên ${idx + 1}`}</span>
                  <Badge size="sm" variant="light" color="blue">
                    {m.role || "Thành viên"}
                  </Badge>
                </div>
                {m.major && (
                  <p className="text-text-muted flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-brand shrink-0" />
                    <span>Ngành: <strong>{m.major}</strong></span>
                  </p>
                )}
                {m.strengths && (
                  <p className="text-text-muted text-base leading-relaxed">
                    <strong className="text-text-app">Thế mạnh:</strong> {m.strengths}
                  </p>
                )}
                {m.experience && (
                  <p className="text-text-muted text-base leading-relaxed">
                    <strong className="text-text-app">Kinh nghiệm:</strong> {m.experience}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Feasibility Gaps & Support Needs ── */}
      {(situations.current_blocker || situations.support_needs || teamFit.team_gaps) && (
        <div className="bg-surface-app border border-border-app rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border-app">
            <ShieldAlert className="w-5 h-5 text-warning shrink-0" />
            <h4 className="font-semibold text-base text-text-app">Rủi ro & Nhu cầu hỗ trợ chuyên môn</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {situations.current_blocker && (
              <div className="bg-warning-soft/20 border border-warning/20 p-4 rounded-lg space-y-1">
                <span className="font-semibold text-warning flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Khó khăn hiện tại của nhóm:
                </span>
                <p className="text-text-app leading-relaxed pl-5">{situations.current_blocker}</p>
              </div>
            )}

            {situations.support_needs && (
              <div className="bg-brand-soft/20 border border-brand/20 p-4 rounded-lg space-y-1">
                <span className="font-semibold text-brand flex items-center gap-1.5">
                  <MessageSquareCode className="w-4 h-4" />
                  Nhu cầu thẩm định từ Supporter:
                </span>
                <p className="text-text-app leading-relaxed pl-5">{situations.support_needs}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
