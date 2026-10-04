import { SignJWT } from "jose";
import { TOKEN_TTL_SECONDS, chatChannel } from "../domain/realtime.types.js";
import logger from "../../../shared/infrastructure/logger.js";

const encoder = new TextEncoder();
const secretKey = () => encoder.encode(process.env.CENTRIFUGO_TOKEN_SECRET || "");

export async function signConnectionToken(userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_TTL_SECONDS)
    .sign(secretKey());
}

export async function signSubscriptionToken(userId: string, caseId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ sub: userId, channel: chatChannel(caseId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_TTL_SECONDS)
    .sign(secretKey());
}

export function hasCentrifugoSecret(): boolean {
  return Boolean(process.env.CENTRIFUGO_TOKEN_SECRET);
}
