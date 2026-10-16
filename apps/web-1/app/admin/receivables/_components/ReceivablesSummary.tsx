import { formatVnd } from "./format";

export default function ReceivablesSummary({ totalOutstanding, overdueCount }: { totalOutstanding: number; overdueCount: number }) {
  return (
    <div className="flex flex-wrap gap-6 rounded-xl border border-border-app bg-surface-app px-5 py-3 text-sm">
      <div>
        <span className="text-text-muted">Khách còn nợ bạn: </span>
        <span className="font-semibold text-text-app">{formatVnd(totalOutstanding)}</span>
      </div>
      <div>
        <span className="text-text-muted">Quá hạn chưa trả: </span>
        <span className={`font-semibold ${overdueCount > 0 ? "text-danger" : "text-text-app"}`}>{overdueCount} khoản</span>
      </div>
    </div>
  );
}
