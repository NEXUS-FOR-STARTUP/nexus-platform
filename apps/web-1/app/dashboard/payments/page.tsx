"use client";

import PaymentHistoryList from "./_components/PaymentHistoryList";
import { useMyPayments } from "../hooks/useMyPayments";

export default function PaymentsPage() {
  const { data: payments, isLoading, error } = useMyPayments();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-1">
        <h1 className="font-heading text-h2 font-bold text-text-app sm:text-h1">
          Lịch sử thanh toán
        </h1>
      </header>

      <PaymentHistoryList items={payments} isLoading={isLoading} error={error} />
    </main>
  );
}
