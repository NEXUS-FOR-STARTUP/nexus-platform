"use client";

import React from "react";
import { Select, Textarea, Tooltip } from "@mantine/core";
import { HelpCircle } from "lucide-react";

interface SupportNeedsStepProps {
  form: any;
  values: any;
}

const PRIMARY_NEEDS = [
  { key: "filter_select_idea", label: "Cần hỗ trợ chọn hướng ý tưởng phù hợp để phát triển tiếp" },
  { key: "clarify_customer_pain", label: "Cần phản biện để làm rõ khách hàng mục tiêu và vấn đề cốt lõi" },
  { key: "critique_feasibility", label: "Cần phản biện để đánh giá giải pháp hiện tại có hợp lý và khả thi không" },
  { key: "audit_cp1_draft", label: "Cần rà soát báo cáo Checkpoint 1 và chỉ ra điểm cần chỉnh sửa" },
  { key: "improve_rejected_idea", label: "Cần góp ý để cải thiện ý tưởng sau phản hồi chưa tốt từ giảng viên" },
];

const PRIMARY_NEED_MAX = 100;

export default function SupportNeedsStep({ form, values }: SupportNeedsStepProps) {
  return (
    <div className="space-y-5 font-body">
      <div className="flex items-center gap-1.5 pb-1">
        <h3 className="font-heading text-base font-semibold text-text-app">Nhu cầu hỗ trợ</h3>
        <Tooltip
          label="Chỉ cần chọn hướng hỗ trợ chính. Phần ghi chú thêm và kỳ vọng đầu ra là tùy chọn."
          position="top"
          multiline
          w={240}
          withArrow
        >
          <span className="flex items-center">
            <HelpCircle className="w-4 h-4 text-text-muted hover:text-text-app cursor-help" />
          </span>
        </Tooltip>
      </div>

      <div className="space-y-4">
        <form.Field
          name="support_needs.primary_need"
          validators={{
            onChange: ({ value }: { value: string }) => {
              if (!value) return "Nhu cầu hỗ trợ chính là bắt buộc.";
              if (value.length > PRIMARY_NEED_MAX) return `Nhu cầu hỗ trợ chính không được vượt quá ${PRIMARY_NEED_MAX} ký tự.`;
              return undefined;
            },
          }}
        >
          {(field: any) => {
            const hasError = (field.state.meta.isTouched || !!field.state.value) && !!field.state.meta.errors.length;
            return (
              <Select
                withAsterisk
                label="Nhu cầu hỗ trợ chính"
                placeholder="Chọn nhu cầu chính của nhóm bạn"
                data={PRIMARY_NEEDS.map((item) => ({ value: item.key, label: item.label }))}
                value={field.state.value || null}
                onChange={(val) => field.handleChange(val || "")}
                error={hasError ? field.state.meta.errors[0] : undefined}
                radius="md"
                comboboxProps={{ withinPortal: false }}
              />
            );
          }}
        </form.Field>

        <form.Field
          name="expected_outputs"
          validators={{
            onChange: ({ value }: { value: string }) => {
              if (value && value.trim().length > 0 && value.trim().length < 5) {
                return "Vui lòng mô tả chi tiết kỳ vọng đầu ra (tối thiểu 5 ký tự).";
              }
              return undefined;
            },
          }}
        >
          {(field: any) => {
            const hasError = (field.state.meta.isTouched || !!field.state.value) && !!field.state.meta.errors.length;
            return (
              <Textarea
                label={
                  <div className="flex items-center gap-1.5">
                    <span>Kết quả mong đợi sau phản biện (Tùy chọn)</span>
                    <Tooltip
                      label="Nếu muốn, hãy nói rõ supporter nên trả về dạng góp ý nào: chỉ điểm yếu logic, hỏi câu phản biện, hay gợi ý cách sửa."
                      multiline
                      w={220}
                      withArrow
                    >
                      <span className="flex items-center">
                        <HelpCircle className="w-3.5 h-3.5 text-text-muted hover:text-text-app cursor-help" />
                      </span>
                    </Tooltip>
                  </div>
                }
                placeholder="Ví dụ: Chỉ ra các điểm yếu chính trong logic khách hàng mục tiêu và đề xuất câu hỏi phản biện cụ thể..."
                value={field.state.value || ""}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => field.handleChange(e.target.value)}
                error={hasError ? field.state.meta.errors[0] : undefined}
                minRows={3}
                autosize
                radius="md"
              />
            );
          }}
        </form.Field>

        <form.Field name="support_needs.extra_notes">
          {(field: any) => (
            <Textarea
              label="Ghi chú thêm cho Supporter (Tùy chọn)"
              placeholder="Bất kỳ thông tin bổ sung nào khác giúp Supporter hiểu rõ hơn vấn đề của nhóm."
              value={field.state.value || ""}
              onBlur={field.handleBlur}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => field.handleChange(e.target.value)}
              minRows={2}
              autosize
              radius="md"
            />
          )}
        </form.Field>
      </div>
    </div>
  );
}
