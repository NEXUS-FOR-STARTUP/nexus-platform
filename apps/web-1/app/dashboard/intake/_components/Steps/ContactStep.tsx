"use client";

import React from "react";
import { TextInput, Text, Tooltip } from "@mantine/core";
import { HelpCircle } from "lucide-react";

const SHORT_MAX = 100;
const EMAIL_MAX = 254;

const charCounter = (value: string, max: number) => (
  <Text size="xs" c="dimmed" className="pointer-events-none">
    {(value || "").length}/{max}
  </Text>
);

interface ContactStepProps {
  form: any;
  values: any;
}

export default function ContactStep({ form, values }: ContactStepProps) {
  return (
    <div className="space-y-5 font-body">
      <div className="flex items-center gap-1.5 pb-1">
        <h3 className="font-heading text-base font-semibold text-text-app">Thông tin người liên hệ</h3>
        <Tooltip
          label="Thông tin của bạn để Supporter tiện liên hệ hỗ trợ khi cần thiết."
          position="top"
          withArrow
        >
          <span className="flex items-center">
            <HelpCircle className="w-4 h-4 text-text-muted hover:text-text-app cursor-help" />
          </span>
        </Tooltip>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field
          name="contact.full_name"
          validators={{
            onChange: ({ value }: { value: string }) => {
              if (!value) return "Họ và tên là bắt buộc.";
              if (value.trim().length < 2) return "Họ và tên tối thiểu phải 2 ký tự.";
              if (value.length > SHORT_MAX) return `Họ và tên không được vượt quá ${SHORT_MAX} ký tự.`;
              return undefined;
            },
          }}
        >
          {(field: any) => {
            const hasError = (field.state.meta.isTouched || !!field.state.value) && !!field.state.meta.errors.length;
            return (
              <TextInput
                withAsterisk
                label="Họ và tên"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={field.state.value || ""}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                error={hasError ? field.state.meta.errors[0] : undefined}
                maxLength={SHORT_MAX}
                rightSection={charCounter(field.state.value || "", SHORT_MAX)}
                rightSectionWidth={64}
                radius="md"
              />
            );
          }}
        </form.Field>

        <form.Field
          name="contact.student_code"
          validators={{
            onChange: ({ value }: { value: string }) => {
              if (!value) return "Mã số sinh viên là bắt buộc.";
              if (value.trim().length < 5) return "Mã số sinh viên tối thiểu phải 5 ký tự.";
              if (value.length > SHORT_MAX) return `Mã số sinh viên không được vượt quá ${SHORT_MAX} ký tự.`;
              return undefined;
            },
          }}
        >
          {(field: any) => {
            const hasError = (field.state.meta.isTouched || !!field.state.value) && !!field.state.meta.errors.length;
            return (
              <TextInput
                label={
                  <div className="flex items-center gap-1.5">
                    <span>Mã số sinh viên <span className="text-red-500">*</span></span>
                    <Tooltip
                      label="Nhập mã số sinh viên của bạn (ví dụ: HE150123) để xác thực bối cảnh Campus."
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
                placeholder="Ví dụ: HE150123"
                value={field.state.value || ""}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                error={hasError ? field.state.meta.errors[0] : undefined}
                maxLength={SHORT_MAX}
                rightSection={charCounter(field.state.value || "", SHORT_MAX)}
                rightSectionWidth={64}
                radius="md"
              />
            );
          }}
        </form.Field>

        <form.Field
          name="contact.team_role"
          validators={{
            onChange: ({ value }: { value: string }) => {
              if (!value || !value.trim()) return "Vai trò trong nhóm là bắt buộc.";
              if (value.length > SHORT_MAX) return `Vai trò trong nhóm không được vượt quá ${SHORT_MAX} ký tự.`;
              return undefined;
            },
          }}
        >
          {(field: any) => {
            const hasError = (field.state.meta.isTouched || !!field.state.value) && !!field.state.meta.errors.length;
            return (
              <TextInput
                label={
                  <div className="flex items-center gap-1.5">
                    <span>Vai trò trong nhóm <span className="text-red-500">*</span></span>
                    <Tooltip
                      label="Nhập vai trò của bạn trong nhóm (ví dụ: Trưởng nhóm, Coder, Pitcher, Designer...)."
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
                placeholder="Ví dụ: Leader, Coder, Pitcher..."
                value={field.state.value || ""}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                error={hasError ? field.state.meta.errors[0] : undefined}
                maxLength={SHORT_MAX}
                rightSection={charCounter(field.state.value || "", SHORT_MAX)}
                rightSectionWidth={64}
                radius="md"
              />
            );
          }}
        </form.Field>

        <form.Field
          name="contact.zalo"
          validators={{
            onChange: ({ value }: { value: string }) => {
              if (!value) return "Số điện thoại Zalo là bắt buộc.";
              if (!/^\d{10}$/.test(value.trim())) return "Số điện thoại Zalo phải bao gồm chính xác 10 chữ số.";
              return undefined;
            },
          }}
        >
          {(field: any) => {
            const hasError = (field.state.meta.isTouched || !!field.state.value) && !!field.state.meta.errors.length;
            return (
              <TextInput
                label={
                  <div className="flex items-center gap-1.5">
                    <span>Số điện thoại Zalo <span className="text-red-500">*</span></span>
                    <Tooltip
                      label="Cung cấp chính xác SĐT Zalo gồm 10 chữ số để supporter liên hệ nhanh khi cần thiết."
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
                placeholder="Ví dụ: 0987654321"
                value={field.state.value || ""}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                error={hasError ? field.state.meta.errors[0] : undefined}
                radius="md"
              />
            );
          }}
        </form.Field>

        <form.Field
          name="contact.email"
          validators={{
            onChange: ({ value }: { value: string }) => {
              if (!value) return "Email liên hệ là bắt buộc.";
              if (!value.includes("@")) return "Email không đúng định dạng.";
              if (value.length > EMAIL_MAX) return `Email liên hệ không được vượt quá ${EMAIL_MAX} ký tự.`;
              return undefined;
            },
          }}
        >
          {(field: any) => {
            const hasError = (field.state.meta.isTouched || !!field.state.value) && !!field.state.meta.errors.length;
            return (
              <div className="md:col-span-2">
                <TextInput
                  withAsterisk
                  type="email"
                  label="Email liên hệ"
                  placeholder="Ví dụ: anvhe150123@fpt.edu.vn"
                  value={field.state.value || ""}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                  error={hasError ? field.state.meta.errors[0] : undefined}
                  maxLength={EMAIL_MAX}
                  rightSection={charCounter(field.state.value || "", EMAIL_MAX)}
                  rightSectionWidth={64}
                  radius="md"
                />
              </div>
            );
          }}
        </form.Field>

        <form.Field name="contact.telegram">
          {(field: any) => (
            <div className="md:col-span-2">
              <TextInput
                label="Telegram Username (Tùy chọn)"
                placeholder="Ví dụ: @annguyen_fpt"
                value={field.state.value || ""}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                radius="md"
              />
            </div>
          )}
        </form.Field>
      </div>
    </div>
  );
}
