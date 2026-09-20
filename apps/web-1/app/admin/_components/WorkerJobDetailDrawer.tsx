"use client";

import { Drawer, Tabs, Stepper, Text, Badge, Group, Paper, Stack, Button, SimpleGrid, CopyButton, ActionIcon, Tooltip } from "@mantine/core";
import { Bot, FileText, Download, AlertCircle, ExternalLink, Activity, Info, Code2, Copy, Check } from "lucide-react";
import { useAdminWorkerJobDetail } from "../hooks/useAdminWorkers";
import WorkerJobTerminal from "./WorkerJobTerminal";

interface WorkerJobDetailDrawerProps {
  jobId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return "0 B";
  return bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
}

function getStep(m?: { sandboxReady: boolean; triadPacket: boolean; auditReport: boolean; reportJson: boolean }) {
  if (!m || !m.sandboxReady) return 0;
  if (!m.triadPacket) return 1;
  if (!m.auditReport) return 2;
  return !m.reportJson ? 3 : 4;
}

export default function WorkerJobDetailDrawer({ jobId, isOpen, onClose }: WorkerJobDetailDrawerProps) {
  const { data: job, isLoading } = useAdminWorkerJobDetail(jobId);

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      position="right"
      size="xl"
      title={
        <div className="w-full pr-4 space-y-1.5">
          <Group gap="xs" wrap="wrap" align="center">
            <Bot className="w-5 h-5 text-brand shrink-0" />
            <Text fw={600} className="font-heading text-sm">
              Tiến trình AI: {job?.caseCode ?? "..."}
            </Text>
            <Badge size="xs" color="cyan" variant="light" className="font-mono">
              Lần chạy thứ {job?.attemptNo || 1}
            </Badge>
          </Group>
          {job?.id && (
            <Group gap={6} align="center">
              <Text size="xs" c="dimmed">Job ID:</Text>
              <Text
                size="xs"
                fw={600}
                className="font-mono text-text-app select-all cursor-pointer hover:text-brand transition-colors"
                title="Click để copy Job ID"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(job.id);
                  }
                }}
              >
                {job.id}
              </Text>
              <CopyButton value={job.id} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? "Đã copy Job ID!" : "Copy Job ID"} withArrow position="top">
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color={copied ? "teal" : "gray"}
                      onClick={copy}
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          )}
        </div>
      }
    >
      {isLoading || !job ? (
        <Text size="xs" c="dimmed" p="md">Đang tải chi tiết tiến trình...</Text>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<Activity className="w-3.5 h-3.5" />}>Tổng quan</Tabs.Tab>
            <Tabs.Tab value="inputs" leftSection={<FileText className="w-3.5 h-3.5" />}>Đầu vào</Tabs.Tab>
            <Tabs.Tab value="outputs" leftSection={<Info className="w-3.5 h-3.5" />}>Kết quả & Báo cáo</Tabs.Tab>
            <Tabs.Tab value="logs" leftSection={<Code2 className="w-3.5 h-3.5" />}>Nhật ký</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" className="space-y-4 pt-2">
            <Paper p="sm" radius="md" withBorder className="border-border-app bg-surface-app">
              <Text size="xs" fw={600} mb="xs" c="dimmed">TIẾN TRÌNH CÁC CỘT MỐC (MILESTONES)</Text>
              <Stepper active={getStep(job.milestones)} size="xs" color="blue">
                <Stepper.Step label="Sandbox" description="Môi trường" />
                <Stepper.Step label="Triad Packet" description="Thu thập" />
                <Stepper.Step label="Audit OMP" description="Thẩm định" />
                <Stepper.Step label="Báo cáo" description="Xuất dữ liệu" />
              </Stepper>
            </Paper>

            <Paper p="sm" radius="md" withBorder className="border-border-app bg-surface-app">
              <SimpleGrid cols={2} spacing="xs">
                <div>
                  <Text size="xs" c="dimmed">Mã Job (ID):</Text>
                  <Text size="xs" fw={600} className="font-mono text-text-app truncate" title={job.id}>
                    {job.id}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Lần chạy & Loại nộp:</Text>
                  <Group gap={4} mt={2}>
                    <Badge size="xs" color="cyan" variant="light" className="font-mono">
                      Lần chạy thứ {job.attemptNo || 1}
                    </Badge>
                    <Text size="xs" c="dimmed" className="capitalize">
                      {job.submissionType}
                    </Text>
                  </Group>
                </div>
                <div><Text size="xs" c="dimmed">Mã hồ sơ:</Text><Text size="xs" fw={600} className="font-mono text-brand">{job.caseCode}</Text></div>
                <div><Text size="xs" c="dimmed">Trạng thái:</Text><Badge size="xs" color={job.status === "completed" ? "green" : job.status === "processing" ? "blue" : job.status === "failed" ? "red" : "gray"}>{job.status}</Badge></div>
                <div><Text size="xs" c="dimmed">Sinh viên:</Text><Text size="xs" fw={500}>{job.student?.name ? `${job.student.name} (${job.student.email})` : "Chưa có thông tin"}</Text></div>
                <div><Text size="xs" c="dimmed">Model & Prompt:</Text><Text size="xs" className="font-mono">{job.model} ({job.promptMode})</Text></div>
                <div><Text size="xs" c="dimmed">Bắt đầu lúc:</Text><Text size="xs" suppressHydrationWarning>{job.startedAt ? new Date(job.startedAt).toLocaleString("vi-VN") : "-"}</Text></div>
                <div><Text size="xs" c="dimmed">Thời lượng:</Text><Text size="xs" fw={600}>{typeof job.durationMs === "number" && !isNaN(job.durationMs) ? `${(job.durationMs / 1000).toFixed(1)}s` : "-"}</Text></div>
              </SimpleGrid>
            </Paper>

            {job.failedReason && (
              <Paper p="sm" radius="md" withBorder className="border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400">
                <Group gap="xs"><AlertCircle className="w-4 h-4 shrink-0" /><Text size="xs" fw={600}>Nguyên nhân thất bại:</Text></Group>
                <Text size="xs" className="mt-1 font-mono whitespace-pre-wrap">{job.failedReason}</Text>
              </Paper>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="inputs" className="space-y-4 pt-2">
            <Paper p="sm" radius="md" withBorder className="border-border-app bg-surface-app">
              <Text size="xs" fw={600} mb="xs" c="dimmed">DANH SÁCH FILE NỘP ({job.inputFiles?.length ?? 0})</Text>
              {!job.inputFiles?.length ? <Text size="xs" c="dimmed">Không có file nộp trong sandbox.</Text> : (
                <Stack gap="xs">
                  {job.inputFiles.map((f) => (
                    <Group key={f.name} justify="space-between" p="xs" className="border border-border-app rounded">
                      <Group gap="xs"><FileText className="w-4 h-4 text-brand" /><Text size="xs" fw={500}>{f.name}</Text></Group>
                      <Group gap="xs">
                        <Badge size="xs" variant="light" color="gray">{formatBytes(f.sizeBytes)}</Badge>
                        {f.downloadPath && (
                          <Button size="compact-xs" variant="subtle" leftSection={<Download className="w-3 h-3" />} component="a" href={f.downloadPath} download>Tải</Button>
                        )}
                      </Group>
                    </Group>
                  ))}
                </Stack>
              )}
            </Paper>
            {job.inputSnapshot?.idea && (
              <Paper p="sm" radius="md" withBorder className="border-border-app bg-surface-app">
                <Text size="xs" fw={600} mb="xs" c="dimmed">SNAPSHOT Ý TƯỞNG ĐỀ ÁN</Text>
                <pre className="p-2 rounded text-xs font-mono bg-surface-app-soft overflow-x-auto whitespace-pre-wrap max-h-60">
                  {JSON.stringify(job.inputSnapshot.idea, null, 2)}
                </pre>
              </Paper>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="outputs" className="space-y-4 pt-2">
            {job.reportSummary ? (
              <Paper p="sm" radius="md" withBorder className="border-border-app bg-surface-app space-y-3">
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed">Điểm đánh giá tổng hợp</Text>
                    <Text size="xl" fw={700} className="font-heading text-brand">{job.reportSummary.overallScore ?? "Chưa có"}/100</Text>
                  </div>
                  {(job.reportSummary.pdfUrl || job.reportSummary.id) && (
                    <Button
                      size="xs"
                      variant="light"
                      color="blue"
                      leftSection={<ExternalLink className="w-3.5 h-3.5" />}
                      component="a"
                      href={
                        job.reportSummary.id
                          ? `/api/reports/${job.reportSummary.id}/download?view=inline`
                          : job.reportSummary.pdfUrl || ""
                      }
                      target="_blank"
                    >
                      Mở Báo cáo PDF A4
                    </Button>
                  )}
                </Group>
                {job.reportSummary.scores && (
                  <div>
                    <Text size="xs" fw={600} mb="xs" c="dimmed">ĐIỂM 5 TIÊU CHÍ RUBRIC</Text>
                    <SimpleGrid cols={2} spacing="xs">
                      {Object.entries(job.reportSummary.scores).map(([k, v]) => (
                        <div key={k} className="p-2 border border-border-app rounded flex justify-between">
                          <Text size="xs" className="capitalize">{k}:</Text><Text size="xs" fw={700}>{v}</Text>
                        </div>
                      ))}
                    </SimpleGrid>
                  </div>
                )}
              </Paper>
            ) : <Text size="xs" c="dimmed">Chưa có kết quả báo cáo thẩm định.</Text>}

            {job.outputFiles?.length > 0 && (
              <Paper p="sm" radius="md" withBorder className="border-border-app bg-surface-app">
                <Text size="xs" fw={600} mb="xs" c="dimmed">FILE KẾT QUẢ ĐẦU RA ({job.outputFiles.length})</Text>
                <Stack gap="xs">
                  {job.outputFiles.map((f) => (
                    <Group key={f.name} justify="space-between" p="xs" className="border border-border-app rounded">
                      <Group gap="xs"><FileText className="w-4 h-4 text-emerald-500" /><Text size="xs" fw={500}>{f.name}</Text></Group>
                      <Badge size="xs" variant="light" color="gray">{formatBytes(f.sizeBytes)}</Badge>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="logs" className="pt-2">
            <WorkerJobTerminal jobId={job.id} isRunning={job.status === "processing"} />
          </Tabs.Panel>
        </Tabs>
      )}
    </Drawer>
  );
}
