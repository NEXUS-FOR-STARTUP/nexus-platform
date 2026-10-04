"use client";

import { Anchor, Badge, Button, Table, Text, Tooltip } from "@mantine/core";
import { Download, FileText } from "lucide-react";
import {
  DocumentRow,
  WorkspaceTab,
  formatDate,
  getFormatColor,
} from "./document-workspace.types";

interface DocumentTableRowProps {
  row: DocumentRow;
  activeTab: WorkspaceTab;
}

export default function DocumentTableRow({ row, activeTab }: DocumentTableRowProps) {
  const isSupporter =
    row.uploaderRole === "supporter" || row.uploaderRole === "admin";
  const isStudent = row.uploaderRole === "student";
  const isReport = activeTab === "assessment-reports";
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
          size="md"
          radius="xl"
          className="font-medium text-base whitespace-nowrap"
        >
          {row.contextLabel}
        </Badge>
      </Table.Td>

      {(activeTab === "documents" || isReport) && (
        <Table.Td className="py-3.5">
          <Badge
            variant="light"
            color={isReport ? "violet" : isSupporter ? "violet" : isStudent ? "teal" : "gray"}
            size="md"
            radius="xl"
            className="font-medium text-base whitespace-nowrap"
          >
            {row.uploaderLabel}
          </Badge>
        </Table.Td>
      )}

      {/* File name cell: whitespace-nowrap to prevent ugly wrapping */}
      <Table.Td className="py-3.5 min-w-[320px]">
        <div className="flex items-center gap-2">
          {isReport && <FileText className="w-4 h-4 text-red-500 shrink-0" />}
          {row.hasAction && row.url ? (
            <Anchor
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-base text-brand hover:underline font-normal whitespace-nowrap ${
                isReport ? "font-mono" : ""
              }`}
            >
              {row.displayName}
            </Anchor>
          ) : (
            <Text className="text-base text-text-muted font-normal whitespace-nowrap">
              {row.displayName}
            </Text>
          )}
        </div>
      </Table.Td>

      <Table.Td className="py-3.5 whitespace-nowrap">
        <Text className="font-normal text-text-app text-base leading-tight">
          {date}
        </Text>
        {time && (
          <Text c="dimmed" className="text-base mt-0.5 font-normal">
            {time}
          </Text>
        )}
      </Table.Td>

      {!isReport && (
        <Table.Td className="py-3.5">
          <Text className="text-base text-text-app font-normal">
            {row.sourceLabel}
          </Text>
        </Table.Td>
      )}

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

      <Table.Td className="py-3.5 text-right">
        {row.hasAction && row.url ? (
          <Tooltip label="Tải xuống tài liệu">
            <Button
              component="a"
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              size="compact-sm"
              variant="subtle"
              color="gray"
              className="cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 text-text-subtle hover:text-brand" />
            </Button>
          </Tooltip>
        ) : (
          <span className="text-text-subtle text-base">—</span>
        )}
      </Table.Td>
    </Table.Tr>
  );
}
