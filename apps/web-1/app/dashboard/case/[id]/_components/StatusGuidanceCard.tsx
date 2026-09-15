"use client";

import React, { useState } from "react";
import { Case } from "@/types";
import {
  Clock,
  Activity,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Zap,
  Upload,
} from "lucide-react";
import { Alert, Button, Select, Stack, Textarea, Group } from "@mantine/core";
import { Dropzone, type FileRejection } from "@mantine/dropzone";
import { STATUS_GUIDANCE_COPY, type GuidanceTone, type GuidanceIconKey } from "./statusCopyMap";
import type { OpenInfoRequest } from "../hooks/useCaseDetails";
import { isCaseFree, PACKAGE_KEYS, caseRequiresPayment, formatPrice } from "@/lib/pricing";
import { usePackagePrice } from "@/lib/usePackagePrice";
import type { SubmissionType } from "../hooks/useTriggerAudit";
import { useStudentDocumentUpload, type RevisionUploadResponse } from "../hooks/useCaseDocumentUploads";

const SUBMISSION_TYPE_OPTIONS = [
  { value: "initial", label: "Lần đầu — Đánh giá tổng quát" },
  { value: "resubmit", label: "Đã sửa — Đối chiếu với kết quả trước" },
  { value: "logic_check", label: "Soi logic — Khả thi + khách hàng" },
] as const;

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_MIME_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/markdown": [".md"],
  "text/plain": [".txt", ".md"],
};

interface StatusGuidanceCardProps {
  caseData: Case;
  creditBalance?: number | null;
  openRequestsForMoreInfo?: OpenInfoRequest[] | null;
  allowedTransitions?: string[];
  onSelectTab: (tab: "documents" | "discussion" | "timeline" | "settings") => void;
  onOpenPayment?: () => void;
  onOpenIntake?: () => void;
  onSubmitRevision?: () => void;
  onConfirmComplete?: () => void;
  isConfirmingComplete?: boolean;
  onTriggerAudit?: (submissionType: SubmissionType, lifecycleUnitId?: string) => Promise<void>;
  isTriggeringAudit?: boolean;
}

const ICON_BY_KEY: Record<GuidanceIconKey, React.ComponentType<{ className?: string }>> = {
  clock: Clock,
  activity: Activity,
  help: HelpCircle,
  check: CheckCircle2,
  alert: AlertCircle,
};

const COLOR_BY_TONE: Record<GuidanceTone, string> = {
  info: "blue",
  warning: "orange",
  success: "green",
  neutral: "gray",
  danger: "red",
};

const ALERT_CLASS = "animate-fade-in font-body text-xs shrink-0";

export default function StatusGuidanceCard({
  caseData,
  creditBalance,
  openRequestsForMoreInfo,
  allowedTransitions = [],
  onOpenPayment,
  onOpenIntake,
  onSubmitRevision,
  onConfirmComplete,
  isConfirmingComplete,
  onTriggerAudit,
  isTriggeringAudit,
}: StatusGuidanceCardProps) {
  const [submissionType, setSubmissionType] = useState<SubmissionType>("initial");
  const [resubmitFiles, setResubmitFiles] = useState<File[]>([]);
  const [resubmitChangeSummary, setResubmitChangeSummary] = useState("");
  const [resubmitError, setResubmitError] = useState<string | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const { submitStudentUpload, isSubmitting: isUploading } = useStudentDocumentUpload(caseData.id);

  const isFree = isCaseFree(caseData);
  const targetPackageId = isFree
    ? PACKAGE_KEYS.AI_AUDIT
    : caseData.package_id || caseData.package?.id || PACKAGE_KEYS.AI_AUDIT;
  const { data: pkgData } = usePackagePrice(targetPackageId);
  const effectivePrice = pkgData?.price ?? (isFree ? 79000 : caseData.locked_price ?? caseData.package?.price ?? 79000);
  const auditPriceLabel = formatPrice(effectivePrice);

  const stage = caseData.user_facing_stage;
  const hasInfoRequest = !!openRequestsForMoreInfo && openRequestsForMoreInfo.length > 0;

  const hasTransition = (t: string) => allowedTransitions.includes(t);
  const canResubmit = hasTransition("T3_RESUBMIT_AFTER_REJECT") || hasTransition("T4_RESUBMIT_AFTER_VETO");
  const canOpenIntake =
    hasTransition("T2_SUBMIT_INTAKE") || hasTransition("T16_EDIT_INTAKE") || canResubmit;
  const canSubmitRevision = hasTransition("T9_SUBMIT_REVISION");

  // D1/FIX-1: reject reason lives in T12_REJECT / T13_VETO events (legacy fallback kept).
  const rejectionReason: string | null = (() => {
    if (stage !== "rejected") return null;
    const events = caseData.events || [];
    const rejectionEvent = [...events]
      .reverse()
      .find(
        (e) =>
          e.event_type === "T12_REJECT" ||
          e.event_type === "T13_VETO" ||
          e.event_type === "case_rejected" ||
          e.event_type === "vetoed",
      );
    const metadata = rejectionEvent?.metadata_json as { reason?: string } | undefined;
    return metadata?.reason || null;
  })();

  const hasCredits = (creditBalance ?? 0) >= 1;
  const canTriggerAudit = !!onTriggerAudit && hasCredits;

  const handleTriggerAudit = async () => {
    if (!onTriggerAudit) return;

    if (submissionType === "resubmit") {
      // 2-step: upload first, then trigger
      if (resubmitFiles.length === 0) {
        setResubmitError("Vui lòng tải lên ít nhất 1 tài liệu đã sửa.");
        return;
      }
      if (resubmitChangeSummary.trim().length < 10) {
        setResubmitError("Tóm tắt thay đổi cần ít nhất 10 ký tự.");
        return;
      }

      setResubmitError(null);
      setIsResubmitting(true);
      try {
        const uploadResult: RevisionUploadResponse = await submitStudentUpload({
          changeSummary: resubmitChangeSummary.trim(),
          files: resubmitFiles,
        });
        await onTriggerAudit("resubmit", uploadResult.lifecycle_unit_id);
        // Reset form on success
        setResubmitFiles([]);
        setResubmitChangeSummary("");
      } catch {
        setResubmitError("Tải tài liệu thất bại. Vui lòng thử lại.");
      } finally {
        setIsResubmitting(false);
      }
      return;
    }

    // initial or logic_check — direct trigger
    await onTriggerAudit(submissionType);
  };

  const appendResubmitFiles = (selected: File[]) => {
    const combined = [...resubmitFiles, ...selected];
    if (combined.length > MAX_FILES) {
      setResubmitError(`Chỉ được tải tối đa ${MAX_FILES} tài liệu.`);
      return;
    }
    setResubmitError(null);
    setResubmitFiles(combined);
  };

  const removeResubmitFile = (index: number) => {
    setResubmitFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRejectedFiles = (rejections: FileRejection[]) => {
    const firstErrorCode = rejections[0]?.errors[0]?.code;
    if (firstErrorCode === "file-too-large") {
      setResubmitError(`Mỗi tệp tối đa ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setResubmitError("Định dạng tệp không được hỗ trợ.");
  };

  if (hasInfoRequest) {
    const queryText =
      openRequestsForMoreInfo?.[0]?.metadata_json?.query ||
      openRequestsForMoreInfo?.[0]?.metadata_json?.reason ||
      "Vui lòng kiểm tra lại tài liệu đã tải lên.";
    return (
      <Alert
        variant="light"
        color="orange"
        radius="md"
        title="Yêu cầu bổ sung thông tin từ Supporter"
        icon={<HelpCircle className="w-4.5 h-4.5 shrink-0" />}
        className={ALERT_CLASS}
      >
        <div className="space-y-2 flex-grow">
          <p className="font-semibold text-warning-strong">Nội dung yêu cầu:</p>
          <p className="italic bg-surface-app/50 p-2.5 rounded border border-warning/10 font-body leading-relaxed">
            &quot;{queryText}&quot;
          </p>
          {canSubmitRevision && onSubmitRevision && (
            <Button
              size="sm"
              color="brand"
              className="shrink-0 cursor-pointer"
              onClick={onSubmitRevision}
            >
              Nộp tài liệu bổ sung
            </Button>
          )}
        </div>
      </Alert>
    );
  }

  if (stage === "rejected") {
    return (
      <Alert
        variant="light"
        color="red"
        radius="md"
        title="Hồ sơ bị từ chối xét duyệt"
        icon={<AlertCircle className="w-4.5 h-4.5 shrink-0" />}
        className={ALERT_CLASS}
      >
        <div className="space-y-2 flex-grow">
          {rejectionReason && <p className="font-semibold text-danger">Lý do từ chối:</p>}
          <p className="text-text-muted text-xs leading-relaxed">
            {rejectionReason
              ? rejectionReason
              : "Yêu cầu phản biện dự án của bạn không được duyệt. Vui lòng liên hệ với Đội ngũ Nexus hoặc gửi thắc mắc qua phần Thảo luận."}
          </p>
          {onOpenIntake && canResubmit && (
            <div className="pt-1">
              <Button size="sm" color="brand" className="shrink-0 cursor-pointer" onClick={onOpenIntake}>
                Chỉnh sửa hồ sơ để nộp lại
              </Button>
            </div>
          )}
        </div>
      </Alert>
    );
  }

  if (stage === "intake_pending") {
    const hasCredits = (creditBalance ?? 0) > 0;
    if (hasCredits) {
      return (
        <Alert
          variant="light"
          color="teal"
          radius="md"
          title={`Đã có ${creditBalance} credit — Hãy nộp hồ sơ để bắt đầu phản biện`}
          icon={<CheckCircle2 className="w-4.5 h-4.5 shrink-0" />}
          className={ALERT_CLASS}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-text-muted text-xs leading-relaxed">
              Bạn đã có sẵn credit đánh giá chuyên sâu. Vui lòng nộp hồ sơ khởi nghiệp để Supporter chuyên môn tiếp nhận và bắt đầu phản biện dự án.
            </p>
            {onOpenIntake && canOpenIntake && (
              <Button size="sm" color="brand" className="shrink-0 cursor-pointer" onClick={onOpenIntake} rightSection={<ArrowRight className="w-3.5 h-3.5" />}>
                Nộp hồ sơ ngay
              </Button>
            )}
          </div>
        </Alert>
      );
    }


    return (
      <Alert
        variant="light"
        color={isFree ? "blue" : "yellow"}
        radius="md"
        title={isFree ? "Kích hoạt quy trình phản biện chuyên sâu" : "Hồ sơ chưa hoàn tất thanh toán"}
        icon={<Clock className="w-4.5 h-4.5 shrink-0" />}
        className={ALERT_CLASS}
      >
        <div className="space-y-3">
          <p className="text-text-muted text-xs leading-relaxed">
            {isFree
              ? "Hồ sơ hiện tại thuộc gói đánh giá AI miễn phí. Quy trình phản biện chuyên sâu bao gồm việc chọn gói đánh giá, điền thông tin và nộp tài liệu dự án để chuyên gia tiếp nhận, chấm điểm và trả báo cáo chi tiết."
              : "Hồ sơ chưa được thanh toán. Bạn có thể nộp trước hồ sơ, quy trình phản biện chính thức sẽ bắt đầu ngay khi thanh toán hoàn tất."}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {onOpenPayment && (
              <Button size="sm" color="brand" className="shrink-0 cursor-pointer font-semibold text-xs" onClick={onOpenPayment}>
                {isFree ? "Chọn gói đánh giá" : "Thanh toán dịch vụ"}
              </Button>
            )}
          </div>
        </div>
      </Alert>
    );
  }

  if (stage === "intake_ready") {
    return (
      <Alert
        variant="light"
        color="blue"
        radius="md"
        icon={<Clock className="w-4.5 h-4.5 shrink-0" />}
        className={ALERT_CLASS}
        styles={{ wrapper: { alignItems: "center" } }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="mantine-Alert-title mb-0.5">Nộp hồ sơ khởi nghiệp</div>
            <p className="text-text-muted text-xs leading-relaxed">
              Vui lòng nộp hồ sơ khởi nghiệp để Supporter có thể đánh giá chính xác.
            </p>
          </div>
          {onOpenIntake && canOpenIntake && (
            <Button size="sm" color="brand" className="shrink-0 cursor-pointer" onClick={onOpenIntake}>
              Nộp hồ sơ
            </Button>
          )}
        </div>
      </Alert>
    );
  }

  if (stage === "revision_submitted") {
    const hasSupporter = !!(caseData.assigned_supporter_auth_user_id || caseData.assigned_supporter?.name);
    return (
      <Alert
        variant="light"
        color="blue"
        radius="md"
        title={hasSupporter ? "Bản sửa đổi đã gửi thành công — Chờ thẩm định" : "Bản sửa đổi đã gửi thành công — Chờ Admin phân công"}
        icon={<Clock className="w-4.5 h-4.5 shrink-0" />}
        className={ALERT_CLASS}
      >
        <p className="text-text-muted text-xs leading-relaxed">
          {hasSupporter
            ? "Supporter đang tiến hành thẩm định bản sửa đổi mới nhất của bạn."
            : "Bản sửa đổi đã được ghi nhận. Đội ngũ Nexus đang phân công Supporter chuyên môn thẩm định bản mới này."}
        </p>
      </Alert>
    );
  }

  if (stage === "need_more_information") {
    return (
      <Alert
        variant="light"
        color="orange"
        radius="md"
        title="Yêu cầu bổ sung thông tin từ Supporter"
        icon={<HelpCircle className="w-4.5 h-4.5 shrink-0" />}
        className={ALERT_CLASS}
      >
        <div className="space-y-2 flex-grow">
          <p className="text-text-muted text-xs leading-relaxed">
            Vui lòng kiểm tra lại tài liệu đã tải lên và bổ sung theo yêu cầu của Supporter.
          </p>
          {canSubmitRevision && onSubmitRevision && (
            <Button size="sm" color="brand" className="shrink-0 cursor-pointer" onClick={onSubmitRevision}>
              Nộp tài liệu bổ sung
            </Button>
          )}
        </div>
      </Alert>
    );
  }

  if (stage === "report_ready") {
    const isFreeReportReady = isCaseFree(caseData);
    const hasReportCredits = isFreeReportReady || (creditBalance ?? 0) > 0;
    const canConfirmComplete = hasTransition("T17_USER_CONFIRM_COMPLETE");

    return (
      <Stack gap="sm" className="animate-fade-in font-body">
        <Alert
          variant="light"
          color="green"
          radius="md"
          title="Báo cáo phản biện đã sẵn sàng"
          icon={<CheckCircle2 className="w-4.5 h-4.5 shrink-0" />}
          className={ALERT_CLASS}
        >
          <div className="space-y-3 flex-grow mt-1">
            <p className="text-text-muted text-xs leading-relaxed">
              Đánh giá chi tiết đã hoàn thành. Khi nhóm đã xem xong kết quả, hãy xác nhận hoàn thành hoặc gửi đánh giá mới.
            </p>

            {hasReportCredits && (
              <p className="text-text-muted text-xs leading-relaxed">
                Muốn tiếp tục cải thiện? Hãy chọn loại đánh giá bên dưới. Mỗi lượt đánh giá mới tương ứng 1 credit.
              </p>
            )}

            {onConfirmComplete && canConfirmComplete && (
              <div className="pt-1">
                <Button
                  size="sm"
                  color="brand"
                  className="shrink-0 cursor-pointer w-full sm:w-auto"
                  loading={isConfirmingComplete}
                  onClick={onConfirmComplete}
                >
                  Xác nhận hoàn thành
                </Button>
              </div>
            )}
          </div>
        </Alert>

        {!hasReportCredits && (
          <Alert
            variant="light"
            color="red"
            radius="md"
            icon={<AlertCircle className="w-4.5 h-4.5 shrink-0" />}
            className={ALERT_CLASS}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-grow">
              <p className="text-xs leading-relaxed">
                Bạn đã hết credit. Nếu muốn tiếp tục nộp bản sửa đổi mới ở vòng sau, vui lòng mua thêm credit.
              </p>
              {onOpenPayment && (
                <Button
                  size="xs"
                  color="red"
                  variant="filled"
                  className="shrink-0 font-semibold cursor-pointer"
                  onClick={onOpenPayment}
                >
                  Mua credit
                </Button>
              )}
            </div>
          </Alert>
        )}

        {/* Audit trigger — shown when credits available and trigger handler provided */}
        {canTriggerAudit && (
          <Alert
            variant="light"
            color="blue"
            radius="md"
            title="Gửi đánh giá mới"
            icon={<Zap className="w-4.5 h-4.5 shrink-0" />}
            className={ALERT_CLASS}
          >
            <Stack gap="sm">
              <Select
                label="Loại đánh giá"
                data={SUBMISSION_TYPE_OPTIONS}
                value={submissionType}
                onChange={(val) => {
                  setSubmissionType((val as SubmissionType) || "initial");
                  setResubmitError(null);
                }}
                size="sm"
                radius="md"
              />

              {submissionType === "resubmit" && (
                <Stack gap="xs">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-app">Tài liệu đã sửa</label>
                    <Dropzone
                      onDrop={appendResubmitFiles}
                      onReject={handleRejectedFiles}
                      accept={ACCEPTED_MIME_TYPES}
                      maxSize={MAX_FILE_SIZE_BYTES}
                      maxFiles={MAX_FILES}
                      multiple
                      disabled={isResubmitting || isUploading}
                      className="border-2 border-dashed border-border-strong hover:border-brand/50 bg-surface-soft/30 rounded-xl p-4 text-center cursor-pointer transition-all"
                    >
                      <Dropzone.Idle>
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <Upload className="w-5 h-5 text-brand" />
                          <p className="text-xs text-text-muted">
                            Kéo thả hoặc <span className="text-brand underline">chọn tài liệu đã sửa</span>
                          </p>
                        </div>
                      </Dropzone.Idle>
                    </Dropzone>
                  </div>

                  {resubmitFiles.length > 0 && (
                    <div className="space-y-1">
                      {resubmitFiles.map((file, idx) => (
                        <div key={`${file.name}-${idx}`} className="flex items-center justify-between text-xs bg-surface-app p-2 rounded border border-border-app">
                          <span className="truncate">{file.name}</span>
                          <button type="button" onClick={() => removeResubmitFile(idx)} className="text-text-subtle hover:text-danger cursor-pointer ml-2">✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Textarea
                    label="Tóm tắt thay đổi"
                    placeholder="Mô tả các nội dung đã cập nhật (ít nhất 10 ký tự)..."
                    value={resubmitChangeSummary}
                    onChange={(e) => {
                      setResubmitChangeSummary(e.currentTarget.value);
                      setResubmitError(null);
                    }}
                    minRows={2}
                    autosize
                    size="sm"
                    radius="md"
                    error={resubmitError}
                  />
                </Stack>
              )}

              {submissionType === "logic_check" && (
                <p className="text-xs text-text-muted">
                  Hệ thống sẽ dùng tài liệu mới nhất để đánh giá khả thi và tính khách quan.
                </p>
              )}

              <Group justify="flex-end">
                <Button
                  size="sm"
                  color="brand"
                  className="shrink-0 cursor-pointer font-semibold"
                  loading={isTriggeringAudit || isResubmitting || isUploading}
                  disabled={isTriggeringAudit || isResubmitting || isUploading}
                  leftSection={submissionType === "resubmit" ? <Upload className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                  onClick={handleTriggerAudit}
                >
                  {submissionType === "resubmit"
                    ? "Tải lên & Gửi đánh giá"
                    : submissionType === "logic_check"
                      ? "Soi logic ngay"
                      : "Gửi đánh giá"}
                </Button>
              </Group>
            </Stack>
          </Alert>
        )}
      </Stack>
    );
  }

  if (stage === "submitted" && caseRequiresPayment(caseData)) {
    return (
      <Alert
        variant="light"
        color="yellow"
        radius="md"
        title="Hồ sơ đã nộp — chờ thanh toán"
        icon={<Clock className="w-4.5 h-4.5 shrink-0" />}
        className={ALERT_CLASS}
      >
        <div className="space-y-3">
          <p className="text-text-muted text-xs leading-relaxed">
            Hồ sơ đã gửi thành công. Đội ngũ Nexus chỉ duyệt và phân công Supporter sau khi thanh toán hoàn tất.
          </p>
          {onOpenPayment && (
            <Button
              size="sm"
              color="brand"
              className="shrink-0 cursor-pointer font-semibold text-xs"
              onClick={onOpenPayment}
            >
              Thanh toán dịch vụ
            </Button>
          )}
        </div>
      </Alert>
    );
  }

  const copy = STATUS_GUIDANCE_COPY[stage];
  if (copy) {
    const Icon = ICON_BY_KEY[copy.icon];
    return (
      <Alert
        variant="light"
        color={COLOR_BY_TONE[copy.tone]}
        radius="md"
        title={copy.title}
        icon={<Icon className="w-4.5 h-4.5 shrink-0" />}
        className={ALERT_CLASS}
      >
        <p className="text-text-muted text-xs leading-relaxed">{copy.description}</p>
      </Alert>
    );
  }

  return null;
}
