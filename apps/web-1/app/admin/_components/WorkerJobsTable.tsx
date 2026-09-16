"use client";

import { useEffect, useState } from "react";
import { Table, Badge, ActionIcon, Tooltip, TextInput, Pagination, Group, Text, Paper } from "@mantine/core";
import { Eye, RotateCcw, Wrench, Square, Search, AlertTriangle } from "lucide-react";
import type { AdminWorkerJobListItem } from "../hooks/useAdminWorkers";

interface WorkerJobsTableProps {
  items: AdminWorkerJobListItem[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onView: (jobId: string) => void;
  onRetry: (job: AdminWorkerJobListItem) => void;
  onHeal: (job: AdminWorkerJobListItem) => void;
  onCancel: (jobId: string) => void;
}

function LiveRunningTimer({ startedAt }: { startedAt: string }) {
  const [mounted, setMounted] = useState(false);
  const startTime = new Date(startedAt).getTime();
  const [elapsed, setElapsed] = useState(() => (!isNaN(startTime) ? Math.max(0, Date.now() - startTime) : 0));

  useEffect(() => {
    setMounted(true);
    if (isNaN(startTime)) return;
    const t = setInterval(() => setElapsed(Math.max(0, Date.now() - startTime)), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  if (!mounted || isNaN(startTime)) {
    return <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">-</span>;
  }
  const sec = Math.floor(elapsed / 1000);
  return (
    <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold" suppressHydrationWarning>
      {Math.floor(sec / 60)}m {sec % 60}s
    </span>
  );
}

function SafeTimeText({ isoString }: { isoString: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return <Text size="xs" c="dimmed">-</Text>;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return <Text size="xs" c="dimmed">-</Text>;
  return <Text size="xs" c="dimmed" suppressHydrationWarning>{d.toLocaleTimeString("vi-VN")}</Text>;
}
function formatDuration(ms: number) {
  if (!ms || ms <= 0) return "-";
  const sec = Math.floor(ms / 1000);
  return sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function StatusBadge({ job }: { job: AdminWorkerJobListItem }) {
  if (job.isStuck) {
    return <Badge color="grape" variant="light" size="sm" leftSection={<AlertTriangle className="w-3 h-3" />}>Nghi kẹt</Badge>;
  }
  if (job.status === "processing") {
    return <Badge color="blue" variant="light" size="sm" leftSection={<span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}>Đang chạy</Badge>;
  }
  if (job.status === "queued") {
    return <Badge color="yellow" variant="light" size="sm" leftSection={<span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}>Chờ xử lý</Badge>;
  }
  if (job.status === "completed") {
    return <Badge color="green" variant="light" size="sm" leftSection={<span className="w-1.5 h-1.5 rounded-full bg-green-500" />}>Thành công</Badge>;
  }
  if (job.status === "failed") {
    return <Badge color="red" variant="light" size="sm" leftSection={<span className="w-1.5 h-1.5 rounded-full bg-red-500" />}>Thất bại</Badge>;
  }
  return <Badge color="gray" variant="light" size="sm">Đã hủy</Badge>;
}

export default function WorkerJobsTable({
  items, total, page, totalPages, isLoading, search,
  onSearchChange, onPageChange, onView, onRetry, onHeal, onCancel,
}: WorkerJobsTableProps) {
  return (
    <Paper p="md" radius="md" withBorder className="border-border-app bg-surface-app space-y-4">
      <Group justify="space-between">
        <TextInput
          placeholder="Tìm mã case, tên đề tài, sinh viên..."
          leftSection={<Search className="w-4 h-4 text-text-muted" />}
          value={search}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          size="xs"
          className="w-80"
        />
        <Text size="xs" c="dimmed">Tổng cộng: <b className="text-text-app">{total}</b> tiến trình</Text>
      </Group>

      <div className="overflow-x-auto">
        <Table verticalSpacing="sm" horizontalSpacing="md" className="font-body text-xs text-text-app">
          <Table.Thead className="bg-surface-app-soft/50 border-b border-border-app">
            <Table.Tr>
              <Table.Th>Mã Case</Table.Th>
              <Table.Th>Đề tài & Sinh viên</Table.Th>
              <Table.Th>Model AI</Table.Th>
              <Table.Th>Thời gian</Table.Th>
              <Table.Th>Trạng thái</Table.Th>
              <Table.Th className="text-right">Thao tác</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr><Table.Td colSpan={6} className="text-center py-8 text-text-muted">Đang tải danh sách tiến trình...</Table.Td></Table.Tr>
            ) : items.length === 0 ? (
              <Table.Tr><Table.Td colSpan={6} className="text-center py-8 text-text-muted">Không tìm thấy tiến trình nào phù hợp</Table.Td></Table.Tr>
            ) : (
              items.map((job) => {
                const isRunning = job.status === "processing";
                const isWaiting = job.status === "queued";
                return (
                  <Table.Tr key={job.id} className="hover:bg-surface-app-soft/40 transition-colors border-b border-border-app/40">
                    <Table.Td>
                      <Text fw={600} className="font-mono text-xs text-brand">{job.caseCode}</Text>
                      <Text size="xs" c="dimmed" className="capitalize">{job.submissionType}</Text>
                    </Table.Td>
                    <Table.Td className="max-w-xs">
                      <Text fw={500} className="truncate">{job.projectName}</Text>
                      <Text size="xs" c="dimmed" className="truncate">{job.studentName} ({job.studentEmail})</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="outline" color="gray" size="xs" className="font-mono">{job.model || "default"}</Badge>
                    </Table.Td>
                    <Table.Td>
                      {isRunning ? <LiveRunningTimer startedAt={job.startedAt} /> : <span>{formatDuration(job.durationMs)}</span>}
                      <SafeTimeText isoString={job.startedAt} />
                    </Table.Td>
                    <Table.Td><StatusBadge job={job} /></Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <Tooltip label="Xem chi tiết">
                          <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => onView(job.id)}>
                            <Eye className="w-4 h-4" />
                          </ActionIcon>
                        </Tooltip>
                        {(job.isStuck || isRunning || isWaiting) && (
                          <Tooltip label="Giải phóng kẹt">
                            <ActionIcon size="sm" variant="subtle" color="orange" onClick={() => onHeal(job)}>
                              <Wrench className="w-4 h-4" />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        {(isRunning || isWaiting) && (
                          <Tooltip label="Hủy tiến trình">
                            <ActionIcon size="sm" variant="subtle" color="red" onClick={() => onCancel(job.id)}>
                              <Square className="w-4 h-4" />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        <Tooltip label="Chạy lại tiến trình">
                          <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => onRetry(job)}>
                            <RotateCcw className="w-4 h-4" />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Group justify="center" pt="xs">
          <Pagination value={page} onChange={onPageChange} total={totalPages} size="sm" />
        </Group>
      )}
    </Paper>
  );
}
