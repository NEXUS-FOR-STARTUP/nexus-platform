"use client";

import React from "react";
import { Case } from "@/types";
import { ExternalLink, FolderOpen, HelpCircle, Target, Users } from "lucide-react";

interface TabIdeaContentProps {
  caseData: Case;
  selectedVersion: number;
}

export default function TabIdeaContent({ caseData, selectedVersion }: TabIdeaContentProps) {
  // Find the lifecycle unit content for the selected version if available.
  const lifecycleUnit = caseData.lifecycle_units?.find(
    (unit) => unit.version_no === selectedVersion && unit.unit_code === "intake"
  );

  // Fallback to version 1 if selected version doesn't have it
  const defaultIntakeUnit = caseData.lifecycle_units?.find(
    (unit) => unit.version_no === 1 && unit.unit_code === "intake"
  );

  const activeUnit = lifecycleUnit || defaultIntakeUnit;

  let idea = "";
  let painPoint = "";
  let customer = "";
  let driveUrl = "";
  let teamName = caseData.team_name || "";
  let school = caseData.school || "";
  let courseContext = caseData.course_context || "";

  if (activeUnit && activeUnit.content) {
    try {
      const parsed = JSON.parse(activeUnit.content);
      idea = parsed.idea || "";
      painPoint = parsed.pain_point || "";
      customer = parsed.customer || "";
      driveUrl = parsed.drive_url || parsed.file_url || "";
      teamName = parsed.team_name || teamName;
      school = parsed.school || school;
      courseContext = parsed.course_context || courseContext;
    } catch (e) {
      // If it's markdown or other format, fallback
    }
  }

  const sections = [
    {
      title: "Ý tưởng đề tài",
      desc: "Mô tả giải pháp, cách hoạt động và giá trị cốt lõi mang lại.",
      content: idea,
      icon: FolderOpen,
      color: "border-brand",
    },
    {
      title: "Vấn đề đang giải quyết",
      desc: "Nỗi đau của khách hàng mà giải pháp này đang giải quyết.",
      content: painPoint,
      icon: HelpCircle,
      color: "border-orange-500",
    },
    {
      title: "Khách hàng mục tiêu",
      desc: "Chân dung đối tượng trực tiếp trả phí hoặc sử dụng sản phẩm.",
      content: customer,
      icon: Target,
      color: "border-emerald-500",
    },
  ];

  return (
    <div className="bg-surface-app border border-border-app rounded-lg p-6 md:p-8 space-y-8 animate-fade-in">

      {/* Main Core Content Sections */}
      <div className="space-y-6">
        {sections.map((section, index) => {
          const Icon = section.icon;

          return (
            <div
              key={index}
              className={`p-6 border-l-4 ${section.color} bg-surface-soft/30 rounded-r-md border-y border-r border-border-app/50 space-y-3`}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-surface-app border border-border-app text-text-muted">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-sm text-text-app">{section.title}</h3>
                  <p className="font-body text-text-muted">{section.desc}</p>
                </div>
              </div>
              <p className="font-body text-xs text-text-app leading-relaxed whitespace-pre-wrap pl-1">
                {section.content || "Chưa cung cấp thông tin."}
              </p>
            </div>
          );
        })}
      </div>

      {/* Drive Documents Card */}
      {driveUrl && (
        <div className="p-5 border border-border-app rounded-lg bg-surface-soft/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h4 className="font-heading font-semibold text-sm text-text-app flex items-center gap-2">
              <FolderOpen className="w-4.5 h-4.5 text-brand" />
              <span>Tài liệu minh chứng hồ sơ</span>
            </h4>
            <p className="font-body text-xs text-text-muted">
              Tài liệu mà Supporter sẽ đọc để chuẩn bị phản biện hồ sơ của nhóm.
            </p>
          </div>
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-body text-xs font-semibold text-white bg-brand hover:bg-brand-hover px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <span>Mở Google Drive</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
