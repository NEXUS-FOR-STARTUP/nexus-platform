import { TextInput, TagsInput } from '@mantine/core';
import { Trash2 } from 'lucide-react';

interface TeamMember {
  major: string;
  strengths: string[];
  experience: string[];
}

interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
  onUpdate: (index: number, partial: Partial<TeamMember>) => void;
  onRemove: (index: number) => void;
}

export default function TeamMemberCard({
  member,
  index,
  onUpdate,
  onRemove,
}: TeamMemberCardProps) {
  return (
    <div className="bg-surface-app border border-border-app rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-app pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand text-white font-bold text-xs shrink-0">
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
        {/* Chuyên ngành */}
        <div>
          <label className="text-text-app text-sm font-medium mb-1.5 block">
            Chuyên ngành <span className="text-red-500">*</span>
          </label>
          <TextInput
            placeholder="Ví dụ: Fullstack Developer, Product Manager..."
            value={member.major}
            onChange={(e) => onUpdate(index, { major: e.currentTarget.value })}
            classNames={{
              input:
                'border-border-app bg-surface-app text-text-app focus:border-brand rounded-lg text-sm',
            }}
          />
        </div>

        {/* Sở trường */}
        <TagsInput
          label={<>Sở trường <span className="text-red-500">*</span></>}
          placeholder="Nhập sở trường và nhấn Enter"
          value={member.strengths}
          onChange={(val) => onUpdate(index, { strengths: val })}
          maxTags={10}
          clearable
          size="sm"
          classNames={{
            input:
              'border-border-app bg-surface-app min-h-[42px] py-1 rounded-lg',
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
              'border-border-app bg-surface-app min-h-[42px] py-1 rounded-lg',
            label: 'text-text-app text-sm font-medium mb-1.5',
            pill: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-md border border-blue-500/20 h-7 m-[2px]',
            inputField: 'placeholder:text-text-muted text-sm',
          }}
        />
      </div>
    </div>
  );
}
