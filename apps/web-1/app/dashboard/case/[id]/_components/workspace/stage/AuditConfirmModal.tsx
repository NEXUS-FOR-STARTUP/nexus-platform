"use client";

import { Modal, Stack, Text, Button, Radio, Group, Paper, Alert, ThemeIcon } from "@mantine/core";
import { useEffect, useState } from "react";
import { AlertCircle, Check, Minus, Sparkles } from "lucide-react";
import type { StageDefinition } from "@app/shared/stages";
import type { Cp2InputSource } from "@app/shared";
import type { StageSummary } from "../../../hooks/useStageSummaries";

interface AuditConfirmModalProps {
  stage: StageDefinition;
  opened: boolean;
  onClose: () => void;
  onConfirm: (scope: string, inputSource: Cp2InputSource) => void;
  creditsRemaining: number;
  summary?: StageSummary;
  missingMandatoryCount?: number;
  isLoading?: boolean;
  /** Jump to the files tab (modal closes first). Keeps upload in StageFilesView only. */
  onGoFiles?: () => void;
}

type Cp2Scope = "full" | "questionnaire";

const SOURCE_PRIORITY: readonly Cp2InputSource[] = ["both", "answers", "files"];
const SCOPE_PRIORITY: readonly Cp2Scope[] = ["full", "questionnaire"];

/**
 * Single grading entry point. Step 1 = what the team has (answers / files).
 * Step 2 = what to grade on (answers, files, or both) + scope + confirm.
 * Either input alone is enough: a team with detailed files skips the 26 questions,
 * a team with no files grades on answers. "Both" needs both to pass.
 * Readiness comes from the server summary so the client never re-implements the bar.
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
  const [scope, setScope] = useState<Cp2Scope>("full");
  const [source, setSource] = useState<Cp2InputSource>("answers");
  const [step, setStep] = useState(1);

  const answeredCount = summary?.answered_count ?? 0;
  const fileCount = summary?.file_count ?? 0;
  const readyFull = summary?.answers_ready_full ?? false;
  const readyQuestionnaire = summary?.answers_ready_questionnaire ?? false;
  const hasFiles = fileCount > 0;

  const answersReadyFor = (sc: Cp2Scope) => (sc === "questionnaire" ? readyQuestionnaire : readyFull);
  const sourceReady = (src: Cp2InputSource, sc: Cp2Scope) => {
    if (src === "files") return hasFiles;
    if (src === "answers") return answersReadyFor(sc);
    return hasFiles && answersReadyFor(sc);
  };

  // Pick the richest option the current input supports; re-run only when readiness changes.
  useEffect(() => {
    if (!isCp2) return;
    for (const src of SOURCE_PRIORITY) {
      const sc = SCOPE_PRIORITY.find((candidate) => sourceReady(src, candidate));
      if (sc) {
        setSource(src);
        setScope(sc);
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCp2, readyFull, readyQuestionnaire, hasFiles]);

  const canConfirm = !isCp2 || sourceReady(source, scope);
  const blocked = isCp2 && !hasFiles && !readyFull && !readyQuestionnaire;
  const hasAnswers = !isCp2 || readyFull || readyQuestionnaire;

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(scope, source);
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
            <Text size="sm" fw={600}>Bước 1/2: bạn đang có gì để chấm?</Text>
            <Stack gap="xs">
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon size="sm" radius="xl" color={hasAnswers ? "green" : "gray"} variant={hasAnswers ? "filled" : "light"}>
                  {hasAnswers ? <Check size={14} /> : <Minus size={14} />}
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="sm">Câu trả lời: {answeredCount} câu</Text>
                  {isCp2 && <Text size="xs" c="dimmed">Không bắt buộc nếu bạn chấm bằng tài liệu. Nếu dùng, cần đủ số câu có nội dung thật, mỗi câu viết thành câu hoàn chỉnh</Text>}
                </Stack>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon size="sm" radius="xl" color={hasFiles ? "green" : "gray"} variant={hasFiles ? "filled" : "light"}>
                  {hasFiles ? <Check size={14} /> : <Minus size={14} />}
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="sm">Tài liệu đính kèm: {fileCount} tệp</Text>
                  {isCp2 ? <Text size="xs" c="dimmed">Không bắt buộc nếu bạn chấm bằng câu trả lời. Khảo sát .xlsx, ghi chép phỏng vấn .docx/.pdf</Text> : <Text size="xs" c="dimmed">Không bắt buộc ở vòng này</Text>}
                </Stack>
              </Group>
            </Stack>

            {isCp2 && !hasFiles && onGoFiles && (
              <Button size="sm" variant="default" onClick={handleGoFiles}>
                Sang tab Tài liệu để tải lên
              </Button>
            )}

            {blocked && (
              <Alert icon={<AlertCircle size={16} />} color="red" title="Chưa có gì để chấm">
                Bạn cần một trong hai: tải tài liệu lên ở tab Tài liệu, hoặc trả lời đủ câu ở tab Soạn thảo
                ({answeredCount} câu hiện có nội dung nhưng quá ngắn hoặc chưa đủ số câu).
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
            <Text size="sm" fw={600}>Bước 2/2: chọn cách chấm và xác nhận</Text>
            {isCp2 && (
              <>
                <Radio.Group
                  value={source}
                  onChange={(value) => setSource(value as Cp2InputSource)}
                  label="AI đọc gì để chấm"
                  description="Chọn đúng thứ bạn muốn được đánh giá."
                >
                  <Stack gap="xs" mt="xs">
                    <Radio
                      value="both"
                      label="Cả câu trả lời và tài liệu"
                      description={sourceReady("both", scope) ? "Chấm kỹ nhất: đối chiếu lời trả lời với tệp bạn nộp" : "Cần đủ câu trả lời và có ít nhất 1 tệp"}
                      disabled={!sourceReady("both", scope)}
                    />
                    <Radio
                      value="answers"
                      label="Chỉ câu trả lời trong mẫu"
                      description={sourceReady("answers", scope) ? "Hợp khi chưa có tài liệu riêng" : "Chưa đủ câu trả lời có nội dung"}
                      disabled={!sourceReady("answers", scope)}
                    />
                    <Radio
                      value="files"
                      label="Chỉ tài liệu đã tải lên"
                      description={hasFiles ? "Hợp khi tài liệu của bạn đã chi tiết, không cần trả lời từng câu" : "Chưa có tệp nào ở tab Tài liệu"}
                      disabled={!hasFiles}
                    />
                  </Stack>
                </Radio.Group>

                <Radio.Group
                  value={scope}
                  onChange={(value) => setScope(value as Cp2Scope)}
                  label="Phạm vi chấm"
                  description="Chọn gói đánh giá bạn muốn AI thực hiện."
                >
                  <Stack gap="xs" mt="xs">
                    <Radio value="full" label="Đánh giá toàn diện (Đề xuất)" description="Kiểm tra bảng hỏi, logic khảo sát và bằng chứng" disabled={!sourceReady(source, "full")} />
                    <Radio value="questionnaire" label="Chỉ soát bảng hỏi" description="Chỉ kiểm tra cấu trúc câu hỏi khảo sát" disabled={!sourceReady(source, "questionnaire")} />
                  </Stack>
                </Radio.Group>
              </>
            )}

            <Paper p="sm" withBorder bg="var(--mantine-color-gray-0)">
              <Stack gap={4}>
                <Text size="xs" fw={600}>Hệ thống AI sẽ phân tích:</Text>
                {(!isCp2 || source !== "files") && <Text size="xs" c="dimmed">• Các câu trả lời trong mẫu {stage.name}</Text>}
                {(!isCp2 || source !== "answers") && <Text size="xs" c="dimmed">• Tài liệu tệp đính kèm bạn đã tải lên giai đoạn này</Text>}
                {stage.code === "CP2" && <Text size="xs" c="dimmed">• Tóm tắt ý tưởng ở giai đoạn trước</Text>}
              </Stack>
            </Paper>

            {isCp2 && source === "answers" && !hasFiles && (
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
                  disabled={!canConfirm}
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
