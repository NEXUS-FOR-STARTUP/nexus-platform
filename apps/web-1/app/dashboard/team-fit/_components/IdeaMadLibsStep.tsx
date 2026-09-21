'use client';

import { Fragment } from 'react';
import { AlertTriangle } from 'lucide-react';
import InlineBlank from './InlineBlank';

type IdeaMadLibsStepProps = {
  blanks: Record<string, string>;
  onChange: (key: string, val: string) => void;
  errors?: Record<string, string>;
  onBlur?: (key: string) => void;
};

const MADLIBS_TEMPLATE = [
  { text: 'Dự án của chúng tôi tên là', blank: 'projectName', placeholder: 'Ví dụ: Nền tảng tìm bạn cùng phòng' },
  { text: ', thuộc lĩnh vực', blank: 'field', placeholder: 'Ví dụ: EdTech, Thương mại điện tử...' },
  { text: '. Chúng tôi giúp', blank: 'targetCustomer', placeholder: 'Ví dụ: Sinh viên đại học năm nhất' },
  { text: 'giải quyết', blank: 'problem', placeholder: 'Ví dụ: Khó khăn trong việc tìm người ở ghép phù hợp lối sống' },
  { text: 'bằng cách', blank: 'solution', placeholder: 'Ví dụ: Ứng dụng gợi ý ghép phòng theo thói quen sinh hoạt' },
  { text: '. Sản phẩm khả dụng đầu tiên (MVP) sẽ là', blank: 'mvp', placeholder: 'Ví dụ: Landing page và nhóm kết nối thủ công' },
  { text: '.' },
];

const FIELD_LABELS: Record<string, string> = {
  projectName: 'Tên dự án',
  field: 'Lĩnh vực',
  targetCustomer: 'Khách hàng mục tiêu',
  problem: 'Vấn đề',
  solution: 'Giải pháp',
  mvp: 'MVP',
};

export default function IdeaMadLibsStep({ blanks, onChange, errors = {}, onBlur }: IdeaMadLibsStepProps) {
  return (
    <div className="space-y-4 py-1 sm:py-2">
      <p className="font-body text-xs sm:text-sm text-text-muted">
        Hoàn thành các câu bên dưới để định hình nhanh bài toán dự án đang giải quyết.
      </p>
      {/* Main Pitch MadLibs paragraph */}
      <p className="font-body text-base sm:text-lg leading-relaxed sm:leading-loose text-text-app select-text break-words">
        {MADLIBS_TEMPLATE.map((item, idx) => {
          const nextItem = MADLIBS_TEMPLATE[idx + 1];
          const nextStartsWithPunct = nextItem && /^[,.]/.test(nextItem.text);
          const error = item.blank ? errors[item.blank] : undefined;

          return (
            <Fragment key={idx}>
              <span>{item.text}</span>
              {item.blank && (
                <>
                  {' '}
                  <InlineBlank
                    value={blanks[item.blank] ?? ''}
                    onChange={(val: string) => onChange(item.blank as string, val)}
                    placeholder={item.placeholder}
                    onBlurField={() => onBlur?.(item.blank as string)}
                    hasError={!!error}
                    errorMessage={error}
                  />
                </>
              )}
              {nextItem && !nextStartsWithPunct && ' '}
            </Fragment>
          );
        })}
      </p>

      {/* Summary of all errors below the template */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Thông tin cần hoàn thiện:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm pl-1">
            {Object.entries(errors).map(([key, msg]) => (
              <li key={key} className="text-red-600 dark:text-red-400">
                <span className="font-medium">{FIELD_LABELS[key] ?? key}:</span> {msg}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


