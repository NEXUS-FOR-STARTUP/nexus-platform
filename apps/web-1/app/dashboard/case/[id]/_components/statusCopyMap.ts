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

export const AI_STATUS_GUIDANCE_COPY: Record<string, StatusGuidanceCopy> = {
  submitted: {
    title: "Dự án đang chuẩn bị đánh giá",
    description:
      "Hệ thống đã tiếp nhận tài liệu và đang khởi động quy trình phân tích tự động. Kết quả sẽ có sau khoảng 10 phút.",
    tone: "info",
    icon: "activity",
  },
  under_review: {
    title: "Đang đánh giá dự án",
    description:
      "Nexus đang phân tích tài liệu theo 5 nhóm tiêu chí cốt lõi (vấn đề, thị trường, mô hình kinh doanh, lợi thế cạnh tranh và khả năng triển khai). Báo cáo chi tiết sẽ sẵn sàng trong ít phút.",
    tone: "info",
    icon: "activity",
  },
};

export const STATUS_GUIDANCE_COPY: Record<string, StatusGuidanceCopy> = {
  submitted: {
    title: "Dự án đang chuẩn bị đánh giá",
    description:
      "Hệ thống đã tiếp nhận tài liệu dự án và đang chuẩn bị quy trình đánh giá.",
    tone: "info",
    icon: "clock",
  },
  under_review: {
    title: "Dự án đang được đánh giá",
    description:
      "Hệ thống đang tiến hành phân tích tài liệu và lập báo cáo đánh giá chi tiết.",
    tone: "info",
    icon: "activity",
  },
  report_ready: {
    title: "Báo cáo đánh giá đã sẵn sàng",
    description:
      "Báo cáo chi tiết cho tài liệu dự án của nhóm đã hoàn thành. Hãy xem báo cáo để nhận diện các điểm cần cải thiện.",
    tone: "success",
    icon: "check",
  },
  waiting_for_revision: {
    title: "Đang chờ tài liệu chỉnh sửa",
    description:
      "Dự án đã có báo cáo đánh giá. Hãy điều chỉnh tài liệu và tải lên phiên bản mới để tiếp tục đánh giá.",
    tone: "success",
    icon: "check",
  },
  closed: {
    title: "Dự án đã đóng",
    description:
      "Dự án này đã được đóng.",
    tone: "neutral",
    icon: "alert",
  },
  completed: {
    title: "Đã hoàn tất đánh giá",
    description:
      "Quy trình đánh giá tài liệu dự án của bạn đã hoàn thành. Bạn có thể xem toàn bộ báo cáo chi tiết tại tab Báo cáo đánh giá.",
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
