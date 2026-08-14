"use client";

import React, { useMemo, useState } from "react";
import { Table, Badge, Text, Anchor, Select } from "@mantine/core";
import {
  DocumentWorkspaceProps,
  DocumentRow,
  WorkspaceTab,
  FilterRole,
  formatDate,
  getFormatColor,
  buildSupportFlowRows,
  buildExternalFeedbackRows,
} from "./document-workspace.types";

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
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-border-app flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface-app">
        {/* Left: Main Workspace Tabs */}
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

        {/* Right: Role Filter Dropdown & Checkpoint Selector */}
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

      {/* Table Body */}
      {displayedRows.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-base font-medium text-text-muted">
            {activeTab === "documents"
              ? "Không có tài liệu nào thuộc bộ lọc này."
              : "Chưa có tài liệu đánh giá bên ngoài trong checkpoint này."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <Table
            highlightOnHover
            verticalSpacing="sm"
            horizontalSpacing="md"
            className="w-full min-w-[800px]"
          >
            <Table.Thead className="bg-surface-soft/40 border-b border-border-app">
              <Table.Tr>
                {/* 1. Phiên bản / Đợt - NẰM ĐẦU TIÊN */}
                <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[100px]">
                  {activeTab === "documents" ? "Phiên bản" : "Đợt"}
                </Table.Th>

                {/* 2. Phân loại / Liên kết */}
                <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[160px]">
                  {activeTab === "documents" ? "Phân loại" : "Liên kết bản nộp"}
                </Table.Th>

                {/* 3. Người tải (chỉ có ở tab Tài liệu bài nộp) */}
                {activeTab === "documents" && (
                  <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[130px]">
                    Người tải
                  </Table.Th>
                )}

                {/* 4. Tên tài liệu */}
                <Table.Th className="text-base font-medium text-text-muted py-3.5">
                  Tên tài liệu
                </Table.Th>

                {/* 5. Ngày tải */}
                <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[150px]">
                  Ngày tải
                </Table.Th>

                {/* 6. Nguồn */}
                <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[130px]">
                  Nguồn
                </Table.Th>

                {/* 7. Định dạng */}
                <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[100px]">
                  Định dạng
                </Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {displayedRows.map((row) => {
                const isSupporter =
                  row.uploaderRole === "supporter" || row.uploaderRole === "admin";
                const isStudent = row.uploaderRole === "student";
                const { date, time } = formatDate(row.createdAt);

                return (
                  <Table.Tr
                    key={row.key}
                    className="transition-colors hover:bg-surface-soft/60"
                  >
                    {/* 1. Phiên bản / Đợt */}
                    <Table.Td className="py-3.5">
                      <Text className="text-base font-medium text-text-app">
                        {row.versionLabel}
                      </Text>
                    </Table.Td>

                    {/* 2. Phân loại / Liên kết */}
                    <Table.Td className="py-3.5">
                      <Badge
                        variant="light"
                        color={
                          isSupporter
                            ? "violet"
                            : row.contextLabel.includes("chính")
                              ? "teal"
                              : "blue"
                        }
                        size="md"
                        radius="xl"
                        className="font-medium text-base whitespace-nowrap"
                      >
                        {row.contextLabel}
                      </Badge>
                    </Table.Td>

                    {/* 3. Người tải */}
                    {activeTab === "documents" && (
                      <Table.Td className="py-3.5">
                        <Badge
                          variant="light"
                          color={isSupporter ? "violet" : isStudent ? "teal" : "gray"}
                          size="md"
                          radius="xl"
                          className="font-medium text-base whitespace-nowrap"
                        >
                          {row.uploaderLabel}
                        </Badge>
                      </Table.Td>
                    )}

                    {/* 4. Tên tài liệu (font bình thường, không bôi đậm, mở link trực tiếp) */}
                    <Table.Td className="py-3.5">
                      {row.hasAction && row.url ? (
                        <Anchor
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base text-brand hover:underline font-normal break-words"
                        >
                          {row.displayName}
                        </Anchor>
                      ) : (
                        <Text className="text-base text-text-muted font-normal break-words">
                          {row.displayName}
                        </Text>
                      )}
                    </Table.Td>

                    {/* 5. Ngày tải */}
                    <Table.Td className="py-3.5">
                      <Text className="font-normal text-text-app text-base leading-tight">
                        {date}
                      </Text>
                      {time && (
                        <Text c="dimmed" className="text-base mt-0.5 font-normal">
                          {time}
                        </Text>
                      )}
                    </Table.Td>

                    {/* 6. Nguồn */}
                    <Table.Td className="py-3.5">
                      <Text className="text-base text-text-app font-normal">
                        {row.sourceLabel}
                      </Text>
                    </Table.Td>

                    {/* 7. Định dạng */}
                    <Table.Td className="py-3.5">
                      <Badge
                        variant="light"
                        color={getFormatColor(row.formatLabel)}
                        size="md"
                        radius="xl"
                        className="font-medium text-base uppercase whitespace-nowrap"
                      >
                        {row.formatLabel}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
