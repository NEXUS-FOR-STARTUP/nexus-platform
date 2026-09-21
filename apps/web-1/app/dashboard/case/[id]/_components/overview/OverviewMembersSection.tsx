"use client";

interface TeamMemberItem {
  fullName?: string;
  name?: string;
  major?: string;
  role?: string;
  skills?: string;
  strengths?: string[];
  experience?: string[] | string;
}

interface OverviewMembersSectionProps {
  members: TeamMemberItem[];
}

export default function OverviewMembersSection({ members }: OverviewMembersSectionProps) {
  if (!members || members.length === 0) return null;

  return (
    <div className="bg-surface-app border border-border-app rounded-xl p-5 space-y-4">
      <div className="pb-2.5 border-b border-border-app/60">
        <h3 className="font-heading text-base font-semibold text-text-app tracking-tight">
          Thành viên đội ngũ ({members.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {members.map((m, i) => {
          const expText = Array.isArray(m.experience) ? m.experience.join(", ") : m.experience;
          const strengthsText = Array.isArray(m.strengths) ? m.strengths.join(", ") : undefined;

          return (
            <div
              key={i}
              className="p-3.5 bg-surface-soft/40 border border-border-app/60 rounded-lg space-y-1.5"
            >
              <p className="font-medium text-text-app text-sm">
                {m.fullName || m.name || `Thành viên ${i + 1}`}
              </p>
              <p className="text-text-muted text-xs leading-relaxed">
                Chuyên môn: {m.major || m.role || "Chưa cập nhật"}
              </p>
              {m.skills && (
                <p className="text-text-muted text-xs leading-relaxed">
                  Kỹ năng: {m.skills}
                </p>
              )}
              {strengthsText && (
                <p className="text-text-muted text-xs leading-relaxed">
                  Thế mạnh: {strengthsText}
                </p>
              )}
              {expText && (
                <p className="text-text-muted text-xs leading-relaxed">
                  Kinh nghiệm: {expText}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
