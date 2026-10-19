import { ActionIcon, Anchor, Group, Stack, Text } from "@mantine/core";
import { Download, Trash2 } from "lucide-react";
import FileTypeIcon from "@/components/ui/FileTypeIcon";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatDate, type DocumentRow as DocumentRowData } from "../../documents/document-workspace.types";
import { versionChip } from "./document-groups";
import s from "./DocumentGroupList.module.css";

interface DocumentRowProps {
  row: DocumentRowData;
  onDelete: (documentId: string, displayName: string) => void;
  isDeleting: boolean;
}

export default function DocumentRow({ row, onDelete, isDeleting }: DocumentRowProps) {
  const chip = versionChip(row.versionLabel);
  const documentId = row.documentId;
  const downloadUrl = row.hasAction ? row.url : null;

  return (
    <div className={s.row}>
      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
        <FileTypeIcon name={row.displayName} size={32} />
        <Stack gap={2} style={{ minWidth: 0 }}>
          <Group gap="xs" wrap="wrap">
            {downloadUrl ? (
              <Anchor href={downloadUrl} target="_blank" rel="noopener noreferrer" className={s.name}>
                {row.displayName}
              </Anchor>
            ) : (
              <span className={s.name}>{row.displayName}</span>
            )}
            {chip && <StatusChip tone="neutral">{chip}</StatusChip>}
          </Group>
          <Group gap="md" wrap="wrap">
            <Text className={s.meta}>{row.formatLabel}</Text>
            <Text className={s.meta}>{row.uploaderLabel}</Text>
            <Text className={s.meta}>{formatDate(row.createdAt).date}</Text>
          </Group>
        </Stack>
      </Group>
      <Group gap={4} wrap="nowrap" className={s.actions}>
        {downloadUrl && (
          <ActionIcon
            component="a"
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
            color="gray"
            size="lg"
            aria-label={`Tải xuống ${row.displayName}`}
          >
            <Download size={16} />
          </ActionIcon>
        )}
        {documentId && (
          <ActionIcon
            variant="subtle"
            color="red"
            size="lg"
            loading={isDeleting}
            onClick={() => onDelete(documentId, row.displayName)}
            aria-label={`Xoá ${row.displayName}`}
          >
            <Trash2 size={16} />
          </ActionIcon>
        )}
      </Group>
    </div>
  );
}
