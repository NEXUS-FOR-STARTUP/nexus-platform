// Detailed transactions matching case-detail billing model
const MOCK_TRANSACTIONS = [
  {
    id: "tx_10928",
    time: "18/10/2026 14:22",
    timeDetail: "18/10/2026 14:22:10",
    title: "Nạp tiền vào ví",
    desc: "Chuyển khoản VietQR · Khớp lệnh tự động",
    type: "deposit",
    amount: 100000,
    status: "Thành công",
    statusTone: "green",
    detail: {
      typeLabel: "Nạp tiền vào ví",
      how: "Chuyển khoản VietQR qua tài khoản ngân hàng",
      balanceBefore: 58000,
      balanceAfter: 158000,
      refLabel: "Mã yêu cầu nạp",
      ref: "DEP-884920",
      pay: {
        method: "VietQR (SePay)",
        bank: "MB Bank (Ngân hàng Quân Đội)",
        accountNo: "0987654321",
        accountHolder: "CONG TY CP NEXUS PLATFORM",
        content: "CRTOPUP884920",
        bankTxId: "FT261018884920",
        credited: "18/10/2026 14:22:10",
        verify: "Tự động (khớp nội dung chuyển khoản)"
      }
    }
  },
  {
    id: "tx_10845",
    time: "15/10/2026 09:15",
    timeDetail: "15/10/2026 09:15:30",
    title: "Mua gói 1 lượt chấm phản biện",
    desc: "Giai đoạn Thị trường (CP2) · Trừ số dư ví",
    type: "service_payment",
    amount: -50000,
    status: "Hoàn tất",
    statusTone: "orange",
    detail: {
      typeLabel: "Mua gói đánh giá",
      how: "Trừ trực tiếp từ số dư ví Nexus",
      balanceBefore: 108000,
      balanceAfter: 58000,
      refLabel: "Mã hồ sơ dự án",
      ref: "CASE-44441B32",
      order: {
        id: "ORD-992144",
        status: "Đã thanh toán",
        items: [
          ["Lượt chấm phản biện Thị trường (CP2)", "1 lượt", "50.000 VND", "50.000 VND"]
        ],
        total: "50.000 VND"
      }
    }
  },
  {
    id: "tx_10780",
    time: "12/10/2026 16:40",
    timeDetail: "12/10/2026 16:40:00",
    title: "Hoàn tiền do lỗi hệ thống",
    desc: "Hoàn 1 lượt chấm Thị trường · Worker timeout",
    type: "refund",
    amount: 50000,
    status: "Đã hoàn tiền",
    statusTone: "blue",
    detail: {
      typeLabel: "Hoàn tiền dịch vụ",
      how: "Hệ thống tự động hoàn sau khi tiến trình chấm bị lỗi",
      balanceBefore: 58000,
      balanceAfter: 108000,
      refLabel: "Mã lần chấm bị lỗi",
      ref: "JOB-1A913F8E",
      note: "Tiến trình chấm gặp lỗi kết nối AI engine. Hệ thống đã hoàn trả 100% số tiền về ví sinh viên."
    }
  },
  {
    id: "tx_10650",
    time: "08/10/2026 11:05",
    timeDetail: "08/10/2026 11:05:45",
    title: "Mua gói 1 lượt chấm phản biện",
    desc: "Giai đoạn Ý tưởng (CP1) · Trừ số dư ví",
    type: "service_payment",
    amount: -42000,
    status: "Hoàn tất",
    statusTone: "orange",
    detail: {
      typeLabel: "Mua gói đánh giá",
      how: "Trừ trực tiếp từ số dư ví Nexus",
      balanceBefore: 100000,
      balanceAfter: 58000,
      refLabel: "Mã hồ sơ dự án",
      ref: "CASE-44441B32",
      order: {
        id: "ORD-881023",
        status: "Đã thanh toán",
        items: [
          ["Lượt chấm phản biện Ý tưởng (CP1)", "1 lượt", "42.000 VND", "42.000 VND"]
        ],
        total: "42.000 VND"
      }
    }
  },
  {
    id: "tx_10512",
    time: "01/10/2026 08:30",
    timeDetail: "01/10/2026 08:30:15",
    title: "Nạp tiền mở ví ban đầu",
    desc: "Chuyển khoản VietQR · Khởi tạo tài khoản",
    type: "deposit",
    amount: 100000,
    status: "Thành công",
    statusTone: "green",
    detail: {
      typeLabel: "Nạp tiền vào ví",
      how: "Chuyển khoản VietQR qua ngân hàng",
      balanceBefore: 0,
      balanceAfter: 100000,
      refLabel: "Mã yêu cầu nạp",
      ref: "DEP-771923",
      pay: {
        method: "VietQR (SePay)",
        bank: "MB Bank (Ngân hàng Quân Đội)",
        accountNo: "0987654321",
        accountHolder: "CONG TY CP NEXUS PLATFORM",
        content: "CRTOPUP771923",
        bankTxId: "FT261001771923",
        credited: "01/10/2026 08:30:15",
        verify: "Tự động (khớp nội dung chuyển khoản)"
      }
    }
  },
  {
    id: "tx_10488",
    time: "28/09/2026 10:00",
    timeDetail: "28/09/2026 10:00:00",
    title: "Cộng khuyến mãi sinh viên",
    desc: "Khóa học khởi nghiệp EXE101 · Quà tặng chào mừng",
    type: "adjustment",
    amount: 50000,
    status: "Đã cộng",
    statusTone: "orange",
    detail: {
      typeLabel: "Điều chỉnh số dư",
      how: "Quản trị viên cộng voucher khuyến mãi khóa học",
      balanceBefore: 0,
      balanceAfter: 50000,
      refLabel: "Mã chương trình",
      ref: "PROMO-EXE101-FALL26",
      note: "Áp dụng cho tài khoản sinh viên đăng ký đề tài tham gia vòng bảo vệ môn học EXE101."
    }
  }
];
