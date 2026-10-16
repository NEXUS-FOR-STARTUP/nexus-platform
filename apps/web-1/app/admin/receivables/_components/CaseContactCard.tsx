"use client";

import Link from "next/link";
import { Alert, Button, Loader } from "@mantine/core";
import { AlertTriangle } from "lucide-react";
import { isCaseContactComplete } from "@repo/validation";
import { useReceivableCaseContact } from "../../hooks/useReceivableCaseOptions";

const EMPTY = "Chưa cập nhật";

/** Read-only debtor preview from the case's own contact; reports completeness so the form can block submit. */
export default function CaseContactCard({ caseId }: { caseId: string }) {
  const { data: contact, isLoading } = useReceivableCaseContact(caseId);
  if (isLoading) return <Loader size="sm" />;
  const rows: [string, string | undefined][] = [
    ["Họ tên", contact?.full_name],
    ["Số điện thoại", contact?.zalo],
    ["Email", contact?.email],
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border-app p-4">
        <p className="mb-2 text-sm font-semibold">Khách nợ bạn</p>
        <dl className="space-y-1 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="w-28 shrink-0 text-text-muted">{label}</dt>
              <dd>{value?.trim() || EMPTY}</dd>
            </div>
          ))}
        </dl>
      </div>
      {!isCaseContactComplete(contact) ? (
        <Alert color="red" icon={<AlertTriangle className="h-4 w-4" />} title="Dự án chưa có đủ thông tin liên hệ của khách">
          <Button component={Link} href={`/dashboard/case/${caseId}?tab=settings`} size="xs" variant="light" color="red" mt={4}>
            Cập nhật hồ sơ dự án
          </Button>
        </Alert>
      ) : null}
    </div>
  );
}

/** Same completeness rule the API enforces, for the submit guard. */
export function useCaseContactReady(caseId: string): boolean {
  const { data } = useReceivableCaseContact(caseId);
  return !!caseId && isCaseContactComplete(data);
}
