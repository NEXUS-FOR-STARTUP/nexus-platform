"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "@phosphor-icons/react";
import { WalletBalanceCard } from "./_components/WalletBalanceCard";
import { WalletTabs } from "./_components/WalletTabs";
import { WalletTopupModal } from "./_components/WalletTopupModal";
import { parseTopupAmount } from "./_components/wallet-topup.constants";
import { clearAllBuyCreditAfterDepositIntents } from "@/app/dashboard/payment/credit-after-deposit-intent";
import styles from "./wallet.module.css";

export default function WalletPage() {
  const searchParams = useSearchParams();
  const initialTopupAmount = parseTopupAmount(searchParams.get("amount"));
  const [topupOpened, setTopupOpened] = useState(Boolean(initialTopupAmount));
  const [topupAmount, setTopupAmount] = useState<number | undefined>(initialTopupAmount);

  useEffect(() => {
    clearAllBuyCreditAfterDepositIntents();
  }, []);

  const openTopup = (amount?: number) => {
    setTopupAmount(amount);
    setTopupOpened(true);
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Ví của tôi</h1>
          <p className={styles.subtitle}>
            Quản lý số dư trả trước và đối soát lịch sử giao dịch đánh giá dự án.
          </p>
        </div>
        <button
          type="button"
          className={styles.btn}
          onClick={() => openTopup()}
        >
          <Plus size={16} />
          <span>Nạp tiền</span>
        </button>
      </header>

      <WalletBalanceCard />
      <WalletTabs />

      <WalletTopupModal
        opened={topupOpened}
        onClose={() => setTopupOpened(false)}
        initialAmount={topupAmount}
      />
    </main>
  );
}
