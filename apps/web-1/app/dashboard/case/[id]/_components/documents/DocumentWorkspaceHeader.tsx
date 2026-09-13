"use client";

import { Select } from "@mantine/core";
import type { WorkspaceTab, FilterRole } from "./document-workspace.types";
import type { DocumentCheckpoint } from "@/types/case";

interface DocumentWorkspaceHeaderProps {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  filterRole: FilterRole;
  setFilterRole: (role: FilterRole) => void;
  documentCount: number;
  feedbackCount: number;
  reportCount: number;
  studentDocCount: number;
  supporterDocCount: number;
  checkpoints: DocumentCheckpoint[];
  selectedCheckpointId: string;
  onSelectCheckpoint: (id: string) => void;
}

export default function DocumentWorkspaceHeader({
  activeTab,
  setActiveTab,
  filterRole,
  setFilterRole,
  documentCount,
  feedbackCount,
  reportCount,
  studentDocCount,
  supporterDocCount,
  checkpoints,
  selectedCheckpointId,
  onSelectCheckpoint,
}: DocumentWorkspaceHeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-border-app flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface-app">
      <div className="flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab("documents");
            setFilterRole("all");
          }}
          className={`px-3.5 py-1.5 text-base font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "documents"
              ? "bg-brand text-white font-semibold"
              : "text-text-muted hover:text-text-app hover:bg-surface-soft"
          }`}
        >
          <span>Tài liệu bài nộp</span>
          <span
            className={`text-[11px] font-semibold px-1.5 py-0.2 rounded-full leading-tight ${
              activeTab === "documents"
                ? "bg-white/20 text-white"
                : "bg-surface-soft text-text-muted"
            }`}
          >
            {documentCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("external-feedback");
            setFilterRole("all");
          }}
          className={`px-3.5 py-1.5 text-base font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "external-feedback"
              ? "bg-brand text-white font-semibold"
              : "text-text-muted hover:text-text-app hover:bg-surface-soft"
          }`}
        >
          <span>Đánh giá bên ngoài</span>
          <span
            className={`text-[11px] font-semibold px-1.5 py-0.2 rounded-full leading-tight ${
              activeTab === "external-feedback"
                ? "bg-white/20 text-white"
                : "bg-surface-soft text-text-muted"
            }`}
          >
            {feedbackCount}
          </span>
        </button>

        {reportCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setActiveTab("assessment-reports");
              setFilterRole("all");
            }}
            className={`px-3.5 py-1.5 text-base font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "assessment-reports"
                ? "bg-brand text-white font-semibold"
                : "text-text-muted hover:text-text-app hover:bg-surface-soft"
            }`}
          >
            <span>Báo cáo phản biện</span>
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.2 rounded-full leading-tight ${
                activeTab === "assessment-reports"
                  ? "bg-white/20 text-white"
                  : "bg-surface-soft text-text-muted"
              }`}
            >
              {reportCount}
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
        {activeTab === "documents" && (
          <Select
            value={filterRole}
            onChange={(val) => setFilterRole((val as FilterRole) || "all")}
            size="sm"
            radius="md"
            w={175}
            data={[
              { label: `Tất cả (${documentCount})`, value: "all" },
              { label: `Sinh viên (${studentDocCount})`, value: "student" },
              { label: `Supporter (${supporterDocCount})`, value: "supporter" },
            ]}
          />
        )}

        {checkpoints.length > 1 && (
          <Select
            value={selectedCheckpointId}
            onChange={(val) => val && onSelectCheckpoint(val)}
            size="sm"
            radius="md"
            w={150}
            data={checkpoints.map((cp) => ({
              label: cp.checkpoint_code,
              value: cp.checkpoint_id,
            }))}
          />
        )}
      </div>
    </div>
  );
}
