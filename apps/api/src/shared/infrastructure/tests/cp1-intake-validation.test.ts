import { test } from "node:test";
import assert from "node:assert";
import {
  Cp1IntakeCaps,
  Cp1IntakeSchema,
  CP1_EMAIL_MAX,
  CP1_LONG_MAX,
  CP1_MAX_DOCUMENTS,
  CP1_SHORT_MAX,
} from "@repo/validation";

const { validateCp1Intake } = await import(
  "../../../modules/cases/http/cases.schema.js"
);

const EMPTY = {};

const VALID_BODY = {
  contact: {
    full_name: "Nguyen Van A",
    student_code: "SE12345",
    team_role: "Leader",
    zalo: "0123456789",
    email: "a@fpt.edu.vn",
  },
  current_blocker: "Nhóm đang gặp khó khăn với việc xác định phân khúc khách hàng mục tiêu",
  support_needs: {
    primary_need: "Phân tích thị trường và khách hàng mục tiêu",
  },
  documents: [
    {
      file_url: "https://example.com/doc.pdf",
      drive_url: "",
      document_type: "business_plan",
    },
  ],
  boundary_confirmations: [
    "cam_ket_1",
    "cam_ket_2",
    "cam_ket_3",
  ],
};

interface TestCase {
  name: string;
  body: any;
  expectedErrors: string[];
}

const CASES: TestCase[] = [
  // --- 0. EMPTY / NULL BODY ---
  {
    name: "null body",
    body: null,
    expectedErrors: ["Dữ liệu trống"],
  },
  {
    name: "undefined body",
    body: undefined,
    expectedErrors: ["Dữ liệu trống"],
  },
  {
    name: "empty object",
    body: {},
    expectedErrors: [
      "Thiếu thông tin liên hệ",
      "Cần mô tả ngắn điểm kẹt hiện tại của nhóm",
      "Cần chọn nhu cầu hỗ trợ chính",
      "Thư mục tài liệu là bắt buộc",
      "Phải xác nhận đầy đủ ít nhất 3 cam kết ranh giới",
    ],
  },

  // --- 1. CONTACT ERRORS ---
  {
    name: "contact: missing full_name",
    body: { ...VALID_BODY, contact: { ...VALID_BODY.contact, full_name: "" } },
    expectedErrors: ["Họ tên người liên hệ không hợp lệ (tối thiểu 2 ký tự)"],
  },
  {
    name: "contact: full_name too short (1 char)",
    body: { ...VALID_BODY, contact: { ...VALID_BODY.contact, full_name: "A" } },
    expectedErrors: ["Họ tên người liên hệ không hợp lệ (tối thiểu 2 ký tự)"],
  },
  {
    name: "contact: missing student_code",
    body: { ...VALID_BODY, contact: { ...VALID_BODY.contact, student_code: "" } },
    expectedErrors: ["Mã số sinh viên không hợp lệ (tối thiểu 5 ký tự)"],
  },
  {
    name: "contact: student_code too short (4 chars)",
    body: { ...VALID_BODY, contact: { ...VALID_BODY.contact, student_code: "SE12" } },
    expectedErrors: ["Mã số sinh viên không hợp lệ (tối thiểu 5 ký tự)"],
  },
  {
    name: "contact: missing team_role",
    body: { ...VALID_BODY, contact: { ...VALID_BODY.contact, team_role: "" } },
    expectedErrors: ["Vai trò trong nhóm không hợp lệ"],
  },
  {
    name: "contact: missing zalo",
    body: { ...VALID_BODY, contact: { ...VALID_BODY.contact, zalo: "" } },
    expectedErrors: ["Số điện thoại Zalo không hợp lệ (phải bao gồm chính xác 10 chữ số)"],
  },
  {
    name: "contact: zalo with 11 digits",
    body: { ...VALID_BODY, contact: { ...VALID_BODY.contact, zalo: "01234567890" } },
    expectedErrors: ["Số điện thoại Zalo không hợp lệ (phải bao gồm chính xác 10 chữ số)"],
  },
  {
    name: "contact: zalo with letters",
    body: { ...VALID_BODY, contact: { ...VALID_BODY.contact, zalo: "abcd123456" } },
    expectedErrors: ["Số điện thoại Zalo không hợp lệ (phải bao gồm chính xác 10 chữ số)"],
  },
  {
    name: "contact: missing email",
    body: { ...VALID_BODY, contact: { ...VALID_BODY.contact, email: "" } },
    expectedErrors: ["Email liên hệ không hợp lệ"],
  },
  {
    name: "contact: email without @",
    body: { ...VALID_BODY, contact: { ...VALID_BODY.contact, email: "invalid" } },
    expectedErrors: ["Email liên hệ không hợp lệ"],
  },

  // --- 2. CURRENT BLOCKER / LEGACY CONTEXT ---
  {
    name: "current_blocker too short (5 chars), no legacy",
    body: { ...VALID_BODY, current_blocker: "Short", case_summary: "", current_situations: [] },
    expectedErrors: ["Cần mô tả ngắn điểm kẹt hiện tại của nhóm"],
  },
  {
    name: "current_blocker empty, but legacy case_summary >= 20",
    body: { ...VALID_BODY, current_blocker: "", case_summary: "Đây là case summary đủ dài hơn 20 ký tự nè" },
    expectedErrors: [],
  },
  {
    name: "current_blocker empty, but legacy current_situations has text",
    body: {
      ...VALID_BODY,
      current_blocker: "",
      case_summary: "",
      current_situations: ["tình huống A", "", null],
    },
    expectedErrors: [],
  },
  {
    name: "current_blocker empty, current_situations empty strings (no legacy)",
    body: {
      ...VALID_BODY,
      current_blocker: "",
      case_summary: "",
      current_situations: ["", "", ""],
    },
    expectedErrors: ["Cần mô tả ngắn điểm kẹt hiện tại của nhóm"],
  },
  {
    name: "current_blocker empty, current_situations falsy items only (no legacy)",
    body: {
      ...VALID_BODY,
      current_blocker: "",
      case_summary: "",
      current_situations: [null, undefined, 123],
    },
    expectedErrors: ["Cần mô tả ngắn điểm kẹt hiện tại của nhóm"],
  },

  // --- 3. SUPPORT NEEDS ---
  {
    name: "support_needs missing primary_need",
    body: { ...VALID_BODY, support_needs: { primary_need: "" } },
    expectedErrors: ["Cần chọn nhu cầu hỗ trợ chính"],
  },
  {
    name: "support_needs primary_need too short (2 chars)",
    body: { ...VALID_BODY, support_needs: { primary_need: "AB" } },
    expectedErrors: ["Cần chọn nhu cầu hỗ trợ chính"],
  },
  {
    name: "support_needs primary_need exactly 5 chars (valid)",
    body: { ...VALID_BODY, support_needs: { primary_need: "ABCDE" } },
    expectedErrors: [],
  },
  {
    name: "support_needs missing entirely",
    body: { ...VALID_BODY, support_needs: undefined },
    expectedErrors: ["Cần chọn nhu cầu hỗ trợ chính"],
  },
  {
    name: "support_needs without primary_need",
    body: { ...VALID_BODY, support_needs: { other: "irrelevant" } },
    expectedErrors: ["Cần chọn nhu cầu hỗ trợ chính"],
  },

  // --- 4. DOCUMENTS ---
  {
    name: "documents: empty array",
    body: { ...VALID_BODY, documents: [] },
    expectedErrors: ["Thư mục tài liệu là bắt buộc"],
  },
  {
    name: "documents: not an array",
    body: { ...VALID_BODY, documents: "not_array" },
    expectedErrors: ["Thư mục tài liệu là bắt buộc"],
  },
  {
    name: "documents: missing file_url AND drive_url",
    body: {
      ...VALID_BODY,
      documents: [{ file_url: "", drive_url: "", document_type: "business_plan" }],
    },
    expectedErrors: ["Tài liệu phải có file_url hoặc drive_url hợp lệ"],
  },
  {
    name: "documents: valid drive_url (no file_url)",
    body: {
      ...VALID_BODY,
      documents: [{ file_url: "", drive_url: "https://drive.google.com/folder", document_type: "business_plan" }],
    },
    expectedErrors: [],
  },
  {
    name: "documents: missing document_type",
    body: {
      ...VALID_BODY,
      documents: [{ file_url: "https://example.com/doc.pdf", document_type: "" }],
    },
    expectedErrors: ["Vui lòng chọn ít nhất một loại tài liệu có trong thư mục"],
  },

  // --- 5. BOUNDARY CONFIRMATIONS ---
  {
    name: "boundary_confirmations: only 1 item",
    body: { ...VALID_BODY, boundary_confirmations: ["cam_ket_1"] },
    expectedErrors: ["Phải xác nhận đầy đủ ít nhất 3 cam kết ranh giới"],
  },
  {
    name: "boundary_confirmations: exactly 2",
    body: { ...VALID_BODY, boundary_confirmations: ["ck1", "ck2"] },
    expectedErrors: ["Phải xác nhận đầy đủ ít nhất 3 cam kết ranh giới"],
  },
  {
    name: "boundary_confirmations: not an array",
    body: { ...VALID_BODY, boundary_confirmations: "not_array" },
    expectedErrors: ["Phải xác nhận đầy đủ ít nhất 3 cam kết ranh giới"],
  },

  // --- 6. VALID BODY ---
  {
    name: "fully valid body",
    body: VALID_BODY,
    expectedErrors: [],
  },

  // --- 7. MULTI-FIELD ERRORS ---
  {
    name: "multiple errors combined",
    body: {
      contact: { full_name: "", student_code: "", team_role: "", zalo: "", email: "" },
      current_blocker: "",
      support_needs: {},
      documents: [],
      boundary_confirmations: [],
    },
    expectedErrors: [
      "Họ tên người liên hệ không hợp lệ (tối thiểu 2 ký tự)",
      "Mã số sinh viên không hợp lệ (tối thiểu 5 ký tự)",
      "Vai trò trong nhóm không hợp lệ",
      "Số điện thoại Zalo không hợp lệ (phải bao gồm chính xác 10 chữ số)",
      "Email liên hệ không hợp lệ",
      "Cần mô tả ngắn điểm kẹt hiện tại của nhóm",
      "Cần chọn nhu cầu hỗ trợ chính",
      "Thư mục tài liệu là bắt buộc",
      "Phải xác nhận đầy đủ ít nhất 3 cam kết ranh giới",
    ],
  },
];

test("Cp1Intake validation snapshot — old imperative validator", async (t) => {
  for (const c of CASES) {
    await t.test(c.name, () => {
      const actual = validateCp1Intake(c.body);
      assert.deepStrictEqual(actual, c.expectedErrors);
    });
  }
});

const CAP_ERRORS: TestCase[] = [
  {
    name: "cap: 11 documents rejected",
    body: {
      ...VALID_BODY,
      documents: Array.from({ length: CP1_MAX_DOCUMENTS + 1 }, (_, i) => ({
        file_url: `https://example.com/doc-${i}.pdf`,
        document_type: "business_plan",
      })),
    },
    expectedErrors: [`Thư mục tài liệu không được vượt quá ${CP1_MAX_DOCUMENTS} tài liệu`],
  },
  {
    name: "cap: exactly 10 documents valid",
    body: {
      ...VALID_BODY,
      documents: Array.from({ length: CP1_MAX_DOCUMENTS }, (_, i) => ({
        file_url: `https://example.com/doc-${i}.pdf`,
        document_type: "business_plan",
      })),
    },
    expectedErrors: [],
  },
  {
    name: "cap: full_name over short max",
    body: {
      ...VALID_BODY,
      contact: { ...VALID_BODY.contact, full_name: "a".repeat(CP1_SHORT_MAX + 1) },
    },
    expectedErrors: [`Họ tên người liên hệ không được vượt quá ${CP1_SHORT_MAX} ký tự`],
  },
  {
    name: "cap: student_code over short max",
    body: {
      ...VALID_BODY,
      contact: { ...VALID_BODY.contact, student_code: "b".repeat(CP1_SHORT_MAX + 1) },
    },
    expectedErrors: [`Mã số sinh viên không được vượt quá ${CP1_SHORT_MAX} ký tự`],
  },
  {
    name: "cap: team_role over short max",
    body: {
      ...VALID_BODY,
      contact: { ...VALID_BODY.contact, team_role: "c".repeat(CP1_SHORT_MAX + 1) },
    },
    expectedErrors: [`Vai trò trong nhóm không được vượt quá ${CP1_SHORT_MAX} ký tự`],
  },
  {
    name: "cap: email over 254 rejected",
    body: {
      ...VALID_BODY,
      contact: { ...VALID_BODY.contact, email: `${"d".repeat(CP1_EMAIL_MAX - 4)}@x.io` },
    },
    expectedErrors: [`Email liên hệ không được vượt quá ${CP1_EMAIL_MAX} ký tự`],
  },
  {
    name: "cap: email exactly 254 valid",
    body: {
      ...VALID_BODY,
      contact: { ...VALID_BODY.contact, email: `${"e".repeat(CP1_EMAIL_MAX - 5)}@x.io` },
    },
    expectedErrors: [],
  },
  {
    name: "cap: primary_need over short max",
    body: {
      ...VALID_BODY,
      support_needs: { primary_need: "f".repeat(CP1_SHORT_MAX + 1) },
    },
    expectedErrors: [`Nhu cầu hỗ trợ chính không được vượt quá ${CP1_SHORT_MAX} ký tự`],
  },
  {
    name: "cap: current_blocker over long max",
    body: {
      ...VALID_BODY,
      current_blocker: "g".repeat(CP1_LONG_MAX + 1),
    },
    expectedErrors: [`Điểm kẹt hiện tại không được vượt quá ${CP1_LONG_MAX} ký tự`],
  },
  {
    name: "cap: case_summary over long max",
    body: {
      ...VALID_BODY,
      current_blocker: "",
      case_summary: "h".repeat(CP1_LONG_MAX + 1),
    },
    expectedErrors: [`Tóm tắt hồ sơ không được vượt quá ${CP1_LONG_MAX} ký tự`],
  },
  {
    name: "cap: current_situations item over long max",
    body: {
      ...VALID_BODY,
      current_blocker: "",
      current_situations: ["i".repeat(CP1_LONG_MAX + 1)],
    },
    expectedErrors: [`Tình huống hiện tại không được vượt quá ${CP1_LONG_MAX} ký tự`],
  },
  {
    name: "cap: long cloudinary file_url exempt (no cap on urls)",
    body: {
      ...VALID_BODY,
      documents: [
        { file_url: `https://res.cloudinary.com/demo/image/upload/${"j".repeat(300)}.pdf`, document_type: "business_plan" },
      ],
    },
    expectedErrors: [],
  },
  {
    name: "cap: zalo stays 10-digit regex exempt",
    body: {
      ...VALID_BODY,
      contact: { ...VALID_BODY.contact, zalo: "0987654321" },
    },
    expectedErrors: [],
  },
];

test("Cp1Intake caps — full schema", async (t) => {
  for (const c of CAP_ERRORS) {
    await t.test(c.name, () => {
      const actual = validateCp1Intake(c.body);
      assert.deepStrictEqual(actual, c.expectedErrors);
    });
  }
});

test("Cp1IntakeCaps — lean schema enforces max only, no min", async () => {
  const overCap = Cp1IntakeCaps.safeParse({
    contact: { full_name: "k".repeat(CP1_SHORT_MAX + 1) },
  });
  assert.strictEqual(overCap.success, false);
  assert.deepStrictEqual(
    overCap.error.issues.map((i) => i.message),
    [`Họ tên người liên hệ không được vượt quá ${CP1_SHORT_MAX} ký tự`],
  );

  const underMin = Cp1IntakeCaps.safeParse({
    contact: { full_name: "A" },
    current_blocker: "ngắn",
    documents: [],
  });
  assert.strictEqual(underMin.success, true);

  const elevenDocs = Cp1IntakeCaps.safeParse({
    documents: Array.from({ length: CP1_MAX_DOCUMENTS + 1 }, (_, i) => ({
      file_url: `https://example.com/doc-${i}.pdf`,
    })),
  });
  assert.strictEqual(elevenDocs.success, false);
  assert.deepStrictEqual(
    elevenDocs.error.issues.map((i) => i.message),
    [`Thư mục tài liệu không được vượt quá ${CP1_MAX_DOCUMENTS} tài liệu`],
  );

  const fullValid = Cp1IntakeSchema.safeParse(VALID_BODY);
  assert.strictEqual(fullValid.success, true);
});
