"use client";

import React, { useMemo, useState } from "react";
import { Select } from "@mantine/core";
import {
  DocumentWorkspaceProps,
  WorkspaceTab,
  FilterRole,
  buildSupportFlowRows,
  buildExternalFeedbackRows,
} from "./document-workspace.types";
import { buildCategoryGroups } from "./document-groups";
import DocumentRowsTable from "./DocumentRowsTable";

export default function DocumentWorkspace({ workspace }: DocumentWorkspaceProps) {
  const [activeCheckpoint, setActiveCheckpoint] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("documents");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");

  const selectedCheckpoint = useMemo(() => {
    if (!workspace || workspace.checkpoints.length === 0) return null;
    return (
      workspace.checkpoints.find((cp) => cp.checkpoint_id === activeCheckpoint) ??
      workspace.checkpoints.find(
        (cp) => cp.checkpoint_id === workspace.selected_checkpoint_id
      ) ??
      null
    );
  }, [activeCheckpoint, workspace]);

  const documentRows = useMemo(() => {
    if (!selectedCheckpoint) return [];
    return buildSupportFlowRows(selectedCheckpoint.support_flow_documents).sort(
      (a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      }
    );
  }, [selectedCheckpoint]);

  const feedbackRows = useMemo(() => {
    if (!selectedCheckpoint) return [];
    return buildExternalFeedbackRows(
      selectedCheckpoint.external_feedback_documents
    ).sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [selectedCheckpoint]);

  const studentDocCount = useMemo(
    () => documentRows.filter((r) => r.uploaderRole === "student").length,
    [documentRows]
  );
  const supporterDocCount = useMemo(
    () =>
      documentRows.filter(
        (r) => r.uploaderRole === "supporter" || r.uploaderRole === "admin"
      ).length,
    [documentRows]
  );

  const displayedRows = useMemo(() => {
    if (activeTab === "external-feedback") {
      return feedbackRows;
    }
    if (filterRole === "student") {
      return documentRows.filter((r) => r.uploaderRole === "student");
    }
    if (filterRole === "supporter") {
      return documentRows.filter(
        (r) => r.uploaderRole === "supporter" || r.uploaderRole === "admin"
      );
    }
    return documentRows;
  }, [activeTab, documentRows, feedbackRows, filterRole]);

  const displayedGroups = useMemo(
    () => (activeTab === "documents" ? buildCategoryGroups(displayedRows) : []),
    [activeTab, displayedRows]
  );

  if (!workspace || workspace.checkpoints.length === 0 || !selectedCheckpoint) {
    return (
      <div className="bg-surface-app border border-border-app rounded-xl p-8 text-center">
        <p className="text-base font-medium text-text-app">Chưa có tài liệu</p>
        <p className="text-base text-text-muted mt-1">
          Hồ sơ này chưa có tài liệu nào được tải lên hoặc liên kết.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-app border border-border-app rounded-xl overflow-hidden">
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
              {documentRows.length}
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
              {feedbackRows.length}
            </span>
          </button>
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
                { label: `Tất cả (${documentRows.length})`, value: "all" },
                { label: `Sinh viên (${studentDocCount})`, value: "student" },
                { label: `Supporter (${supporterDocCount})`, value: "supporter" },
              ]}
            />
          )}

          {workspace.checkpoints.length > 1 && (
            <Select
              value={selectedCheckpoint.checkpoint_id}
              onChange={(val) => val && setActiveCheckpoint(val)}
              size="sm"
              radius="md"
              w={150}
              data={workspace.checkpoints.map((cp) => ({
                label: cp.checkpoint_code,
                value: cp.checkpoint_id,
              }))}
            />
          )}
        </div>
      </div>

      {displayedRows.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-base font-medium text-text-muted">
            {activeTab === "documents"
              ? "Không có tài liệu nào thuộc bộ lọc này."
              : "Chưa có tài liệu đánh giá bên ngoài trong checkpoint này."}
          </p>
        </div>
      ) : (
        <DocumentRowsTable
          activeTab={activeTab}
          rows={displayedRows}
          groups={displayedGroups}
        />
      )}
    </div>
  );
}
