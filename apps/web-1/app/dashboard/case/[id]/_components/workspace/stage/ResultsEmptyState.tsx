import { CaretRightIcon, FolderOpenIcon, PencilSimpleLineIcon } from "@phosphor-icons/react";
import { Button } from "../../ui/Button";
import s from "./stage-results-empty.module.css";

interface ResultsEmptyStateProps {
  answeredCount: number;
  fileCount: number;
  onGoDraft?: () => void;
  onGoFiles?: () => void;
  onAudit?: () => void;
}

export default function ResultsEmptyState({ answeredCount, fileCount, onGoDraft, onGoFiles, onAudit }: ResultsEmptyStateProps) {
  return (
    <section className={s.card}>
      <h2 className={s.title}>Chưa có kết quả chấm</h2>
      <p className={s.lead}>Làm theo các bước dưới đây để nhận kết quả chấm đầu tiên.</p>
      <ol className={s.steps}>
        <li>
          <button type="button" className={s.step} onClick={onGoDraft}>
            <span className={s.icon}>
              <PencilSimpleLineIcon size={20} aria-hidden />
            </span>
            <span className={s.text}>
              <span className={s.name}>Trả lời các câu hỏi</span>
              <span className={s.note}>Mục Soạn thảo · đã trả lời {answeredCount} câu</span>
            </span>
            <CaretRightIcon size={16} className={s.go} aria-hidden />
          </button>
        </li>
        <li>
          <button type="button" className={s.step} onClick={onGoFiles}>
            <span className={s.icon}>
              <FolderOpenIcon size={20} aria-hidden />
            </span>
            <span className={s.text}>
              <span className={s.name}>Tải tài liệu lên</span>
              <span className={s.note}>Mục Tài liệu · {fileCount} tệp</span>
            </span>
            <CaretRightIcon size={16} className={s.go} aria-hidden />
          </button>
        </li>
        <li>
          <div className={`${s.step} ${s.last}`}>
            <span className={s.text}>
              <span className={s.name}>Bấm chấm bài</span>
              <span className={s.note}>Mỗi lần chấm trừ 1 lượt của giai đoạn này.</span>
            </span>
            <Button onClick={onAudit}>Chấm bài</Button>
          </div>
        </li>
      </ol>
    </section>
  );
}
