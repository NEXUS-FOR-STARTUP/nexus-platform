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
  creditBalance?: number | null;
  openRequestsForMoreInfo?: any[] | null;
  onSelectTab: (tab: "documents" | "discussion" | "timeline" | "settings") => void;
  onOpenPayment?: () => void;
  onOpenIntake?: () => void;
}

export default function StatusGuidanceCard({
  caseData,
  creditBalance,
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
        title="Yêu cầu bổ sung thông tin từ Supporter"
        icon={<HelpCircle className="w-4.5 h-4.5 shrink-0" />}
        className="animate-fade-in font-body text-xs shrink-0"
      >
        <div className="space-y-1 flex-grow">
            <p className="font-semibold text-warning-strong">Nội dung yêu cầu:</p>
            <p className="italic bg-surface-app/50 p-2.5 rounded border border-warning/10 font-body leading-relaxed">
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
          title="Hồ sơ đã gửi thành công — Chờ xét duyệt"
          icon={<Clock className="w-4.5 h-4.5 shrink-0" />}
          className="animate-fade-in font-body text-xs shrink-0"
        >
          <p className="text-text-muted text-xs leading-relaxed">
            Ban tổ chức đang kiểm tra hồ sơ và phân công Supporter chuyên môn phụ trách dự án (thường mất 12-24 giờ). Hiện tại bạn không cần làm gì thêm.
          </p>
        </Alert>
      );

    case "need_more_information":
      return (
        <Alert
          variant="light"
          color="orange"
          radius="md"
          title="Yêu cầu bổ sung thông tin từ Supporter"
          icon={<HelpCircle className="w-4.5 h-4.5 shrink-0" />}
          className="animate-fade-in font-body text-xs shrink-0"
        >
          <p className="text-text-muted text-xs leading-relaxed">
            Vui lòng kiểm tra lại tài liệu đã tải lên và bổ sung theo yêu cầu của Supporter.
          </p>
        </Alert>
      );

    case "under_review":
      return (
        <Alert
          variant="light"
          color="blue"
          radius="md"
          title="Dự án đang trong quá trình phản biện"
          icon={<Activity className="w-4.5 h-4.5 shrink-0" />}
          className="animate-fade-in font-body text-xs shrink-0"
        >
          <p className="text-text-muted text-xs leading-relaxed">
            Supporter đang tiến hành đọc tài liệu và viết báo cáo phản biện chi tiết. Vui lòng chờ báo cáo hoặc theo dõi Thảo luận nếu Supporter cần trao đổi thêm.
          </p>
        </Alert>
      );

    case "report_ready":
    case "waiting_for_revision": {
      return (
        <Alert
          variant="light"
          color="green"
          radius="md"
          title="Báo cáo phản biện đã sẵn sàng — Nhóm có thể nộp bản sửa đổi"
          icon={<CheckCircle2 className="w-4.5 h-4.5 shrink-0" />}
          className="animate-fade-in font-body text-xs shrink-0"
        >
          <div className="mt-1">
            <p className="text-text-muted text-xs leading-relaxed">
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
          title={hasSupporter ? "Bản sửa đổi đã gửi thành công — Chờ thẩm định" : "Bản sửa đổi đã gửi thành công — Chờ Admin phân công"}
          icon={<Clock className="w-4.5 h-4.5 shrink-0" />}
          className="animate-fade-in font-body text-xs shrink-0"
        >
          <p className="text-text-muted text-xs leading-relaxed">
            {hasSupporter
              ? "Supporter đang tiến hành thẩm định bản sửa đổi mới nhất của bạn."
              : "Bản sửa đổi đã được ghi nhận. Ban tổ chức (Admin) đang phân công Supporter chuyên môn thẩm định bản mới này."}
          </p>
        </Alert>
      );
    }

    case "closed":
      return (
        <Alert
          variant="light"
          color="gray"
          radius="md"
          title="Hồ sơ đã đóng"
          icon={<AlertCircle className="w-4.5 h-4.5 shrink-0" />}
          className="animate-fade-in font-body text-xs shrink-0"
        >
          <p className="text-text-muted text-xs leading-relaxed">
            Hồ sơ phản biện này đã được đóng. Vui lòng liên hệ Ban tổ chức nếu cần thêm thông tin.
          </p>
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
          title="Quy trình phản biện đã hoàn tất"
          icon={<CheckCircle2 className="w-4.5 h-4.5 shrink-0" />}
          className="animate-fade-in font-body text-xs shrink-0"
        >
          <p className="text-text-muted text-xs leading-relaxed">
            Hồ sơ phản biện dự án của bạn đã hoàn thành qua các vòng. Bạn có thể xem báo cáo chi tiết và điểm số tại tab Tài liệu dự án.
          </p>
        </Alert>
      );

    case "rejected":
      return (
        <Alert
          variant="light"
          color="red"
          radius="md"
          title="Hồ sơ bị từ chối xét duyệt"
          icon={<AlertCircle className="w-4.5 h-4.5 shrink-0" />}
          className="animate-fade-in font-body text-xs shrink-0"
        >
          <div className="space-y-1 flex-grow">
            {rejectionReason && (
              <p className="font-semibold text-danger">Lý do từ chối:</p>
            )}
            <p className="text-text-muted text-xs leading-relaxed">
              {rejectionReason
                ? rejectionReason
                : "Yêu cầu phản biện dự án của bạn không được duyệt. Vui lòng liên hệ với Ban tổ chức hoặc gửi thắc mắc qua phần Thảo luận."
              }
            </p>
            {onOpenIntake && (
              <div className="pt-2">
                <Button
                  size="sm"
                  color="brand"
                  className="shrink-0 cursor-pointer"
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
      const hasCredits = (creditBalance ?? 0) > 0;
      if (hasCredits) return null;

      const isFree = caseData.package_id === "pkg_tf_free";
      return (
        <Alert
          variant="light"
          color={isFree ? "blue" : "yellow"}
          radius="md"
          title={isFree ? "Nâng cấp lên đánh giá chuyên sâu" : "Chờ thanh toán dịch vụ"}
          icon={isFree ? <Zap className="w-4.5 h-4.5 shrink-0" /> : <Clock className="w-4.5 h-4.5 shrink-0" />}
          className="animate-fade-in font-body text-xs shrink-0"
          styles={{ wrapper: { alignItems: "center" } }}
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-text-muted text-xs leading-relaxed">
              {isFree
                ? "Bạn đang dùng gói miễn phí. Mua lượt đánh giá chuyên sâu để nhận phản biện chi tiết từ chuyên gia."
                : "Vui lòng hoàn tất thanh toán để kích hoạt quy trình phản biện."
              }
            </p>
            {onOpenPayment && (
              <Button
                size="sm"
                color="brand"
                className="shrink-0 cursor-pointer"
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
          icon={<Clock className="w-4.5 h-4.5 shrink-0" />}
          className="animate-fade-in font-body text-xs shrink-0"
          styles={{ wrapper: { alignItems: "center" } }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="mantine-Alert-title mb-0.5">Cần cập nhật thông tin hồ sơ</div>
              <p className="text-text-muted text-xs leading-relaxed">
                Vui lòng cập nhật thông tin hồ sơ khởi nghiệp trước khi gửi để Supporter có thể đánh giá chính xác.
              </p>
            </div>
            {onOpenIntake && (
              <Button
                size="sm"
                color="brand"
                className="shrink-0 cursor-pointer"
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
