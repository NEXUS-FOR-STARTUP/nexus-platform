"use client";

import { Tabs } from "@mantine/core";

export function WalletTabsList() {
  return (
    <Tabs.List className="border-none bg-transparent p-0">
      <Tabs.Tab value="history">Lịch sử giao dịch</Tabs.Tab>
      <Tabs.Tab value="proofs">Ảnh minh chứng</Tabs.Tab>
    </Tabs.List>
  );
}
