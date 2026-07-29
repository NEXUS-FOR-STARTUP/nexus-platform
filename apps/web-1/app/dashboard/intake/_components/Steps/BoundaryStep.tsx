"use client";

import React from "react";
import { Checkbox, Tooltip, Alert } from "@mantine/core";
import { AlertTriangle, HelpCircle } from "lucide-react";

interface BoundaryStepProps {
  form: any;
  values: any;
}

const BOUNDARY_RULES = [
  { id: "originality", label: "Chúng tôi cam kết tài liệu đính kèm là do nhóm tự nghiên cứu và xây dựng, không sao chép trái phép." },
  { id: "advisory_only", label: "Chúng tôi hiểu rằng các đánh giá và phản biện từ Nexus mang tính chất tư vấn phản biện, không thay thế điểm số của giảng viên." },
  { id: "accurate_contact", label: "Chúng tôi cam kết cung cấp đúng thông tin liên hệ để Supporter trao đổi khi cần làm rõ hồ sơ." }
];

export default function BoundaryStep({ form, values }: BoundaryStepProps) {
  return (
    <div className="space-y-5 font-body">
      <div className="flex items-center gap-1.5 pb-1">
        <h3 className="font-heading text-base font-semibold text-text-app">Cam kết ranh giới</h3>
        <Tooltip
          label="Đọc kỹ và tích chọn tất cả các cam kết dưới đây."
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
        color="red"
        radius="md"
        title="ĐIỀU KHOẢN QUAN TRỌNG"
        icon={<AlertTriangle className="w-4 h-4" />}
      >
        Bạn cần xác nhận các cam kết bên dưới để gửi hồ sơ. Nexus từ chối hỗ trợ tài liệu sao chép hoặc yêu cầu cam kết điểm số/kết quả đánh giá chính thức.
      </Alert>

      <form.Field
        name="boundary_confirmations"
        validators={{
          onChange: ({ value }: { value: string[] }) => {
            if (!value || value.length < 3) {
              return "Bạn phải tích chọn tất cả cam kết để có thể gửi hồ sơ.";
            }
            return undefined;
          },
        }}
      >
        {(field: any) => {
          const currentConfirmations = field.state.value || [];
          const hasError = !!field.state.meta.errors.length;

          return (
            <div className="space-y-3">
              <div className={`p-4 border rounded-xl space-y-3 transition-all bg-surface-soft/60 ${
                hasError && currentConfirmations.length === 0
                  ? "border-danger shadow-sm" 
                  : "border-border-strong"
              }`}>
                {BOUNDARY_RULES.map((rule) => {
                  const isChecked = currentConfirmations.includes(rule.id);
                  return (
                    <Checkbox
                      key={rule.id}
                      checked={isChecked}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked;
                        const next = checked
                          ? [...currentConfirmations, rule.id]
                          : currentConfirmations.filter((id: string) => id !== rule.id);
                        field.handleChange(next);
                      }}
                      label={rule.label}
                      size="sm"
                      radius="sm"
                      className="py-1"
                    />
                  );
                })}
              </div>
              {hasError && (
                <p className="text-xs text-red-500 font-body pl-1 mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          );
        }}
      </form.Field>
    </div>
  );
}
