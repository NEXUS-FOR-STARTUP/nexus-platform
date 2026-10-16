"use client";

import { Alert, Button } from "@mantine/core";
import { UserRoundPen } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Case } from "@/types";

const MAX_LISTED = 3;

export default function ContactIncompleteBanner({ cases }: { cases: Case[] }) {
  const router = useRouter();
  // `contact_complete` is computed server-side; undefined (older API) is treated as complete.
  const incomplete = cases.filter((c) => c.contact_complete === false);
  if (incomplete.length === 0) return null;

  const name = (c: Case) => c.team_name || c.case_code;
  const listed = incomplete.slice(0, MAX_LISTED).map(name).join(", ");
  const extra = incomplete.length - MAX_LISTED;
  const title =
    incomplete.length === 1
      ? `Dự án ${listed} cần cập nhật thông tin liên hệ`
      : `${incomplete.length} dự án cần cập nhật thông tin liên hệ`;

  return (
    <Alert color="yellow" variant="light" radius="md" icon={<UserRoundPen className="w-4 h-4" />} title={title}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-sm">
          {incomplete.length > 1 && (
            <>
              {listed}
              {extra > 0 ? ` và ${extra} dự án khác` : ""}.{" "}
            </>
          )}
          Cần họ tên, số điện thoại và email để nhận thông báo và dùng cho thanh toán.
        </span>
        <Button
          size="md"
          color="yellow"
          className="cursor-pointer shrink-0"
          onClick={() => router.push(`/dashboard/case/${incomplete[0].id}?tab=settings`)}
        >
          Cập nhật hồ sơ
        </Button>
      </div>
    </Alert>
  );
}
