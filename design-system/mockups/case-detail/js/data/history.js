// SAMPLE DATA (made up). Balances net to 2 lượt Ý tưởng, 0 lượt Thị trường.
const NOW=new Date("2026-10-12");
// [iso, display, title, stage note, type, amount, tone, status]
const MONEY=[
 ["2026-10-12","12/10/2026 02:20","Cộng lượt chấm vào số dư","Giai đoạn Ý tưởng","buy","+2","ok","Thành công"],
 ["2026-10-11","11/10/2026 16:48","Chấm bài","Giai đoạn Thị trường","use","−1","ok","Thành công"],
 ["2026-10-11","11/10/2026 16:20","Hoàn lượt chấm do lỗi hệ thống","Giai đoạn Thị trường","refund","+1","ok","Đã hoàn"],
 ["2026-10-11","11/10/2026 15:52","Chấm bài","Giai đoạn Thị trường","use","−1","warn","Lỗi, đã hoàn lượt"],
 ["2026-10-10","10/10/2026 21:07","Chấm bài","Giai đoạn Thị trường","use","−1","ok","Thành công"],
 ["2026-10-09","09/10/2026 10:30","Mua lượt chấm","Giai đoạn Thị trường · VietQR","buy","+2","ok","Thành công"],
 ["2026-10-08","08/10/2026 19:15","Chấm bài","Giai đoạn Ý tưởng","use","−1","ok","Thành công"],
 ["2026-10-07","07/10/2026 20:30","Chấm bài","Giai đoạn Ý tưởng","use","−1","ok","Thành công"],
 ["2026-10-06","06/10/2026 21:42","Chấm bài","Giai đoạn Ý tưởng","use","−1","ok","Thành công"],
 ["2026-10-06","06/10/2026 09:15","Mua lượt chấm","Giai đoạn Ý tưởng · VietQR","buy","+3","ok","Thành công"]
];
const U="Phung Luu Hoang Long (Sinh viên)";
// [day, list of [time, title, detail, actor, type]]
const EVENTS=[
 ["12/10/2026",[["02:20","Cộng 2 lượt chấm vào giai đoạn Ý tưởng","Số dư giai đoạn Ý tưởng tăng từ 0 lên 2 lượt.","Hệ thống","pay"],["02:20","Nâng cấp gói dịch vụ","Gói dịch vụ của hồ sơ đã được nâng cấp thành công.",U,"pay"]]],
 ["11/10/2026",[["16:48","Kết quả chấm giai đoạn Thị trường đã sẵn sàng","Lần chấm hoàn tất sau 4 phút. Xem ở mục Hành trình.","Hệ thống","grade"],["16:20","Hoàn 1 lượt chấm giai đoạn Thị trường","Lần chấm lúc 15:52 gặp lỗi hệ thống nên lượt chấm được hoàn lại tự động.","Hệ thống","pay"],["15:52","Chấm bài giai đoạn Thị trường gặp lỗi","Tiến trình chấm bị gián đoạn. Bài soạn được giữ nguyên, bạn có thể chấm lại.","Hệ thống","grade"]]],
 ["10/10/2026",[["21:07","Gửi chấm bài giai đoạn Thị trường","Dùng 1 lượt chấm. Còn 1 lượt.",U,"grade"]]],
 ["09/10/2026",[["10:30","Mua 2 lượt chấm giai đoạn Thị trường","Thanh toán thành công qua VietQR.",U,"pay"],["10:12","Mở giai đoạn Thị trường","Giai đoạn mở sau khi bạn trả lời đủ 22/22 câu của giai đoạn Ý tưởng.","Hệ thống","project"]]],
 ["08/10/2026",[["19:15","Gửi chấm bài giai đoạn Ý tưởng","Dùng 1 lượt chấm. Hết lượt chấm của giai đoạn Ý tưởng.",U,"grade"]]],
 ["07/10/2026",[["20:30","Gửi chấm bài giai đoạn Ý tưởng","Dùng 1 lượt chấm. Còn 1 lượt.",U,"grade"]]],
 ["06/10/2026",[["21:42","Gửi chấm bài giai đoạn Ý tưởng","Dùng 1 lượt chấm. Còn 2 lượt.",U,"grade"],["09:15","Mua 3 lượt chấm giai đoạn Ý tưởng","Thanh toán thành công qua VietQR.",U,"pay"],["09:05","Tạo dự án MentorMap","Bắt đầu trả lời các câu hỏi của giai đoạn Ý tưởng.",U,"project"]]]
];
