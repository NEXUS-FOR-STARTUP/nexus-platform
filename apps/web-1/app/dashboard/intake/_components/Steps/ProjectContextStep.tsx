"use client";

import React from "react";
import { TextInput, Textarea, Tooltip, Select } from "@mantine/core";
import { HelpCircle } from "lucide-react";

interface ProjectContextStepProps {
  form: any;
  values: any;
}

export default function ProjectContextStep({ form, values }: ProjectContextStepProps) {
  return (
    <div className="space-y-5 font-body">
      <div className="flex items-center gap-1.5 pb-1">
        <h3 className="font-heading text-base font-semibold text-text-app">Thông tin Nhóm / Đề tài</h3>
        <Tooltip
          label="Thông tin bối cảnh học tập và hoạt động của nhóm."
          position="top"
          withArrow
        >
          <span className="flex items-center">
            <HelpCircle className="w-4 h-4 text-text-muted hover:text-text-app cursor-help" />
          </span>
        </Tooltip>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Trường học */}
        <form.Field
          name="school"
          validators={{
            onChange: ({ value }: { value: string }) => {
              if (!value) return "Vui lòng chọn trường học.";
              return undefined;
            },
          }}
        >
          {(field: any) => {
            const hasError = (field.state.meta.isTouched || !!field.state.value) && !!field.state.meta.errors.length;
            return (
              <Select
                label="Trường học"
                placeholder="Chọn trường học"
                data={[
                  { value: "Đại học FPT", label: "Đại học FPT" },
                  { value: "Khác", label: "Khác" },
                ]}
                value={field.state.value || null}
                onChange={(val) => {
                  field.handleChange(val || "");
                  if (val === "Khác") {
                    form.setFieldValue("course_context", "Khác");
                    form.setFieldValue("team_context.group_no", "Khác");
                  } else if (val === "Đại học FPT") {
                    form.setFieldValue("course_context", "");
                    form.setFieldValue("team_context.group_no", "");
                  }
                }}
                error={hasError ? field.state.meta.errors[0] : undefined}
                radius="md"
                withAsterisk
              />
            );
          }}
        </form.Field>

        {/* 2. Mã môn học */}
        <form.Field
          name="course_context"
          validators={{
            onChange: ({ value }: { value: string }) => {
              if (!value) return "Vui lòng chọn mã môn học.";
              return undefined;
            },
          }}
        >
          {(field: any) => {
            const hasError = (field.state.meta.isTouched || !!field.state.value) && !!field.state.meta.errors.length;
            const schoolVal = values.school;
            const options =
              schoolVal === "Đại học FPT"
                ? [
                    { value: "EXE101", label: "EXE101" },
                    { value: "Khác", label: "Khác" },
                  ]
                : [{ value: "Khác", label: "Khác" }];

            return (
              <Select
                label="Mã môn học"
                placeholder="Chọn mã môn học"
                data={options}
                value={field.state.value || null}
                onChange={(val) => {
                  field.handleChange(val || "");
                  if (val === "Khác") {
                    form.setFieldValue("team_context.group_no", "Khác");
                  } else {
                    form.setFieldValue("team_context.group_no", "");
                  }
                }}
                error={hasError ? field.state.meta.errors[0] : undefined}
                radius="md"
                disabled={!schoolVal}
                withAsterisk
              />
            );
          }}
        </form.Field>

        {/* 3. Số thứ tự nhóm (Chỉ hiển thị nếu là Đại học FPT và môn EXE101) */}
        {values.school === "Đại học FPT" && values.course_context === "EXE101" && (
          <form.Field
            name="team_context.group_no"
            validators={{
              onChange: ({ value }: { value: string }) => {
                const text = typeof value === "string" ? value.trim() : "";
                if (!text) return "Số thứ tự nhóm là bắt buộc.";
                if (!/^\d+$/.test(text)) {
                  return "Số thứ tự nhóm chỉ được chứa chữ số (ví dụ: 5).";
                }
                return undefined;
              },
            }}
          >
            {(field: any) => {
              const hasError = (field.state.meta.isTouched || !!field.state.value) && !!field.state.meta.errors.length;
              return (
                <TextInput
                  label="Số thứ tự nhóm (Group No)"
                  placeholder="Ví dụ: 5"
                  value={field.state.value || ""}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                  error={hasError ? field.state.meta.errors[0] : undefined}
                  radius="md"
                  withAsterisk
                />
              );
            }}
          </form.Field>
        )}

        {/* 4. Tên đề tài */}
        <div className={values.school === "Đại học FPT" && values.course_context === "EXE101" ? "" : "md:col-span-2"}>
          <form.Field
            name="team_context.project_name"
            validators={{
              onChange: ({ value }: { value: string }) => {
                const text = typeof value === "string" ? value.trim() : "";
                if (!text) return "Tên đề tài là bắt buộc.";
                return undefined;
              },
            }}
          >
            {(field: any) => {
              const hasError = (field.state.meta.isTouched || !!field.state.value) && !!field.state.meta.errors.length;
              return (
                <TextInput
                  label="Tên đề tài"
                  placeholder="Ví dụ: EduMap"
                  value={field.state.value || ""}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                  error={hasError ? field.state.meta.errors[0] : undefined}
                  description="Tên đề tài có thể thay đổi sau trong phần Cài đặt."
                  radius="md"
                  withAsterisk
                />
              );
            }}
          </form.Field>
        </div>

        {/* 5. Tóm tắt hiện trạng nhóm */}
        <form.Field name="team_context.team_status_summary">
          {(field: any) => (
            <div className="md:col-span-2">
              <Textarea
                label={
                  <div className="flex items-center gap-1.5">
                    <span>Tóm tắt hiện trạng nhóm</span>
                    <Tooltip
                      label="Mô tả ngắn gọn về tình hình hiện tại (ví dụ: đã phân chia công việc xong, đang gặp khó khăn trong thống nhất ý tưởng...)."
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
                placeholder="Ví dụ: Nhóm đã thống nhất ý tưởng, đang viết đề cương phân tích thị trường..."
                value={field.state.value || ""}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => field.handleChange(e.target.value)}
                minRows={2}
                autosize
                radius="md"
              />
            </div>
          )}
        </form.Field>
      </div>
    </div>
  );
}
