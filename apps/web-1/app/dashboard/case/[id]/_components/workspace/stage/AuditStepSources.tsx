"use client";

import { Alert, Button, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { Check, Minus } from "@phosphor-icons/react";

interface AuditStepSourcesProps {
  isCp2: boolean;
  answeredCount: number;
  fileCount: number;
  hasAnswers: boolean;
  hasFiles: boolean;
  blocked: boolean;
  missingMandatoryCount: number;
  onGoFiles?: () => void;
}

function SourceRow({ ok, title, hint }: { ok: boolean; title: string; hint?: string }) {
  return (
    <Group gap="xs" wrap="nowrap" align="flex-start">
      <ThemeIcon size="sm" radius="xl" color={ok ? "green" : "gray"} variant={ok ? "filled" : "light"}>
        {ok ? <Check size={14} /> : <Minus size={14} />}
      </ThemeIcon>
      <Stack gap={0}>
        <Text size="sm">{title}</Text>
        {hint && <Text size="sm" c="dimmed">{hint}</Text>}
      </Stack>
    </Group>
  );
}

/** Step 1: what the team has to grade (answers / files), plus the dead-end alert when it has neither. */
export default function AuditStepSources({ isCp2, answeredCount, fileCount, hasAnswers, hasFiles, blocked, missingMandatoryCount, onGoFiles }: AuditStepSourcesProps) {
  return (
    <>
      <Text fw={500}>Bước 1/2: bạn đang có gì để chấm?</Text>
      <Stack gap="xs">
        <SourceRow
          ok={hasAnswers}
          title={`Câu trả lời: ${answeredCount} câu`}
          hint={isCp2 ? "Không bắt buộc nếu bạn chấm bằng tài liệu. Nếu dùng, cần đủ số câu có nội dung thật, mỗi câu viết thành câu hoàn chỉnh" : undefined}
        />
        <SourceRow
          ok={hasFiles}
          title={`Tài liệu đính kèm: ${fileCount} tệp`}
          hint={isCp2 ? "Không bắt buộc nếu bạn chấm bằng câu trả lời. Khảo sát .xlsx, ghi chép phỏng vấn .docx/.pdf" : "Không bắt buộc nếu bạn đã trả lời câu hỏi ở tab Soạn thảo"}
        />
      </Stack>

      {!hasFiles && onGoFiles && (
        <Button variant="default" onClick={onGoFiles}>Sang tab Tài liệu để tải lên</Button>
      )}

      {blocked && (
        <Alert color="red" title="Chưa có gì để chấm">
          {isCp2
            ? `Bạn cần một trong hai: tải tài liệu lên ở tab Tài liệu, hoặc trả lời đủ câu ở tab Soạn thảo (${answeredCount} câu hiện có nội dung nhưng quá ngắn hoặc chưa đủ số câu).`
            : "Chưa có câu trả lời nào và chưa có tệp nào. Trả lời ít nhất một câu ở tab Soạn thảo hoặc tải một tệp lên ở tab Tài liệu trước khi chấm."}
        </Alert>
      )}
      {!blocked && missingMandatoryCount > 0 && (
        <Alert color="yellow" title="Còn câu điều kiện chưa điền">
          Bạn còn {missingMandatoryCount} câu điều kiện chưa trả lời. Bạn vẫn có thể gửi chấm, nhưng hội đồng có thể trừ điểm phần này.
        </Alert>
      )}
    </>
  );
}
