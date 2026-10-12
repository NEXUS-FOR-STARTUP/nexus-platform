"use client";

import type { ReactNode } from "react";

/**
 * Single table frame for the billing tab. Both tables (stage balances and
 * transaction history) share it: same rounded border, same thead background,
 * same mobile divider list. Header row (filters) is optional per table.
 */
export default function BillingTableShell({
  header,
  mobile,
  desktop,
}: {
  header?: ReactNode;
  mobile: ReactNode;
  desktop: ReactNode;
}) {
  return (
    <div className="bg-surface-app border border-border-app rounded-xl overflow-hidden">
      {header && (
        <div className="px-3.5 sm:px-4 py-3 border-b border-border-app bg-surface-app">
          {header}
        </div>
      )}
      <div className="md:hidden divide-y divide-border-app/60">{mobile}</div>
      <div className="hidden md:block">{desktop}</div>
    </div>
  );
}

/** Shared thead style: soft background row, muted labels. */
export const BILLING_THEAD_CLASS = "bg-surface-soft/40 border-b border-border-app";
export const BILLING_TH_CLASS = "text-base font-medium text-text-muted py-3.5";
