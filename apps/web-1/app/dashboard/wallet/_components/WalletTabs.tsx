"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs } from "@mantine/core";
import { UNDERLINE_TABS_CLASSES } from "@/components/ui/underline-tabs";
import { WalletTransactionList } from "./WalletTransactionList";
import { WalletProofTable } from "./WalletProofTable";

export function parseWalletView(raw?: string | null): "history" | "proofs" {
  if (raw === "proofs") return "proofs";
  return "history";
}

export function WalletTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentView = parseWalletView(searchParams.get("view"));

  const handleTabChange = (val: string | null) => {
    const nextView = parseWalletView(val);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs
      value={currentView}
      onChange={handleTabChange}
      classNames={UNDERLINE_TABS_CLASSES}
    >
      <Tabs.List className="mb-4">
        <Tabs.Tab value="history">Lịch sử giao dịch</Tabs.Tab>
        <Tabs.Tab value="proofs">Ảnh minh chứng</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="history">
        <WalletTransactionList />
      </Tabs.Panel>

      <Tabs.Panel value="proofs">
        <WalletProofTable />
      </Tabs.Panel>
    </Tabs>
  );
}
