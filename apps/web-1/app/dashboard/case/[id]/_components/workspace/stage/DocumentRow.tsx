import { DownloadSimpleIcon, TrashIcon } from "@phosphor-icons/react/ssr";
import FileTypeIcon from "@/components/ui/FileTypeIcon";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatDate, type DocumentRow as DocumentRowData } from "../../documents/document-workspace.types";
import { IconButton } from "../../ui/Button";
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
  const meta = [row.formatLabel, row.uploaderLabel, formatDate(row.createdAt).date].join(" · ");

  return (
    <div className={s.row}>
      <div className={s.nm}>
        <FileTypeIcon name={row.displayName} size={32} />
        <div>
          <div className={s.title}>
            {downloadUrl ? (
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className={s.name}>
                {row.displayName}
              </a>
            ) : (
              <span className={s.name}>{row.displayName}</span>
            )}
            {chip && <StatusChip tone="neutral">{chip}</StatusChip>}
          </div>
          <div className={s.meta}>{meta}</div>
        </div>
      </div>
      <div className={s.acts}>
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.ib}
            aria-label={`Tải xuống ${row.displayName}`}
          >
            <DownloadSimpleIcon size={18} aria-hidden />
          </a>
        )}
        {documentId && (
          <IconButton
            label={`Xoá ${row.displayName}`}
            loading={isDeleting}
            onClick={() => onDelete(documentId, row.displayName)}
          >
            <TrashIcon size={18} aria-hidden />
          </IconButton>
        )}
      </div>
    </div>
  );
}
