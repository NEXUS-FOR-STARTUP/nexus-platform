"use client";

import { ActionIcon, Badge, Menu, Table, Tooltip } from "@mantine/core";
import { Warning as AlertTriangle, Money as Banknote, Link as Link2, DotsThree as MoreHorizontal, Prohibit as Ban } from "@phosphor-icons/react";
import { RECEIVABLE_STATUS_LABELS, type AdminReceivable, type ReceivableStatus } from "@repo/validation";
import { formatDateTime, formatVnd } from "./format";

const STATUS_COLOR: Record<ReceivableStatus, string> = {
  open: "gray",
  partial: "orange",
  overdue: "red",
  settled: "green",
  written_off: "dark",
};

export type ReceivableAction = "link" | "payment" | "write-off";

interface ReceivablesTableProps {
  items: AdminReceivable[];
  onAction: (action: ReceivableAction, receivable: AdminReceivable) => void;
}

export default function ReceivablesTable({ items, onAction }: ReceivablesTableProps) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-text-muted">Chưa có khoản nào khách còn nợ bạn.</p>;
  }

  return (
    <Table verticalSpacing="sm" highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Mã khoản</Table.Th>
          <Table.Th>Khách</Table.Th>
          <Table.Th>Dự án</Table.Th>
          <Table.Th ta="right">Tổng phải thu</Table.Th>
          <Table.Th ta="right">Khách đã trả</Table.Th>
          <Table.Th ta="right">Khách còn nợ</Table.Th>
          <Table.Th>Hạn trả</Table.Th>
          <Table.Th>Trạng thái</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((r) => {
          const closed = r.status === "settled" || r.status === "written_off";
          return (
            <Table.Tr key={r.id}>
              <Table.Td>
                <div className="flex items-center gap-1.5 font-mono font-semibold">
                  {r.code}
                  {r.review_reason ? (
                    <Tooltip label={`Cần kiểm tra: ${r.review_reason}`} withArrow multiline maw={280}>
                      <span className="text-warning" aria-label="Cần kiểm tra">
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                    </Tooltip>
                  ) : null}
                </div>
              </Table.Td>
              <Table.Td>
                <div className="font-medium">{r.customer_name}</div>
                {r.customer_phone || r.customer_email ? (
                  <>
                    {r.customer_phone ? <div className="text-xs text-text-muted">{r.customer_phone}</div> : null}
                    {r.customer_email ? <div className="text-xs text-text-muted">{r.customer_email}</div> : null}
                  </>
                ) : (
                  <div className="text-xs text-text-muted">{r.customer_contact}</div>
                )}
              </Table.Td>
              <Table.Td>{r.case_code ?? "—"}</Table.Td>
              <Table.Td ta="right">{formatVnd(r.amount_due)}</Table.Td>
              <Table.Td ta="right">{formatVnd(r.paid)}</Table.Td>
              <Table.Td ta="right" fw={600}>
                {formatVnd(r.outstanding)}
                {r.overpaid > 0 ? (
                  <div className="text-xs font-normal text-warning">Khách trả dư {formatVnd(r.overpaid)}</div>
                ) : null}
              </Table.Td>
              <Table.Td>{formatDateTime(r.due_at)}</Table.Td>
              <Table.Td>
                <Badge color={STATUS_COLOR[r.status]} variant="light" size="md">
                  {RECEIVABLE_STATUS_LABELS[r.status]}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Menu position="bottom-end" withinPortal>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Thao tác với khoản này">
                      <MoreHorizontal className="h-4 w-4" />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<Link2 className="h-4 w-4" />} onClick={() => onAction("link", r)}>
                      {r.has_payment_link ? "Xem link & QR gửi khách" : "Tạo link & QR gửi khách"}
                    </Menu.Item>
                    <Menu.Item leftSection={<Banknote className="h-4 w-4" />} disabled={closed} onClick={() => onAction("payment", r)}>
                      Ghi nhận khách đã chuyển
                    </Menu.Item>
                    <Menu.Item color="red" leftSection={<Ban className="h-4 w-4" />} disabled={closed} onClick={() => onAction("write-off", r)}>
                      Xoá nợ (không thu nữa)
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
