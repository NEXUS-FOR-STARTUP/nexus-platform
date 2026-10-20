"use client";

import { Pagination } from "@mantine/core";

interface Props {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export function WalletHistoryPagination({ page, total, limit, onChange }: Props) {
  if (total <= 0) return null;

  const totalPages = Math.ceil(total / limit);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 mt-2">
      <span className="text-sm text-text-muted">
        Hiển thị {from}–{to} trên tổng số {total} giao dịch
      </span>

      {totalPages > 1 && (
        <Pagination
          value={page}
          onChange={onChange}
          total={totalPages}
          size="sm"
          radius="sm"
        />
      )}
    </div>
  );
}
