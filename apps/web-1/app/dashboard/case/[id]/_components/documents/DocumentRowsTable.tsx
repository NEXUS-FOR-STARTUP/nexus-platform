"use client";

import { Badge, Group, Table, Text } from "@mantine/core";
import { DocumentRow, WorkspaceTab } from "./document-workspace.types";
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

export default function DocumentRowsTable({
  activeTab,
  rows,
  groups,
}: DocumentRowsTableProps) {
  const isReport = activeTab === "assessment-reports";

  return (
    <div className="overflow-x-auto w-full">
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
  );
}
