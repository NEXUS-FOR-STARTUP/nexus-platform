import { ReportStack, type ReportPage } from "./ReportStack";

/** Add a fourth page by appending one entry (real file dimensions required). */
const REPORT_PAGES: ReportPage[] = [
  {
    src: "/landing/report-sample.png",
    width: 1323,
    height: 1290,
    label: "Điểm tổng quát",
    alt: "Trang đầu báo cáo phản biện mẫu: điểm tổng quát 49/100, nhãn ‘Ý tưởng chưa đủ độ rõ ràng’, năm điểm thành phần Rõ ràng 40, Thị trường 65, Kinh doanh 40, Cạnh tranh 60, Thực thi 40.",
  },
  {
    src: "/landing/report-sample-2.png",
    width: 1323,
    height: 2026,
    label: "Lỗi chí mạng",
    alt: "Danh sách lỗi chí mạng (BLOCKER) của báo cáo mẫu: ba lỗi, mỗi lỗi có vấn đề cốt lõi, vì sao nghiêm trọng, nếu không sửa hệ thống sẽ hiểu sai gì và khuyến nghị nhóm viết lại.",
  },
  {
    src: "/landing/report-sample-3.png",
    width: 1323,
    height: 1871,
    label: "Lỗi quan trọng",
    alt: "Danh sách lỗi quan trọng (MAJOR) của báo cáo mẫu: ba lỗi, mỗi lỗi nêu hạng mục liên quan, vấn đề cốt lõi, vì sao quan trọng và việc nhóm cần làm rõ.",
  },
];

const REPORT_NOTE = "Trích từ báo cáo thực tế. Tên dự án đã được ẩn.";

export function LandingReportSamples() {
  return <ReportStack pages={REPORT_PAGES} note={REPORT_NOTE} />;
}
