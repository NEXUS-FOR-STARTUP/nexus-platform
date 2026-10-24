"use client";

import { Accordion, Alert, Group, Radio, Stack, Text, Textarea } from "@mantine/core";
import type { Cp2InputSource } from "@app/shared";
import type { AuditScope, AuditStageUi } from "@/lib/audit-stage-ui";

export type RunKind = "initial" | "resubmit";

const SOURCE_LABEL: Record<Cp2InputSource, string> = { both: "Cả câu trả lời và tài liệu", answers: "Chỉ câu trả lời", files: "Chỉ tài liệu" };
const SCOPE_LABEL: Record<AuditScope, string> = { full: "Đánh giá toàn diện", questionnaire: "Chỉ soát bảng hỏi" };
const CHANGE_SUMMARY_MAX = 5000;
const USER_NOTE_MAX = 2000;

interface AuditStepOptionsProps {
  ui: AuditStageUi;
  scope: AuditScope;
  source: Cp2InputSource;
  submissionType: RunKind;
  hasFiles: boolean;
  /** CP1: a previous result exists to compare against. */
  canResubmit: boolean;
  sourceReady: (src: Cp2InputSource, sc: AuditScope) => boolean;
  changeSummary: string;
  userNote: string;
  creditsRemaining: number;
  onSourceChange: (value: Cp2InputSource) => void;
  onScopeChange: (value: AuditScope) => void;
  onKindChange: (value: RunKind) => void;
  onChangeSummary: (value: string) => void;
  onUserNote: (value: string) => void;
}

/** Step 2: how to grade (CP2 accordion of 4 choices) and the credit cost line. */
export default function AuditStepOptions({
  ui, scope, source, submissionType, hasFiles, canResubmit, sourceReady, changeSummary, userNote, creditsRemaining,
  onSourceChange, onScopeChange, onKindChange, onChangeSummary, onUserNote,
}: AuditStepOptionsProps) {
  const sourceBased = ui.sourceBased;
  // Source-based stages re-grade only at full scope; CP1 only once a previous result exists to compare against.
  const resubmitBlocked = sourceBased ? scope !== "full" : !canResubmit;
  const resubmitHint = sourceBased
    ? scope === "full" ? "Đối chiếu với kết quả lần trước" : "Chỉ có ở chấm toàn diện"
    : canResubmit ? "Đối chiếu với kết quả lần trước" : "Chưa có kết quả trước để đối chiếu";
  const newRunHint = sourceBased ? "Không đối chiếu bản cũ" : "Đọc lại toàn bộ tài liệu hiện có, hợp khi lần trước thiếu tệp";
  const kindItem = (
    <Accordion.Item value="kind">
      <Accordion.Control>Lần chấm này <Text span size="sm" c="dimmed">- {submissionType === "resubmit" ? "Chấm lại" : "Chấm mới"}</Text></Accordion.Control>
      <Accordion.Panel>
        <Radio.Group value={submissionType} onChange={(value) => onKindChange(value as RunKind)}>
          <Stack gap="xs">
            <Radio value="initial" label="Chấm mới từ đầu" description={newRunHint} />
            <Radio value="resubmit" label="Chấm lại sau khi sửa" description={resubmitHint} disabled={resubmitBlocked} />
          </Stack>
        </Radio.Group>
        {submissionType === "resubmit" && (
          <Textarea
            mt="sm"
            label="Bạn đã sửa gì"
            placeholder={ui.changePlaceholder}
            value={changeSummary}
            onChange={(e) => onChangeSummary(e.currentTarget.value)}
            minRows={2}
            maxLength={CHANGE_SUMMARY_MAX}
          />
        )}
      </Accordion.Panel>
    </Accordion.Item>
  );
  const noteItem = (
    <Accordion.Item value="note">
      <Accordion.Control>Ghi chú thêm <Text span size="sm" c="dimmed">- {userNote.trim() ? "đã viết" : "không bắt buộc"}</Text></Accordion.Control>
      <Accordion.Panel>
        <Textarea placeholder={ui.notePlaceholder} value={userNote} onChange={(e) => onUserNote(e.currentTarget.value)} minRows={2} maxLength={USER_NOTE_MAX} />
      </Accordion.Panel>
    </Accordion.Item>
  );

  return (
    <>
      <Text fw={500}>Bước 2/2: chọn cách chấm và xác nhận</Text>
      {sourceBased && (
        <Accordion variant="separated" radius="md" defaultValue="source">
          <Accordion.Item value="source">
            <Accordion.Control>Chấm gì <Text span size="sm" c="dimmed">- {SOURCE_LABEL[source]}</Text></Accordion.Control>
            <Accordion.Panel>
              <Radio.Group value={source} onChange={(value) => onSourceChange(value as Cp2InputSource)}>
                <Stack gap="xs">
                  <Radio value="both" label="Cả câu trả lời và tài liệu" description="Đối chiếu lời trả lời với tệp bạn nộp" disabled={!sourceReady("both", scope)} />
                  <Radio value="answers" label="Chỉ câu trả lời" description="Hợp khi chưa có tài liệu riêng" disabled={!sourceReady("answers", scope)} />
                  <Radio value="files" label="Chỉ tài liệu" description="Hợp khi tài liệu đã chi tiết" disabled={!hasFiles} />
                </Stack>
              </Radio.Group>
            </Accordion.Panel>
          </Accordion.Item>

          {ui.scopes.length > 1 && (
          <Accordion.Item value="scope">
            <Accordion.Control>Chấm tới đâu <Text span size="sm" c="dimmed">- {SCOPE_LABEL[scope]}</Text></Accordion.Control>
            <Accordion.Panel>
              <Radio.Group value={scope} onChange={(value) => onScopeChange(value as AuditScope)}>
                <Stack gap="xs">
                  <Radio value="full" label="Toàn diện (Đề xuất)" description="Bảng hỏi, phỏng vấn, khảo sát (nếu có) và bằng chứng" disabled={!sourceReady(source, "full")} />
                  <Radio value="questionnaire" label="Chỉ soát bảng hỏi" description="Cấu trúc câu hỏi khảo sát" disabled={!sourceReady(source, "questionnaire")} />
                </Stack>
              </Radio.Group>
            </Accordion.Panel>
          </Accordion.Item>
          )}

          {kindItem}

          {noteItem}
        </Accordion>
      )}

      {!sourceBased && (
        <Accordion variant="separated" radius="md" defaultValue="kind">
          {kindItem}
          {noteItem}
        </Accordion>
      )}

      {sourceBased && source === "answers" && !hasFiles && (
        <Alert color="yellow" title="Chấm khi thiếu tệp">
          Vẫn chấm được theo lời nhóm mô tả, nhưng các tiêu chí thiếu bằng chứng sẽ bị đánh giá thấp.
        </Alert>
      )}
      {ui.scopeNote && (
        <Alert color="blue" variant="light" title="Phạm vi chấm">
          {ui.scopeNote}
        </Alert>
      )}

      <Group justify="space-between">
        <Text size="sm">Chi phí:</Text>
        <Text size="sm" fw={500} c="blue">Tốn 1 lượt - còn lại {Math.max(creditsRemaining - 1, 0)} sau lần chấm này</Text>
      </Group>
    </>
  );
}
