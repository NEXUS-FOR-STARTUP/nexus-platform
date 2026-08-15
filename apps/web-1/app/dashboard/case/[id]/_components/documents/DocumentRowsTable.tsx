"use client";

import { Anchor, Badge, Group, Table, Text } from "@mantine/core";
import {
  DocumentRow,
  WorkspaceTab,
  formatDate,
  getFormatColor,
} from "./document-workspace.types";
import type { DocumentCategoryGroup } from "./document-groups";

interface DocumentRowsTableProps {
  activeTab: WorkspaceTab;
  rows: DocumentRow[];
  groups: DocumentCategoryGroup[];
}

function DocumentTableRow({ row, activeTab }: { row: DocumentRow; activeTab: WorkspaceTab }) {
  const isSupporter =
    row.uploaderRole === "supporter" || row.uploaderRole === "admin";
  const isStudent = row.uploaderRole === "student";
  const { date, time } = formatDate(row.createdAt);

  return (
    <Table.Tr className="transition-colors hover:bg-surface-soft/60">
      <Table.Td className="py-3.5">
        <Text className="text-base font-medium text-text-app">
          {row.versionLabel}
        </Text>
      </Table.Td>

      <Table.Td className="py-3.5">
        <Badge
          variant="light"
          color={isSupporter ? "violet" : "blue"}
          size="md"
          radius="xl"
          className="font-medium text-base whitespace-nowrap"
        >
          {row.contextLabel}
        </Badge>
      </Table.Td>

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

      <Table.Td className="py-3.5">
        <Text className="text-base text-text-app font-normal">
          {row.sourceLabel}
        </Text>
      </Table.Td>

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
}

function GroupedDocumentRows({ group }: { group: DocumentCategoryGroup }) {
  return (
    <>
      <Table.Tr className="bg-surface-soft/40">
        <Table.Td colSpan={7} className="py-2.5">
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
  return (
    <div className="overflow-x-auto w-full">
      <Table
        highlightOnHover
        verticalSpacing="sm"
        horizontalSpacing="md"
        className="w-full min-w-[800px]"
      >
        <Table.Thead className="bg-surface-soft/40 border-b border-border-app">
          <Table.Tr>
            <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[100px]">
              {activeTab === "documents" ? "Phiên bản" : "Đợt"}
            </Table.Th>

            <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[160px]">
              {activeTab === "documents" ? "Phân loại" : "Liên kết bản nộp"}
            </Table.Th>

            {activeTab === "documents" && (
              <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[130px]">
                Người tải
              </Table.Th>
            )}

            <Table.Th className="text-base font-medium text-text-muted py-3.5">
              Tên tài liệu
            </Table.Th>

            <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[150px]">
              Ngày tải
            </Table.Th>

            <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[130px]">
              Nguồn
            </Table.Th>

            <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[100px]">
              Định dạng
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
