import type { ReactNode } from "react";

interface OverviewCardProps {
  title: string;
  children: ReactNode;
}

export default function OverviewCard({ title, children }: OverviewCardProps) {
  return (
    <div className="bg-surface-app border border-border-app rounded-xl p-5 space-y-4">
      <div className="pb-2.5 border-b border-border-app/60">
        <h3 className="font-heading text-base font-semibold text-text-app tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}
