"use client";

import { Anchor, Badge, Button, Group, Table, Text } from "@mantine/core";
import { Download } from "lucide-react";
import {
  DocumentRow,
  WorkspaceTab,
  formatDate,
  getFormatColor,
} from "./document-workspace.types";
import type { DocumentCategoryGroup } from "./document-groups";
import DocumentTableRow from "./DocumentTableRow";

interface DocumentRowsTableProps {
  activeTab: WorkspaceTab;
  rows: DocumentRow[];
  groups: DocumentCategoryGroup[];
}

function GroupedDocumentRows({ group }: { group: DocumentCategoryGroup }) {
  return (
    <>
      <Table.Tr className="bg-surface-soft/40">
        <Table.Td colSpan={8} className="py-2.5">
          <Group gap="xs" wrap="nowrap">
            <Text className="text-base font-semibold text-text-app">
              {group.label}
            </Text>
            <Badge variant="light" color="gray" size="sm" radius="xl">
              {group.rows.length}
            </Badge>
          </Group>
        </Table.Td>
      </Table.Tr>
      {group.rows.map((row) => (
        <DocumentTableRow key={row.key} row={row} activeTab="documents" />
      ))}
    </>
  );
}

function DocumentMobileCard({
  row,
  activeTab,
}: {
  row: DocumentRow;
  activeTab: WorkspaceTab;
}) {
  const isSupporter =
    row.uploaderRole === "supporter" || row.uploaderRole === "admin";
  const isStudent = row.uploaderRole === "student";
  const isReport = activeTab === "assessment-reports";
  const { date, time } = formatDate(row.createdAt);

  return (
    <div className="p-3.5 rounded-xl border border-border-app bg-surface-app flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" color="gray" size="sm" radius="md">
            {row.versionLabel}
          </Badge>
          <Badge
            variant="light"
            color={
              isReport
                ? row.contextLabel === "Đã sửa"
                  ? "blue"
                  : row.contextLabel === "Lần đầu"
                    ? "teal"
                    : "violet"
                : isSupporter
                  ? "violet"
                  : "blue"
            }
            size="sm"
            radius="xl"
          >
            {row.contextLabel}
          </Badge>
          {(activeTab === "documents" || isReport) && (
            <Badge
              variant="light"
              color={
                isReport
                  ? "violet"
                  : isSupporter
                    ? "violet"
                    : isStudent
                      ? "teal"
                      : "gray"
              }
              size="sm"
              radius="xl"
            >
              {row.uploaderLabel}
            </Badge>
          )}
        </div>
        <Badge
          variant="light"
          color={getFormatColor(row.formatLabel)}
          size="xs"
          radius="md"
          className="uppercase font-mono"
        >
          {row.formatLabel}
        </Badge>
      </div>

      <div className="min-w-0">
        {row.hasAction && row.url ? (
          <Anchor
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-brand hover:underline break-words"
          >
            {row.displayName}
          </Anchor>
        ) : (
          <Text className="text-sm font-medium text-text-app break-words">
            {row.displayName}
          </Text>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted pt-1 border-t border-border-app/60">
        <span>
          {date} {time}
        </span>
        {row.hasAction && row.url && (
          <Button
            component="a"
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
            size="compact-sm"
            color="brand"
            leftSection={<Download className="w-3.5 h-3.5" />}
            className="min-h-[44px] font-medium"
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
  groups,
}: DocumentRowsTableProps) {
  const isReport = activeTab === "assessment-reports";

  return (
    <div className="w-full">
      {/* Mobile Card View (md:hidden) */}
      <div className="md:hidden flex flex-col gap-3">
        {activeTab === "documents"
          ? groups.map((group) => (
              <div key={group.key} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1 pt-2">
                  <Text className="text-sm font-semibold text-text-app">
                    {group.label}
                  </Text>
                  <Badge variant="light" color="gray" size="xs" radius="xl">
                    {group.rows.length}
                  </Badge>
                </div>
                {group.rows.map((row) => (
                  <DocumentMobileCard
                    key={row.key}
                    row={row}
                    activeTab="documents"
                  />
                ))}
              </div>
            ))
          : rows.map((row) => (
              <DocumentMobileCard
                key={row.key}
                row={row}
                activeTab={activeTab}
              />
            ))}
      </div>

      {/* Desktop Table View (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto w-full">
        <Table
          highlightOnHover
          verticalSpacing="sm"
          horizontalSpacing="md"
          className="w-full min-w-[920px]"
        >
          <Table.Thead className="bg-surface-soft/40 border-b border-border-app">
            <Table.Tr>
              <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[85px]">
                {activeTab === "external-feedback" ? "Đợt" : "Phiên bản"}
              </Table.Th>

              <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[130px]">
                {activeTab === "documents"
                  ? "Phân loại"
                  : activeTab === "external-feedback"
                    ? "Liên kết bản nộp"
                    : "Loại nộp"}
              </Table.Th>

              {(activeTab === "documents" || isReport) && (
                <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[120px]">
                  {isReport ? "Nguồn tạo" : "Người tải"}
                </Table.Th>
              )}

              {/* Filename column allocated maximum flexible width */}
              <Table.Th className="text-base font-medium text-text-muted py-3.5 min-w-[320px]">
                {isReport ? "Tên file báo cáo" : "Tên tài liệu"}
              </Table.Th>

              <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[130px] whitespace-nowrap">
                Thời gian
              </Table.Th>

              {!isReport && (
                <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[110px]">
                  Nguồn
                </Table.Th>
              )}

              <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[90px]">
                Định dạng
              </Table.Th>

              <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[75px] text-right">
                Thao tác
              </Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {activeTab === "documents"
              ? groups.map((group) => (
                  <GroupedDocumentRows key={group.key} group={group} />
                ))
              : rows.map((row) => (
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
