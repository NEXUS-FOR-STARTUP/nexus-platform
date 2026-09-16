"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { PackageSelectionModal } from "./PackageSelectionModal";

export default function DashboardEmptyState() {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-16 text-center border-2 border-dashed border-border-strong rounded-2xl bg-surface-app transition-colors duration-200">
      <div className="w-16 h-16 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mb-6">
        <Users className="w-8 h-8" />
      </div>
      
      <h3 className="font-heading text-xl font-semibold text-text-app mb-2">Chưa có hồ sơ phản biện nào</h3>
      <p className="font-body text-text-muted text-sm max-w-md mb-8 leading-relaxed">
        Đánh giá đội ngũ khởi nghiệp của bạn trước, sau đó tạo hồ sơ phản biện với các checkpoint chuẩn.
      </p>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/team-fit"
          className="inline-flex items-center justify-center gap-2 font-body text-sm font-semibold bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-lg shadow-sm shadow-brand/10 transition-colors cursor-pointer"
        >
          <span>Đánh giá đội ngũ miễn phí</span>
        </Link>
        <button
          onClick={open}
          className="inline-flex items-center justify-center gap-2 font-body text-sm font-semibold bg-surface-app border border-border-app hover:border-brand/40 text-text-app px-6 py-3 rounded-lg transition-colors cursor-pointer"
        >
          <span>Bắt đầu kiểm tra dự án</span>
        </button>
      </div>
      <PackageSelectionModal opened={opened} onClose={close} />
    </div>
  );
}
