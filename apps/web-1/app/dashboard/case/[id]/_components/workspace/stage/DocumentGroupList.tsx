import type { DocumentGroup } from "./document-groups";
import DocumentRow from "./DocumentRow";
import s from "./DocumentGroupList.module.css";

interface DocumentGroupListProps {
  groups: DocumentGroup[];
  missing: string[];
  onDelete: (documentId: string, displayName: string) => void;
  isDeleting: boolean;
}

export default function DocumentGroupList({ groups, missing, onDelete, isDeleting }: DocumentGroupListProps) {
  return (
    <div>
      {groups.map((group) => (
        <section key={group.label}>
          <h3 className={s.group}>{group.label}</h3>
          <div className={s.rows}>
            {group.rows.map((row) => (
              <DocumentRow key={row.key} row={row} onDelete={onDelete} isDeleting={isDeleting} />
            ))}
          </div>
        </section>
      ))}
      {missing.length > 0 && <p className={s.more}>Có thể thêm: {missing.join(", ")}.</p>}
    </div>
  );
}
