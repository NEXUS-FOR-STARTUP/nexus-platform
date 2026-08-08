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

interface StatusGuidanceCardProps {
  caseData: Case;
  openRequestsForMoreInfo?: any[] | null;
  onSelectTab: (tab: "documents" | "discussion" | "timeline" | "settings") => void;
  onOpenPayment?: () => void;
  onOpenIntake?: () => void;
}

export default function StatusGuidanceCard({
  caseData,
  openRequestsForMoreInfo,
  onOpenPayment,
  onOpenIntake,
}: StatusGuidanceCardProps) {
  const stage = caseData.user_facing_stage;
  const hasInfoRequest = openRequestsForMoreInfo && openRequestsForMoreInfo.length > 0;

  // Extract rejection reason from events when case was rejected
  const rejectionReason: string | null = (() => {
    if (stage !== "rejected") return null;
    const events = caseData.events || [];
    const rejectionEvent = [...events]
      .reverse()
      .find(e => e.event_type === "case_rejected" || e.event_type === "vetoed");
    return (rejectionEvent?.metadata_json as any)?.reason || null;
  })();

  if (hasInfoRequest) {
    const queryText = openRequestsForMoreInfo[0].metadata_json?.query || "Vui lòng kiểm tra lại tài liệu đã tải lên.";
    return (
      <Alert
        variant="light"
        color="orange"
        radius="md"
        icon={<HelpCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />}
        className="animate-fade-in font-body text-xs shrink-0 border border-amber-200 dark:border-amber-900/60 shadow-xs"
        styles={{
          wrapper: { alignItems: "center" },
          body: { gap: "2px" },
        }}
      >
        <div className="space-y-1 py-0.5">
          <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200 tracking-tight">
            Yêu cầu bổ sung thông tin từ Supporter
          </h4>
          <p className="italic bg-surface-app/60 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-900/40 text-text-app text-xs leading-relaxed">
            "{queryText}"
          </p>
        </div>
      </Alert>
    );
  }

  switch (stage) {
    case "submitted":
      return (
        <Alert
          variant="light"
          color="blue"
          radius="md"
          icon={<Clock className="w-5 h-5 shrink-0 text-brand" />}
          className="animate-fade-in font-body text-xs shrink-0 border border-blue-100 dark:border-blue-950/60 shadow-xs"
          styles={{
            wrapper: { alignItems: "center" },
            body: { gap: "2px" },
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-0.5">
            <div className="space-y-0.5">
              <h4 className="font-semibold text-sm text-brand tracking-tight">
                Hồ sơ đã gửi thành công — Chờ xét duyệt
              </h4>
              <p className="text-text-app text-xs leading-relaxed max-w-2xl">
                Ban tổ chức đang kiểm tra hồ sơ và phân công Supporter chuyên môn phụ trách dự án (thường mất 12-24 giờ). Bạn vẫn có thể cập nhật lại thông tin hồ sơ trước khi Admin phê duyệt.
              </p>
            </div>
            {onOpenIntake && (
              <Button
                size="sm"
                color="brand"
                variant="filled"
                className="shrink-0 cursor-pointer font-medium shadow-xs hover:shadow-md transition-all duration-200"
                onClick={onOpenIntake}
              >
                Chỉnh sửa hồ sơ
              </Button>
            )}
          </div>
        </Alert>
      );

    case "need_more_information":
      return (
        <Alert
          variant="light"
          color="orange"
          radius="md"
          icon={<HelpCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />}
          className="animate-fade-in font-body text-xs shrink-0 border border-amber-200 dark:border-amber-900/60 shadow-xs"
          styles={{
            wrapper: { alignItems: "center" },
            body: { gap: "2px" },
          }}
        >
          <div className="space-y-0.5 py-0.5">
            <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200 tracking-tight">
              Yêu cầu bổ sung thông tin từ Supporter
            </h4>
            <p className="text-text-app text-xs leading-relaxed max-w-full">
              Vui lòng kiểm tra lại tài liệu đã tải lên và bổ sung theo yêu cầu của Supporter.
            </p>
          </div>
        </Alert>
      );

    case "under_review":
      return (
        <Alert
          variant="light"
          color="blue"
          radius="md"
          icon={<Activity className="w-5 h-5 shrink-0 text-brand" />}
          className="animate-fade-in font-body text-xs shrink-0 border border-blue-100 dark:border-blue-950/60 shadow-xs"
          styles={{
            wrapper: { alignItems: "center" },
            body: { gap: "2px" },
          }}
        >
          <div className="space-y-0.5 py-0.5">
            <h4 className="font-semibold text-sm text-brand tracking-tight">
              Dự án đang trong quá trình phản biện
            </h4>
            <p className="text-text-app text-xs leading-relaxed max-w-full">
              Supporter đang tiến hành đọc tài liệu và viết báo cáo phản biện chi tiết. Vui lòng chờ báo cáo hoặc theo dõi Thảo luận nếu Supporter cần trao đổi thêm.
            </p>
          </div>
        </Alert>
      );

    case "report_ready":
    case "waiting_for_revision": {
      return (
        <Alert
          variant="light"
          color="green"
          radius="md"
          icon={<CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
          className="animate-fade-in font-body text-xs shrink-0 border border-emerald-200 dark:border-emerald-950/60 shadow-xs"
          styles={{
            wrapper: { alignItems: "center" },
            body: { gap: "2px" },
          }}
        >
          <div className="space-y-0.5 py-0.5">
            <h4 className="font-semibold text-sm text-emerald-900 dark:text-emerald-200 tracking-tight">
              Báo cáo phản biện đã sẵn sàng — Nhóm có thể nộp bản sửa đổi
            </h4>
            <p className="text-text-app text-xs leading-relaxed max-w-full">
              Supporter đã hoàn thành đánh giá chi tiết. Nhóm có thể xem kết quả phản biện bên dưới, tiến hành sửa đổi bài làm và nộp bản mới (v02, v03...) bằng nút <strong>"Tải tài liệu"</strong> để Supporter thẩm định vòng tiếp theo.
            </p>
          </div>
        </Alert>
      );
    }

    case "revision_submitted": {
      const hasSupporter = !!(caseData.assigned_supporter_auth_user_id || caseData.assigned_supporter?.name);
      return (
        <Alert
          variant="light"
          color="blue"
          radius="md"
          icon={<Clock className="w-5 h-5 shrink-0 text-brand" />}
          className="animate-fade-in font-body text-xs shrink-0 border border-blue-100 dark:border-blue-950/60 shadow-xs"
          styles={{
            wrapper: { alignItems: "center" },
            body: { gap: "2px" },
          }}
        >
          <div className="space-y-0.5 py-0.5">
            <h4 className="font-semibold text-sm text-brand tracking-tight">
              {hasSupporter ? "Bản sửa đổi đã gửi thành công — Chờ thẩm định" : "Bản sửa đổi đã gửi thành công — Chờ Admin phân công"}
            </h4>
            <p className="text-text-app text-xs leading-relaxed max-w-full">
              {hasSupporter
                ? "Supporter đang tiến hành thẩm định bản sửa đổi mới nhất của bạn."
                : "Bản sửa đổi đã được ghi nhận. Ban tổ chức (Admin) đang phân công Supporter chuyên môn thẩm định bản mới này."}
            </p>
          </div>
        </Alert>
      );
    }

    case "closed":
      return (
        <Alert
          variant="light"
          color="gray"
          radius="md"
          icon={<AlertCircle className="w-5 h-5 shrink-0 text-gray-600 dark:text-gray-400" />}
          className="animate-fade-in font-body text-xs shrink-0 border border-gray-200 dark:border-gray-800 shadow-xs"
          styles={{
            wrapper: { alignItems: "center" },
            body: { gap: "2px" },
          }}
        >
          <div className="space-y-0.5 py-0.5">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-200 tracking-tight">
              Hồ sơ đã đóng
            </h4>
            <p className="text-text-app text-xs leading-relaxed max-w-full">
              Hồ sơ phản biện này đã được đóng. Vui lòng liên hệ Ban tổ chức nếu cần thêm thông tin.
            </p>
          </div>
        </Alert>
      );

    case "completed":
    case "approved":
    case "APPROVED":
    case "sent":
      return (
        <Alert
          variant="light"
          color="green"
          radius="md"
          icon={<CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
          className="animate-fade-in font-body text-xs shrink-0 border border-emerald-200 dark:border-emerald-950/60 shadow-xs"
          styles={{
            wrapper: { alignItems: "center" },
            body: { gap: "2px" },
          }}
        >
          <div className="space-y-0.5 py-0.5">
            <h4 className="font-semibold text-sm text-emerald-900 dark:text-emerald-200 tracking-tight">
              Quy trình phản biện đã hoàn tất
            </h4>
            <p className="text-text-app text-xs leading-relaxed max-w-full">
              Hồ sơ phản biện dự án của bạn đã hoàn thành qua các vòng. Bạn có thể xem báo cáo chi tiết và điểm số tại tab Tài liệu dự án.
            </p>
          </div>
        </Alert>
      );

    case "rejected":
      return (
        <Alert
          variant="light"
          color="red"
          radius="md"
          icon={<AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />}
          className="animate-fade-in font-body text-xs shrink-0 border border-red-200 dark:border-red-950/60 shadow-xs"
          styles={{
            wrapper: { alignItems: "center" },
            body: { gap: "2px" },
          }}
        >
          <div className="space-y-1.5 py-0.5">
            <h4 className="font-semibold text-sm text-red-900 dark:text-red-200 tracking-tight">
              Hồ sơ bị từ chối xét duyệt
            </h4>
            {rejectionReason && (
              <p className="font-semibold text-danger text-xs">
                Lý do từ chối: <span className="font-normal text-text-app">{rejectionReason}</span>
              </p>
            )}
            <p className="text-text-app text-xs leading-relaxed max-w-full">
              {!rejectionReason && "Yêu cầu phản biện dự án của bạn không được duyệt. Vui lòng liên hệ với Ban tổ chức hoặc gửi thắc mắc qua phần Thảo luận."}
            </p>
            {onOpenIntake && (
              <div className="pt-1">
                <Button
                  size="sm"
                  color="brand"
                  variant="filled"
                  className="shrink-0 cursor-pointer font-medium shadow-xs hover:shadow-md transition-all duration-200"
                  onClick={onOpenIntake}
                >
                  Chỉnh sửa hồ sơ để nộp lại
                </Button>
              </div>
            )}
          </div>
        </Alert>
      );

    case "intake_pending": {
      const isFree = caseData.package_id === "pkg_tf_free";
      return (
        <Alert
          variant="light"
          color={isFree ? "blue" : "yellow"}
          radius="md"
          icon={isFree ? <Zap className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" /> : <Clock className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />}
          className="animate-fade-in font-body text-xs shrink-0 border border-blue-100 dark:border-blue-950/60 shadow-xs"
          styles={{
            wrapper: { alignItems: "center" },
            body: { gap: "2px" },
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-0.5">
            <div className="space-y-0.5">
              <h4 className="font-semibold text-sm text-text-primary tracking-tight">
                {isFree ? "Nâng cấp lên đánh giá chuyên sâu" : "Chờ thanh toán dịch vụ"}
              </h4>
              <p className="text-text-app text-xs leading-relaxed max-w-2xl">
                {isFree
                  ? "Bạn đang dùng gói miễn phí. Mua lượt đánh giá chuyên sâu để nhận phản biện chi tiết từ chuyên gia."
                  : "Vui lòng hoàn tất thanh toán để kích hoạt quy trình phản biện."
                }
              </p>
            </div>
            {onOpenPayment && (
              <Button
                size="sm"
                color="brand"
                variant="filled"
                className="shrink-0 cursor-pointer self-start md:self-auto font-medium shadow-xs hover:shadow-md transition-all duration-200"
                onClick={onOpenPayment}
              >
                {isFree ? "Mua lượt đánh giá" : "Thanh toán ngay"}
              </Button>
            )}
          </div>
        </Alert>
      );
    }

    case "intake_ready":
      return (
        <Alert
          variant="light"
          color="blue"
          radius="md"
          icon={<Clock className="w-5 h-5 shrink-0 text-brand" />}
          className="animate-fade-in font-body text-xs shrink-0 border border-blue-100 dark:border-blue-950/60 shadow-xs"
          styles={{
            wrapper: { alignItems: "center" },
            body: { gap: "2px" },
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-0.5">
            <div className="space-y-0.5">
              <h4 className="font-semibold text-sm text-brand tracking-tight">
                Cần cập nhật thông tin hồ sơ
              </h4>
              <p className="text-text-app text-xs leading-relaxed max-w-full">
                Vui lòng cập nhật thông tin hồ sơ khởi nghiệp trước khi gửi để Supporter có thể đánh giá chính xác.
              </p>
            </div>
            {onOpenIntake && (
              <Button
                size="sm"
                color="brand"
                variant="filled"
                className="shrink-0 cursor-pointer font-medium shadow-xs hover:shadow-md transition-all duration-200"
                onClick={onOpenIntake}
              >
                Cập nhật ngay
              </Button>
            )}
          </div>
        </Alert>
      );

    default:
      return null;
  }
}
