"use client";

import { useState } from "react";
import { Modal, TextInput, Stack, Button, Group } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { apiClient } from "@/lib/api-client";

interface CreateProjectModalProps {
  opened: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ opened, onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [projectName, setProjectName] = useState("");
  const [school, setSchool] = useState("");
  const [courseContext, setCourseContext] = useState("");
  const [groupNo, setGroupNo] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/cases", {
        team_context: {
          project_name: projectName.trim() || "Dự án mới",
          group_no: groupNo.trim() || undefined,
        },
        school: school.trim() || undefined,
        course_context: courseContext.trim() || undefined,
      });
      return res.data as { id: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      notifications.show({ color: "green", title: "Thành công", message: "Đã tạo dự án mới." });
      onClose();
      router.push(`/dashboard/case/${data.id}`);
    },
    onError: () => {
      notifications.show({ color: "red", title: "Lỗi", message: "Không thể tạo dự án. Vui lòng thử lại." });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Tạo dự án mới" centered size="sm">
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Tên dự án"
            placeholder="Ví dụ: Nền tảng kết nối gia sư EduLink"
            value={projectName}
            onChange={(e) => setProjectName(e.currentTarget.value)}
            required
            autoFocus
          />
          <TextInput
            label="Trường đại học"
            placeholder="Ví dụ: Đại học FPT"
            value={school}
            onChange={(e) => setSchool(e.currentTarget.value)}
          />
          <Group grow>
            <TextInput
              label="Mã môn học"
              placeholder="Ví dụ: EXE101"
              value={courseContext}
              onChange={(e) => setCourseContext(e.currentTarget.value)}
            />
            <TextInput
              label="Số nhóm"
              placeholder="Ví dụ: Nhóm 4"
              value={groupNo}
              onChange={(e) => setGroupNo(e.currentTarget.value)}
            />
          </Group>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={createMutation.isPending}>
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
