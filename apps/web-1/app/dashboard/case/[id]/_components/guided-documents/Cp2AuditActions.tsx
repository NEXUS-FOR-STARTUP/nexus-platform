"use client";

import { Button } from "@mantine/core";
import { ClipboardCheck, FileSearch, RefreshCw } from "lucide-react";
import { QUESTION_REGISTRY, type Readiness } from "@repo/validation";
import { useCp2Audit } from "../../hooks/useCp2Audit";
import Cp2PackageCard from "../Cp2PackageCard";

interface Cp2AuditActionsProps {
  caseId: string;
  readiness: Readiness;
}

export default function Cp2AuditActions({ caseId, readiness }: Cp2AuditActionsProps) {
  const { creditsLeft, hasFullReport, isBusy, auditQuestionnaire, auditFull, resubmitFull } = useCp2Audit(caseId);
  const noCredits = creditsLeft === 0;
  const disabled = isBusy || noCredits;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium text-text-app">Chấm điểm CP2 · còn {creditsLeft} lượt</p>

      <p className="text-xs text-text-muted">Xóa cột email, số điện thoại, họ tên người trả lời trước khi tải lên</p>

      <div className="flex flex-wrap gap-2">
        <Button
          size="xs"
          variant="default"
          leftSection={<ClipboardCheck className="w-4 h-4" />}
          disabled={disabled || !readiness.interviewAuditReady}
          onClick={auditQuestionnaire}
        >
          Chấm bảng hỏi
        </Button>
        <Button
          size="xs"
          color={readiness.missing.length > 0 ? "orange" : "blue"}
          leftSection={<FileSearch className="w-4 h-4" />}
          disabled={disabled}
          onClick={auditFull}
        >
          Chấm toàn bộ
        </Button>
        {hasFullReport && (
          <Button
            size="xs"
            variant="light"
            leftSection={<RefreshCw className="w-4 h-4" />}
            disabled={disabled}
            onClick={resubmitFull}
          >
            Chấm lại bản sửa
          </Button>
        )}
      </div>

      {!readiness.interviewAuditReady && (
        <p className="text-xs text-text-muted">
          Chấm bảng hỏi cần thêm: {readiness.interviewAuditMissing.map((id) => QUESTION_REGISTRY[id].text).join("; ")}
        </p>
      )}
      {readiness.missing.length > 0 && (
        <p className="text-xs text-orange-600">
          Còn {readiness.missing.length} câu bắt buộc chưa điền. Bạn vẫn có thể chấm, nhưng các mục thiếu sẽ bị tính là chưa đạt.
        </p>
      )}

      {noCredits && <Cp2PackageCard caseId={caseId} />}
    </div>
  );
}
