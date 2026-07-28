"use client";

import React, { useRef, useState } from "react";
import { Alert, Button, Tooltip, Text, Badge, ActionIcon, Paper, Group, Select, Stack } from "@mantine/core";
import { CheckCircle2, HelpCircle, Copy, Download, Upload, X, FileText, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentInputStepProps {
  form: any;
  values: any;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_DOCUMENT_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ACCEPT_EXTENSIONS = ".pdf,.docx,.xlsx,.pptx,.md,.txt";

const DOCUMENT_TYPE_OPTIONS = [
  { label: "Báo cáo ý tưởng (Draft Report)", value: "Báo cáo ý tưởng" },
  { label: "Slide thuyết trình (Pitch Deck)", value: "Slide thuyết trình" },
  {
    label: "Phân tích đối thủ (Competitor Analysis)",
    value: "Phân tích đối thủ cạnh tranh",
  },
  {
    label: "Khảo sát & Phỏng vấn khách hàng (Customer Research)",
    value: "Khảo sát khách hàng",
  },
  {
    label: "Đề cương phân công (Task Assignment)",
    value: "Đề cương phân công",
  },
  {
    label: "Tài liệu bổ sung khác (Other resources)",
    value: "Tài liệu bổ sung",
  },
];

const TEMPLATE_MD_URL = "/idea-template/TEMPLATE_STARTUP_CHECKPOINT1_V2.md";
const TEMPLATE_DOCX_URL = "/idea-template/TEMPLATE_STARTUP_CHECKPOINT1_V2.docx";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DocumentInputStep({ form, values }: DocumentInputStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [templateMessage, setTemplateMessage] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

  // --- Template actions (unchanged) ---

  const handleTemplateAction = async (value: "copy_markdown" | "download_docx") => {
    try {
      if (value === "copy_markdown") {
        const response = await fetch(TEMPLATE_MD_URL);
        if (!response.ok) {
          throw new Error("Không thể tải template Markdown.");
        }
        const text = await response.text();
        await navigator.clipboard.writeText(text);
        setTemplateMessage("Đã copy template Markdown. Bạn có thể dán ra ngoài để điền nhanh.");
      }

      if (value === "download_docx") {
        window.open(TEMPLATE_DOCX_URL, "_blank", "noopener,noreferrer");
        setTemplateMessage("Đã mở file .docx template trong tab mới để bạn tải về.");
      }
    } catch (error) {
      setTemplateMessage(
        value === "copy_markdown"
          ? "Copy template Markdown thất bại. Hãy thử lại hoặc tải file .docx."
          : "Không thể mở file .docx template. Hãy thử lại sau.",
      );
    }
  };

  // --- File upload ---

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, parentField: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset so same file can be selected again
    e.target.value = "";

    // Client-side size validation
    if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      setUploadError(`File "${file.name}" vượt quá giới hạn 15MB. Vui lòng chọn file nhỏ hơn.`);
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "intake_document");

      const response = await apiClient.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { url, publicId, originalName, extension, mimeType } = response.data;

      const currentDocs: any[] = parentField.state.value || [];
      const newDoc = {
        file_url: url,
        cloudinary_public_id: publicId,
        original_name: originalName,
        extension,
        mime_type: mimeType,
        document_type: "",
      };

      parentField.handleChange([...currentDocs, newDoc]);
      parentField.handleBlur();
    } catch (error: any) {
      // Try to surface a user-friendly message; fall back to generic
      const apiMessage =
        error?.response?.data?.message ??
        `Lỗi khi tải lên "${file.name}". Vui lòng thử lại.`;
      setUploadError(apiMessage);
    } finally {
      setUploading(false);
    }
  };

  // --- Remove document ---

  const handleRemoveDoc = (index: number, parentField: any) => {
    const currentDocs: any[] = parentField.state.value || [];
    const nextDocs = currentDocs.filter((_: any, i: number) => i !== index);
    parentField.handleChange(nextDocs);
    parentField.handleBlur();
  };

  // --- Change document type ---

  const handleTypeChange = (index: number, type: string | null, parentField: any) => {
    if (!type) return;
    const currentDocs: any[] = parentField.state.value || [];
    const nextDocs = currentDocs.map((doc: any, i: number) =>
      i === index ? { ...doc, document_type: type } : doc,
    );
    parentField.handleChange(nextDocs);
    parentField.handleBlur();
  };

  // =====================================================================
  // Render
  // =====================================================================

  return (
    <div className="space-y-5 font-body">
      {/* ─── Template Reference Alert ─── */}
      <div className="flex items-center gap-1.5 pb-1">
        <h3 className="font-heading text-base font-bold text-text-app">
          Hồ sơ của nhóm đã có sẵn chưa?
        </h3>
        <Tooltip
          label="Tải file tài liệu nhóm đã chuẩn bị. Supporter sẽ đọc trực tiếp từ đây, nên bạn không cần viết lại toàn bộ ý tưởng."
          position="top"
          multiline
          w={260}
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
        title="Chưa có hồ sơ hoặc ý tưởng còn mơ hồ?"
        icon={<CheckCircle2 className="w-4 h-4" />}
      >
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            Nếu nhóm chưa có proposal đủ rõ, hãy dùng template có sẵn để điền nhanh
            các phần cốt lõi. Sau khi hoàn tất, tải file lên ở bên dưới.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Button
              variant="default"
              size="xs"
              leftSection={<Copy className="w-3.5 h-3.5 text-blue-500" />}
              onClick={() => handleTemplateAction("copy_markdown")}
              className="font-body font-semibold cursor-pointer h-9 px-3 rounded-lg text-xs bg-surface-app hover:bg-surface-hover border-border-app text-text-app"
            >
              Copy template Markdown
            </Button>
            <Button
              variant="default"
              size="xs"
              leftSection={<Download className="w-3.5 h-3.5 text-blue-500" />}
              onClick={() => handleTemplateAction("download_docx")}
              className="font-body font-semibold cursor-pointer h-9 px-3 rounded-lg text-xs bg-surface-app hover:bg-surface-hover border-border-app text-text-app"
            >
              Tải file .docx template
            </Button>
          </div>
          {templateMessage ? (
            <p className="text-xs text-text-muted font-medium mt-1">{templateMessage}</p>
          ) : null}
        </div>
      </Alert>

      {/* ─── Document Upload Section ─── */}
      <form.Field name="documents">
        {(parentField: any) => {
          const docs: any[] = parentField.state.value || [];
          const hasDocs = docs.length > 0;
          const isTouched = parentField.state.meta.isTouched;

          // Flag any uploaded doc missing its type selection
          const hasMissingTypes =
            isTouched && hasDocs && docs.some((d: any) => !d.document_type);

          return (
            <div className="space-y-5">
              {/* Upload control */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-sm font-bold text-text-app">
                    Tải lên tài liệu hồ sơ <span className="text-danger">*</span>
                  </label>
                  <Tooltip
                    label="Hỗ trợ PDF, DOCX, XLSX, PPTX, MD, TXT. Dung lượng tối đa 15MB mỗi file."
                    multiline
                    w={260}
                    withArrow
                  >
                    <span className="flex items-center">
                      <HelpCircle className="w-3.5 h-3.5 text-text-muted hover:text-text-app cursor-help" />
                    </span>
                  </Tooltip>
                </div>

                {/* Hidden file input + visible trigger */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_EXTENSIONS}
                  onChange={(e) => handleFileSelect(e, parentField)}
                  className="hidden"
                />

                <Button
                  variant="outline"
                  leftSection={<Upload className="w-4 h-4" />}
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploading}
                  disabled={uploading}
                  className="font-body font-semibold cursor-pointer h-10 px-4 rounded-xl text-sm border-border-strong text-text-app hover:bg-surface-hover w-fit"
                >
                  {uploading ? "Đang tải lên..." : "Chọn file tài liệu"}
                </Button>

                <Text size="xs" c="dimmed">
                  .pdf, .docx, .xlsx, .pptx, .md, .txt &bull; tối đa 15MB
                </Text>

                {/* Upload error banner */}
                {uploadError && (
                  <Alert
                    variant="light"
                    color="red"
                    radius="md"
                    icon={<AlertCircle className="w-4 h-4" />}
                    onClose={() => setUploadError("")}
                    withCloseButton
                  >
                    <Text size="sm">{uploadError}</Text>
                  </Alert>
                )}
              </div>

              {/* Uploaded documents list */}
              {hasDocs && (
                <Stack gap="sm">
                  <label className="text-sm font-bold text-text-app">
                    Tài liệu đã tải lên ({docs.length})
                  </label>

                  {docs.map((doc: any, index: number) => (
                    <Paper
                      key={`${doc.cloudinary_public_id ?? doc.file_url}_${index}`}
                      p="md"
                      withBorder
                      radius="md"
                      className="border-border-strong bg-surface-soft/60"
                    >
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        {/* File info */}
                        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                          <FileText className="w-5 h-5 text-text-muted shrink-0" />
                          <div style={{ minWidth: 0 }}>
                            <Text size="sm" fw={600} truncate>
                              {doc.original_name}
                            </Text>
                            <Group gap="xs" mt={2}>
                              <Badge size="xs" variant="light" color="gray">
                                {doc.extension?.toUpperCase() ?? "FILE"}
                              </Badge>
                              <Text size="xs" c="dimmed">
                                Cloudinary
                              </Text>
                            </Group>
                          </div>
                        </Group>

                        {/* Type selector + remove */}
                        <Group gap="sm" wrap="nowrap">
                          <Select
                            placeholder="Chọn loại tài liệu"
                            data={DOCUMENT_TYPE_OPTIONS}
                            value={doc.document_type || null}
                            onChange={(val) => handleTypeChange(index, val, parentField)}
                            size="xs"
                            clearable
                            className="min-w-[220px]"
                          />
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleRemoveDoc(index, parentField)}
                            aria-label="Xóa tài liệu"
                          >
                            <X className="w-4 h-4" />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}

              {/* Validation hint */}
              {hasMissingTypes && (
                <p className="text-xs text-red-500 font-body pl-1 mt-1">
                  Vui lòng chọn loại tài liệu cho tất cả các file đã tải lên.
                </p>
              )}

              {/* Empty state */}
              {!hasDocs && !uploading && (
                <div className="p-6 border-2 border-dashed rounded-xl bg-surface-soft/40 border-border-strong text-center">
                  <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <Text size="sm" c="dimmed">
                    Chưa có tài liệu nào được tải lên. Nhấn &quot;Chọn file tài liệu&quot; để bắt đầu.
                  </Text>
                </div>
              )}
            </div>
          );
        }}
      </form.Field>
    </div>
  );
}
