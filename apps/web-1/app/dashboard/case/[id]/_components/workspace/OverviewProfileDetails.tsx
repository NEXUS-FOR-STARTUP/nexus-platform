import type { OverviewData, TeamMemberSnapshot } from "../overview/caseOverviewData";
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
  const detail = [m.major || m.role, m.skills].filter(Boolean).join(", ");
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

export default function OverviewProfileDetails({ data: d }: { data: OverviewData }) {
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
    </div>
  );
}
