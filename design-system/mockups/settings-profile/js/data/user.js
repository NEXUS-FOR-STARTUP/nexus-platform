// Default user session data matching apps/web-1 contracts
const MOCK_USER = {
  name: "Nguyễn Tuấn",
  email: "tuan.nguyen@example.com",
  image: null,
  role: "student",
  created_at: "2026-09-15T08:30:00Z"
};

const AVATAR_CONFIG = {
  maxSizeBytes: 2 * 1024 * 1024, // 2MB
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  allowedExts: [".jpg", ".jpeg", ".png", ".webp"]
};

const MOCK_SESSIONS = [
  {
    id: "sess_1",
    device: "Chrome trên Windows 11",
    type: "monitor",
    location: "Hà Nội, Việt Nam",
    ip: "118.70.192.44",
    activeText: "Đang hoạt động",
    isCurrent: true
  },
  {
    id: "sess_2",
    device: "Safari trên iPhone 15 Pro",
    type: "smartphone",
    location: "TP. Hồ Chí Minh, Việt Nam",
    ip: "14.161.22.105",
    activeText: "2 giờ trước",
    isCurrent: false
  },
  {
    id: "sess_3",
    device: "Edge trên Windows 10",
    type: "monitor",
    location: "Đà Nẵng, Việt Nam",
    ip: "42.114.18.90",
    activeText: "3 ngày trước",
    isCurrent: false
  },
  {
    id: "sess_4",
    device: "Chrome trên MacOS Sonoma",
    type: "laptop",
    location: "Hà Nội, Việt Nam",
    ip: "118.70.192.44",
    activeText: "1 tuần trước",
    isCurrent: false
  }
];

const MOCK_NOTIFICATIONS = [
  {
    id: "eval_results",
    title: "Thông báo kết quả phản biện",
    desc: "Nhận email và thông báo khi AI hoặc Supporter hoàn thành chấm bài dự án.",
    enabled: true
  },
  {
    id: "wallet_balance",
    title: "Biến động số dư ví",
    desc: "Thông báo khi giao dịch nạp tiền hoặc thanh toán mua gói đánh giá thành công.",
    enabled: true
  },
  {
    id: "case_deadline",
    title: "Nhắc nhở hạn nộp bài",
    desc: "Cảnh báo trước 24 giờ khi đến hạn nộp báo cáo phản biện giai đoạn.",
    enabled: true
  },
  {
    id: "system_news",
    title: "Bản tin hệ thống Nexus",
    desc: "Cập nhật các tính năng mô hình AI mới và quy chế phản biện khởi nghiệp.",
    enabled: false
  }
];
