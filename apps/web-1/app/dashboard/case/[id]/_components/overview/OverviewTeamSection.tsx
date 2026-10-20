"use client";

import type { OverviewData } from "./caseOverviewData";
import OverviewCard from "./OverviewCard";
import OverviewField from "./OverviewField";

const GRID = "grid grid-cols-1 sm:grid-cols-2 gap-4";

export default function OverviewTeamSection({ data: d }: { data: OverviewData }) {
  const hasProject = Boolean(d.groupName || d.groupNo || d.schoolName || d.courseContext);
  const hasContact = Boolean(d.contactName || d.studentCode || d.contactEmail || d.contactPhone || d.contactTelegram);
  if (!hasProject && !hasContact) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {hasProject && (
        <OverviewCard title="Dự án & Đội ngũ">
          <div className={GRID}>
            <OverviewField label="Tên đề tài" value={d.groupName} />
            <OverviewField label="Nhóm số" value={d.groupNo} />
            <OverviewField label="Trường" value={d.schoolName} />
            <OverviewField label="Môn học" value={d.courseContext} />
          </div>
        </OverviewCard>
      )}
      {hasContact && (
        <OverviewCard title="Người đại diện liên hệ">
          <div className={GRID}>
            <OverviewField label="Họ và tên" value={d.contactName} />
            <OverviewField label="Mã số sinh viên" value={d.studentCode} />
            <OverviewField label="Email" value={d.contactEmail} />
            <OverviewField label="Số điện thoại / Zalo" value={d.contactPhone} />
            <OverviewField label="Vai trò" value={d.teamRole} />
            <OverviewField label="Telegram" value={d.contactTelegram} />
          </div>
        </OverviewCard>
      )}
    </div>
  );
}
