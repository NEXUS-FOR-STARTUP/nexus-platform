"use client";

import React from "react";
import { Case } from "@/types";
import {
  Clock,
  Activity,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Coins,
  ArrowRight,
} from "lucide-react";
import { Alert, Button } from "@mantine/core";
import { STATUS_GUIDANCE_COPY, type GuidanceTone, type GuidanceIconKey } from "./statusCopyMap";
import type { OpenInfoRequest } from "../hooks/useCaseDetails";
import { isCaseFree, PACKAGE_KEYS, caseRequiresPayment } from "@/lib/pricing";
import { usePackagePrice } from "@/lib/usePackagePrice";

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
  const { data: auditPkg } = usePackagePrice(PACKAGE_KEYS.AUDIT);
  const auditPriceLabel = auditPkg?.price != null ? `${auditPkg.price.toLocaleString("vi-VN")}đ` : "…đ";

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

    const isFree = isCaseFree(caseData);
    return (
      <Alert
        variant="light"
        color={isFree ? "blue" : "yellow"}
        radius="md"
        title={isFree ? "Kích hoạt quy trình phản biện chuyên sâu từ Supporter" : "Hồ sơ chưa hoàn tất thanh toán"}
        icon={isFree ? <Coins className="w-4.5 h-4.5 shrink-0" /> : <Clock className="w-4.5 h-4.5 shrink-0" />}
        className={ALERT_CLASS}
      >
        <div className="space-y-3">
          <p className="text-text-muted text-xs leading-relaxed">
            {isFree
              ? "Hồ sơ hiện tại đang ở gói đánh giá AI miễn phí. Để Supporter chuyên môn đọc tài liệu và viết báo cáo phản biện chi tiết, nhóm cần mua credit đánh giá chuyên sâu."
              : "Hồ sơ chưa được thanh toán. Bạn có thể nộp trước hồ sơ, quy trình phản biện chính thức sẽ bắt đầu ngay khi thanh toán hoàn tất."}
          </p>

          {isFree && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-brand/10 text-xs">
              <div className="bg-surface-app/70 p-2 rounded border border-brand/15 font-body">
                <span className="font-semibold text-brand block mb-0.5">1. Mua credit (Hiện tại)</span>
                <span className="text-text-muted text-[11px]">Mua credit đánh giá chuyên sâu ({auditPriceLabel} / lượt).</span>
              </div>
              <div className="bg-surface-app/70 p-2 rounded border border-border-app font-body">
                <span className="font-semibold text-text-app block mb-0.5">2. Nộp hồ sơ chi tiết</span>
                <span className="text-text-muted text-[11px]">Điền thông tin và tải lên tài liệu dự án (Intake).</span>
              </div>
              <div className="bg-surface-app/70 p-2 rounded border border-border-app font-body">
                <span className="font-semibold text-text-app block mb-0.5">3. Nhận phản biện</span>
                <span className="text-text-muted text-[11px]">Supporter tiếp nhận, chấm điểm và giao báo cáo.</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {onOpenPayment && (
              <Button size="sm" color="brand" leftSection={<Coins className="w-4 h-4" />} className="shrink-0 cursor-pointer font-semibold text-xs" onClick={onOpenPayment}>
                {isFree ? `Mua credit đánh giá ngay (${auditPriceLabel})` : "Thanh toán ngay"}
              </Button>
            )}
            {onOpenIntake && canOpenIntake && (
              <Button size="sm" variant="default" className="shrink-0 cursor-pointer text-xs" onClick={onOpenIntake}>
                Cập nhật thông tin hồ sơ
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

    return (
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
            Supporter đã hoàn thành đánh giá chi tiết. Xem báo cáo ở tab Tài liệu; khi nhóm đã xem xong, hãy xác nhận hoàn thành để đóng quy trình phản biện.
          </p>

          {!hasCredits ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-danger-soft dark:bg-red-950/30 p-2.5 rounded border border-danger/10 dark:border-red-800/40">
              <p className="text-danger dark:text-red-300 text-xs leading-relaxed">
                Bạn đã hết credit. Nếu muốn tiếp tục nộp bản sửa đổi mới ở vòng sau, vui lòng mua thêm credit.
              </p>
              {onOpenPayment && (
                <Button size="xs" color="red" variant="light" className="shrink-0 cursor-pointer" onClick={onOpenPayment}>
                  Mua credit
                </Button>
              )}
            </div>
          ) : (
            <p className="text-text-muted text-xs leading-relaxed">
              Muốn tiếp tục cải thiện? Sửa tài liệu rồi gửi lại — mỗi lượt đánh giá mới = 1 credit.
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
            Hồ sơ đã gửi thành công. Ban tổ chức chỉ duyệt và phân công Supporter sau khi thanh toán hoàn tất.
          </p>
          {onOpenPayment && (
            <Button
              size="sm"
              color="brand"
              leftSection={<Coins className="w-4 h-4" />}
              className="shrink-0 cursor-pointer font-semibold text-xs"
              onClick={onOpenPayment}
            >
              Thanh toán ngay
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
