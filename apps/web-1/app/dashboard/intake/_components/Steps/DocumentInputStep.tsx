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

  // --- File processing helper ---

  const uploadFileObject = async (file: File, parentField: any) => {
    if (!file) return;

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
      const apiMessage =
        error?.response?.data?.message ??
        `Lỗi khi tải lên "${file.name}". Vui lòng thử lại.`;
      setUploadError(apiMessage);
    } finally {
      setUploading(false);
    }
  };

  // --- File upload ---

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, parentField: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";
    await uploadFileObject(file, parentField);
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent, parentField: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadFileObject(file, parentField);
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
        <h3 className="font-heading text-h3 font-bold text-text-app">
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
            <HelpCircle className="w-5 h-5 text-text-muted hover:text-text-app cursor-help" />
          </span>
        </Tooltip>
      </div>

      <Alert
        variant="light"
        color="blue"
        radius="md"
        title={<span className="font-heading text-h4 font-bold">Chưa có hồ sơ hoặc ý tưởng còn mơ hồ?</span>}
        icon={<CheckCircle2 className="w-5 h-5" />}
      >
        <div className="space-y-3 text-base font-body text-text-app leading-relaxed">
          <p>
            Nếu nhóm chưa có proposal đủ rõ, hãy dùng template có sẵn để điền nhanh
            các phần cốt lõi. Sau khi hoàn tất, tải file lên ở bên dưới.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Button
              variant="default"
              size="md"
              leftSection={<Copy className="w-4 h-4 text-blue-500" />}
              onClick={() => handleTemplateAction("copy_markdown")}
              className="font-body font-semibold cursor-pointer h-10 px-4 rounded-xl text-base bg-surface-app hover:bg-surface-hover border-border-app text-text-app"
            >
              Copy template Markdown
            </Button>
            <Button
              variant="default"
              size="md"
              leftSection={<Download className="w-4 h-4 text-blue-500" />}
              onClick={() => handleTemplateAction("download_docx")}
              className="font-body font-semibold cursor-pointer h-10 px-4 rounded-xl text-base bg-surface-app hover:bg-surface-hover border-border-app text-text-app"
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
                  <label className="text-base font-semibold text-text-app">
                    Tải lên tài liệu hồ sơ <span className="text-danger">*</span>
                  </label>
                  <Tooltip
                    label="Hỗ trợ PDF, DOCX, XLSX, PPTX, MD, TXT. Dung lượng tối đa 15MB mỗi file."
                    multiline
                    w={260}
                    withArrow
                  >
                    <span className="flex items-center">
                      <HelpCircle className="w-4 h-4 text-text-muted hover:text-text-app cursor-help" />
                    </span>
                  </Tooltip>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_EXTENSIONS}
                  onChange={(e) => handleFileSelect(e, parentField)}
                  className="hidden"
                />

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
                  <label className="text-base font-semibold text-text-app">
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
                      <Group justify="space-between" align="center" wrap="nowrap">
                        {/* File info */}
                        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                          <FileText className="w-6 h-6 text-text-muted shrink-0" />
                          <div style={{ minWidth: 0 }}>
                            <Text size="md" fw={600} truncate>
                              {doc.original_name}
                            </Text>
                            <Group gap="xs" mt={2}>
                              <Badge size="sm" variant="light" color="gray">
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
                            size="md"
                            clearable
                            className="w-full sm:w-60"
                          />
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleRemoveDoc(index, parentField)}
                            aria-label="Xóa tài liệu"
                          >
                            <X className="w-5 h-5" />
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

              {/* Interactive Dropzone Box */}
              {!uploading && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, parentField)}
                  className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200 group space-y-2 ${
                    isDragging
                      ? "border-brand bg-brand-soft/30 scale-[1.01]"
                      : "bg-surface-soft/40 hover:bg-surface-soft/80 border-border-strong hover:border-brand/40"
                  }`}
                >
                  <Upload className={`w-9 h-9 mx-auto transition-colors duration-200 ${
                    isDragging ? "text-brand animate-pulse" : "text-text-muted group-hover:text-brand"
                  }`} />
                  <div className="space-y-1">
                    <p className={`text-base font-semibold transition-colors duration-200 ${
                      isDragging ? "text-brand" : "text-text-app group-hover:text-brand"
                    }`}>
                      {isDragging ? "Thả file vào đây để tải lên" : "Kéo thả file vào đây hoặc nhấn để chọn file"}
                    </p>
                    <p className="text-sm text-text-muted">
                      .pdf, .docx, .xlsx, .pptx, .md, .txt &bull; tối đa 15MB mỗi file
                    </p>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="p-8 border-2 border-dashed rounded-xl bg-surface-soft/40 border-border-strong text-center space-y-2">
                  <Upload className="w-8 h-8 text-brand animate-bounce mx-auto" />
                  <p className="text-sm font-semibold text-brand">Đang tải tài liệu lên...</p>
                </div>
              )}
            </div>
          );
        }}
      </form.Field>
    </div>
  );
}
