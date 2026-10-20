// Wallet state and configuration
const MOCK_WALLET = {
  balance: 158000,
  totalDeposited: 250000,
  totalSpent: 92000,
  approxCredits: 3,
  currency: "VND",
  minTopup: 2000,
  defaultTopup: 50000,
  suggestedTopup: 79000,
  bankInfo: {
    bankName: "MB Bank (Ngân hàng Quân Đội)",
    accountNumber: "0987654321",
    accountHolder: "CONG TY CO PHAN NEXUS PLATFORM"
  }
};

const TYPE_CONFIG = {
  deposit: { label: "Nạp tiền", color: "green" },
  withdrawal: { label: "Trừ ví", color: "red" },
  refund: { label: "Hoàn tiền", color: "blue" },
  adjustment: { label: "Điều chỉnh", color: "orange" },
  migration: { label: "Chuyển đổi", color: "orange" },
  service_payment: { label: "Mua gói đánh giá", color: "orange" }
};

const STATUS_CONFIG = {
  pending: { label: "Đang chờ xác minh", color: "orange" },
  verified: { label: "Đã vào ví", color: "green" },
  rejected: { label: "Từ chối", color: "red" },
  amount_mismatch: { label: "Sai số tiền", color: "orange" }
};

function formatVND(amt) {
  return (amt || 0).toLocaleString("vi-VN") + " VND";
}

function formatDate(iso) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}
