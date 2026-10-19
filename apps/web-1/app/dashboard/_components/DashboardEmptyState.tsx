"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { CreateProjectModal } from "./CreateProjectModal";

export default function DashboardEmptyState() {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-16 text-center rounded-2xl bg-surface-soft transition-colors duration-200">
      <div className="w-16 h-16 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mb-6">
        <Users className="w-8 h-8" />
      </div>
      
      <h3 className="font-heading text-2xl font-medium tracking-tight text-text-app mb-2">Chưa có dự án phản biện nào</h3>
      <p className="font-body text-text-muted text-base max-w-md mb-8 leading-relaxed">
        Tạo dự án phản biện đầu tiên để bắt đầu kiểm tra ý tưởng của bạn theo từng vòng chuẩn.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button
          onClick={open}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-body text-base font-medium bg-brand hover:bg-brand-hover text-white px-8 h-12 rounded-full transition-colors cursor-pointer whitespace-nowrap"
        >
          <span>Tạo dự án phản biện</span>
        </button>
        <Link
          href="/dashboard/team-fit"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-body text-base font-medium bg-surface-app border border-border-app hover:border-brand text-text-app hover:text-brand px-8 h-12 rounded-full transition-colors cursor-pointer whitespace-nowrap"
        >
          <span>Đánh giá đội ngũ</span>
        </Link>
      </div>
      <CreateProjectModal opened={opened} onClose={close} />
    </div>
  );
}
