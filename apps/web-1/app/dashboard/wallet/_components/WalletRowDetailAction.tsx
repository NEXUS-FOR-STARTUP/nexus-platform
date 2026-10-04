"use client";

import Link from "next/link";
import { ActionIcon, Tooltip } from "@mantine/core";
import { MoreVertical } from "lucide-react";

export function WalletRowDetailAction({ href }: { href: string | null }) {
  const icon = <MoreVertical className="h-4 w-4" />;

  if (href) {
    return (
      <Tooltip label="Xem chi tiết" withArrow>
        <ActionIcon
          component={Link}
          href={href}
          variant="subtle"
          color="gray"
          size="lg"
          aria-label="Xem chi tiết"
          className="min-h-11 min-w-11 cursor-pointer"
        >
          {icon}
        </ActionIcon>
      </Tooltip>
    );
  }

  return (
    <Tooltip label="Thanh toán dịch vụ — không có ảnh chứng minh" withArrow>
      <span className="inline-flex">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          disabled
          aria-label="Không có chi tiết nạp"
          className="min-h-11 min-w-11"
        >
          {icon}
        </ActionIcon>
      </span>
    </Tooltip>
  );
}
