import { test } from "node:test";
import assert from "node:assert";
import {
  Cp1IntakeCaps,
  Cp1IntakeSchema,
  CP1_EMAIL_MAX,
  CP1_LONG_MAX,
  CP1_MAX_DOCUMENTS,
  CP1_SHORT_MAX,
  canonicalizeDocCategory,
  docCategoryLabel,
} from "@repo/validation";
import { validateCp1Intake } from "../../../modules/cases/http/cases.schema.js";
import { completenessFromIntake } from "../../../modules/admin/application/list-admin-cases.usecase.js";

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
  body: unknown;
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
    name: "support_needs missing primary_need (valid when empty)",
    body: { ...VALID_BODY, support_needs: { primary_need: "" } },
    expectedErrors: [],
  },
  {
    name: "support_needs primary_need too short (2 chars)",
    body: { ...VALID_BODY, support_needs: { primary_need: "AB" } },
    expectedErrors: ["Nhu cầu hỗ trợ chính nếu có phải từ 5 ký tự trở lên"],
  },
  {
    name: "support_needs primary_need too short (4 chars)",
    body: { ...VALID_BODY, support_needs: { primary_need: "ABCD" } },
    expectedErrors: ["Nhu cầu hỗ trợ chính nếu có phải từ 5 ký tự trở lên"],
  },
  {
    name: "support_needs primary_need exactly 5 chars (valid)",
    body: { ...VALID_BODY, support_needs: { primary_need: "ABCDE" } },
    expectedErrors: [],
  },
  {
    name: "support_needs missing entirely (valid)",
    body: { ...VALID_BODY, support_needs: undefined },
    expectedErrors: [],
  },
  {
    name: "support_needs without primary_need (valid)",
    body: { ...VALID_BODY, support_needs: { other: "irrelevant" } },
    expectedErrors: [],
  },
  {
    name: "support_needs empty object (valid)",
    body: { ...VALID_BODY, support_needs: {} },
    expectedErrors: [],
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
  {
    name: "fully valid body without support_needs",
    body: (() => {
      const { support_needs: _sn, ...rest } = VALID_BODY;
      return rest;
    })(),
    expectedErrors: [],
  },

  // --- 7. MULTI-FIELD ERRORS ---
  {
    name: "multiple errors combined",
    body: {
      contact: { full_name: "", student_code: "", team_role: "", zalo: "", email: "" },
      current_blocker: "",
      support_needs: { primary_need: "AB" },
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
      "Nhu cầu hỗ trợ chính nếu có phải từ 5 ký tự trở lên",
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

test("Document category canonicalization and labels", async (t) => {
  await t.test("canonicalizeDocCategory with new codes", () => {
    assert.strictEqual(canonicalizeDocCategory("idea_report"), "idea_report");
    assert.strictEqual(canonicalizeDocCategory("pitch_deck"), "pitch_deck");
    assert.strictEqual(canonicalizeDocCategory("market_research"), "market_research");
    assert.strictEqual(canonicalizeDocCategory("financial_plan"), "financial_plan");
    assert.strictEqual(canonicalizeDocCategory("other"), "other");
  });

  await t.test("canonicalizeDocCategory with legacy codes", () => {
    assert.strictEqual(canonicalizeDocCategory("competitor_analysis"), "market_research");
    assert.strictEqual(canonicalizeDocCategory("customer_research"), "market_research");
    assert.strictEqual(canonicalizeDocCategory("task_assignment"), "task_assignment");
  });

  await t.test("canonicalizeDocCategory with null/undefined/empty", () => {
    assert.strictEqual(canonicalizeDocCategory(null), "other");
    assert.strictEqual(canonicalizeDocCategory(undefined), "other");
    assert.strictEqual(canonicalizeDocCategory(""), "other");
    assert.strictEqual(canonicalizeDocCategory("unknown_category"), "unknown_category");
  });

  await t.test("docCategoryLabel with new codes", () => {
    assert.strictEqual(docCategoryLabel("idea_report"), "Thuyết minh ý tưởng");
    assert.strictEqual(docCategoryLabel("pitch_deck"), "Slide thuyết trình");
    assert.strictEqual(docCategoryLabel("market_research"), "Nghiên cứu thị trường");
    assert.strictEqual(docCategoryLabel("financial_plan"), "Kế hoạch tài chính");
    assert.strictEqual(docCategoryLabel("other"), "Tài liệu bổ sung");
  });

  await t.test("docCategoryLabel with legacy codes", () => {
    assert.strictEqual(docCategoryLabel("competitor_analysis"), "Nghiên cứu thị trường");
    assert.strictEqual(docCategoryLabel("customer_research"), "Nghiên cứu thị trường");
    assert.strictEqual(docCategoryLabel("task_assignment"), "Đề cương phân công");
  });

  await t.test("docCategoryLabel with unknown code falls back to code", () => {
    assert.strictEqual(docCategoryLabel("custom_code"), "custom_code");
  });
});

test("completenessFromIntake — package adaptation", async (t) => {
  const fullPayload = JSON.stringify(VALID_BODY);
  const noSupportNeedsPayload = JSON.stringify((() => {
    const { support_needs: _sn, ...rest } = VALID_BODY;
    return rest;
  })());

  await t.test("null/undefined/empty returns 0", () => {
    assert.strictEqual(completenessFromIntake(null), 0);
    assert.strictEqual(completenessFromIntake(undefined), 0);
    assert.strictEqual(completenessFromIntake(""), 0);
    assert.strictEqual(completenessFromIntake("invalid-json"), 0);
  });

  await t.test("pkg_ai_audit: 4 core criteria at 25% each (100% total without support_needs)", () => {
    assert.strictEqual(completenessFromIntake(fullPayload, "pkg_ai_audit"), 100);
    assert.strictEqual(completenessFromIntake(noSupportNeedsPayload, "pkg_ai_audit"), 100);

    const halfPayload = JSON.stringify({
      contact: VALID_BODY.contact,
      current_blocker: VALID_BODY.current_blocker,
      documents: [],
      boundary_confirmations: [],
    });
    assert.strictEqual(completenessFromIntake(halfPayload, "pkg_ai_audit"), 50);
  });

  await t.test("standard package: 5 criteria at 20% each", () => {
    assert.strictEqual(completenessFromIntake(fullPayload, "pkg_full"), 100);
    assert.strictEqual(completenessFromIntake(noSupportNeedsPayload, "pkg_full"), 80);
  });
});
