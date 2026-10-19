import { Select, Tabs } from "@mantine/core";
import { UNDERLINE_TABS_CLASSES } from "@/components/ui/underline-tabs";
import type { CreditDaysFilter, CreditTypeFilter } from "./credit-history-filter";
import s from "./credit-history.module.css";

const TYPE_TABS: ReadonlyArray<{ value: CreditTypeFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "purchase", label: "Mua" },
  { value: "consumption", label: "Dùng" },
  { value: "refund", label: "Hoàn" },
];

const DAYS_OPTIONS = [
  { value: "all", label: "Tất cả thời gian" },
  { value: "3", label: "3 ngày gần đây" },
  { value: "7", label: "7 ngày gần đây" },
];

interface Props {
  type: CreditTypeFilter;
  days: CreditDaysFilter;
  counts: Record<CreditTypeFilter, number>;
  onTypeChange: (type: CreditTypeFilter) => void;
  onDaysChange: (days: CreditDaysFilter) => void;
}

export default function CreditHistoryFilters({ type, days, counts, onTypeChange, onDaysChange }: Props) {
  return (
    <div className={s.filters}>
      <Tabs value={type} onChange={(v) => v && onTypeChange(v as CreditTypeFilter)} classNames={UNDERLINE_TABS_CLASSES}>
        <Tabs.List>
          {TYPE_TABS.map((t) => (
            <Tabs.Tab key={t.value} value={t.value}>{`${t.label} (${counts[t.value]})`}</Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
      <Select
        aria-label="Khoảng thời gian"
        allowDeselect={false}
        data={DAYS_OPTIONS}
        value={days === null ? "all" : String(days)}
        onChange={(v) => onDaysChange(!v || v === "all" ? null : Number(v))}
        w={200}
      />
    </div>
  );
}
