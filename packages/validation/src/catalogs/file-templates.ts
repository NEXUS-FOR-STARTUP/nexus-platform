// ---------------------------------------------------------------------------
// File templates — documents the team downloads and fills in by hand outside
// the app (for example the lecturer's Excel sheet). Unlike the question
// templates (cp1..cp4) there are no questions, no saved answers and no DOCX:
// only a file plus the instructions shown with it.
// ---------------------------------------------------------------------------

export interface FileTemplate {
  template_key: string;
  title: string;
  description: string;
  /** Public URL of the file, served from apps/web-1/public. */
  file_url: string;
  /** Name the browser saves the download as. */
  file_name: string;
  /** Shown in a quote block next to the download. Line breaks are preserved. */
  instructions: string;
}

const financeInstructions = [
  "File mẫu do giảng viên cung cấp. Bạn tự điền số và tự tính trong Excel hoặc Google Sheets. Nexus không điền hộ và không kiểm tra số liệu của bạn.",
  "",
  "Cách dùng",
  "1. Tải file về và mở sheet \"Profit and Loss (P&L) Statement\". Đây là bảng chính.",
  "2. Đổi tên các cột thời gian (ví dụ Q4/2026) theo kỳ của nhóm. Hướng dẫn của giảng viên: bảng dự báo 3 đến 5 năm, năm đầu chia theo tháng.",
  "3. Điền các dòng nguồn: doanh thu, hoàn tiền, giá vốn, chi phí, khoản vay và lãi suất.",
  "4. Hoàn tiền (Returns, Refunds, Discounts) nhập là số âm: trong file mẫu, Total Net Revenue là tổng của ba dòng đầu.",
  "5. Các dòng còn lại là kết quả tính. Đối chiếu từng dòng với công thức bên dưới.",
  "",
  "Công thức theo hướng dẫn của giảng viên",
  "- Total Net Revenue = Revenue 1 + Revenue 2 − Refunds",
  "- Gross Profit = Total Net Revenue − COGS",
  "- Gross Profit Margin = Gross Profit ÷ Total Net Revenue",
  "- Total Expenses = tổng các dòng chi phí vận hành",
  "- EBIT = Gross Profit − Total Expenses; EBIT margin = EBIT ÷ Total Net Revenue",
  "- Interest Expense = Loan × Interest rate (của cùng kỳ)",
  "- EBT = EBIT − Interest Expense; EBT margin = EBT ÷ Total Net Revenue",
  "- Corporate Taxes = nếu EBT > 0 thì EBT × 20%, ngược lại bằng 0",
  "- Net Earnings = EBT − Corporate Taxes",
  "",
  "Lưu ý",
  "- Ô Corporate Taxes trong file mẫu là ô nhập tay, hãy nhập theo quy tắc ở trên.",
  "- Dòng Interest Expense trong file mẫu có công thức sai ở một số ô (ví dụ ô B33 tự tham chiếu chính nó, ô C33 trỏ nhầm sang D34). Hãy kiểm tra từng ô và sửa theo công thức ở trên.",
  "- Các ô báo #DIV/0! là do dòng doanh thu đang để trống, điền doanh thu thì hết.",
  "- Doanh thu phải có căn cứ từ TAM/SAM/SOM của nhóm. Công sức thành viên không trả lương (sweat equity) phải ghi chú rõ.",
  "- Không làm bảng cân đối kế toán.",
  "- Các sheet Revenue, COGS, Expense, Valuation & Fundraising trong file đang để trống. Dùng chúng nếu nhóm muốn tính chi tiết riêng, rồi tự đưa kết quả sang sheet P&L.",
].join("\n");

export const financeTemplate: FileTemplate = {
  template_key: "finance",
  title: "Bảng tài chính (P&L)",
  description: "File Excel mẫu để nhóm tự lập bảng lãi lỗ dự báo cho CP4.",
  file_url: "/templates/finance-template.xlsx",
  file_name: "FINANCE TEMPLATE.xlsx",
  instructions: financeInstructions,
};

/** Adding a file template = one entry here. */
export const FILE_TEMPLATE_REGISTRY = { finance: financeTemplate } as const satisfies Record<string, FileTemplate>;
export type FileTemplateKey = keyof typeof FILE_TEMPLATE_REGISTRY;
export const FILE_TEMPLATE_KEYS = Object.keys(FILE_TEMPLATE_REGISTRY) as [FileTemplateKey, ...FileTemplateKey[]];

export function isFileTemplateKey(value: string | null | undefined): value is FileTemplateKey {
  return value != null && Object.hasOwn(FILE_TEMPLATE_REGISTRY, value);
}
