"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Group } from "@mantine/core";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { ideaModeOf } from "@repo/validation";
import { StatusChip } from "@/components/ui/StatusChip";
import { CreateProjectModal } from "../../_components/CreateProjectModal";
import { usePreCp1Save } from "../_hooks/usePreCp1Save";
import type { PreCp1HistoryItem } from "../_hooks/usePreCp1History";
import { ResultView } from "../_components/result/ResultView";
import {
  formatHistoryDate,
  parseHistoryAiResult,
  parseHistoryInput,
  parseHistoryReport,
} from "./historyUtils";
import s from "./history.module.css";

export function HistoryDetailView({
  item,
  onBackAction,
}: {
  item: PreCp1HistoryItem;
  onBackAction: () => void;
}) {
  const router = useRouter();
  const saveMutation = usePreCp1Save();
  const [modalOpen, setModalOpen] = useState(false);

  const input = parseHistoryInput(item.input_snapshot);
  const report = parseHistoryReport(item.report_snapshot, input);
  const aiResult = parseHistoryAiResult(item.team_fit_snapshot);

  if (!input || !report) {
    return (
      <div className={s.page}>
        <div>
          <Button variant="default" size="sm" leftSection={<ArrowLeftIcon size={16} />} onClick={onBackAction}>
            Quay lại danh sách
          </Button>
        </div>
        <div className={s.card}>
          <p className={s.note}>Dữ liệu bản lưu này không còn tương thích để hiển thị.</p>
        </div>
      </div>
    );
  }

  const effectiveMode = ideaModeOf(input);

  const handleCreated = async (createdCaseId: string) => {
    await saveMutation.mutateAsync({
      caseId: createdCaseId,
      reportId: item.id,
      input,
      aiResult: aiResult ?? undefined,
    });
    router.push(`/dashboard/case/${createdCaseId}?tab=overview`);
  };

  return (
    <div className={s.page}>
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Button variant="default" size="sm" leftSection={<ArrowLeftIcon size={16} />} onClick={onBackAction}>
          Quay lại danh sách
        </Button>

        <Group gap="xs" align="center" wrap="wrap">
          <StatusChip tone={item.case ? "ok" : "neutral"}>
            {item.case
              ? `Dự án: ${item.case.team_name || item.case.case_code}`
              : "Chưa gắn dự án"}
          </StatusChip>
          <span className={s.note}>{formatHistoryDate(item.created_at)}</span>
          {item.case ? (
            <Button
              size="sm"
              variant="default"
              rightSection={<ArrowRightIcon size={15} />}
              onClick={() => router.push(`/dashboard/case/${item.case!.id}?tab=overview`)}
            >
              Mở dự án
            </Button>
          ) : (
            <Button
              size="sm"
              color="brand"
              loading={saveMutation.isPending}
              onClick={() => setModalOpen(true)}
            >
              Tạo dự án từ kết quả này
            </Button>
          )}
        </Group>
      </Group>

      <ResultView
        report={report}
        input={input}
        ideaMode={effectiveMode}
        structureIncomplete={input.ideaMode === "structured" && effectiveMode === "draft"}
        aiResult={aiResult}
        aiFailed={false}
        aiLoading={false}
        readOnly
      />

      <CreateProjectModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        initialValues={{
          projectName: (input.madlibs?.projectName ?? "").trim(),
          school: input.school === "fpt" ? "Đại học FPT" : input.schoolName?.trim() || "Khác",
          courseContext: input.course === "exe101" ? "EXE101" : input.courseName?.trim() || "Khác",
        }}
        onCreated={handleCreated}
      />
    </div>
  );
}
