"use client";

import { Alert, Textarea, Tooltip } from "@mantine/core";
import { HelpCircle, Info } from "lucide-react";

interface SituationStepProps {
  form: any;
  values: any;
}

export default function SituationStep({ form, values }: SituationStepProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 pb-1">
        <h3 className="font-heading text-base font-semibold text-text-app">Nhóm đang kẹt ở đâu?</h3>
        <Tooltip
          label="Mô tả ngắn gọn nút thắt hiện tại để Supporter tập trung giải quyết."
          position="top"
          withArrow
        >
          <span className="flex items-center">
            <HelpCircle className="w-4 h-4 text-text-muted hover:text-text-app cursor-help" />
          </span>
        </Tooltip>
      </div>

      <Alert
        variant="light"
        color="blue"
        radius="md"
        title="Lưu ý quan trọng"
        icon={<Info className="w-4 h-4" />}
      >
        Không cần viết lại proposal. Chỉ nói ngắn gọn nút thắt hiện tại: giảng viên chê gì, đội đang bí gì, hoặc cần Supporter phản biện phần nào ngay bây giờ.
      </Alert>

      <div className="space-y-4">
        <form.Field
          name="current_blocker"
          validators={{
            onChange: ({ value }: { value: string }) => {
              const text = typeof value === "string" ? value.trim() : "";
              if (!text) return "Mô tả điểm kẹt hiện tại là bắt buộc.";
              if (text.length < 10) return "Mô tả điểm kẹt hiện tại tối thiểu 10 ký tự.";
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
                    <span>Điểm kẹt hiện tại <span className="text-red-500">*</span></span>
                    <Tooltip
                      label="Ví dụ: nhóm bị chê phần customer pain chưa rõ, logic solution còn yếu, hoặc cần phản biện giúp trước deadline thứ 5."
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
                placeholder="Ví dụ: Giảng viên nói phần customer segment còn mơ hồ, cần supporter phản biện giúp trước thứ 5."
                value={field.state.value || ""}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => field.handleChange(e.target.value)}
                error={hasError ? field.state.meta.errors[0] : undefined}
                minRows={4}
                autosize
                radius="md"
              />
            );
          }}
        </form.Field>
      </div>
    </div>
  );
}
