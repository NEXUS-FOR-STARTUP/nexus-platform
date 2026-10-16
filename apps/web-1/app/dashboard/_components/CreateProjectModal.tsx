"use client";

import { useState } from "react";
import { Modal, TextInput, Select, Stack, Button, Group } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { apiClient } from "@/lib/api-client";
import { EMPTY_CASE_CONTACT, validateCaseContact, type CaseContactValues } from "./case-contact";

interface CreateProjectModalProps {
  opened: boolean;
  onClose: () => void;
}

const FPT_SCHOOL = "Đại học FPT";
const OTHER_VALUE = "Khác";
const EXE101_COURSE = "EXE101";

const SCHOOL_OPTIONS = [
  { value: FPT_SCHOOL, label: FPT_SCHOOL },
  { value: OTHER_VALUE, label: OTHER_VALUE },
];

const COURSE_OPTIONS = [
  { value: EXE101_COURSE, label: EXE101_COURSE },
  { value: OTHER_VALUE, label: OTHER_VALUE },
];

export function CreateProjectModal({ opened, onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [projectName, setProjectName] = useState("");
  const [school, setSchool] = useState("");
  const [courseContext, setCourseContext] = useState("");
  const [groupNo, setGroupNo] = useState("");
  const [contact, setContact] = useState<CaseContactValues>(EMPTY_CASE_CONTACT);
  const [submitted, setSubmitted] = useState(false);

  // Class and group number only apply to FPT students; other schools store "Khác"
  // so the project card still has a course label. Group number is only asked for
  // EXE101 - other FPT courses have no numbered groups (mirrors the intake step).
  const isFpt = school === FPT_SCHOOL;
  const asksGroupNo = isFpt && courseContext === EXE101_COURSE;

  const errors = {
    projectName: projectName.trim() ? "" : "Vui lòng nhập tên dự án.",
    school: school ? "" : "Vui lòng chọn trường học.",
    courseContext: !isFpt || courseContext ? "" : "Vui lòng chọn mã môn học.",
    groupNo: !asksGroupNo
      ? ""
      : !groupNo.trim()
        ? "Số thứ tự nhóm là bắt buộc."
        : /^\d+$/.test(groupNo.trim())
          ? ""
          : "Số thứ tự nhóm chỉ được chứa chữ số (ví dụ: 5).",
  };
  const contactErrors = validateCaseContact(contact, true);
  const setContactField = (field: "full_name" | "zalo" | "email", value: string) =>
    setContact((prev) => ({ ...prev, [field]: value }));
  const isValid =
    !errors.projectName &&
    !errors.school &&
    !errors.courseContext &&
    !errors.groupNo &&
    !contactErrors.full_name &&
    !contactErrors.zalo &&
    !contactErrors.email;

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/cases", {
        team_context: {
          project_name: projectName.trim(),
          group_no: groupNo.trim() || undefined,
        },
        school,
        course_context: courseContext || undefined,
        contact: {
          full_name: contact.full_name.trim(),
          zalo: contact.zalo.trim(),
          email: contact.email.trim(),
        },
      });
      return res.data as { id: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      notifications.show({ color: "green", title: "Thành công", message: "Đã tạo dự án mới." });
      handleClose();
      router.push(`/dashboard/case/${data.id}`);
    },
    onError: () => {
      notifications.show({ color: "red", title: "Lỗi", message: "Không thể tạo dự án. Vui lòng thử lại." });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    createMutation.mutate();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Tạo dự án mới" centered size="sm">
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Tên dự án"
            placeholder="Ví dụ: Nền tảng kết nối gia sư EduLink"
            value={projectName}
            onChange={(e) => setProjectName(e.currentTarget.value)}
            error={submitted ? errors.projectName || undefined : undefined}
            withAsterisk
            autoFocus
          />
          <Select
            label="Trường học"
            placeholder="Chọn trường học"
            data={SCHOOL_OPTIONS}
            value={school || null}
            onChange={(val) => {
              const next = val || "";
              setSchool(next);
              if (next === FPT_SCHOOL) {
                setCourseContext("");
                setGroupNo("");
              } else if (next) {
                setCourseContext(OTHER_VALUE);
                setGroupNo(OTHER_VALUE);
              }
            }}
            error={submitted ? errors.school || undefined : undefined}
            withAsterisk
          />

          {isFpt && (
            <Select
              label="Mã môn học"
              placeholder="Chọn mã môn học"
              data={COURSE_OPTIONS}
              value={courseContext || null}
              onChange={(val) => {
                const next = val || "";
                setCourseContext(next);
                setGroupNo(next === EXE101_COURSE ? "" : OTHER_VALUE);
              }}
              error={submitted ? errors.courseContext || undefined : undefined}
              withAsterisk
            />
          )}

          {asksGroupNo && (
            <TextInput
              label="Số thứ tự nhóm (Group No)"
              placeholder="Ví dụ: 5"
              value={groupNo}
              onChange={(e) => setGroupNo(e.currentTarget.value)}
              error={submitted ? errors.groupNo || undefined : undefined}
              withAsterisk
            />
          )}

          <TextInput
            label="Họ tên người liên hệ"
            placeholder="Nguyễn Văn A"
            description="Thông tin liên hệ chỉ dùng cho dự án này, không lấy từ hay thay đổi tài khoản của bạn."
            value={contact.full_name}
            onChange={(e) => setContactField("full_name", e.currentTarget.value)}
            error={submitted ? contactErrors.full_name : undefined}
            withAsterisk
          />
          <TextInput
            label="Số điện thoại / Zalo"
            placeholder="10 chữ số"
            inputMode="numeric"
            value={contact.zalo}
            onChange={(e) => setContactField("zalo", e.currentTarget.value)}
            error={submitted ? contactErrors.zalo : undefined}
            withAsterisk
          />
          <TextInput
            label="Email liên hệ"
            placeholder="ten@example.com"
            value={contact.email}
            onChange={(e) => setContactField("email", e.currentTarget.value)}
            error={submitted ? contactErrors.email : undefined}
            withAsterisk
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose} disabled={createMutation.isPending}>
              Hủy
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Tạo dự án
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
