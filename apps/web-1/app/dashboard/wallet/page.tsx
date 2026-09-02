"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Tabs } from "@mantine/core";
import { Plus } from "lucide-react";
import { WalletBalanceCard } from "./_components/WalletBalanceCard";
import { WalletTransactionList } from "./_components/WalletTransactionList";
import { WalletProofTable } from "./_components/WalletProofTable";
import { WalletTopupModal } from "./_components/WalletTopupModal";

export default function WalletPage() {
  const searchParams = useSearchParams();
  const amountParam = searchParams.get("amount");
  const initialTopupAmount = amountParam ? Number(amountParam) : undefined;
  const [topupOpened, setTopupOpened] = useState(!!initialTopupAmount);
  const [topupAmount, setTopupAmount] = useState<number | undefined>(initialTopupAmount);

  const openTopup = (amount?: number) => {
    setTopupAmount(amount);
    setTopupOpened(true);
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-text-app sm:text-3xl">
          Ví của tôi
        </h1>
        <Button leftSection={<Plus size={16} />} onClick={() => openTopup()}>
          Nạp tiền
        </Button>
      </header>

      <WalletBalanceCard />

      <Tabs defaultValue="history" variant="pills" radius="md">
        <Tabs.Panel value="history">
          <WalletTransactionList />
        </Tabs.Panel>

        <Tabs.Panel value="proofs">
          <WalletProofTable />
        </Tabs.Panel>
      </Tabs>

      <WalletTopupModal
        opened={topupOpened}
        onClose={() => setTopupOpened(false)}
        initialAmount={topupAmount}
      />
    </main>
  );
}
