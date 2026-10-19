"use client";

import { useMemo, useState } from "react";
import { Button, Skeleton, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { ExpandableList } from "@/components/ui/expandable-list/ExpandableList";
import type { CreditEntry } from "../../credit-history.types";
import CreditHistoryFilters from "./CreditHistoryFilters";
import CreditTransactionRow from "./CreditTransactionRow";
import CreditTxDetail from "./CreditTxDetail";
import { countByType, filterCreditEntries, type CreditDaysFilter, type CreditTypeFilter } from "./credit-history-filter";

const MOBILE_QUERY = "(max-width: 820px)";
const MOBILE_VISIBLE_ROWS = 5;

interface Props {
  entries?: CreditEntry[];
  isLoading?: boolean;
}

export default function CreditHistorySection({ entries, isLoading = false }: Props) {
  const [type, setType] = useState<CreditTypeFilter>("all");
  const [days, setDays] = useState<CreditDaysFilter>(null);
  const [showAll, setShowAll] = useState(false);
  const [openedIds, setOpenedIds] = useState<ReadonlySet<string>>(new Set());
  const isMobile = useMediaQuery(MOBILE_QUERY);

  const sorted = useMemo(
    () => [...(entries ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [entries],
  );
  const counts = useMemo(() => countByType(sorted), [sorted]);
  // Snapshot at mount: the 3/7-day window does not need to tick while the page is open.
  const [now] = useState(() => Date.now());
  const filtered = useMemo(
    () => filterCreditEntries(sorted, { type, days, now }),
    [sorted, type, days, now],
  );

  if (isLoading) {
    return (
      <Stack gap="xs">
        <Skeleton height={56} />
        <Skeleton height={56} />
        <Skeleton height={56} />
      </Stack>
    );
  }

  if (sorted.length === 0) {
    return <Text c="dimmed">Chưa có giao dịch nào. Giao dịch sẽ xuất hiện khi bạn mua hoặc dùng lượt chấm.</Text>;
  }

  const hidden = isMobile && !showAll ? Math.max(filtered.length - MOBILE_VISIBLE_ROWS, 0) : 0;
  const visible = hidden > 0 ? filtered.slice(0, MOBILE_VISIBLE_ROWS) : filtered;

  return (
    <div>
      <CreditHistoryFilters type={type} days={days} counts={counts} onTypeChange={setType} onDaysChange={setDays} />
      {filtered.length === 0 ? (
        <Text c="dimmed">Không có giao dịch nào khớp bộ lọc.</Text>
      ) : (
        <ExpandableList
          onOpen={(id) => setOpenedIds((prev) => new Set(prev).add(id))}
          items={visible.map((entry) => ({
            id: entry.id,
            summary: <CreditTransactionRow entry={entry} />,
            children: <CreditTxDetail entry={entry} opened={openedIds.has(entry.id)} />,
          }))}
        />
      )}
      {hidden > 0 && (
        <Button variant="default" fullWidth onClick={() => setShowAll(true)}>{`Xem thêm ${hidden} giao dịch`}</Button>
      )}
      {isMobile && showAll && filtered.length > MOBILE_VISIBLE_ROWS && (
        <Button variant="default" fullWidth onClick={() => setShowAll(false)}>Thu gọn</Button>
      )}
    </div>
  );
}
