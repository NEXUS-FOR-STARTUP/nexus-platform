import { TextInput, TagsInput, Select } from '@mantine/core';
import { Trash2 } from 'lucide-react';
import {
  ROLE_TRACK_CODES,
  ROLE_TRACK_LABELS,
  type RoleTrackCode,
} from '@repo/validation';
import type { TeamMemberInput } from '../hooks/useTeamFitMutation';

interface TeamMemberCardProps {
  member: TeamMemberInput;
  index: number;
  onUpdate: (index: number, partial: Partial<TeamMemberInput>) => void;
  onRemove: (index: number) => void;
}

const ROLE_TRACK_OPTIONS = ROLE_TRACK_CODES.map((code) => ({
  value: code,
  label: ROLE_TRACK_LABELS[code],
}));

// Dữ liệu nháp (kể cả draft cũ trong localStorage) có thể chưa chọn mảng nghề:
// giữ rỗng để người dùng chọn lại, schema chặn lúc nộp kèm lỗi tiếng Việt.
const EMPTY_ROLE_TRACK = '' as RoleTrackCode;

const ACCENT_COLORS = [
  { border: 'border-l-emerald-500', bg: 'bg-emerald-500/5', badge: 'bg-emerald-500' },
  { border: 'border-l-violet-500', bg: 'bg-violet-500/5', badge: 'bg-violet-500' },
  { border: 'border-l-amber-500', bg: 'bg-amber-500/5', badge: 'bg-amber-500' },
  { border: 'border-l-cyan-500', bg: 'bg-cyan-500/5', badge: 'bg-cyan-500' },
  { border: 'border-l-rose-500', bg: 'bg-rose-500/5', badge: 'bg-rose-500' },
  { border: 'border-l-indigo-500', bg: 'bg-indigo-500/5', badge: 'bg-indigo-500' },
];

export default function TeamMemberCard({
  member,
  index,
  onUpdate,
  onRemove,
}: TeamMemberCardProps) {
  const color = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <div
      className={`bg-surface-app border border-border-app rounded-xl p-5 space-y-4 border-l-4 ${color.border} ${color.bg}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-app pb-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex items-center justify-center w-7 h-7 rounded-full ${color.badge} text-white font-semibold text-xs shrink-0`}
          >
            {index + 1}
          </span>
          <h3 className="text-text-app font-semibold text-base">Thành viên {index + 1}</h3>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-text-muted hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
          title="Xóa thành viên"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        {/* Mảng nghề */}
        <Select
          label={<>Mảng nghề <span className="text-red-500">*</span></>}
          placeholder="Chọn mảng nghề chính của thành viên"
          data={ROLE_TRACK_OPTIONS}
          value={member.roleTrack ?? EMPTY_ROLE_TRACK}
          onChange={(value) => {
            if (!value) return; // bắt buộc chọn — không cho bỏ trống
            onUpdate(index, { roleTrack: value });
          }}
          allowDeselect={false}
          size="sm"
          classNames={{
            input:
              'border-border-app bg-white dark:bg-surface-app min-h-[42px] py-1 rounded-lg text-sm',
            label: 'text-text-app text-sm font-medium mb-1.5',
          }}
        />

        {/* Chuyên ngành đào tạo */}
        <div>
          <label className="text-text-app text-sm font-medium mb-1.5 block">
            Chuyên ngành đào tạo <span className="text-red-500">*</span>
          </label>
          <TextInput
            placeholder="Ví dụ: Kỹ thuật phần mềm, Quản trị kinh doanh"
            value={member.major}
            onChange={(e) => onUpdate(index, { major: e.currentTarget.value })}
            classNames={{
              input:
                'border-border-app bg-white dark:bg-surface-app text-text-app focus:border-brand rounded-lg text-sm',
            }}
          />
        </div>

        {/* Thế mạnh / kỹ năng nổi bật */}
        <TagsInput
          label={<>Thế mạnh / kỹ năng nổi bật <span className="text-red-500">*</span></>}
          placeholder="Nhập kỹ năng nổi bật và nhấn Enter"
          value={member.strengths}
          onChange={(val) => onUpdate(index, { strengths: val })}
          maxTags={10}
          clearable
          size="sm"
          classNames={{
            input:
              'border-border-app bg-white dark:bg-surface-app min-h-[42px] py-1 rounded-lg',
            label: 'text-text-app text-sm font-medium mb-1.5',
            pill: 'bg-brand/15 text-brand text-xs font-medium rounded-md border border-brand/20 h-7 m-[2px]',
            inputField: 'placeholder:text-text-muted text-sm',
          }}
        />

        {/* Kinh nghiệm */}
        <TagsInput
          label="Kinh nghiệm"
          placeholder="Nhập kinh nghiệm và nhấn Enter"
          value={member.experience}
          onChange={(val) => onUpdate(index, { experience: val })}
          maxTags={10}
          clearable
          size="sm"
          classNames={{
            input:
              'border-border-app bg-white dark:bg-surface-app min-h-[42px] py-1 rounded-lg',
            label: 'text-text-app text-sm font-medium mb-1.5',
            pill: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-md border border-blue-500/20 h-7 m-[2px]',
            inputField: 'placeholder:text-text-muted text-sm',
          }}
        />
      </div>
    </div>
  );
}
