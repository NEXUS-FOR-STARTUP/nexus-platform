/**
 * Normalize and clean agent-generated markdown for client-facing PDF output.
 *
 * - Translates 13 bilingual field names → unified Vietnamese
 * - Removes debug error codes (ERR_*)
 * - Strips redundant English parenthesized noise
 * - Normalizes whitespace
 */
export function localizeAndCleanMarkdown(md: string): string {
  let res = md;

  // 1. Clean "(Field)", "Tiêu chí" → "Hạng mục"
  res = res.replace(/Trường dữ liệu\s*\(\s*Field\s*\)/gi, "Hạng mục");
  res = res.replace(/\|\s*Trường dữ liệu\s*\(\s*Field\s*\)\s*\|/gi, "| Hạng mục |");
  res = res.replace(/\|\s*Field\s*\|/gmi, "| Hạng mục |");
  res = res.replace(/\|\s*Tiêu chí đánh giá\s*\|/gi, "| Hạng mục |");
  res = res.replace(/\|\s*Trường dữ liệu\s*\|/gi, "| Hạng mục |");
  res = res.replace(/Field liên quan:/gi, "Hạng mục liên quan:");
  res = res.replace(/Trường dữ liệu liên quan:/gi, "Hạng mục liên quan:");
  res = res.replace(/Tiêu chí liên quan:/gi, "Hạng mục liên quan:");
  res = res.replace(/^- \*\*Field:\*\*/gmi, "- **Hạng mục liên quan:**");
  res = res.replace(/\*\*Field:\*\*/gi, "**Hạng mục liên quan:**");
  res = res.replace(/\*\*Trường dữ liệu:\*\*/gi, "**Hạng mục liên quan:**");
  res = res.replace(/## 2\.\s*Trạng thái các field/gi, "## 2. Bảng rà soát 13 hạng mục thông tin");
  res = res.replace(/## 2\.\s*Bảng trạng thái 13 trường dữ liệu chuẩn/gi, "## 2. Bảng rà soát 13 hạng mục thông tin");
  res = res.replace(/## 2\.\s*Bảng đánh giá 13 tiêu chí chuẩn/gi, "## 2. Bảng rà soát 13 hạng mục thông tin");

  // 2. Clean 13 Standard Fields bilingual names: "English (Tiếng Việt)" → "Tiếng Việt"
  const fieldReplacements: Array<[RegExp, string]> = [
    [/(\*{0,2})Target customer(\*{0,2})\s*\(\s*Khách hàng mục tiêu\s*\)/gi, "$1Khách hàng mục tiêu$2"],
    [/(\*{0,2})Customer story(\*{0,2})\s*\(\s*Câu chuyện khách hàng\s*\)/gi, "$1Câu chuyện khách hàng$2"],
    [/(\*{0,2})Pain point(\*{0,2})\s*\(\s*Nỗi đau khách hàng\s*\)/gi, "$1Vấn đề khách hàng$2"],
    [/(\*{0,2})Current alternative(\*{0,2})\s*\(\s*Giải pháp thay thế hiện tại\s*\)/gi, "$1Giải pháp thay thế hiện tại$2"],
    [/(\*{0,2})Existing gaps(\*{0,2})\s*\(\s*Khoảng trống giải pháp\s*\)/gi, "$1Điểm hạn chế của giải pháp hiện tại$2"],
    [/(\*{0,2})Solution description(\*{0,2})\s*\(\s*Mô tả giải pháp\s*\)/gi, "$1Giải pháp đề xuất$2"],
    [/(\*{0,2})Value proposition(\*{0,2})\s*\(\s*Tuyên ngôn giá trị\s*\)/gi, "$1Tuyên ngôn giá trị$2"],
    [/(\*{0,2})User\s*\/\s*Customer\s*\/\s*Payer\s*\/\s*Partner roles(\*{0,2})\s*\(\s*Phân tách vai trò\s*\)/gi, "$1Phân vai người dùng & người trả tiền$2"],
    [/(\*{0,2})MVP scope(\*{0,2})\s*\(\s*Phạm vi MVP\s*\)/gi, "$1Phạm vi MVP$2"],
    [/(\*{0,2})Revenue stream(\*{0,2})\s*\(\s*Dòng doanh thu\s*\)/gi, "$1Nguồn thu dự kiến$2"],
    [/(\*{0,2})Cost structure(\*{0,2})\s*\(\s*Cấu trúc chi phí\s*\)/gi, "$1Cơ cấu chi phí$2"],
    [/(\*{0,2})Unfair advantage\s*\/\s*Moat(\*{0,2})\s*\(\s*Lợi thế phòng thủ\s*\)/gi, "$1Lợi thế cạnh tranh$2"],
    [/(\*{0,2})Team capability(\*{0,2})\s*\(\s*Năng lực đội ngũ\s*\)/gi, "$1Năng lực đội ngũ$2"],
    [/(\*{0,2})Idea name(\*{0,2})\s*\(\s*Tên ý tưởng\s*\)/gi, "$1Tên ý tưởng$2"],
    [/(\*{0,2})Success metrics(\*{0,2})\s*\(\s*Chỉ số thành công\s*\)/gi, "$1Chỉ số thành công$2"],
  ];
  for (const [pattern, repl] of fieldReplacements) {
    res = res.replace(pattern, repl);
  }

  // Standalone English field names in tables
  res = res.replace(/\|\s*Target customer\s*\|/gi, "| Khách hàng mục tiêu |");
  res = res.replace(/\|\s*Customer story\s*\|/gi, "| Chân dung khách hàng |");
  res = res.replace(/\|\s*Pain point\s*\|/gi, "| Vấn đề khách hàng |");
  res = res.replace(/\|\s*Current alternative\s*\|/gi, "| Giải pháp thay thế hiện tại |");
  res = res.replace(/\|\s*Existing gaps\s*\|/gi, "| Điểm hạn chế của giải pháp hiện tại |");
  res = res.replace(/\|\s*Solution description\s*\|/gi, "| Giải pháp đề xuất |");
  res = res.replace(/\|\s*Solution\s*\|/gi, "| Giải pháp đề xuất |");
  res = res.replace(/\|\s*Value proposition\s*\|/gi, "| Tuyên ngôn giá trị |");
  res = res.replace(/\|\s*User\s*\/\s*customer\s*\/\s*payer\s*\/\s*partner\s*\|/gi, "| Phân vai người dùng & người trả tiền |");
  res = res.replace(/\|\s*MVP scope\s*\|/gi, "| Phạm vi MVP |");
  res = res.replace(/\|\s*MVP\s*\|/gi, "| Phạm vi MVP |");
  res = res.replace(/\|\s*Revenue stream\s*\|/gi, "| Nguồn thu dự kiến |");
  res = res.replace(/\|\s*Business model\s*\|/gi, "| Mô hình kinh doanh |");
  res = res.replace(/\|\s*Cost structure\s*\|/gi, "| Cơ cấu chi phí |");
  res = res.replace(/\|\s*Unfair advantage\s*\/\s*Moat\s*\|/gi, "| Lợi thế cạnh tranh |");
  res = res.replace(/\|\s*Team capability\s*\|/gi, "| Năng lực đội ngũ |");
  res = res.replace(/\|\s*Evidence\s*\|/gi, "| Bằng chứng kiểm chứng |");
  res = res.replace(/\|\s*Market\s*\|/gi, "| Quy mô thị trường |");
  res = res.replace(/\|\s*Success metrics\s*\|/gi, "| Chỉ số thành công |");

  // 3. Status localization with optional bold
  res = res.replace(/(\*{0,2})Mixed frame(\*{0,2})/gi, "$1Trộn lẫn mô hình$2");
  res = res.replace(/(\*{0,2})Too vague(\*{0,2})/gi, "$1Còn quá chung chung$2");
  res = res.replace(/(\*{0,2})Unsupported claim(\*{0,2})/gi, "$1Chưa có số liệu chứng minh$2");
  res = res.replace(/(\*{0,2})Missing(\*{0,2})/gi, "$1Chưa có thông tin$2");
  res = res.replace(/(\*{0,2})Good enough(\*{0,2})/gi, "$1Đạt yêu cầu$2");
  res = res.replace(/\s*\(\s*Field\s*\)/gi, "");

  // 4. Remove parenthesized English noise terms
  const noiseParens = [
    /\s*\(\s*disintermediation\s*\)/gi,
    /\s*\(\s*Off-platform Leakage\s*\/\s*Disintermediation\s*\)/gi,
    /\s*\(\s*Moat\s*\)/gi,
    /\s*\(\s*Supply acquisition\s*\)/gi,
    /\s*\(\s*CAC\s*\)/gi,
    /\s*\(\s*Secondary Customer\s*\)/gi,
    /\s*\(\s*Beachhead Market\s*\)/gi,
    /\s*\(\s*Beachhead Customer\s*\)/gi,
    /\s*\(\s*Consumer On-demand Booking Platform\s*\)/gi,
    /\s*\(\s*Staffing & Recruitment Agency\s*\)/gi,
    /\s*\(\s*Makeup Artist\s*\)/gi,
    /\s*\(\s*Concierge\/Manual MVP\s*\)/gi,
    /\s*\(\s*Concierge MVP\s*\)/gi,
    /\s*\(\s*Execution Risk\s*\)/gi,
    /\s*\(\s*overclaim\s*\)/gi,
    /\s*\(\s*Team Capability\s*\)/gi,
    /\s*\(\s*Mandatory Clarification Questions\s*\)/gi,
    /\s*\(\s*Target Customer\s*\)/gi,
    /\s*\(\s*MVP Validation Path\s*\)/gi,
    /\s*\(\s*Rewrite Template\s*\)/gi,
    /\s*\(\s*Pain Point\s*\)/gi,
    /\s*\(\s*Problem Hypothesis\s*\)/gi,
    /\s*\(\s*Riskiest Assumption Testing\s*\)/gi,
    /\s*\(\s*Missing\s*\)/gi,
  ];
  for (const p of noiseParens) {
    res = res.replace(p, "");
  }

  // 5. Clean error codes
  res = res.replace(/Dính mã lỗi\s*`?ERR_[A-Z0-9_]+`?(?:\s*(?:và|,)\s*`?ERR_[A-Z0-9_]+`?)*/gi, "");
  res = res.replace(/Mã bẫy lỗi chuẩn hóa:\s*`?ERR_[A-Z0-9_]+`?(?:\s*(?:&|và|,)\s*`?ERR_[A-Z0-9_]+`?)*/gi, "");
  res = res.replace(/`?ERR_[A-Z0-9_]+`?/gi, "");
  res = res.replace(/\s*;\s*;/g, ";");
  res = res.replace(/\.\s*\./g, ".");

  // 6. Normalize list items where LLM placed content on a new line after colon
  // Example: "- **Vấn đề cốt lõi:**\n  Nhóm khẳng định..." -> "- **Vấn đề cốt lõi:** Nhóm khẳng định..."
  // Preserves blockquotes (>), nested lists (-, *, +, 1.), headers (#), and empty lines
  res = res.replace(/^(\s*[-*+]\s+(?:\*\*[^*]+:\*\*|[^*:\r\n]+:))[ \t]*\r?\n(?!\s*[-*+>]|\s*\d+\.|\s*#|\s*$)[ \t]*(\S.*)$/gm, "$1 $2");

  // 7. Collapse multiple blank lines
  res = res.replace(/\n{3,}/g, "\n\n");
  return res;
}
