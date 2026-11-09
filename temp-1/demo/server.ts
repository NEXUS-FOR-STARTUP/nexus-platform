// Demo server: serves the static UX demo and labels one answer with the pi coding agent SDK.
// Run: bun temp-1/demo/server.ts   (needs .env + models.json in this folder)
import { type AgentSession, createAgentSession, ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent";
import { resolve, dirname, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5599);
// Mặc định chỉ nghe máy này; mở trên điện thoại thì chạy HOST=0.0.0.0 vì LAN cần như vậy.
const HOST = process.env.HOST || "127.0.0.1";

const MODEL_PROVIDER = "crouton";
const MODEL_ID = "stealth/crouton-alpha";
const TIMEOUT_MS = 45000;

const ASSET_LABELS: Record<string, string> = {
  agri: "Cửa hàng hoặc nghề nông nghiệp", fnb: "Quán ăn, quán cà phê, bếp",
  retail: "Cửa hàng, tiệm bán lẻ", online: "Bán hàng online", print: "Tiệm in, photo",
  beauty: "Spa, tóc, làm đẹp", auto: "Xe cộ, sửa xe", tutoring: "Dạy học, gia sư",
  workshop: "Xưởng, máy móc", lab: "Phòng thí nghiệm, phòng lab",
  fashion: "May mặc, thời trang, vải", hospitality: "Du lịch, homestay, khách sạn",
  health: "Phòng khám, nhà thuốc", pro: "Kế toán, luật, văn phòng",
  dorm: "Ký túc xá, nhà trọ", club: "CLB, đội nhóm, sự kiện",
};

const IDEA_LABELS: Record<string, string> = {
  forbidden: "Đụng vũ khí, chất nổ, hạt nhân, chất cấm",
  illegal: "Có thể vi phạm pháp luật hoặc bản quyền",
  ai: "Tự xây phần AI", physical: "Làm ra sản phẩm thật bằng vật liệu hoặc máy móc",
  marketplace: "Sàn kết nối người mua và người bán",
  superapp: "Cả hệ thống lớn làm cùng lúc", logistics: "Giao hàng hoặc vận chuyển",
  b2bLarge: "Bán cho doanh nghiệp lớn hoặc cơ quan lớn",
  regulated: "Dính đến sức khoẻ hoặc tiền bạc người khác",
  software: "Là website, app hoặc phần mềm",
};

const SYSTEM = [
  "Bạn gán nhãn cho câu trả lời của sinh viên Việt Nam về nguồn lực và ý tưởng khởi nghiệp.",
  "Chỉ trả về JSON đúng một dòng, không giải thích, không markdown.",
  'Dạng: {"ids":[{"id":"<mã>","quote":"<trích ngắn từ câu trả lời>"}]}',
  "Chỉ chọn mã trong danh sách được đưa. Không có mã nào phù hợp thì trả {\"ids\":[]}. Không đoán bừa.",
].join(" ");

interface AssetAnswer { q: string; answer: string }
interface AiPayload { answers: AssetAnswer[]; pain: string; idea: string }

/** Read one field off an unvalidated JSON object. */
function field(o: unknown, key: string): unknown {
  return o !== null && typeof o === "object" && key in o ? (o as Record<string, unknown>)[key] : undefined;
}

function toPayload(raw: unknown): AiPayload {
  const answers: AssetAnswer[] = Array.isArray(field(raw, "answers"))
    ? (field(raw, "answers") as unknown[]).flatMap((a) => {
        const q = field(a, "q"), answer = field(a, "answer");
        return typeof q === "string" && typeof answer === "string" && answer.trim() ? [{ q, answer }] : [];
      })
    : [];
  const pain = field(raw, "pain"), idea = field(raw, "idea");
  // Nhánh Mad Libs gửi 6 ô riêng; ghép ở server để client khỏi tự nối chuỗi lệch nhau.
  const mad = field(raw, "madlibs");
  const madText = mad !== null && typeof mad === "object"
    ? Object.values(mad as Record<string, unknown>).filter((v): v is string => typeof v === "string" && v.trim().length > 0).join("\n")
    : "";
  return { answers, pain: typeof pain === "string" ? pain : "", idea: (typeof idea === "string" ? idea : "") || madText };
}

function buildPrompt(kind: string, payload: AiPayload): string {
  const list = (m: Record<string, string>) => Object.entries(m).map(([k, v]) => `- ${k}: ${v}`).join("\n");
  if (kind === "assets") {
    const answers = payload.answers.map((a) => `Hỏi: ${a.q}\nĐáp: ${a.answer}`).join("\n\n");
    return `Danh sách mã cho nguồn lực gia đình/người quen đang có:\n${list(ASSET_LABELS)}\n\nCâu trả lời của nhóm:\n${answers}\n\nChọn những mã mà nhóm THỰC SỰ có người hoặc điều kiện đó. quote là cụm từ ngắn (dưới 60 ký tự) lấy nguyên văn từ câu trả lời.`;
  }
  return `Danh sách mã cho ý tưởng:\n${list(IDEA_LABELS)}\n\nĐiều làm người dùng bực mình: ${payload.pain || "(không nêu)"}\nÝ tưởng: ${payload.idea || "(không nêu)"}\n\nChọn các mã mô tả đúng ý tưởng hoặc rủi ro của nó. quote là cụm từ ngắn (dưới 60 ký tự) lấy nguyên văn từ phần ý tưởng.`;
}

/** Lấy object JSON đầu tiên trong câu trả lời; bỏ phần văn xuôi model có thể thêm sau đó. */
function firstJson(text: string): string {
  const start = text.indexOf("{");
  if (start < 0) throw new Error("omp không trả JSON: " + text.slice(0, 200));
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = inStr; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("JSON trong câu trả lời bị cắt: " + text.slice(0, 200));
}

/** Một phiên pi giữ ấm: khởi động ~4s, mỗi nhãn sau đó ~2s. */
async function boot() {
  const runtime = await ModelRuntime.create({ modelsPath: resolve(HERE, "models.json"), refreshOnCreate: false });
  const key = process.env.COMMAND_CODE_API_KEY;
  if (!key) throw new Error("Thiếu COMMAND_CODE_API_KEY trong file temp-1/demo/.env");
  await runtime.setRuntimeApiKey(MODEL_PROVIDER, key);
  const model = runtime.getModel(MODEL_PROVIDER, MODEL_ID);
  if (!model) throw new Error(`Không thấy model ${MODEL_PROVIDER}/${MODEL_ID} trong models.json`);
  const { session } = await createAgentSession({ modelRuntime: runtime, model, thinkingLevel: "low", noTools: "all", sessionManager: SessionManager.inMemory() });
  await session.prompt("ok"); // hâm nóng: lần gọi đầu của provider chậm hơn 10s
  return session;
}

/** Khởi động hỏng thì lần gọi sau thử lại, không kẹt 502 tới khi restart. */
let ready: Promise<AgentSession> | null = null;
function piSession(): Promise<AgentSession> {
  ready ??= boot().catch((err: unknown) => {
    ready = null;
    throw err;
  });
  return ready;
}
let chain: Promise<unknown> = Promise.resolve();

/** Phiên pi không nhận hai prompt cùng lúc, nên xếp hàng thay vì lỗi. */
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

const deadline = <T>(p: Promise<T>, what: string): Promise<T> => {
  // Khi quá hạn, promise gốc bị bỏ rơi; nó reject sau đó sẽ thành unhandled và giết process.
  p.catch(() => undefined);
  return Promise.race([p, Bun.sleep(TIMEOUT_MS).then(() => { throw new Error(what + " quá " + TIMEOUT_MS + "ms"); })]);
};

async function label(kind: string, payload: AiPayload) {
  const t0 = Date.now();
  const prompt = SYSTEM + "\n\n" + buildPrompt(kind, payload);
  const text = await serial(async () => {
    const session = await deadline(piSession(), "pi khởi động");
    try {
      await deadline(session.prompt(prompt), "pi trả lời");
    } catch (err) {
      await session.abort().catch(() => undefined);
      throw err;
    }
    return session.getLastAssistantText() ?? "";
  });
  const parsed: unknown = JSON.parse(firstJson(text));
  const allowed = kind === "assets" ? ASSET_LABELS : IDEA_LABELS;
  const listed = field(parsed, "ids");
  const ids = (Array.isArray(listed) ? listed : []).flatMap((x) => {
    const id = field(x, "id");
    if (typeof id !== "string" || !allowed[id]) return [];
    return [{ id, quote: String(field(x, "quote") ?? "").slice(0, 120) }];
  });
  console.log(`[ai] ${kind} -> ${ids.length} nhãn, ${Date.now() - t0}ms`);
  return { ids, model: MODEL_PROVIDER + "/" + MODEL_ID, raw: text.slice(0, 2000) };
}

// Demo chạy cả buổi: lỗi lạc từ SDK chỉ ghi log, không được làm chết server.
process.on("unhandledRejection", (err) => console.error("[unhandled]", err instanceof Error ? err.message : err));
process.on("uncaughtException", (err) => console.error("[uncaught]", err instanceof Error ? err.stack : err));

const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };
// Danh sách trắng: chỉ những đuôi này mới được trả ra ngoài.
const ASSET_EXT: Record<string, true> = { ".html": true, ".css": true, ".js": true, ".svg": true, ".png": true, ".webp": true, ".ico": true };

const server = Bun.serve({
  port: PORT,
  hostname: HOST,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/api/ai") {
      if (req.method !== "POST") return new Response("POST only", { status: 405 });
      try {
        const body: unknown = await req.json();
        const kind = field(body, "kind");
        if (kind !== "assets" && kind !== "idea") return Response.json({ ok: false, error: "kind không hợp lệ" }, { status: 400 });
        return Response.json({ ok: true, ...(await label(kind, toPayload(field(body, "payload")))) });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[ai]", message);
        return Response.json({ ok: false, error: message }, { status: 502 });
      }
    }
    const name = url.pathname === "/" ? "/index.html" : url.pathname;
    const target = resolve(HERE, "." + name);
    const rel = relative(HERE, target);
    const ext = name.slice(name.lastIndexOf("."));
    // Chỉ phục vụ tài nguyên của trang: chặn `..` ra ngoài, file ẩn (.env) và file cấu hình.
    if (rel.startsWith("..") || isAbsolute(rel) || rel.split(/[\\/]/).some((part) => part.startsWith(".")) || !ASSET_EXT[ext]) {
      return new Response("Not found", { status: 404 });
    }
    const file = Bun.file(target);
    if (!(await file.exists())) return new Response("Not found", { status: 404 });
    return new Response(file, { headers: { "Content-Type": TYPES[ext] || "application/octet-stream" } });
  },
});

console.log(`Demo: http://localhost:${server.port}/`);
