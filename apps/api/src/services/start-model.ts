import { createGoogleGenerativeAI, type GoogleGenerativeAIProvider } from '@ai-sdk/google'
import { createOpenAI, type OpenAIProvider } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'
import logger from '../shared/infrastructure/logger.js'

// Model choice for the start flow (dashboard/start): Command Code Provider first, Gemini as fallback.
// Model ids are resolved per provider so a Gemini id never reaches the Command Code endpoint.

const COMMAND_CODE_PROVIDER_NAME = 'commandcode'
const COMMAND_CODE_DEFAULT_BASE_URL = 'https://api.commandcode.ai/provider/v1'
const GEMINI_DEFAULT_MODEL = 'gemini-2.0-flash'

export interface StartModel {
  model: LanguageModel
  /** Logged so a silent fallback is visible in production. */
  label: string
}

export interface StartModelChoice {
  /** null when Command Code is not configured; the caller goes straight to the fallback. */
  primary: (() => StartModel) | null
  fallback: () => StartModel
}

let geminiProvider: GoogleGenerativeAIProvider | null = null

function getGeminiProvider(): GoogleGenerativeAIProvider {
  if (geminiProvider) return geminiProvider

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY environment variable')
  }

  geminiProvider = createGoogleGenerativeAI({ apiKey })
  return geminiProvider
}

/**
 * Command Code validates `reasoning_effort`; "low" is a value the SDK's own enum cannot send,
 * so team fit goes through this transport hook instead of providerOptions.
 */
function withReasoningEffort(level: 'low') {
  return (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Promise<Response> => {
    if (typeof init?.body !== 'string') return fetch(input, init)

    let parsed: unknown
    try {
      parsed = JSON.parse(init.body)
    } catch {
      // Non-JSON body: forward untouched instead of failing here.
      return fetch(input, init)
    }
    if (typeof parsed !== 'object' || parsed === null) return fetch(input, init)

    return fetch(input, { ...init, body: JSON.stringify({ ...parsed, reasoning_effort: level }) })
  }
}

/**
 * Team fit analyses a whole team, so it asks for light reasoning.
 * Label stays on the provider default: deepseek-v4.1-flash answers {"ids":[]} with
 * reasoning off (6 output tokens) and also with "low" (12s of wandering), so any
 * override silently empties the label list. Default reasoning labels correctly in ~6s.
 */
const commandCodeProviders = new Map<'low' | 'default', OpenAIProvider>()

function getCommandCodeProvider(kind: StartModelKind): OpenAIProvider {
  const level = kind === 'team-fit' ? 'low' : 'default'
  const cached = commandCodeProviders.get(level)
  if (cached) return cached

  const provider = createOpenAI({
    name: COMMAND_CODE_PROVIDER_NAME,
    baseURL: process.env.COMMAND_CODE_BASE_URL ?? COMMAND_CODE_DEFAULT_BASE_URL,
    apiKey: process.env.COMMAND_CODE_API_KEY,
    ...(level === 'default' ? {} : { fetch: withReasoningEffort(level) }),
  })
  commandCodeProviders.set(level, provider)
  return provider
}

function geminiModelName(kind: StartModelKind): string {
  if (kind === 'label') {
    return process.env.AI_PRE_CP1_MODEL ?? process.env.AI_TEAM_FIT_MODEL ?? GEMINI_DEFAULT_MODEL
  }
  return process.env.AI_TEAM_FIT_MODEL ?? GEMINI_DEFAULT_MODEL
}

function commandCodeModelName(kind: StartModelKind): string | undefined {
  if (kind === 'label') {
    return process.env.COMMAND_CODE_PRE_CP1_MODEL ?? process.env.COMMAND_CODE_TEAM_FIT_MODEL
  }
  return process.env.COMMAND_CODE_TEAM_FIT_MODEL
}

export type StartModelKind = 'team-fit' | 'label'

export function getStartModelChoice(kind: StartModelKind): StartModelChoice {
  const fallbackModelName = geminiModelName(kind)

  // Both sides are factories: a missing fallback key must not break a working primary.
  const fallback = () => ({
    model: getGeminiProvider()(fallbackModelName),
    label: `gemini:${fallbackModelName}`,
  })

  const commandCodeModel = commandCodeModelName(kind)
  if (!process.env.COMMAND_CODE_API_KEY || !commandCodeModel) {
    logger.info({ kind, provider: `gemini:${fallbackModelName}` }, 'start model: Command Code not configured, Gemini only')
    return { primary: null, fallback }
  }

  return {
    primary: () => ({
      model: getCommandCodeProvider(kind).chat(commandCodeModel),
      label: `${COMMAND_CODE_PROVIDER_NAME}:${commandCodeModel}`,
    }),
    fallback,
  }
}
