"use client";

import { useMemo, useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
import { Button } from "../../ui/Button";
import type { CreditEntry } from "../../credit-history.types";
import CreditHistoryFilters from "./CreditHistoryFilters";
import CreditTransactionRow from "./CreditTransactionRow";
import { countByType, filterCreditEntries, type CreditDaysFilter, type CreditTypeFilter } from "./credit-history-filter";
import s from "./credit-history.module.css";

const MOBILE_QUERY = "(max-width: 820px)";
const MOBILE_VISIBLE_ROWS = 5;
const SKELETON_ROWS = 3;

interface Props {
  entries?: CreditEntry[];
  isLoading?: boolean;
}

export default function CreditHistorySection({ entries, isLoading = false }: Props) {
  const [type, setType] = useState<CreditTypeFilter>("all");
  const [days, setDays] = useState<CreditDaysFilter>(null);
  const [showAll, setShowAll] = useState(false);
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
      <div className={s.rows} aria-busy>
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <div key={i} className={s.skeleton} />
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return <p className={s.empty}>Chưa có giao dịch nào. Giao dịch sẽ xuất hiện khi bạn mua hoặc dùng lượt chấm.</p>;
  }

  const folded = !!isMobile && !showAll && filtered.length > MOBILE_VISIBLE_ROWS;
  const visible = folded ? filtered.slice(0, MOBILE_VISIBLE_ROWS) : filtered;
  const countText = isMobile ? `Hiện ${visible.length} trên ${filtered.length} giao dịch` : `${filtered.length} giao dịch`;

  return (
    <div>
      <CreditHistoryFilters type={type} days={days} counts={counts} onTypeChange={setType} onDaysChange={setDays} />
      {filtered.length === 0 ? (
        <p className={s.empty}>Không có giao dịch nào khớp bộ lọc.</p>
      ) : (
        <div className={s.rows}>
          {visible.map((entry) => (
            <CreditTransactionRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
      <p className={s.footer}>
        <span className={s.note}>{countText}</span>
        {isMobile && filtered.length > MOBILE_VISIBLE_ROWS && (
          <Button variant="quiet" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Thu gọn" : `Xem thêm ${filtered.length - MOBILE_VISIBLE_ROWS} giao dịch`}
          </Button>
        )}
      </p>
    </div>
  );
}
