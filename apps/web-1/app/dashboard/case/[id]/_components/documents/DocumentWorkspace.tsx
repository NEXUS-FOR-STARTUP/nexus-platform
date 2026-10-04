"use client";

import { useMemo, useState } from "react";
import {
  DocumentWorkspaceProps,
  WorkspaceTab,
  FilterRole,
  buildSupportFlowRows,
  buildExternalFeedbackRows,
} from "./document-workspace.types";
import { buildCategoryGroups } from "./document-groups";
import { buildAssessmentReportRows } from "./report-rows";
import DocumentWorkspaceHeader from "./DocumentWorkspaceHeader";
import DocumentRowsTable from "./DocumentRowsTable";
import type { RoundHistoryEntry } from "@/types/case";

interface DocumentWorkspaceWithReportsProps extends DocumentWorkspaceProps {
  roundHistory?: RoundHistoryEntry[] | null;
  caseId?: string;
  projectName?: string;
  caseCode?: string;
}

export default function DocumentWorkspace({
  workspace,
  roundHistory,
  projectName,
  caseCode,
}: DocumentWorkspaceWithReportsProps) {
  const [activeCheckpoint, setActiveCheckpoint] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("documents");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");

  const selectedCheckpoint = useMemo(() => {
    if (!workspace || workspace.checkpoints.length === 0) return null;
    return (
      workspace.checkpoints.find((cp) => cp.checkpoint_id === activeCheckpoint) ??
      workspace.checkpoints.find(
        (cp) => cp.checkpoint_id === workspace.selected_checkpoint_id,
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
      },
    );
  }, [selectedCheckpoint]);

  const feedbackRows = useMemo(() => {
    if (!selectedCheckpoint) return [];
    return buildExternalFeedbackRows(
      selectedCheckpoint.external_feedback_documents,
    ).sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [selectedCheckpoint]);

  const reportRows = useMemo(() => {
    return buildAssessmentReportRows(roundHistory, projectName, caseCode).sort(
      (a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      },
    );
  }, [roundHistory, projectName, caseCode]);

  const studentDocCount = useMemo(
    () => documentRows.filter((r) => r.uploaderRole === "student").length,
    [documentRows],
  );
  const supporterDocCount = useMemo(
    () =>
      documentRows.filter(
        (r) => r.uploaderRole === "supporter" || r.uploaderRole === "admin",
      ).length,
    [documentRows],
  );

  const displayedRows = useMemo(() => {
    if (activeTab === "assessment-reports") return reportRows;
    if (activeTab === "external-feedback") return feedbackRows;
    if (filterRole === "student") {
      return documentRows.filter((r) => r.uploaderRole === "student");
    }
    if (filterRole === "supporter") {
      return documentRows.filter(
        (r) => r.uploaderRole === "supporter" || r.uploaderRole === "admin",
      );
    }
    return documentRows;
  }, [activeTab, documentRows, feedbackRows, filterRole, reportRows]);

  const displayedGroups = useMemo(
    () => (activeTab === "documents" ? buildCategoryGroups(displayedRows) : []),
    [activeTab, displayedRows],
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
      <DocumentWorkspaceHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        documentCount={documentRows.length}
        feedbackCount={feedbackRows.length}
        reportCount={roundHistory ? roundHistory.length : 0}
        studentDocCount={studentDocCount}
        supporterDocCount={supporterDocCount}
        checkpoints={workspace.checkpoints}
        selectedCheckpointId={selectedCheckpoint.checkpoint_id}
        onSelectCheckpoint={setActiveCheckpoint}
      />

      {displayedRows.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-base font-medium text-text-muted">
            {activeTab === "documents"
              ? "Không có tài liệu nào thuộc bộ lọc này."
              : activeTab === "assessment-reports"
                ? "Chưa có báo cáo phản biện nào được lưu."
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
