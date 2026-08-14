/**
 * Static Vietnamese copy for the StatusGuidanceCard stage switch (D1/D10).
 * Dynamic stages (rejected, intake_pending, intake_ready, revision_submitted,
 * need_more_information) render inline in the card because they need buttons
 * or runtime-derived text.
 */

export type GuidanceTone = "info" | "warning" | "success" | "neutral" | "danger";
export type GuidanceIconKey = "clock" | "activity" | "help" | "check" | "alert";

export interface StatusGuidanceCopy {
  title: string;
  description: string;
  tone: GuidanceTone;
  icon: GuidanceIconKey;
}

export const STATUS_GUIDANCE_COPY: Record<string, StatusGuidanceCopy> = {
  submitted: {
    title: "Hồ sơ đã gửi thành công — Chờ xét duyệt",
    description:
      "Ban tổ chức đang kiểm tra hồ sơ và phân công Supporter chuyên môn phụ trách dự án (thường mất 12-24 giờ). Hiện tại bạn không cần làm gì thêm.",
    tone: "info",
    icon: "clock",
  },
  under_review: {
    title: "Dự án đang trong quá trình phản biện",
    description:
      "Supporter đang tiến hành đọc tài liệu và viết báo cáo phản biện chi tiết. Vui lòng chờ báo cáo hoặc theo dõi Thảo luận nếu Supporter cần trao đổi thêm.",
    tone: "info",
    icon: "activity",
  },
  report_ready: {
    title: "Báo cáo phản biện đã sẵn sàng — Nhóm có thể nộp bản sửa đổi",
    description:
      "Supporter đã hoàn thành đánh giá chi tiết. Nhóm có thể xem kết quả phản biện bên dưới, tiến hành sửa đổi bài làm và nộp bản mới (v02, v03...) để Supporter thẩm định vòng tiếp theo.",
    tone: "success",
    icon: "check",
  },
  waiting_for_revision: {
    title: "Báo cáo phản biện đã sẵn sàng — Nhóm có thể nộp bản sửa đổi",
    description:
      "Supporter đã hoàn thành đánh giá chi tiết. Nhóm có thể xem kết quả phản biện bên dưới, tiến hành sửa đổi bài làm và nộp bản mới (v02, v03...) để Supporter thẩm định vòng tiếp theo.",
    tone: "success",
    icon: "check",
  },
  closed: {
    title: "Hồ sơ đã đóng",
    description:
      "Hồ sơ phản biện này đã được đóng. Vui lòng liên hệ Ban tổ chức nếu cần thêm thông tin.",
    tone: "neutral",
    icon: "alert",
  },
  completed: {
    title: "Quy trình phản biện đã hoàn tất",
    description:
      "Hồ sơ phản biện dự án của bạn đã hoàn thành qua các vòng. Bạn có thể xem báo cáo chi tiết và điểm số tại tab Tài liệu dự án.",
    tone: "success",
    icon: "check",
  },
  approved: {
    title: "Quy trình phản biện đã hoàn tất",
    description:
      "Hồ sơ phản biện dự án của bạn đã hoàn thành qua các vòng. Bạn có thể xem báo cáo chi tiết và điểm số tại tab Tài liệu dự án.",
    tone: "success",
    icon: "check",
  },
  APPROVED: {
    title: "Quy trình phản biện đã hoàn tất",
    description:
      "Hồ sơ phản biện dự án của bạn đã hoàn thành qua các vòng. Bạn có thể xem báo cáo chi tiết và điểm số tại tab Tài liệu dự án.",
    tone: "success",
    icon: "check",
  },
  sent: {
    title: "Quy trình phản biện đã hoàn tất",
    description:
      "Hồ sơ phản biện dự án của bạn đã hoàn thành qua các vòng. Bạn có thể xem báo cáo chi tiết và điểm số tại tab Tài liệu dự án.",
    tone: "success",
    icon: "check",
  },
};
