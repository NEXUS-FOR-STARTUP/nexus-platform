"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stack,
  Paper,
  Text,
  TextInput,
  Textarea,
  Button,
  Group,
  Checkbox,
  Blockquote,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { Case } from "@/types";

interface ProjectProfileFormProps {
  caseId: string;
  caseData?: Case;
  intakeSnapshot?: unknown;
}

export default function ProjectProfileForm({
  caseId,
  caseData,
  intakeSnapshot,
}: ProjectProfileFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const snapshot = typeof intakeSnapshot === "object" && intakeSnapshot !== null
    ? (intakeSnapshot as Record<string, unknown>)
    : {};
  const contact = typeof snapshot.contact === "object" && snapshot.contact !== null
    ? (snapshot.contact as Record<string, unknown>)
    : {};

  const [fullName, setFullName] = useState<string>(String(contact.full_name || ""));
  const [studentCode, setStudentCode] = useState<string>(String(contact.student_code || ""));
  const [teamRole, setTeamRole] = useState<string>(String(contact.team_role || "Trưởng nhóm"));
  const [zalo, setZalo] = useState<string>(String(contact.zalo || ""));
  const [email, setEmail] = useState<string>(String(contact.email || ""));

  const [school, setSchool] = useState<string>(String(caseData?.school || ""));
  const [courseContext, setCourseContext] = useState<string>(String(caseData?.course_context || ""));
  const [groupNo, setGroupNo] = useState<string>(String(caseData?.group_no || ""));

  const [currentBlocker, setCurrentBlocker] = useState<string>(String(snapshot.current_blocker || ""));
  const [notes, setNotes] = useState<string>(String(snapshot.notes || snapshot.extra_notes || ""));
  const [agreed, setAgreed] = useState<boolean>(true);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        contact: {
          full_name: fullName.trim(),
          student_code: studentCode.trim(),
          team_role: teamRole.trim(),
          zalo: zalo.trim(),
          email: email.trim(),
        },
        current_blocker: currentBlocker.trim() || undefined,
        notes: notes.trim() || undefined,
        boundary_confirmations: agreed,
        // Documents sent only when the case already has some: the profile form
        // manages contact/notes, files are managed by the stage upload endpoints.
        documents: Array.isArray(snapshot.documents) ? (snapshot.documents as unknown[]) : [],
      };
      const res = await apiClient.post(`/cases/${caseId}/intake`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      notifications.show({ color: "green", title: "Thành công", message: "Đã lưu hồ sơ dự án." });
      router.push(`/dashboard/case/${caseId}?tab=overview`);
    },
    onError: () => {
      notifications.show({ color: "red", title: "Lỗi", message: "Không thể lưu hồ sơ. Vui lòng kiểm tra lại thông tin." });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      notifications.show({ color: "red", title: "Chưa đồng ý cam kết", message: "Vui lòng xác nhận đồng ý điều khoản." });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="lg" max-w="3xl">
        <Group justify="flex-start" align="center">
          <Button
            variant="subtle"
            size="xs"
            leftSection={<ArrowLeft size={14} />}
            onClick={() => router.push(`/dashboard/case/${caseId}?tab=overview`)}
          >
            Quay lại Tổng quan
          </Button>
        </Group>

        <div>
          <Text fw={700} size="xl">Hồ sơ dự án</Text>
          <Text size="sm" c="dimmed">
            Cung cấp thông tin nền tảng về đội ngũ và bối cảnh để AI đưa ra nhận xét sát thực tế nhất.
          </Text>
        </div>

        <Paper p="md" withBorder radius="md">
          <Text fw={600} size="sm" mb="sm">1. Người đại diện liên hệ</Text>
          <Stack gap="xs">
            <Group grow>
              <TextInput
                label="Họ và tên"
                value={fullName}
                onChange={(e) => setFullName(e.currentTarget.value)}
                required
              />
              <TextInput
                label="Mã số sinh viên"
                value={studentCode}
                onChange={(e) => setStudentCode(e.currentTarget.value)}
                required
              />
            </Group>
            <Group grow>
              <TextInput
                label="Vai trò trong nhóm"
                value={teamRole}
                onChange={(e) => setTeamRole(e.currentTarget.value)}
                required
              />
              <TextInput
                label="Số điện thoại / Zalo"
                value={zalo}
                onChange={(e) => setZalo(e.currentTarget.value)}
                required
              />
              <TextInput
                label="Email liên hệ"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
              />
            </Group>
          </Stack>
        </Paper>

        <Paper p="md" withBorder radius="md">
          <Text fw={600} size="sm" mb="sm">2. Bối cảnh lớp môn học</Text>
          <Stack gap="xs">
            <Group grow>
              <TextInput
                label="Trường"
                value={school}
                onChange={(e) => setSchool(e.currentTarget.value)}
              />
              <TextInput
                label="Mã môn học"
                value={courseContext}
                onChange={(e) => setCourseContext(e.currentTarget.value)}
              />
              <TextInput
                label="Số nhóm"
                value={groupNo}
                onChange={(e) => setGroupNo(e.currentTarget.value)}
              />
            </Group>
          </Stack>
        </Paper>

        <Paper p="md" withBorder radius="md">
          <Text fw={600} size="sm" mb="sm">3. Khó khăn hiện tại của dự án</Text>
          <Textarea
            placeholder="Mô tả ngắn gọn điều nhóm đang cảm thấy vướng mắc nhất..."
            value={currentBlocker}
            onChange={(e) => setCurrentBlocker(e.currentTarget.value)}
            rows={3}
          />
        </Paper>

        <Paper p="md" withBorder radius="md">
          <Text fw={600} size="sm" mb="xs">4. Ghi chú thêm cho AI</Text>
          <Blockquote icon={null} color="blue" p="sm" mb="sm">
            <Text size="xs">
              &ldquo;Nhắn AI điều bạn muốn được góp ý nhất: nhóm đang vướng gì, giảng viên đã nhận xét gì, bạn kỳ vọng nhận được gì.&rdquo;
            </Text>
          </Blockquote>
          <Textarea
            placeholder="Ví dụ: Giảng viên nhận xét TAM quá lớn, nhóm muốn AI chỉ ra cách tính lại SOM thực tế hơn..."
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
            rows={4}
          />
        </Paper>

        <Checkbox
          checked={agreed}
          onChange={(e) => setAgreed(e.currentTarget.checked)}
          label="Tôi xác nhận thông tin trên là chính xác và đồng ý với điều khoản sử dụng nền tảng."
        />

        <Group justify="flex-end">
          <Button type="submit" loading={saveMutation.isPending} leftSection={<Save size={16} />}>
            Lưu hồ sơ dự án
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
