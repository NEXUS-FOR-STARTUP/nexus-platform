"use client";

import { Anchor, Button, Table, Text } from "@mantine/core";
import { Download } from "lucide-react";
import {
  DocumentRow,
  WorkspaceTab,
  formatDate,
} from "./document-workspace.types";
import DocumentTableRow from "./DocumentTableRow";

interface DocumentRowsTableProps {
  activeTab: WorkspaceTab;
  rows: DocumentRow[];
}

function DocumentMobileCard({
  row,
  showUploader,
}: {
  row: DocumentRow;
  showUploader: boolean;
}) {
  const { date, time } = formatDate(row.createdAt);
  const meta = [
    row.versionLabel,
    row.contextLabel,
    showUploader ? row.uploaderLabel : null,
    `${date}${time ? ` ${time}` : ""}`,
    row.formatLabel,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="p-3 rounded-xl border border-border-app bg-surface-app flex flex-col gap-1.5">
      <div className="min-w-0">
        {row.hasAction && row.url ? (
          <Anchor
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-brand hover:underline break-words leading-snug"
          >
            {row.displayName}
          </Anchor>
        ) : (
          <Text className="text-sm font-medium text-text-app break-words leading-snug">
            {row.displayName}
          </Text>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Text className="text-xs text-text-muted leading-snug min-w-0">
          {meta}
        </Text>
        {row.hasAction && row.url && (
          <Button
            component="a"
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
            size="xs"
            color="brand"
            leftSection={<Download className="w-3.5 h-3.5" />}
            className="shrink-0 font-medium"
          >
            Tải về
          </Button>
        )}
      </div>
    </div>
  );
}

export default function DocumentRowsTable({
  activeTab,
  rows,
}: DocumentRowsTableProps) {
  const isReport = activeTab === "assessment-reports";
  const showUploader = activeTab === "documents" || isReport;

  return (
    <div className="w-full">
      {/* Mobile Card View (md:hidden) */}
      <div className="md:hidden flex flex-col gap-2 p-2">
        {rows.map((row) => (
          <DocumentMobileCard
            key={row.key}
            row={row}
            showUploader={showUploader}
          />
        ))}
      </div>

      {/* Desktop Table View (hidden md:block) */}
      <div className="hidden md:block w-full">
        <Table
          highlightOnHover
          verticalSpacing="xs"
          horizontalSpacing="sm"
          className="w-full"
        >
          <Table.Thead className="bg-surface-soft/40 border-b border-border-app">
            <Table.Tr>
              <Table.Th className="text-xs font-medium text-text-muted py-2">
                {activeTab === "external-feedback" ? "Đợt" : "Phiên bản"}
              </Table.Th>

              <Table.Th className="text-xs font-medium text-text-muted py-2">
                {activeTab === "documents"
                  ? "Phân loại"
                  : activeTab === "external-feedback"
                    ? "Liên kết bản nộp"
                    : "Loại nộp"}
              </Table.Th>

              {showUploader && (
                <Table.Th className="text-xs font-medium text-text-muted py-2">
                  {isReport ? "Nguồn tạo" : "Người tải"}
                </Table.Th>
              )}

              <Table.Th className="text-xs font-medium text-text-muted py-2">
                {isReport ? "Tên file báo cáo" : "Tên tài liệu"}
              </Table.Th>

              <Table.Th className="text-xs font-medium text-text-muted py-2 whitespace-nowrap">
                Thời gian
              </Table.Th>

              <Table.Th className="text-xs font-medium text-text-muted py-2">
                Định dạng
              </Table.Th>

              <Table.Th className="text-xs font-medium text-text-muted py-2 text-right">
                Thao tác
              </Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {rows.map((row) => (
              <DocumentTableRow
                key={row.key}
                row={row}
                activeTab={activeTab}
              />
            ))}
          </Table.Tbody>
        </Table>
      </div>
    </div>
  );
}
