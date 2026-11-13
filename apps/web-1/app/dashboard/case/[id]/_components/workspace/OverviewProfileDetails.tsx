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

      {d.preCp1 && (
        <>
          <Group
            title="Chuẩn bị ban đầu (Pre-CP1)"
            rows={[
              ["Mục tiêu", d.preCp1.goalLabel],
              ["Ngân sách dự kiến", d.preCp1.budgetLabel],
              ["Trạng thái ý tưởng", d.preCp1.ideaModeLabel],
              ...(d.preCp1.pain ? [["Vấn đề quan tâm", d.preCp1.pain] as const] : []),
              ...(d.preCp1.idea ? [["Ý tưởng sơ bộ", d.preCp1.idea] as const] : []),
              ...(d.preCp1.network.length > 0 ? [["Mạng lưới hỗ trợ", d.preCp1.network.join("; ")] as const] : []),
              ...(d.preCp1.sensitive.length > 0 ? [["Yếu tố nhạy cảm", d.preCp1.sensitive.join("; ")] as const] : []),
              ...(d.preCp1.assetTags.length > 0 ? [["Lợi thế tài nguyên", d.preCp1.assetTags.join("; ")] as const] : []),
              ...(d.preCp1.ideaTags.length > 0 ? [["Đặc điểm ý tưởng", d.preCp1.ideaTags.join("; ")] as const] : []),
              ...(d.preCp1.aiLabels.length > 0 ? [["Nhãn AI ghi nhận", d.preCp1.aiLabels.join("; ")] as const] : []),
            ]}
          />

          {d.preCp1.assets.length > 0 && <Group title="Tài nguyên sẵn có" rows={d.preCp1.assets} />}

          {(d.preCp1.verdict || d.preCp1.flags.length > 0 || d.preCp1.recruit.length > 0) && (
            <Group
              title="Đánh giá Pre-CP1"
              rows={[
                ...(d.preCp1.verdict
                  ? [[d.preCp1.verdict.title, d.preCp1.verdict.detail] as const]
                  : []),
                ...d.preCp1.flags.map((f): Row => [f.title, [f.reason, f.fix].filter(Boolean).join(" → ")]),
                ...d.preCp1.recruit.map((r): Row => [`Nên tìm: ${r.title}`, r.why]),
              ]}
            />
          )}
        </>
      )}
    </div>
  );
}
