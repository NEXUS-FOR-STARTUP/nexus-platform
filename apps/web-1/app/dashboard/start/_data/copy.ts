// Every user-facing string of the start flow. No "CP", no internal stage names.
import type { FlagStatus } from "@repo/validation";

export const STEP_NAMES = [
  "Mục tiêu",
  "Nhóm",
  "Điều bạn đang có",
  "Người quen",
  "Ý tưởng",
  "Mô tả ý tưởng",
  "Điều nhạy cảm",
] as const;

/** Rough minutes left, shown in the progress line. */
export const STEP_MINUTES = [1, 3, 4, 1, 1, 3, 1] as const;

export const INTRO_LEAD =
  "Sáu đến bảy trang ngắn, mỗi trang một câu hỏi, mất khoảng 10 đến 12 phút, chủ yếu là bấm chọn. Không cần chuẩn bị gì. Không có đáp án đúng hay sai.";

export const INTRO_BULLETS = [
  "Nhóm hiện tại đang mạnh và thiếu gì, và nên tìm thêm ai, kèm sẵn tin đăng tuyển để dán.",
  "Ý tưởng nháp của bạn có ổn không — chỉ hiện khi bạn đã viết vài dòng về ý tưởng.",
  "Vài hướng thay thế hợp với nhóm để đi hỏi thử. Đây là hướng để kiểm tra, chưa phải kết luận ý tưởng nào đúng.",
  "Nếu bạn mô tả được ý tưởng trong sáu câu: thêm phần hợp với mảng việc và câu hội đồng sẽ hỏi.",
] as const;

export const WHY = {
  basics: "Phần lớn là bấm chọn. Không có đáp án sai.",
  team: "Để biết nhóm đang thiếu người làm việc gì. Việc nhóm chưa ai làm được thì sẽ được gợi ý tuyển thêm.",
  assets:
    "Mục này quyết định hướng gợi ý ở cuối. Thứ bạn thấy bình thường có thể là lợi thế lớn của cả nhóm.",
  network:
    "Muốn biết hướng nào đáng làm, sau này bạn phải đi hỏi người thật. Nên cần biết bạn dễ tiếp cận nhóm người nào.",
  idea: "Không có thì không sao. Kể một chuyện bạn thấy khó chịu cũng đi tiếp được.",
  form: "Càng rõ càng dễ chấm. Câu ngắn cũng được, miễn đủ ý.",
  confirm: "AI chỉ đề xuất, bạn là người quyết định.",
  sensitive: "Chọn tất cả những gì đúng. Không có thì chọn dòng cuối.",
} as const;

export const ASSETS_LEAD =
  "Năm câu ngắn, cả nhóm trả lời chung: mỗi người góp vài chữ, ghi tên cho dễ nhớ. Hoặc bấm “Mình không có”.";

export const IDEA_DRAFT_LEAD = "Không bắt buộc. Bỏ trống vẫn đi tiếp được.";

export const MAD_LIBS_LEAD = "Viết như đang kể cho bạn cùng lớp; câu ngắn cũng được, miễn đủ ý.";

export const SENSITIVE_LEAD = "Chọn tất cả những gì đúng. Không có thì chọn dòng cuối.";

export const NETWORK_LEAD =
  "Ghi tự do vào ô dưới đây. Bấm một gợi ý để nó điền sẵn câu vào ô, rồi sửa lại theo ý bạn.";

export const CONFIRM_LEAD_ASSETS = "Bấm “Đúng” hoặc “Không đúng” cho từng mục. Chỉ mục đúng mới được dùng để gợi ý.";
export const CONFIRM_LEAD_IDEA = "Bấm “Đúng” hoặc “Không đúng” cho từng mục. Chỉ mục đúng mới được tính.";

export const AI_UNAVAILABLE =
  "Chưa đọc được câu trả lời bằng AI. Bạn tự chọn nhãn bên dưới — kết quả vẫn tính như thường.";

export const BUSY_LABEL =
  "AI đang đọc câu trả lời của nhóm. Thường mất 3 đến 10 giây, lúc chậm có thể lâu hơn. Bạn không cần bấm gì.";

export const STATUS: Record<FlagStatus, { icon: string; label: string }> = {
  ok: { icon: "✓", label: "Ổn" },
  warn: { icon: "!", label: "Cần lưu ý" },
  hard: { icon: "✕", label: "Khó làm nổi" },
  blocked: { icon: "⛔", label: "Không thể làm" },
};

export const RESULT = {
  title: "Kết quả sơ bộ của nhóm bạn",
  beforeReading:
    "Đọc trước khi xem: đây là các hướng nên đi kiểm tra, chưa phải kết luận ý tưởng nào đúng. Chỉ khi bạn đi hỏi người thật mới biết có khách cần hay không.",
  toc: "Trong trang này",
  createdAt: "Tạo dự án từ kết quả này",
  edit: "Sửa câu trả lời",
  restart: "Làm lại từ đầu",
  restartConfirm: "Xoá hết câu trả lời và bắt đầu lại từ đầu?",
  saveFailed: "Chưa lưu được kết quả sơ bộ vào dự án. Câu trả lời của bạn vẫn còn, thử lại giúp mình.",
  saved: "Đã lưu vào dự án",
  openCase: "Mở dự án",
  copyPost: "Sao chép",
  copied: "Đã sao chép",
  copyFailed: "Không sao chép tự động được. Bôi đen đoạn tin và nhấn Ctrl+C.",
  zonesEmpty: "Chưa đủ thông tin để gợi ý hướng. Quay lại bước “Điều bạn đang có” và kể thêm.",
  aiFailed: "Chưa chấm được theo ngành, xem phần luật bên dưới.",
  ideaSectionNote: "Bạn chưa ghi ý tưởng nên mục này chỉ kiểm tra nhóm và nguồn lực. Xem hướng gợi ý ở mục dưới.",
  structuredIncomplete:
    "Bạn chọn “Có ý tưởng cụ thể” nhưng sáu ô chưa đủ, nên phần chấm theo ngành và câu hội đồng chưa chạy. Các mục bên dưới chỉ dựa trên phần bạn đã viết.",
} as const;

export const RECRUIT_NOTE =
  "Xếp theo mức cần thiết, từ trên xuống. Một người có thể đảm nhiệm nhiều việc, nên không cần tuyển đủ bằng số vai.";

export const INTERVIEW_LEAD =
  "Chọn một hướng ở trên. Tìm vài người thuộc nhóm đó và hỏi theo năm câu này. Ghi lại nguyên văn câu họ nói. Đây là việc của bước phỏng vấn khách hàng ở giai đoạn sau. Hiện bạn chưa cần làm.";
