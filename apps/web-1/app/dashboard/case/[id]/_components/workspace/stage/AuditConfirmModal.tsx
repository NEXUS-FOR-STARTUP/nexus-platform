"use client";

import { Modal, Stack, Text, Button, Radio, Group, Paper, Alert, ThemeIcon } from "@mantine/core";
import { useEffect, useState } from "react";
import { AlertCircle, Check, Minus, Sparkles } from "lucide-react";
import type { StageDefinition } from "@app/shared/stages";
import type { StageSummary } from "../../../hooks/useStageSummaries";

interface AuditConfirmModalProps {
  stage: StageDefinition;
  opened: boolean;
  onClose: () => void;
  onConfirm: (scope: string) => void;
  creditsRemaining: number;
  summary?: StageSummary;
  missingMandatoryCount?: number;
  isLoading?: boolean;
  /** Jump to the files tab (modal closes first). Keeps upload in StageFilesView only. */
  onGoFiles?: () => void;
}



/**
 * Single grading entry point. Step 1 = readiness checklist (answers + files);
 * missing files link to the files tab instead of duplicating upload here.
 * Step 2 = scope + confirm. Thin input is blocked with the same bar as the
 * API gate so the user never burns a click on a 400.
 */
export default function AuditConfirmModal({
  stage,
  opened,
  onClose,
  onConfirm,
  creditsRemaining,
  summary,
  missingMandatoryCount = 0,
  isLoading = false,
  onGoFiles,
}: AuditConfirmModalProps) {
  const isCp2 = stage.code === "CP2";
  const [scope, setScope] = useState<string>("full");
  const [step, setStep] = useState(1);

  const answeredCount = summary?.answered_count ?? 0;
  const fileCount = summary?.file_count ?? 0;
  // Server decides per scope (thresholds are env-driven); never re-implement the bar here.
  // Step 1 runs before scope is picked, so it passes when EITHER scope is ready.
  // Step 2 enforces the selected scope via scopeReady.
  const readyFull = summary?.answers_ready_full ?? false;
  const readyQuestionnaire = summary?.answers_ready_questionnaire ?? false;
  // Step 2 defaults to full, but only-questionnaire-ready input would stall there.
  useEffect(() => {
    if (isCp2 && !readyFull && readyQuestionnaire) setScope("questionnaire");
  }, [isCp2, readyFull, readyQuestionnaire]);
  // Step 2 enforces the selected scope.
  const scopeReady = scope === "questionnaire" ? readyQuestionnaire : readyFull;
  const hasAnswers = !isCp2 || readyFull || readyQuestionnaire;
  const hasFiles = fileCount > 0;
  const blocked = isCp2 && !readyFull && !readyQuestionnaire;

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(scope);
    handleClose();
  };

  const handleGoFiles = () => {
    handleClose();
    onGoFiles?.();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={`Xác nhận chấm bài — ${stage.name}`} centered size="md">
      <Stack gap="md">
        {step === 1 && (
          <>
            <Text size="sm" fw={600}>Bước 1/2: chuẩn bị đã đủ chưa?</Text>
            <Stack gap="xs">
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon size="sm" radius="xl" color={hasAnswers ? "green" : "gray"} variant={hasAnswers ? "filled" : "light"}>
                  {hasAnswers ? <Check size={14} /> : <Minus size={14} />}
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="sm">Câu trả lời: {answeredCount} câu</Text>
                  {isCp2 && <Text size="xs" c="dimmed">Cần đủ số câu có nội dung thật, mỗi câu viết thành câu hoàn chỉnh (không &ldquo;không biết&rdquo;, không 1-2 từ)</Text>}
                </Stack>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon size="sm" radius="xl" color={hasFiles ? "green" : "gray"} variant={hasFiles ? "filled" : "light"}>
                  {hasFiles ? <Check size={14} /> : <Minus size={14} />}
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="sm">Tài liệu đính kèm: {fileCount} tệp</Text>
                  {isCp2 ? <Text size="xs" c="dimmed">Khảo sát .xlsx, ghi chép phỏng vấn .docx/.pdf — thiếu thì điểm tiêu chí đó thấp</Text> : <Text size="xs" c="dimmed">Không bắt buộc ở vòng này</Text>}
                </Stack>
              </Group>
            </Stack>

            {isCp2 && !hasFiles && onGoFiles && (
              <Button size="sm" variant="default" onClick={handleGoFiles}>
                Sang tab Tài liệu để tải lên
              </Button>
            )}

            {blocked && (
              <Alert icon={<AlertCircle size={16} />} color="red" title="Chưa đủ điều kiện chấm">
                Câu trả lời hiện chưa đủ chuẩn: {answeredCount} câu có nội dung, nhưng quá ngắn hoặc chưa đủ số câu.
                Viết đầy đủ hơn ở tab Soạn thảo rồi quay lại. Hệ thống sẽ từ chối nếu cố chấm lúc này.
              </Alert>
            )}
            {!blocked && missingMandatoryCount > 0 && (
              <Alert icon={<AlertCircle size={16} />} color="yellow" title="Còn câu điều kiện chưa điền">
                Bạn còn {missingMandatoryCount} câu điều kiện chưa trả lời. Bạn vẫn có thể gửi chấm, nhưng hội đồng có thể trừ điểm phần này.
              </Alert>
            )}

            <Group justify="flex-end" gap="xs">
              <Button variant="default" onClick={handleClose} disabled={isLoading}>
                Hủy
              </Button>
              <Button color="blue" disabled={blocked} onClick={() => setStep(2)}>
                Tiếp tục
              </Button>
            </Group>
          </>
        )}

        {step === 2 && (
          <>
            <Text size="sm" fw={600}>Bước 2/2: chọn phạm vi và xác nhận</Text>
            {isCp2 && (
              <Radio.Group
                value={scope}
                onChange={setScope}
                label="Phạm vi chấm"
                description="Chọn gói đánh giá bạn muốn AI thực hiện."
              >
                <Stack gap="xs" mt="xs">
                  <Radio value="full" label="Đánh giá toàn diện (Đề xuất)" description="Kiểm tra bảng hỏi, logic khảo sát và tài liệu đính kèm" disabled={!readyFull} />
                  <Radio value="questionnaire" label="Chỉ soát bảng hỏi" description="Chỉ kiểm tra cấu trúc câu hỏi khảo sát" disabled={!readyQuestionnaire} />
                </Stack>
              </Radio.Group>
            )}

            <Paper p="sm" withBorder bg="var(--mantine-color-gray-0)">
              <Stack gap={4}>
                <Text size="xs" fw={600}>Hệ thống AI sẽ phân tích:</Text>
                <Text size="xs" c="dimmed">• Các câu trả lời trong mẫu {stage.name}</Text>
                <Text size="xs" c="dimmed">• Tài liệu tệp đính kèm bạn đã tải lên giai đoạn này</Text>
                {stage.code === "CP2" && <Text size="xs" c="dimmed">• Tóm tắt ý tưởng ở giai đoạn trước</Text>}
              </Stack>
            </Paper>

            {isCp2 && !hasFiles && (
              <Alert color="yellow" title="Chấm khi thiếu tệp">
                Vẫn chấm được theo lời nhóm mô tả, nhưng các tiêu chí thiếu bằng chứng sẽ bị đánh giá thấp.
              </Alert>
            )}

            <Group justify="space-between">
              <Text size="sm">Chi phí:</Text>
              <Text size="sm" fw={600} c="blue">
                Dùng 1 lượt (còn {creditsRemaining} → {Math.max(creditsRemaining - 1, 0)})
              </Text>
            </Group>

            <Group justify="space-between" gap="xs">
              <Button variant="default" onClick={() => setStep(1)} disabled={isLoading}>
                Quay lại
              </Button>
              <Group gap="xs">
                <Button variant="default" onClick={handleClose} disabled={isLoading}>
                  Hủy
                </Button>
                <Button
                  color="blue"
                  leftSection={<Sparkles size={16} />}
                  loading={isLoading}
                  disabled={isCp2 && !scopeReady}
                  onClick={handleConfirm}
                >
                  Bắt đầu chấm bài
                </Button>
              </Group>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
