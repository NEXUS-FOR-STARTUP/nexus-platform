"use client";

interface OverviewTeamSectionProps {
  groupName: string;
  groupNo?: string;
  schoolName: string;
  courseContext: string;
  contactName: string;
  studentCode: string;
  teamRole: string;
  contactEmail: string;
  contactPhone: string;
  contactTelegram?: string;
}

export default function OverviewTeamSection({
  groupName,
  groupNo,
  schoolName,
  courseContext,
  contactName,
  studentCode,
  teamRole,
  contactEmail,
  contactPhone,
  contactTelegram,
}: OverviewTeamSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Dự án & Đội ngũ */}
      <div className="bg-surface-app border border-border-app rounded-xl p-5 space-y-4">
        <div className="pb-2.5 border-b border-border-app/60">
          <h3 className="font-heading text-base font-semibold text-text-app tracking-tight">
            Dự án & Đội ngũ
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-text-muted text-xs font-medium block mb-0.5">Tên đề tài:</span>
            <p className="font-normal text-text-app mt-0.5 text-sm leading-relaxed">{groupName}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs font-medium block mb-0.5">Nhóm số:</span>
            <p className="font-normal text-text-app mt-0.5 text-sm leading-relaxed">{groupNo || "Chưa cập nhật"}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs font-medium block mb-0.5">Trường:</span>
            <p className="font-normal text-text-app mt-0.5 text-sm leading-relaxed">{schoolName}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs font-medium block mb-0.5">Môn học:</span>
            <p className="font-normal text-text-app mt-0.5 text-sm leading-relaxed">{courseContext}</p>
          </div>
        </div>
      </div>

      {/* Người đại diện liên hệ */}
      <div className="bg-surface-app border border-border-app rounded-xl p-5 space-y-4">
        <div className="pb-2.5 border-b border-border-app/60">
          <h3 className="font-heading text-base font-semibold text-text-app tracking-tight">
            Người đại diện liên hệ
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-text-muted text-xs font-medium block mb-0.5">Họ và tên:</span>
            <p className="font-normal text-text-app mt-0.5 text-sm leading-relaxed">{contactName}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs font-medium block mb-0.5">Mã số sinh viên:</span>
            <p className="font-normal text-text-app mt-0.5 text-sm leading-relaxed">{studentCode}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs font-medium block mb-0.5">Email:</span>
            <p className="font-normal text-text-app mt-0.5 text-sm leading-relaxed truncate">{contactEmail}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs font-medium block mb-0.5">Số điện thoại / Zalo:</span>
            <p className="font-normal text-text-app mt-0.5 text-sm leading-relaxed">{contactPhone}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs font-medium block mb-0.5">Vai trò:</span>
            <p className="font-normal text-text-app mt-0.5 text-sm leading-relaxed">{teamRole}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs font-medium block mb-0.5">Telegram:</span>
            <p className="font-normal text-text-app mt-0.5 text-sm leading-relaxed">{contactTelegram || "Chưa cập nhật"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
