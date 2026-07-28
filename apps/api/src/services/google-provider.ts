import { createGoogleGenerativeAI } from '@ai-sdk/google';

// ---------------------------------------------------------------------------
// Google Generative AI provider singleton (external infrastructure)
// ---------------------------------------------------------------------------

let googleInstance: ReturnType<typeof createGoogleGenerativeAI> | null = null;

function getGoogleInstance(): ReturnType<typeof createGoogleGenerativeAI> {
  if (googleInstance) return googleInstance;

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY environment variable');
  }

  googleInstance = createGoogleGenerativeAI({ apiKey });
  return googleInstance;
}

export function getGoogleModel() {
  const modelName = process.env.AI_TEAM_FIT_MODEL ?? 'gemini-2.0-flash';
  const google = getGoogleInstance();
  return google(modelName);
}
