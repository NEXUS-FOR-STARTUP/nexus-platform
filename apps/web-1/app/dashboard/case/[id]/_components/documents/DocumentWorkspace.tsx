"use client";

import React, { useMemo, useState } from "react";
import { Anchor, Badge, Card, Group, Stack, Table, Tabs, Text, SegmentedControl } from "@mantine/core";
import { CheckCircle, FileText, FolderOpen, Lock, User, ShieldCheck } from "lucide-react";
import type { DocumentFile, DocumentUnit, DocumentWorkspace as DocumentWorkspaceType, ExternalFeedbackMetadata, ExternalFeedbackUnit } from "@/types/case";

interface DocumentWorkspaceProps {
  workspace: DocumentWorkspaceType | null;
}

type WorkspaceTab = "documents" | "external-feedback";
type FilterRole = "all" | "student" | "supporter";

type DocumentRow = {
  key: string;
  versionLabel: string;
  contextLabel: string;
  displayName: string;
  url: string | null;
  hasAction: boolean;
  sourceLabel: string;
  formatLabel: string;
  uploaderLabel: string;
  uploaderRole: "student" | "supporter" | "admin" | "other";
  createdAt: string;
};

export default function DocumentWorkspace({ workspace }: DocumentWorkspaceProps) {
  const [activeCheckpoint, setActiveCheckpoint] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("documents");

  const selectedCheckpoint = useMemo(() => {
    if (!workspace || workspace.checkpoints.length === 0) return null;
    return workspace.checkpoints.find((cp) => cp.checkpoint_id === activeCheckpoint)
      ?? workspace.checkpoints.find((cp) => cp.checkpoint_id === workspace.selected_checkpoint_id)
      ?? null;
  }, [activeCheckpoint, workspace]);

  if (!workspace || workspace.checkpoints.length === 0 || !selectedCheckpoint) {
    return (
      <Card withBorder padding="xl" radius="md">
        <Stack gap="md" align="center" py="xl">
          <FolderOpen className="w-12 h-12 text-text-muted" />
          <Text size="lg" fw={500} c="dimmed">Chưa có tài liệu</Text>
          <Text size="sm" c="dimmed" ta="center">Hồ sơ này chưa có tài liệu nào được tải lên hoặc liên kết.</Text>
        </Stack>
      </Card>
    );
  }

  const documentRows = useMemo(() => {
    return buildSupportFlowRows(selectedCheckpoint.support_flow_documents)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedCheckpoint.support_flow_documents]);

  const feedbackRows = useMemo(() => {
    return buildExternalFeedbackRows(selectedCheckpoint.external_feedback_documents)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedCheckpoint.external_feedback_documents]);

  return (
    <Stack gap="md">
      {workspace.checkpoints.length > 1 && (
        <Card withBorder padding="md" radius="md">
          <Group gap="xs">
            <Text size="sm" fw={500}>Checkpoint:</Text>
            {workspace.checkpoints.map((checkpoint) => (
              <Badge
                key={checkpoint.checkpoint_id}
                variant={checkpoint.checkpoint_id === selectedCheckpoint.checkpoint_id ? "filled" : "light"}
                color="brand"
                style={{ cursor: "pointer" }}
                onClick={() => setActiveCheckpoint(checkpoint.checkpoint_id)}
              >
                {checkpoint.checkpoint_code}
              </Badge>
            ))}
          </Group>
        </Card>
      )}

      <Card withBorder padding="lg" radius="md">
        <Tabs value={activeTab} onChange={(value) => setActiveTab((value ?? "documents") as WorkspaceTab)}>
          <Tabs.List>
            <Tabs.Tab value="documents" leftSection={<FileText className="w-4 h-4" />}>Tài liệu ({documentRows.length})</Tabs.Tab>
            <Tabs.Tab value="external-feedback" leftSection={<CheckCircle className="w-4 h-4" />}>Đánh giá bên ngoài ({feedbackRows.length})</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="documents" pt="md">
            <DocumentTable
              rows={documentRows}
              emptyMessage="Chưa có tài liệu bản nộp hoặc bản sửa trong checkpoint này."
              versionHeader="Phiên bản"
              contextHeader="Vai trò"
            />
          </Tabs.Panel>

          <Tabs.Panel value="external-feedback" pt="md">
            <DocumentTable
              rows={feedbackRows}
              emptyMessage="Chưa có tài liệu đánh giá bên ngoài trong checkpoint này."
              versionHeader="Đợt đánh giá"
              contextHeader="Liên kết bản nộp"
            />
          </Tabs.Panel>
        </Tabs>
      </Card>
    </Stack>
  );
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function DocumentTable({
  rows,
  emptyMessage,
  versionHeader,
  contextHeader,
}: {
  rows: DocumentRow[];
  emptyMessage: string;
  versionHeader: string;
  contextHeader: string;
}) {
  const [filterRole, setFilterRole] = useState<FilterRole>("all");

  const studentCount = useMemo(() => rows.filter((r) => r.uploaderRole === "student").length, [rows]);
  const supporterCount = useMemo(() => rows.filter((r) => r.uploaderRole === "supporter" || r.uploaderRole === "admin").length, [rows]);

  const filteredRows = useMemo(() => {
    if (filterRole === "student") {
      return rows.filter((r) => r.uploaderRole === "student");
    }
    if (filterRole === "supporter") {
      return rows.filter((r) => r.uploaderRole === "supporter" || r.uploaderRole === "admin");
    }
    return rows;
  }, [rows, filterRole]);

  if (rows.length === 0) {
    return <Text size="sm" c="dimmed">{emptyMessage}</Text>;
  }

  return (
    <div className="space-y-3">
      {/* Quick Filter Control */}
      <div className="flex items-center justify-between gap-4 bg-surface-soft/40 p-2 rounded-xl border border-border-app">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-subtle px-2">
          <span>Lọc người gửi:</span>
        </div>
        <SegmentedControl
          size="xs"
          radius="md"
          value={filterRole}
          onChange={(val) => setFilterRole(val as FilterRole)}
          data={[
            { label: `Tất cả (${rows.length})`, value: "all" },
            { label: `Sinh viên (${studentCount})`, value: "student" },
            { label: `Supporter (${supporterCount})`, value: "supporter" },
          ]}
          className="font-body text-xs"
        />
      </div>

      <div className="border border-border-app bg-surface-app overflow-hidden rounded-xl">
        <Table.ScrollContainer minWidth={780}>
          <Table highlightOnHover verticalSpacing="md" horizontalSpacing="md">
            <Table.Thead className="bg-surface-soft">
              <Table.Tr>
                <Table.Th style={{ width: "95px" }}>{versionHeader}</Table.Th>
                <Table.Th style={{ width: "160px" }}>{contextHeader}</Table.Th>
                <Table.Th style={{ width: "140px" }}>Người tải</Table.Th>
                <Table.Th>Tài liệu / Đường dẫn</Table.Th>
                <Table.Th style={{ width: "150px" }}>Ngày tải</Table.Th>
                <Table.Th style={{ width: "130px" }}>Nguồn</Table.Th>
                <Table.Th style={{ width: "110px" }}>Định dạng</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredRows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} className="text-center py-6 text-text-muted text-xs">
                    Không có tài liệu nào thuộc bộ lọc này.
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredRows.map((row) => {
                  const isSupporter = row.uploaderRole === "supporter" || row.uploaderRole === "admin";
                  const isStudent = row.uploaderRole === "student";

                  return (
                    <Table.Tr key={row.key} className={isSupporter ? "bg-brand-soft/5 hover:bg-brand-soft/10" : undefined}>
                      <Table.Td>
                        <Text size="xs" fw={600} className="font-mono">{row.versionLabel}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          variant="light"
                          color={isSupporter ? "violet" : row.contextLabel.includes("chính") ? "cyan" : "blue"}
                          radius="xl"
                        >
                          {row.contextLabel}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {isSupporter ? (
                          <Badge
                            size="sm"
                            variant="filled"
                            color="violet"
                            radius="xl"
                            className="font-body text-xs"
                          >
                            Supporter
                          </Badge>
                        ) : isStudent ? (
                          <Badge
                            size="sm"
                            variant="light"
                            color="teal"
                            radius="xl"
                            className="font-body text-xs"
                          >
                            Sinh viên
                          </Badge>
                        ) : (
                          <Badge size="sm" variant="light" color="gray" radius="xl">
                            {row.uploaderLabel}
                          </Badge>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {row.hasAction ? (
                          <Anchor
                            href={row.url ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="always"
                            color="brand"
                            className="hover:text-brand-hover transition-colors break-all whitespace-normal block text-xs font-medium"
                            style={{ maxWidth: "450px" }}
                          >
                            {row.displayName}
                          </Anchor>
                        ) : (
                          <Group gap="xs" wrap="nowrap">
                            <Lock className="w-3.5 h-3.5 text-text-muted shrink-0" />
                            <Text c="dimmed" className="break-all whitespace-normal block text-xs" style={{ maxWidth: "450px" }}>
                              {row.displayName}
                            </Text>
                          </Group>
                        )}
                      </Table.Td>
                      <Table.Td><Text size="xs" c="dimmed">{formatDate(row.createdAt)}</Text></Table.Td>
                      <Table.Td><Text size="xs">{row.sourceLabel}</Text></Table.Td>
                      <Table.Td><Text size="xs" className="font-mono uppercase">{row.formatLabel}</Text></Table.Td>
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </div>
    </div>
  );
}

function buildSupportFlowRows(units: DocumentUnit[]): DocumentRow[] {
  return units.flatMap((unit) =>
    unit.files.map((file) => ({
      ...buildCommonRow(unit, file),
      versionLabel: `v${String(unit.version_no).padStart(2, "0")}`,
      contextLabel: file.doc_type_label ?? (file.is_primary ? "Tài liệu chính" : "Output hỗ trợ"),
    })),
  );
}

function buildExternalFeedbackRows(units: ExternalFeedbackUnit[]): DocumentRow[] {
  return units.flatMap((unit) =>
    unit.files.map((file) => ({
      ...buildCommonRow(unit, file),
      versionLabel: `Đợt ${unit.assessment_no}`,
      contextLabel: unit.metadata
        ? `${getFeedbackSourceLabel(unit.metadata)} • v${String(unit.metadata.selected_version_no).padStart(2, "0")}`
        : unit.linked_version_no
          ? `v${String(unit.linked_version_no).padStart(2, "0")}`
          : "—",
    })),
  );
}

function getFeedbackSourceLabel(metadata: ExternalFeedbackMetadata): string {
  if (metadata.source === "lecturer") return "Giảng viên";
  if (metadata.source === "mentor") return "Người hướng dẫn";
  return metadata.source_other_text || "Khác";
}

function buildCommonRow(unit: DocumentUnit | ExternalFeedbackUnit, file: DocumentFile): DocumentRow {
  const url = file.file_url || file.download_url;

  let uploaderLabel = "—";
  let uploaderRole: "student" | "supporter" | "admin" | "other" = "other";

  if (file.uploaded_by_role === "user") {
    uploaderLabel = "Sinh viên";
    uploaderRole = "student";
  } else if (file.uploaded_by_role === "supporter") {
    uploaderLabel = "Supporter";
    uploaderRole = "supporter";
  } else if (file.uploaded_by_role === "admin") {
    uploaderLabel = "Admin";
    uploaderRole = "admin";
  } else if (file.uploaded_by_name) {
    uploaderLabel = file.uploaded_by_name;
  } else if (file.source_kind === "generated") {
    uploaderLabel = "Hệ thống";
  } else {
    // Fallback based on document type for legacy documents
    const userDocTypes = ["intake_document", "revision_document", "revision_attachment", "external_feedback", "external_evidence"];
    const supporterDocTypes = ["supporter_output", "supporter_attachment"];
    if (file.doc_type && userDocTypes.includes(file.doc_type)) {
      uploaderLabel = "Sinh viên";
      uploaderRole = "student";
    } else if (file.doc_type && supporterDocTypes.includes(file.doc_type)) {
      uploaderLabel = "Supporter";
      uploaderRole = "supporter";
    } else if (file.source_kind === "drive") {
      uploaderLabel = "Sinh viên";
      uploaderRole = "student";
    }
  }

  return {
    key: `${unit.unit_code}-${file.id}`,
    displayName: getFileDisplayName(file, url),
    url,
    hasAction: !!(file.open_action && url),
    sourceLabel: getSourceLabel(file),
    formatLabel: getFormatLabel(file, url),
    versionLabel: "",
    contextLabel: "",
    uploaderLabel,
    uploaderRole,
    createdAt: file.created_at ?? "",
  };
}

function getFileDisplayName(file: DocumentFile, url: string | null) {
  const name = file.original_name || file.canonical_name || "";
  const fileUrl = url || "";
  const isUrl = file.source_kind === "drive" || name.startsWith("http") || (!file.extension && fileUrl);
  if (isUrl) return fileUrl;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(name) && fileUrl) return fileUrl;

  if (name && file.extension) {
    const ext = file.extension.startsWith(".") ? file.extension : `.${file.extension}`;
    return name.endsWith(ext) ? name : `${name}${ext}`;
  }

  return name || fileUrl || "Tài liệu không tên";
}

function getFormatLabel(file: DocumentFile, url: string | null) {
  const displayName = getFileDisplayName(file, url);
  if (file.source_kind === "drive" || displayName.startsWith("http")) return "LINK";
  if (file.extension) return file.extension.replace(/^\./, "").toUpperCase();
  if (!file.mime_type) return "FILE";

  const parts = file.mime_type.split("/");
  if (parts.length < 2) return "FILE";
  const subtype = parts[1].toUpperCase();
  return subtype === "OCTET-STREAM" ? "FILE" : subtype;
}

function getSourceLabel(file: DocumentFile) {
  if (file.source_kind === "drive") return "Google Drive";
  if (file.source_kind === "generated") return "Hệ thống";
  return "Tải lên";
}
