import FilterTabs from "../../ui/FilterTabs";
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
  { value: "3", label: "3 ngày qua" },
  { value: "7", label: "7 ngày qua" },
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
    <div className={s.bar}>
      <FilterTabs
        className={s.barTabs}
        ariaLabel="Lọc theo loại"
        value={type}
        onChange={onTypeChange}
        items={TYPE_TABS.map((t) => ({ value: t.value, label: `${t.label} (${counts[t.value]})` }))}
      />
      <select
        className={s.select}
        aria-label="Khoảng thời gian"
        value={days === null ? "all" : String(days)}
        onChange={(e) => onDaysChange(e.target.value === "all" ? null : Number(e.target.value))}
      >
        {DAYS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
