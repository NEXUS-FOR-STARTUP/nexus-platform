"use client";

import { Alert } from "@mantine/core";
import { useSearchParams } from "next/navigation";
import { TagIcon } from "@phosphor-icons/react";
import type { CreditBalances } from "@/lib/credit-balances";
import type { CreditEntry } from "../credit-history.types";
import PageHead from "../ui/PageHead";
import StageBalanceCards from "./StageBalanceCards";
import CreditHistorySection from "./credit-history/CreditHistorySection";
import s from "./credit-history/credit-history.module.css";

interface BillingTabProps {
  caseId: string;
  balances?: CreditBalances | null;
  creditLedger?: CreditEntry[];
  isLoading?: boolean;
}

export default function BillingTab({ caseId, balances, creditLedger, isLoading = false }: BillingTabProps) {
  const linkCode = useSearchParams().get("code");
  return (
    <div className={s.page}>
      <PageHead title="Lượt chấm & thanh toán" note="Mỗi lần bấm chấm trừ 1 lượt của đúng giai đoạn đó." />
      {linkCode && (
        <Alert color="teal" variant="light" radius="md" icon={<TagIcon size={18} aria-hidden="true" />} title="Bạn có mã giảm giá">
          Mã <b>{linkCode}</b> sẽ tự áp dụng khi bạn bấm Mua thêm ở đúng giai đoạn được tặng mã. Mã dùng 1 lần, cho 1 lượt.
        </Alert>
      )}
      <StageBalanceCards caseId={caseId} balances={balances} />
      <section className={s.hist}>
        <h2 className={s.histTitle}>Lịch sử lượt chấm</h2>
        <CreditHistorySection entries={creditLedger} isLoading={isLoading} />
      </section>
    </div>
  );
}
