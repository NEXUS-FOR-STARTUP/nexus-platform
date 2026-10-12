"use client";

import { Paper, Stack, Group, Text, Badge, Button, ThemeIcon } from "@mantine/core";
import {
  ArrowRight,
  Lock,
  Lightbulb,
  Users,
  Package,
  Banknote,
  CheckCircle2,
} from "lucide-react";
import type { StageDefinition } from "@app/shared/stages";
import { TEMPLATE_REGISTRY, type TemplateKey } from "@repo/validation";
import type { StageSummary } from "../../hooks/useStageSummaries";

interface StageCardProps {
  stage: StageDefinition;
  summary?: StageSummary;
  creditsRemaining: number;
  onOpen: () => void;
}

const STAGE_META: Record<
  string,
  {
    icon: React.ElementType;
    color: string;
    lightBg: string;
    description: string;
  }
> = {
  "y-tuong": {
    icon: Lightbulb,
    color: "var(--mantine-color-blue-6)",
    lightBg: "var(--mantine-color-blue-0)",
    description: "Làm rõ ý tưởng, đối tượng khách hàng và giá trị cốt lõi.",
  },
  "thi-truong": {
    icon: Users,
    color: "var(--mantine-color-violet-6)",
    lightBg: "var(--mantine-color-violet-0)",
    description: "Phân tích thị trường, đối thủ và xác thực nhu cầu.",
  },
  "san-pham-mo-hinh": {
    icon: Package,
    color: "var(--mantine-color-orange-6)",
    lightBg: "var(--mantine-color-orange-0)",
    description: "Định hình sản phẩm, mô hình vận hành và lộ trình phát triển.",
  },
  "goi-von-tai-chinh": {
    icon: Banknote,
    color: "var(--mantine-color-teal-6)",
    lightBg: "var(--mantine-color-teal-0)",
    description: "Chuẩn bị tài chính, kế hoạch gọi vốn và định giá.",
  },
};

const STATUS_META: Record<
  string,
  {
    label: string;
    color: string;
  }
> = {
  not_started: { label: "Chưa bắt đầu", color: "gray" },
  drafting: { label: "Đang soạn", color: "blue" },
  files_submitted: { label: "Đã nộp tệp", color: "cyan" },
  grading: { label: "Đang chấm", color: "orange" },
  has_result: { label: "Đã có kết quả", color: "green" },
};

export default function StageCard({
  stage,
  summary,
  creditsRemaining,
  onOpen,
}: StageCardProps) {
  const isAvailable = stage.available;
  const meta = STAGE_META[stage.slug] ?? STAGE_META["y-tuong"];
  const StageIcon = meta.icon;
  const status = summary?.status ?? "not_started";
  const statusInfo = STATUS_META[status] ?? STATUS_META.not_started;
  const stageNumber = stage.code.replace("CP", "").padStart(2, "0");
  const isDone = status === "has_result";

  const ctaLabel = isDone
    ? "Xem đánh giá"
    : status === "grading"
      ? "Vào xem"
      : status === "files_submitted"
        ? "Vào xem"
        : status === "drafting"
          ? "Tiếp tục soạn"
          : "Bắt đầu soạn";

  return (
    <Paper
      p="lg"
      radius="md"
      className={`stage-card relative overflow-hidden transition-colors duration-200 ${
        isAvailable ? "hover:border-opacity-80" : "opacity-70"
      }`}
      style={{
        ["--stage-color" as string]: isAvailable ? meta.color : "var(--mantine-color-gray-3)",
        backgroundColor: isAvailable ? "var(--mantine-color-white)" : "var(--mantine-color-gray-0)",
      }}
    >
      <Stack justify="space-between" h="100%" gap="md">
        <Stack gap="sm">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon
              size="xl"
              radius="xl"
              styles={{
                root: {
                  backgroundColor: meta.lightBg,
                  color: meta.color,
                  border: `2px solid ${meta.color}`,
                },
              }}
            >
              <StageIcon size={24} />
            </ThemeIcon>

            <div>
              <Group gap={6} align="center">
                <Text fw={800} size="lg" c={meta.color}>
                  {stageNumber}
                </Text>
                <Text fw={700} size="md" lh={1.3}>
                  {stage.name}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {isAvailable ? meta.description : "Sẵn sàng khi bạn hoàn thành các giai đoạn trước."}
              </Text>
            </div>
          </Group>

          {isAvailable && (
            <Stack gap={0}>
              <Text size="xs" c="dimmed">
                <Text span fw={600} c="dark">
                  {summary?.answered_count ?? 0}/
                  {TEMPLATE_REGISTRY[stage.templateKey as TemplateKey]?.phases.flatMap((p) => p.questions).length ?? 0}
                </Text>{" "}
                câu đã trả lời
              </Text>
              <Text size="xs" c="dimmed">
                <Text span fw={600} c="dark">{summary?.file_count ?? 0}</Text> tài liệu
              </Text>
              <Text size="xs" c="dimmed">
                Còn <Text span fw={700} c={creditsRemaining === 0 ? "red.7" : "blue.7"}>{creditsRemaining}</Text> lượt chấm
              </Text>
            </Stack>
          )}
        </Stack>

        <Group justify="space-between" align="center">
          {isAvailable ? (
            <Badge color={statusInfo.color} variant="filled" size="sm" className="whitespace-nowrap">
              {statusInfo.label}
            </Badge>
          ) : (
            <Badge color="gray" variant="outline" size="sm" leftSection={<Lock size={12} />} className="whitespace-nowrap">
              Sắp ra mắt
            </Badge>
          )}
          {isAvailable ? (
            <Button
              size="sm"
              variant={isDone ? "outline" : "filled"}
              color={isDone ? "green" : "blue"}
              rightSection={isDone ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
              onClick={onOpen}
            >
              {ctaLabel}
            </Button>
          ) : (
            <Button size="sm" variant="default" disabled>
              Chưa mở
            </Button>
          )}
        </Group>

      </Stack>
    </Paper>
  );
}
