import logger from "../../../shared/infrastructure/logger.js";

const PUBLISH_TIMEOUT_MS = 3000;

export async function publishToChannel(channel: string, data: unknown): Promise<boolean> {
  const url = process.env.CENTRIFUGO_URL || "http://localhost:8010";
  const apiKey = process.env.CENTRIFUGO_API_KEY || "";
  if (!apiKey) {
    logger.warn({ channel }, "CENTRIFUGO_API_KEY missing — skip publish");
    return false;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PUBLISH_TIMEOUT_MS);
    const response = await fetch(`${url}/api/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ channel, data }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      logger.error({ channel, status: response.status }, "centrifugo publish non-200");
      await response.body?.cancel();
      return false;
    }
    return true;
  } catch (error) {
    logger.error({ channel, err: error }, "centrifugo publish failed");
    return false;
  }
}
