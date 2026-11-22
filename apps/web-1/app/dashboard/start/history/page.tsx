"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Center, Group, Loader, Stack, Tabs } from "@mantine/core";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { UNDERLINE_TABS_CLASSES } from "@/components/ui/underline-tabs";
import { usePreCp1History } from "../_hooks/usePreCp1History";
import { HistoryDetailView } from "./HistoryDetailView";
import { HistoryItemCard } from "./HistoryItemCard";
import type { FilterMode } from "./historyUtils";
import s from "./history.module.css";

function StartHistoryContent() {
  const router = useRouter();
  const caseIdFilter = useSearchParams().get("caseId");
  const { data: items = [], isLoading, error } = usePreCp1History();
  const [filter, setFilter] = useState<FilterMode>(caseIdFilter ? "case" : "all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filter === "case" && caseIdFilter) return item.case_id === caseIdFilter;
      if (filter === "linked") return item.case_id !== null;
      if (filter === "unlinked") return item.case_id === null;
      return true;
    });
  }, [items, filter, caseIdFilter]);

  const selectedItem = useMemo(
    () => (selectedId ? items.find((i) => i.id === selectedId) ?? null : null),
    [items, selectedId],
  );

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (error) {
    return (
      <div className={s.page}>
        <div className={s.card}>
          <p className={s.note}>Không thể tải lịch sử đánh giá. Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }

  if (selectedItem) {
    return <HistoryDetailView item={selectedItem} onBackAction={() => setSelectedId(null)} />;
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Lịch sử đánh giá ban đầu</h1>
          <p className={s.subtitle}>Toàn bộ các lần chạy phân tích nhóm và ý tưởng bạn đã thực hiện.</p>
        </div>
        <Group gap="xs">
          {caseIdFilter && (
            <Button
              variant="default"
              size="sm"
              leftSection={<ArrowLeftIcon size={15} />}
              onClick={() => router.push(`/dashboard/case/${caseIdFilter}?tab=overview`)}
            >
              Quay lại dự án
            </Button>
          )}
          <Button component={Link} href="/dashboard/start" color="brand" size="sm">
            Chạy đánh giá mới
          </Button>
        </Group>
      </div>

      <Tabs value={filter} onChange={(v) => setFilter((v as FilterMode) ?? "all")} classNames={UNDERLINE_TABS_CLASSES}>
        <Tabs.List className="mb-4">
          {caseIdFilter && <Tabs.Tab value="case">Thuộc dự án này</Tabs.Tab>}
          <Tabs.Tab value="all">Tất cả</Tabs.Tab>
          <Tabs.Tab value="linked">Đã gắn dự án</Tabs.Tab>
          <Tabs.Tab value="unlinked">Chưa gắn dự án</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {filtered.length === 0 ? (
        <div className={s.card}>
          <Stack gap="sm" align="flex-start">
            <p className={s.note}>Chưa có lần chạy nào phù hợp với mục đang chọn.</p>
            <Button component={Link} href="/dashboard/start" color="brand" size="sm">
              Bắt đầu phân tích ngay
            </Button>
          </Stack>
        </div>
      ) : (
        <Stack gap="sm">
          {filtered.map((item) => (
            <HistoryItemCard key={item.id} item={item} onSelectAction={setSelectedId} />
          ))}
        </Stack>
      )}
    </div>
  );
}

export default function StartHistoryPage() {
  return (
    <Suspense fallback={<Center py="xl"><Loader size="md" /></Center>}>
      <StartHistoryContent />
    </Suspense>
  );
}
