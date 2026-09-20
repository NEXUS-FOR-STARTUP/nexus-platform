"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Select, TextInput, Radio, Group, Stack, Text, Switch, Alert } from "@mantine/core";
import { RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import type { AdminWorkerJobListItem, RetryJobPayload } from "../hooks/useAdminWorkers";

interface RetryJobModalProps {
  job: AdminWorkerJobListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (jobId: string, payload: RetryJobPayload) => Promise<void>;
  isSubmitting: boolean;
}

const MODEL_OPTIONS = [
  { value: "openai-codex/gpt-5.6-sol", label: "ChatGPT Plus (GPT-5.6 Sol - Khuyên dùng)" },
  { value: "mimo/mimo-v2.5", label: "Xiaomi MiMo v2.5 (Tiết kiệm)" },
  { value: "google-antigravity/gemini-3.8-flash", label: "Google Gemini 3.8 Flash" },
  { value: "custom", label: "Tùy chỉnh model khác..." },
];

export default function RetryJobModal({ job, isOpen, onClose, onConfirm, isSubmitting }: RetryJobModalProps) {
  const [selectedModel, setSelectedModel] = useState("openai-codex/gpt-5.6-sol");
  const [customModel, setCustomModel] = useState("");
  const [promptMode, setPromptMode] = useState<"full" | "lite">("full");
  const [clearSandbox, setClearSandbox] = useState(true);

  useEffect(() => {
    if (!job || !isOpen) return;
    const currentModel = job.model?.trim();
    if (!currentModel) {
      setSelectedModel("openai-codex/gpt-5.6-sol");
      setCustomModel("");
      return;
    }
    const isKnownOption = MODEL_OPTIONS.some((opt) => opt.value === currentModel);
    if (isKnownOption) {
      setSelectedModel(currentModel);
      setCustomModel("");
    } else {
      setSelectedModel("custom");
      setCustomModel(currentModel);
    }
  }, [job, isOpen]);
  if (!job) return null;

  const isCustomEmpty = selectedModel === "custom" && !customModel.trim();

  const handleSubmit = async () => {
    if (isCustomEmpty) return;
    const finalModel = selectedModel === "custom" ? customModel.trim() : selectedModel;
    await onConfirm(job.id, {
      model: finalModel,
      promptMode,
      clearOldSandbox: clearSandbox,
    });
    onClose();
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap="xs">
          <RotateCcw className="w-5 h-5 text-brand" />
          <Text fw={600} className="font-heading text-sm">Chạy lại tiến trình AI: {job.caseCode}</Text>
        </Group>
      }
      size="md"
      radius="md"
      centered
    >
      <Stack gap="md" className="font-body text-xs text-text-app">
        <Alert icon={<ShieldCheck className="w-4 h-4" />} color="blue" variant="light" title="Chính sách tín chỉ">
          Thao tác này <b>KHÔNG trừ credit</b> của sinh viên. Hệ thống sử dụng quota nội bộ của quản trị viên để hoàn tất thẩm định.
        </Alert>

        <div>
          <Text size="xs" fw={500} mb={4}>Chọn mô hình AI (Model)</Text>
          <Select
            data={MODEL_OPTIONS}
            value={selectedModel}
            onChange={(val) => setSelectedModel(val ?? "gemini-2.5-flash")}
            leftSection={<Sparkles className="w-4 h-4 text-brand" />}
            size="xs"
          />
          {selectedModel === "custom" && (
            <TextInput
              mt="xs"
              placeholder="Nhập tên model (ví dụ: gpt-4-turbo)..."
              value={customModel}
              onChange={(e) => setCustomModel(e.currentTarget.value)}
              size="xs"
              error={customModel.length > 0 && !customModel.trim() ? "Tên model không được để trống" : undefined}
              required
            />
          )}
        </div>

        <div>
          <Text size="xs" fw={500} mb={4}>Chế độ Prompt</Text>
          <Radio.Group value={promptMode} onChange={(val) => setPromptMode(val as "full" | "lite")} size="xs">
            <Group gap="lg">
              <Radio value="full" label="Tiêu chuẩn (Full Prompt)" />
              <Radio value="lite" label="Tinh gọn (Lite Prompt)" />
            </Group>
          </Radio.Group>
        </div>

        <Switch
          checked={clearSandbox}
          onChange={(e) => setClearSandbox(e.currentTarget.checked)}
          label="Xóa và khởi tạo lại sandbox sạch sẽ trước khi chạy"
          size="xs"
        />

        <Group justify="flex-end" gap="xs" mt="sm">
          <Button variant="default" size="xs" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            color="blue"
            size="xs"
            leftSection={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isCustomEmpty || isSubmitting}
          >
            Kích hoạt chạy lại
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
