"use client";

import { Anchor, Button, Table, Text, Tooltip } from "@mantine/core";
import { Download } from "lucide-react";
import FileTypeIcon from "@/components/ui/FileTypeIcon";
import {
  DocumentRow,
  WorkspaceTab,
  formatDate,
} from "./document-workspace.types";

interface DocumentTableRowProps {
  row: DocumentRow;
  activeTab: WorkspaceTab;
}

export default function DocumentTableRow({ row, activeTab }: DocumentTableRowProps) {
  const isReport = activeTab === "assessment-reports";
  const { date, time } = formatDate(row.createdAt);

  return (
    <Table.Tr className="transition-colors hover:bg-surface-soft/60">
      <Table.Td className="py-2 w-[52px]">
        <Text className="font-mono text-[13px] text-text-muted whitespace-nowrap">
          {row.versionLabel}
        </Text>
      </Table.Td>

      <Table.Td className="py-2 w-[148px]">
        <Text className="text-sm leading-snug text-text-app" title={row.contextLabel}>
          {row.contextLabel}
        </Text>
      </Table.Td>

      {(activeTab === "documents" || isReport) && (
        <Table.Td className="py-2 w-[88px]">
          <Text className="text-sm text-text-muted whitespace-nowrap">
            {row.uploaderLabel}
          </Text>
        </Table.Td>
      )}

      <Table.Td className="py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0">
            <FileTypeIcon name={row.displayName} size={20} />
          </span>
          {row.hasAction && row.url ? (
            <Anchor
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`min-w-0 text-sm font-medium text-brand hover:underline break-words leading-snug ${
                isReport ? "font-mono" : ""
              }`}
            >
              {row.displayName}
            </Anchor>
          ) : (
            <Text className="min-w-0 text-sm text-text-app break-words leading-snug">
              {row.displayName}
            </Text>
          )}
        </div>
      </Table.Td>

      <Table.Td className="py-2 w-[122px]">
        <Text className="text-[13px] text-text-muted whitespace-nowrap tabular-nums">
          {date}
          {time ? ` · ${time}` : ""}
        </Text>
      </Table.Td>

      <Table.Td className="py-2 w-[62px]">
        <Text className="font-mono text-xs uppercase text-text-muted whitespace-nowrap">
          {row.formatLabel}
        </Text>
      </Table.Td>

      <Table.Td className="py-2 w-[44px] text-right">
        {row.hasAction && row.url ? (
          <Tooltip label="Tải xuống tài liệu">
            <Button
              component="a"
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              variant="subtle"
              color="gray"
              aria-label={`Tải xuống ${row.displayName}`}
              className="cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 text-text-subtle hover:text-brand" />
            </Button>
          </Tooltip>
        ) : (
          <span className="text-text-subtle text-sm">—</span>
        )}
      </Table.Td>
    </Table.Tr>
  );
}
