import type { OverviewData, TeamMemberSnapshot } from "../overview/caseOverviewData";
import Link from "next/link";
import s from "./overview.module.css";

type Row = readonly [label: string, value: string];

/** Every field is listed; a field without data keeps its label and an empty value. */
function Group({ title, rows }: { title?: string; rows: Row[] }) {
  return (
    <>
      {title && <p className={s.kvh}>{title}</p>}
      <dl className={s.kv}>
        {rows.map(([label, value]) => (
          <div key={label} className={s.kvRow}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function memberRow(m: TeamMemberSnapshot, index: number): Row {
  const roleOrMajor = [m.major, m.role].filter(Boolean).join(" · ");
  const detail = [roleOrMajor, m.skills].filter(Boolean).join(" — ");
  return [m.fullName || m.name || `Thành viên ${index + 1}`, detail];
}

/** Risks come from the team-fit areas; reports saved before areas existed only have flat gap lists. */
function riskRows(d: OverviewData): Row[] {
  if (d.areas.length > 0) return d.areas.map((area): Row => [area.ten, area.lyDo]);
  return [
    ["Khoảng trống đội ngũ", d.teamGaps.join("; ")],
    ["Khoảng trống thương mại và thị trường", d.commercialGaps.join("; ")],
  ];
}

export default function OverviewProfileDetails({
  data: d,
  caseId,
  initialCheckCount = 0,
}: {
  data: OverviewData;
  caseId?: string;
  initialCheckCount?: number;
}) {
  return (
    <div className={s.inner}>
      <Group
        rows={[
          ["Tên đề tài", d.groupName],
          ["Nhóm số", d.groupNo],
          ["Trường", d.schoolName],
          ["Môn học", d.courseContext],
        ]}
      />

      <Group
        title="Người đại diện liên hệ"
        rows={[
          ["Họ và tên", d.contactName],
          ["Mã số sinh viên", d.studentCode],
          ["Email", d.contactEmail],
          ["Số điện thoại / Zalo", d.contactPhone],
          ["Vai trò", d.teamRole],
          ["Telegram", d.contactTelegram],
        ]}
      />

      <Group
        title="Ý tưởng khởi nghiệp"
        rows={[
          ["Lĩnh vực", d.field],
          ["Khách hàng mục tiêu", d.targetCustomer],
          ["Vấn đề cốt lõi", d.problem],
          ["Giải pháp", d.solution],
          ["Sản phẩm tối thiểu", d.mvp],
        ]}
      />

      <Group
        title="Nhu cầu hỗ trợ"
        rows={[
          ["Điểm kẹt hiện tại", d.currentBlocker],
          ["Nhu cầu hỗ trợ chính", d.primaryNeedText],
          ["Kết quả mong đợi", d.expectedOutputs],
          ["Ghi chú thêm", d.extraNotes],
        ]}
      />

      <Group title={`Đội ngũ (${d.members.length} thành viên)`} rows={d.members.map(memberRow)} />

      <Group title="Rủi ro về đội ngũ" rows={riskRows(d)} />

      {caseId && (
        <>
          <p className={s.kvh}>Đánh giá ban đầu</p>
          <dl className={s.kv}>
            <div className={s.kvRow}>
              <dt>Lịch sử phân tích nhóm &amp; ý tưởng</dt>
              <dd>
                <span>
                  {initialCheckCount > 0
                    ? `Đã lưu ${initialCheckCount} lần đánh giá cho dự án này · `
                    : "Xem toàn bộ các lần chạy đánh giá ban đầu của bạn · "}
                </span>
                <Link
                  href={`/dashboard/start/history?caseId=${caseId}`}
                  className={s.foldLink}
                >
                  Xem lịch sử
                </Link>
              </dd>
            </div>
          </dl>
        </>
      )}
    </div>
  );
}
