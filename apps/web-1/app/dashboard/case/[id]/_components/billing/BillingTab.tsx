"use client";

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
  return (
    <div className={s.page}>
      <PageHead title="Lượt chấm & thanh toán" note="Mỗi lần bấm chấm trừ 1 lượt của đúng giai đoạn đó." />
      <StageBalanceCards caseId={caseId} balances={balances} />
      <section className={s.hist}>
        <h2 className={s.histTitle}>Lịch sử lượt chấm</h2>
        <CreditHistorySection entries={creditLedger} isLoading={isLoading} />
      </section>
    </div>
  );
}
