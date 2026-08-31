export const WALLET_COPY = {
  pageTitle: "Ví của tôi",
  menuLabel: "Ví của tôi",
  cta: "Nạp tiền qua chuyển khoản",
  depositSection: "Lịch sử nạp tiền",
  depositSectionHint: "Xem trạng thái, mã chuyển khoản và ảnh chứng minh",
  ledgerSection: "Hoạt động ví",
  viewAllDeposits: "Xem tất cả lịch sử nạp tiền",
  collapseDeposits: "Thu gọn lịch sử nạp tiền",
  viewDetail: "Xem chi tiết",
  addProof: "Thêm ảnh chứng minh",
  boundedHint: "Hiển thị 20 yêu cầu gần nhất.",
  hasProof: "Đã gửi ảnh chứng minh",
  noProof: "Chưa có ảnh chứng minh",
  proofUnavailable: "Không mở được ảnh chứng minh. Thử lại sau hoặc liên hệ hỗ trợ.",
  depositEmptyTitle: "Chưa có yêu cầu nạp tiền",
  depositEmptyHint: "Mã chuyển khoản và ảnh chứng minh sẽ hiện tại đây.",
  depositError: "Không thể tải lịch sử nạp tiền.",
  ledgerEmptyTitle: "Chưa có hoạt động ví",
  ledgerEmptyHint: "Các biến động số dư ví sẽ được ghi nhận tại đây.",
  ledgerError: "Không thể tải hoạt động ví.",
  retry: "Thử lại",
  backToWallet: "Về trang ví",
  newDeposit: "Tạo yêu cầu nạp mới",
  requestCreated: "Thời điểm tạo yêu cầu",
  bankCredited: "Thời điểm ngân hàng ghi nhận",
  activityDescription: "Nội dung giao dịch",
  transferContent: "Nội dung chuyển khoản",
  depositActivityText: "Nạp tiền qua chuyển khoản ngân hàng",
  detailTitle: "Chi tiết nạp tiền",
} as const;

export type DepositDisplay = {
  label: string;
  color: string;
  explanation: string;
  actionLabel: string;
  attention: boolean;
};

export function getDepositDisplay(status: string, hasProof?: boolean): DepositDisplay {
  if (status === "amount_mismatch") {
    return {
      label: "Số tiền chưa khớp",
      color: "yellow",
      explanation:
        "Số tiền chuyển khoản không khớp yêu cầu. Đội ngũ đang đối soát. Số dư chưa thay đổi.",
      actionLabel: WALLET_COPY.viewDetail,
      attention: true,
    };
  }
  if (status === "rejected") {
    return {
      label: "Cần xử lý lại",
      color: "red",
      explanation: "Yêu cầu chưa được xác minh. Xem lý do rồi tạo yêu cầu nạp mới.",
      actionLabel: WALLET_COPY.viewDetail,
      attention: true,
    };
  }
  if (status === "verified") {
    return {
      label: "Đã cộng vào ví",
      color: "green",
      explanation: "Tiền đã vào số dư. Xem ảnh chứng minh hoặc hoạt động ví.",
      actionLabel: WALLET_COPY.viewDetail,
      attention: false,
    };
  }
  if (status === "pending" && hasProof === false) {
    return {
      label: "Cần bổ sung chứng minh",
      color: "orange",
      explanation: "Số dư chưa thay đổi. Thêm ảnh chứng minh để được xác minh.",
      actionLabel: WALLET_COPY.addProof,
      attention: true,
    };
  }
  if (status === "pending" && hasProof === true) {
    return {
      label: "Đang chờ xác minh",
      color: "orange",
      explanation: "Đã gửi ảnh chứng minh. Số dư chưa thay đổi. Bạn có thể chờ.",
      actionLabel: WALLET_COPY.viewDetail,
      attention: true,
    };
  }
  if (status === "pending") {
    return {
      label: "Đang chờ xác minh",
      color: "orange",
      explanation: "Số dư chưa thay đổi. Mở chi tiết để xem trạng thái và ảnh chứng minh.",
      actionLabel: WALLET_COPY.viewDetail,
      attention: true,
    };
  }
  return {
    label: "Trạng thái không xác định",
    color: "gray",
    explanation: "Mở chi tiết để xem yêu cầu nạp tiền.",
    actionLabel: WALLET_COPY.viewDetail,
    attention: false,
  };
}

export function depositDetailHref(depositId: string): string {
  return `/dashboard/payment?pid=${depositId}`;
}
