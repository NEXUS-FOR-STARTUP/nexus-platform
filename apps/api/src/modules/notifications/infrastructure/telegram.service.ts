import { Bot } from "grammy";
import { autoRetry } from "@grammyjs/auto-retry";
import logger from "../../../shared/infrastructure/logger.js";

// Optional init — thiếu token → disabled (không crash)
const token = process.env.TELEGRAM_BOT_TOKEN;
export const telegramBot = token ? new Bot(token) : null;
if (telegramBot) telegramBot.api.config.use(autoRetry()); // tự xử lý 429 + retry_after

export async function sendTelegram(chatId: string, text: string): Promise<number | null> {
  if (!telegramBot) {
    logger.warn("TELEGRAM_BOT_TOKEN missing — telegram notifications disabled");
    return null;
  }
  const msg = await telegramBot.api.sendMessage(chatId, text);
  return msg.message_id; // lưu vào provider_message_id — audit
}
