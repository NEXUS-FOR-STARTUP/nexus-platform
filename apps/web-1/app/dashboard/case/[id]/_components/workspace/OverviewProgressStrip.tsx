"use client";

import { Badge, Group, Paper, Stack, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import { ArrowRight, Banknote, Check, Lightbulb, Package, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { STAGES } from "@app/shared/stages";
import type { StageSummary } from "../../hooks/useStageSummaries";

interface OverviewProgressStripProps {
  caseId: string;
  stages?: StageSummary[];
}

const STAGE_META: Record<string, { icon: typeof Lightbulb; description: string }> = {
  "y-tuong": {
    icon: Lightbulb,
    description: "Làm rõ ý tưởng, khách hàng mục tiêu và giá trị cốt lõi của dự án.",
  },
  "thi-truong": {
    icon: Users,
    description: "Phân tích quy mô thị trường, đối thủ và bằng chứng nhu cầu có thật.",
  },
  "san-pham-mo-hinh": {
    icon: Package,
    description: "Định hình sản phẩm, cách vận hành và lộ trình phát triển.",
  },
  "goi-von-tai-chinh": {
    icon: Banknote,
    description: "Chuẩn bị số liệu tài chính, kế hoạch gọi vốn và định giá.",
  },
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  not_started: { label: "Chưa bắt đầu", color: "gray" },
  drafting: { label: "Đang soạn", color: "blue" },
  files_submitted: { label: "Đã nộp tài liệu", color: "cyan" },
  grading: { label: "Đang chấm", color: "orange" },
  has_result: { label: "Đã có kết quả", color: "green" },
};

export default function OverviewProgressStrip({ caseId, stages }: OverviewProgressStripProps) {
  const router = useRouter();
  const summaryByCode = new Map(stages?.map((s) => [s.checkpoint_code, s]));

  return (
    <Paper p="md" withBorder radius="md">
      <Text fw={600} size="sm" mb="sm">Hành trình 4 giai đoạn</Text>
      <Stack gap="sm">
        {STAGES.map((stage, index) => {
          const summary = summaryByCode.get(stage.code);
          const status = summary?.status ?? "not_started";
          const meta = STAGE_META[stage.slug] ?? STAGE_META["y-tuong"];
          const statusMeta = STATUS_LABEL[status] ?? STATUS_LABEL.not_started;
 
          const done = status === "has_result";
          const view = status === "has_result" || status === "grading" ? "results" : "draft";

          return (
            <UnstyledButton
              key={stage.code}
              disabled={!stage.available}
              onClick={() => router.push(`/dashboard/case/${caseId}?tab=journey&stage=${stage.slug}&view=${view}`)}
              style={{ width: "100%", textAlign: "left", opacity: stage.available ? 1 : 0.6 }}
            >
              <Group gap="sm" wrap="nowrap" align="flex-start">
                <ThemeIcon
                  size="lg"
                  radius="xl"
                  variant={done ? "filled" : "light"}
                  color={done ? "green" : stage.available ? "blue" : "gray"}
                >
                  {done ? <Check size={16} /> : <Text size="sm" fw={700}>{index + 1}</Text>}
                </ThemeIcon>
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs" wrap="wrap">
                    <Text fw={600} size="sm">{stage.name}</Text>
                    <Badge size="sm" variant={done ? "filled" : "light"} color={stage.available ? statusMeta.color : "gray"}>
                      {stage.available ? statusMeta.label : "Sắp ra mắt"}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">{meta.description}</Text>
                  {summary && (
                    <Text size="xs" c="dimmed">
                      Đã trả lời {summary.answered_count} câu, nộp {summary.file_count} tài liệu
                    </Text>
                  )}
                </Stack>
                {stage.available && <ArrowRight size={16} className="text-gray-400 shrink-0 mt-1" />}
              </Group>
            </UnstyledButton>
          );
        })}
      </Stack>
    </Paper>
  );
}
