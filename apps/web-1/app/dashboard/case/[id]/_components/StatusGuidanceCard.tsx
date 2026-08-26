"use client";

import React from "react";
import { Case } from "@/types";
import {
  Clock,
  Activity,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Zap,
} from "lucide-react";
import { Alert, Button } from "@mantine/core";
import { STATUS_GUIDANCE_COPY, type GuidanceTone, type GuidanceIconKey } from "./statusCopyMap";
import type { OpenInfoRequest } from "../hooks/useCaseDetails";
import { isCaseFree } from "@/lib/pricing";

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
}: StatusGuidanceCardProps) {
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
              : "Yêu cầu phản biện dự án của bạn không được duyệt. Vui lòng liên hệ với Ban tổ chức hoặc gửi thắc mắc qua phần Thảo luận."}
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
    if (hasCredits) return null;

    const isFree = isCaseFree(caseData);
    return (
      <Alert
        variant="light"
        color={isFree ? "blue" : "yellow"}
        radius="md"
        title={isFree ? "Nâng cấp lên đánh giá chuyên sâu" : "Hồ sơ chưa thanh toán"}
        icon={isFree ? <Zap className="w-4.5 h-4.5 shrink-0" /> : <Clock className="w-4.5 h-4.5 shrink-0" />}
        className={ALERT_CLASS}
        styles={{ wrapper: { alignItems: "center" } }}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-text-muted text-xs leading-relaxed">
            {isFree
              ? "Bạn đang dùng gói miễn phí. Mua lượt đánh giá chuyên sâu để nhận phản biện chi tiết từ chuyên gia."
              : "Bạn có thể nộp hồ sơ trước, thanh toán sau — phản biện chỉ bắt đầu sau khi thanh toán hoàn tất."}
          </p>
          {onOpenPayment && (
            <Button size="sm" color="brand" className="shrink-0 cursor-pointer" onClick={onOpenPayment}>
              {isFree ? "Mua lượt đánh giá" : "Thanh toán ngay"}
            </Button>
          )}
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
            : "Bản sửa đổi đã được ghi nhận. Ban tổ chức (Admin) đang phân công Supporter chuyên môn thẩm định bản mới này."}
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
    const isFree = isCaseFree(caseData);
    const hasCredits = isFree || (creditBalance ?? 0) > 0;
    const canConfirmComplete = hasTransition("T17_USER_CONFIRM_COMPLETE");

    if (!hasCredits) {
      return (
        <Alert
          variant="light"
          color="red"
          radius="md"
          title="Hết credit đánh giá"
          icon={<AlertCircle className="w-4.5 h-4.5 shrink-0" />}
          className={ALERT_CLASS}
          styles={{ wrapper: { alignItems: "center" } }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-text-muted text-xs leading-relaxed">
              Bạn đã hết credit đánh giá cho dự án này. Mua thêm credit để tiếp tục các lượt đánh giá tiếp theo.
            </p>
            {onOpenPayment && (
              <Button size="sm" color="brand" className="shrink-0 cursor-pointer" onClick={onOpenPayment}>
                Mua credit
              </Button>
            )}
          </div>
        </Alert>
      );
    }

    return (
      <Alert
        variant="light"
        color="green"
        radius="md"
        title="Báo cáo phản biện đã sẵn sàng"
        icon={<CheckCircle2 className="w-4.5 h-4.5 shrink-0" />}
        className={ALERT_CLASS}
      >
        <div className="space-y-2 flex-grow">
          <p className="text-text-muted text-xs leading-relaxed">
            Supporter đã hoàn thành đánh giá chi tiết. Xem báo cáo ở tab Tài liệu; khi nhóm đã xem xong, hãy xác nhận hoàn thành để đóng quy trình phản biện.
          </p>
          <p className="text-text-muted text-xs leading-relaxed">
            Muốn tiếp tục cải thiện? Sửa tài liệu rồi gửi lại — mỗi lượt đánh giá mới = 1 credit.
          </p>
          {onConfirmComplete && canConfirmComplete && (
            <Button
              size="sm"
              color="brand"
              className="shrink-0 cursor-pointer"
              loading={isConfirmingComplete}
              onClick={onConfirmComplete}
            >
              Xác nhận hoàn thành
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
