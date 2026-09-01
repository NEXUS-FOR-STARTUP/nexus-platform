"use client";

import { useState, useMemo } from "react";
import {
  Paper,
  Table,
  Badge,
  Text,
  Skeleton,
  Button,
  Center,
  Stack,
  Divider,
  Group,
  Select,
} from "@mantine/core";
import { ExternalLink, Image as ImageIcon, FileText } from "lucide-react";
import { useMyDeposits } from "../hooks/useWallet";
import { depositDetailHref } from "@/lib/deposit-display";
import { WalletRowDetailAction } from "./WalletRowDetailAction";
import { formatVND, formatDateTime } from "./wallet-transaction.types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Đang chờ xác minh", color: "orange" },
  verified: { label: "Đã vào ví", color: "green" },
  rejected: { label: "Từ chối", color: "red" },
  amount_mismatch: { label: "Sai số tiền", color: "yellow" },
};

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Đang chờ xác minh" },
  { value: "verified", label: "Đã vào ví" },
  { value: "rejected", label: "Từ chối" },
  { value: "amount_mismatch", label: "Sai số tiền" },
];

export function WalletProofTable() {
  const { data, isLoading, isFetching, isError, refetch } = useMyDeposits();
  const [statusFilter, setStatusFilter] = useState<string | null>("all");
  const rawDeposits = data?.deposits;
  const deposits = useMemo(() => rawDeposits ?? [], [rawDeposits]);

  const filteredDeposits = useMemo(() => {
    if (!statusFilter || statusFilter === "all") {
      return deposits;
    }
    return deposits.filter((d) => d.status === statusFilter);
  }, [deposits, statusFilter]);
  const hasActiveFilter = statusFilter && statusFilter !== "all";

  return (
    <Paper withBorder radius="md" className="bg-surface-app overflow-hidden">
      {/* Filter and Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-border-app bg-surface-app">
        <Group
          gap="sm"
          wrap="nowrap"
          justify="flex-end"
          className="w-full sm:w-auto sm:ml-auto"
        >
          <Select
            data={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val || "all")}
            placeholder="Tất cả trạng thái"
            clearable={false}
            size="sm"
            w={220}
            aria-label="Lọc theo trạng thái"
          />

          <Button
            variant="subtle"
            color="gray"
            size="sm"
            onClick={() => refetch()}
            loading={isFetching}
            className="text-base font-medium"
          >
            Làm mới
          </Button>
        </Group>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={38} radius="sm" />
          ))}
        </div>
      ) : isError ? (
        <Center p="xl">
          <Stack align="center" gap="sm">
            <Text className="text-text-app text-base">
              Không thể tải danh sách ảnh minh chứng.
            </Text>
            <Button
              size="sm"
              variant="default"
              onClick={() => refetch()}
              className="text-base"
            >
              Thử lại
            </Button>
          </Stack>
        </Center>
      ) : deposits.length === 0 ? (
        <Center p="xl">
          <Stack align="center" gap="sm" ta="center">
            <Text fw={500} className="text-text-app text-base">
              Chưa có ảnh minh chứng đã gửi
            </Text>
            <Text c="dimmed" className="text-base">
              Các giao dịch nạp tiền có gửi ảnh chứng minh sẽ hiển thị tại đây.
            </Text>
          </Stack>
        </Center>
      ) : filteredDeposits.length === 0 ? (
        <Center p="xl">
          <Stack align="center" gap="sm" ta="center">
            <Text fw={500} className="text-text-app text-base">
              Không có ảnh minh chứng phù hợp
            </Text>
            <Text c="dimmed" className="text-base">
              Thử chuyển bộ lọc để tìm kiếm các ảnh minh chứng khác.
            </Text>
            <Button
              size="sm"
              variant="subtle"
              color="gray"
              onClick={() => setStatusFilter("all")}
              className="text-base"
            >
              Xem tất cả ảnh minh chứng
            </Button>
          </Stack>
        </Center>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table.ScrollContainer minWidth={820}>
              <Table
                highlightOnHover
                verticalSpacing="sm"
                horizontalSpacing="md"
                className="w-full"
              >
                <Table.Thead className="bg-surface-soft/40 border-b border-border-app">
                  <Table.Tr>
                    <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[160px]">
                      Thời gian
                    </Table.Th>
                    <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[170px]">
                      Mã chuyển khoản
                    </Table.Th>
                    <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[200px] whitespace-nowrap">
                      Ảnh minh chứng
                    </Table.Th>
                    <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[180px]">
                      Trạng thái
                    </Table.Th>
                    <Table.Th
                      ta="right"
                      style={{ textAlign: "right" }}
                      className="text-base font-medium text-text-muted py-3.5 w-[160px]"
                    >
                      Số tiền nạp
                    </Table.Th>
                    <Table.Th
                      ta="center"
                      className="whitespace-nowrap px-2 py-3.5 text-base font-medium text-text-muted"
                      style={{ width: 1 }}
                    >
                      Chi tiết
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredDeposits.map((deposit) => {
                    const { date, time } = formatDateTime(deposit.created_at);
                    const statusInfo = STATUS_LABELS[deposit.status] ?? {
                      label: deposit.status,
                      color: "gray",
                    };
                    const depositHref = depositDetailHref(deposit.id);

                    return (
                      <Table.Tr
                        key={deposit.id}
                        className="transition-colors hover:bg-surface-soft/60"
                      >
                        {/* Time */}
                        <Table.Td className="py-3.5">
                          <Text className="font-medium text-text-app leading-tight text-base">
                            {date}
                          </Text>
                          <Text c="dimmed" className="mt-0.5 text-base">
                            {time}
                          </Text>
                        </Table.Td>

                        {/* Transfer Content */}
                        <Table.Td className="py-3.5">
                          <Text className="font-mono text-sm font-medium text-text-app">
                            {deposit.transfer_content}
                          </Text>
                        </Table.Td>

                        {/* Proof Link */}
                        <Table.Td className="py-3.5 whitespace-nowrap">
                          {deposit.proof_file_url ? (
                            <a
                              href={
                                deposit.proof_file_url.startsWith("http")
                                  ? deposit.proof_file_url
                                  : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${deposit.proof_file_url}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                              className="whitespace-nowrap font-semibold text-brand hover:underline text-base shrink-0"
                            >
                              {deposit.proof_file_url.toLowerCase().endsWith(".pdf") ? (
                                <FileText className="w-4 h-4 shrink-0 text-brand" />
                              ) : (
                                <ImageIcon className="w-4 h-4 shrink-0 text-brand" />
                              )}
                              <span className="whitespace-nowrap">Xem minh chứng</span>
                              <ExternalLink className="w-3.5 h-3.5 text-text-subtle shrink-0" />
                            </a>
                          ) : (
                            <Text c="dimmed" className="text-base">
                              —
                            </Text>
                          )}
                        </Table.Td>

                        {/* Status Badge */}
                        <Table.Td className="py-3.5">
                          <Badge
                            variant="light"
                            color={statusInfo.color}
                            size="md"
                            radius="xl"
                            className="font-medium text-base normal-case"
                          >
                            {statusInfo.label}
                          </Badge>
                        </Table.Td>

                        {/* Amount */}
                        <Table.Td
                          ta="right"
                          style={{ textAlign: "right" }}
                          className="py-3.5"
                        >
                          <span className="text-base font-semibold tabular-nums text-text-app">
                            {formatVND(deposit.amount)}
                          </span>
                        </Table.Td>

                        {/* Action Column */}
                        <Table.Td
                          ta="center"
                          className="px-2 py-3.5"
                          style={{ width: 1 }}
                        >
                          <div className="flex justify-center">
                            <WalletRowDetailAction href={depositHref} />
                          </div>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-border-app">
            {filteredDeposits.map((deposit) => {
              const { date, time } = formatDateTime(deposit.created_at);
              const statusInfo = STATUS_LABELS[deposit.status] ?? {
                label: deposit.status,
                color: "gray",
              };
              const depositHref = depositDetailHref(deposit.id);

              return (
                <div
                  key={deposit.id}
                  className="p-4 flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge
                        variant="light"
                        color={statusInfo.color}
                        size="md"
                        radius="xl"
                        className="font-medium text-base normal-case"
                      >
                        {statusInfo.label}
                      </Badge>
                      <span className="text-base text-text-muted">
                        {time} · {date}
                      </span>
                    </div>

                    <Text className="font-mono text-sm font-medium text-text-app">
                      {deposit.transfer_content}
                    </Text>

                    {deposit.proof_file_url && (
                      <div className="mt-2">
                        <a
                          href={
                            deposit.proof_file_url.startsWith("http")
                              ? deposit.proof_file_url
                              : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${deposit.proof_file_url}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                          className="whitespace-nowrap font-semibold text-brand hover:underline text-base shrink-0"
                        >
                          {deposit.proof_file_url.toLowerCase().endsWith(".pdf") ? (
                            <FileText className="w-4 h-4 shrink-0 text-brand" />
                          ) : (
                            <ImageIcon className="w-4 h-4 shrink-0 text-brand" />
                          )}
                          <span className="whitespace-nowrap">Xem minh chứng</span>
                          <ExternalLink className="w-3.5 h-3.5 text-text-subtle shrink-0" />
                        </a>
                      </div>
                    )}

                    <div className="mt-2">
                      <WalletRowDetailAction href={depositHref} />
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-semibold tabular-nums text-text-app">
                      {formatVND(deposit.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <Divider />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface-app">
            <Text c="dimmed" className="text-base">
              {hasActiveFilter
                ? `Hiển thị ${filteredDeposits.length} trên tổng số ${deposits.length} ảnh minh chứng`
                : `Hiển thị ${deposits.length} ảnh minh chứng gần nhất`}
            </Text>
          </div>
        </>
      )}
    </Paper>
  );
}
