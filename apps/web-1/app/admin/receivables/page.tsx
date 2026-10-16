"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Button, Pagination, Select, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { ArrowLeft, Plus, Search } from "lucide-react";
import {
  RECEIVABLE_STATUSES,
  RECEIVABLE_STATUS_LABELS,
  type AdminReceivable,
  type ReceivableStatus,
} from "@repo/validation";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { useReceivableSystemAccount } from "../hooks/useReceivableCaseOptions";
import { useReceivables } from "../hooks/useReceivables";
import CreateReceivableModal from "./_components/CreateReceivableModal";
import PaymentLinkModal from "./_components/PaymentLinkModal";
import RecordPaymentModal from "./_components/RecordPaymentModal";
import ReceivablesSummary from "./_components/ReceivablesSummary";
import ReceivablesTable, { type ReceivableAction } from "./_components/ReceivablesTable";
import WriteOffModal from "./_components/WriteOffModal";

const STATUS_OPTIONS = RECEIVABLE_STATUSES.map((s) => ({ value: s, label: RECEIVABLE_STATUS_LABELS[s] }));

export default function AdminReceivablesPage() {
  const [status, setStatus] = useState<ReceivableStatus | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [active, setActive] = useState<{ action: ReceivableAction; receivable: AdminReceivable } | null>(null);

  const { data, isLoading, error } = useReceivables({
    status: status ?? undefined,
    search: debouncedSearch,
    page,
  });
  const { data: systemAccount } = useReceivableSystemAccount();
  const closeActive = () => setActive(null);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="space-y-5 p-6 font-body text-text-app">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-app">
        <ArrowLeft className="h-4 w-4" />
        Về trang chủ
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Khoản phải thu từ khách</h1>
          <p className="mt-0.5 text-xs text-text-muted">Bạn làm trước, khách chuyển khoản sau. Theo dõi số tiền khách còn nợ bạn, gửi QR cho khách và ghi nhận khi nhận được tiền.</p>
        </div>
        {systemAccount ? (
          <Button size="sm" leftSection={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            Ghi nợ cho khách
          </Button>
        ) : null}
      </div>

      <div className="flex items-end gap-3">
        <TextInput
          className="w-72"
          size="sm"
          placeholder="Tìm mã khoản, tên khách, SĐT, email"
          leftSection={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
        />
        <Select
          className="w-52"
          size="sm"
          placeholder="Tất cả trạng thái"
          clearable
          data={STATUS_OPTIONS}
          value={status}
          onChange={(v) => {
            setStatus(v as ReceivableStatus | null);
            setPage(1);
          }}
        />
      </div>

      {data ? <ReceivablesSummary totalOutstanding={data.total_outstanding} overdueCount={data.overdue_count} /> : null}

      {isLoading ? (
        <LoadingSkeleton variant="table-row" count={4} />
      ) : error || !data ? (
        <Alert color="red" title="Lỗi">
          Không thể tải danh sách khoản phải thu.
        </Alert>
      ) : (
        <>
          <ReceivablesTable items={data.items} onAction={(action, receivable) => setActive({ action, receivable })} />
          {totalPages > 1 ? <Pagination total={totalPages} value={page} onChange={setPage} size="sm" /> : null}
        </>
      )}

      {creating ? <CreateReceivableModal onClose={() => setCreating(false)} /> : null}
      {active?.action === "link" ? <PaymentLinkModal receivable={active.receivable} onClose={closeActive} /> : null}
      {active?.action === "payment" ? <RecordPaymentModal receivable={active.receivable} onClose={closeActive} /> : null}
      {active?.action === "write-off" ? <WriteOffModal receivable={active.receivable} onClose={closeActive} /> : null}
    </div>
  );
}
