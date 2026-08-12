"use client";

import Link from "next/link";
import { Case } from "@/types";
import { statusThemeMap } from "@/types";
import { Card, Badge } from "@mantine/core";
import { Calendar, User, BookOpen } from "lucide-react";

interface CaseCardProps {
  item: Case;
  hrefPrefix?: string;
}

export default function CaseCard({ item, hrefPrefix = "/dashboard/case" }: CaseCardProps) {
  const getBadgeProps = (status: string) => {
    const mapped = statusThemeMap[status] || { label: status, color: "default" as const };
    let color = "gray";
    
    if (mapped.color === "success") color = "teal";
    else if (mapped.color === "warning") color = "yellow";
    else if (mapped.color === "danger") color = "red";
    else if (mapped.color === "primary") color = "brand";
    
    return { label: mapped.label, color };
  };

  const paymentBadge = getBadgeProps(item.payment_status);
  const userFacingStatusBadge = getBadgeProps(item.user_facing_stage);
  const hasCredits = (item.credit_balance ?? 0) > 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <Link href={`${hrefPrefix}/${item.id}`} className="block group">
      <Card p="lg" radius="md" withBorder className="bg-surface-app group-hover:border-brand shadow-sm hover:shadow-md transition-all duration-200">
        <div className="mb-4 space-y-2.5">
          {/* Row 1: case code */}
          <span className="block text-xs font-semibold text-text-subtle uppercase font-body tracking-wider">
            {item.case_code}
          </span>
          {/* Row 2: team name */}
          <h3 className="font-heading text-lg font-semibold text-text-app group-hover:text-brand transition-colors">
            {item.team_name || "Hồ sơ chưa đặt tên nhóm"}
          </h3>
          {/* Row 3: status badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge size="md" variant="light" color={userFacingStatusBadge.color} className="font-body text-sm whitespace-nowrap">
              {userFacingStatusBadge.label}
            </Badge>
            {!hasCredits && (
              <Badge size="md" variant="light" color={paymentBadge.color} className="font-body text-sm whitespace-nowrap">
                {paymentBadge.label}
              </Badge>
            )}
            {hasCredits && (
              <Badge size="md" variant="light" color="teal" className="font-body text-sm whitespace-nowrap">
                Có {item.credit_balance} credit
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-4 border-t border-border-app text-xs font-body text-text-muted">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-text-subtle shrink-0" />
            <span>{item.package?.name || "Gói dịch vụ"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-text-subtle shrink-0" />
            <span>Ngày nộp hồ sơ: {formatDate(item.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 min-h-[20px]">
            {item.school ? (
              <>
                <User className="w-3.5 h-3.5 text-text-subtle shrink-0" />
                <span className="truncate">{item.school} {item.course_context ? `(${item.course_context})` : ""}</span>
              </>
            ) : (
              <span className="invisible">placeholder</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
