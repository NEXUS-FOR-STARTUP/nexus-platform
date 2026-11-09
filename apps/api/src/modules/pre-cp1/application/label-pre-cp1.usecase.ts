import { generateObject } from 'ai'
import { z } from 'zod'
import {
  ASSET_PROMPTS,
  ASSET_RULES,
  IDEA_RULES,
  type LabelQuote,
  type LabelRequest,
  type LabelResult,
} from '@repo/validation'
import { getGoogleModel } from '../../../services/google-provider.js'
import logger from '../../../shared/infrastructure/logger.js'

const AI_TIMEOUT_MS = 20_000
const AI_TEMPERATURE = 0.1
const MAX_LABELS = 8
const MAX_QUOTE_CHARS = 120

const SYSTEM = [
  'Bạn gán nhãn cho câu trả lời của sinh viên Việt Nam về nguồn lực và ý tưởng khởi nghiệp.',
  'Chỉ chọn mã trong danh sách được đưa. Không có mã nào phù hợp thì trả danh sách rỗng. Không đoán bừa.',
  'Không viết lời khuyên, không thêm mã mới, không giải thích ngoài JSON.',
].join(' ')

export const LabelOutputSchema = z.object({
  ids: z.array(z.object({ id: z.string(), quote: z.string() })).max(MAX_LABELS),
})

export const ALLOWED_IDS = {
  assets: ASSET_RULES.map((rule) => rule.id),
  idea: IDEA_RULES.map((rule) => rule.id),
} as const

/** Keep only allowlisted ids, one entry each, quote trimmed to 120 characters. */
export function filterLabels(kind: LabelRequest['kind'], raw: Array<{ id: string; quote: string }>): LabelQuote[] {
  const allowed = new Set<string>(ALLOWED_IDS[kind])
  const seen = new Set<string>()
  const out: LabelQuote[] = []
  for (const item of raw) {
    if (!allowed.has(item.id) || seen.has(item.id)) continue
    seen.add(item.id)
    out.push({ id: item.id, quote: item.quote.replace(/\s+/g, ' ').trim().slice(0, MAX_QUOTE_CHARS) })
  }
  return out
}

function labelList(kind: LabelRequest['kind']): string {
  const rules = kind === 'assets' ? ASSET_RULES : IDEA_RULES
  return rules.map((rule) => `- ${rule.id}: ${rule.label}`).join('\n')
}

/** Mad Libs arrives as six boxes; joining here keeps the prompt identical on both sides. */
function madLibsText(madlibs: Record<string, string> | undefined): string {
  return Object.values(madlibs ?? {}).filter((v) => v.trim()).join('\n')
}

export function buildPrompt(request: LabelRequest): string {
  const list = labelList(request.kind)
  if (request.kind === 'assets') {
    const answers = request.payload.answers
      .map((a) => {
        const title = ASSET_PROMPTS.find((p) => p.id === a.id)?.title ?? a.id
        return `Hỏi: ${title}\nĐáp: ${a.text.trim()}`
      })
      .join('\n\n')
    return `Danh sách mã nguồn lực:\n${list}\n\nCâu trả lời của nhóm:\n${answers}\n\nChọn những mã mà nhóm THỰC SỰ có người hoặc điều kiện đó. quote là cụm từ ngắn lấy nguyên văn từ câu trả lời.`
  }

  const { pain, idea, madlibs } = request.payload
  const body = [pain, idea, madLibsText(madlibs)].filter((t) => t?.trim()).join('\n')
  return `Danh sách mã ý tưởng:\n${list}\n\nCâu trả lời của nhóm:\n${body || '(không nêu)'}\n\nChọn các mã mô tả đúng ý tưởng hoặc rủi ro của nó. quote là cụm từ ngắn lấy nguyên văn từ phần ý tưởng.`
}

/**
 * One AI call, never throws for the user: a broken model yields aiOk=false and
 * the UI asks the user to tick labels by hand.
 */
export async function labelPreCp1UseCase(request: LabelRequest): Promise<LabelResult> {
  const t0 = Date.now()
  try {
    const { object } = await generateObject({
      model: getGoogleModel(process.env.AI_PRE_CP1_MODEL ?? process.env.AI_TEAM_FIT_MODEL),
      schema: LabelOutputSchema,
      system: SYSTEM,
      prompt: buildPrompt(request),
      temperature: AI_TEMPERATURE,
      abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
    })
    const labels = filterLabels(request.kind, object.ids)
    logger.info({ kind: request.kind, labels: labels.length, duration_ms: Date.now() - t0 }, 'pre-cp1 labels')
    return { aiOk: true, labels }
  } catch (error) {
    logger.error({ kind: request.kind, duration_ms: Date.now() - t0, err: error }, 'pre-cp1 label failed')
    return { aiOk: false, labels: [] }
  }
}
