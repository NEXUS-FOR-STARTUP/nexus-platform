'use client';

import { Plus } from 'lucide-react';
import type { TeamMemberInput } from '../hooks/useTeamFitMutation';
import TeamMemberCard from './TeamMemberCard';

const MAX_MEMBERS = 6;

// Thành viên mới luôn ở trạng thái nháp: mảng nghề rỗng buộc người dùng chọn,
// schema chặn lúc nộp kèm lỗi tiếng Việt (giống major rỗng hiện tại).
const EMPTY_ROLE_TRACK = '' as TeamMemberInput['roleTrack'];

interface TeamInputStepProps {
  members: TeamMemberInput[];
  onChange: (members: TeamMemberInput[]) => void;
}

export default function TeamInputStep({ members, onChange }: TeamInputStepProps) {
  const addMember = () => {
    if (members.length >= MAX_MEMBERS) return;
    onChange([
      ...members,
      { roleTrack: EMPTY_ROLE_TRACK, major: '', strengths: [], experience: [] },
    ]);
  };

  const updateMember = (index: number, partial: Partial<TeamMemberInput>) => {
    const next = members.map((m, i) => (i === index ? { ...m, ...partial } : m));
    onChange(next);
  };

  const removeMember = (index: number) => {
    onChange(members.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h3 className="text-text-app text-base font-semibold">
          Thành viên nhóm
        </h3>
      </div>
      {members.length === 0 ? (
        <div className="text-center py-10 px-4 border-2 border-dashed border-border-app/70 rounded-xl space-y-3">
          <p className="text-text-app text-sm font-semibold">
            Chưa có thành viên
          </p>
          <button
            type="button"
            onClick={addMember}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white font-medium text-xs rounded-lg hover:bg-brand/90 transition-colors cursor-pointer"
          >
            <Plus size={15} />
            Thêm thành viên
          </button>
        </div>
      ) : (
        members.map((member, index) => (
          <TeamMemberCard
            key={index}
            member={member}
            index={index}
            onUpdate={updateMember}
            onRemove={removeMember}
          />
        ))
      )}

      {members.length > 0 && (
        <button
          type="button"
          onClick={addMember}
          disabled={members.length >= MAX_MEMBERS}
          className="w-full py-3 border-2 border-dashed border-brand/30 hover:border-brand bg-brand/10 hover:bg-brand/20 text-brand font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          Thêm thành viên ({members.length}/{MAX_MEMBERS})
        </button>
      )}
    </div>
  );
}
