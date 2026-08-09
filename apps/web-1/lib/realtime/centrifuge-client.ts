import { Centrifuge } from "centrifuge";

let client: Centrifuge | null = null;

const CENTRIFUGO_URL =
  process.env.NEXT_PUBLIC_CENTRIFUGO_URL || "ws://localhost:8010/connection/websocket";

const TOKEN_API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export function getCentrifugeClient(): Centrifuge {
  if (client) return client;
  client = new Centrifuge(CENTRIFUGO_URL, {
    getToken: async () => {
      const res = await fetch(`${TOKEN_API_BASE}/api/realtime/connection-token`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Không lấy được token kết nối");
      return (await res.json()).token;
    },
  });
  client.connect();
  return client;
}

export function disconnectCentrifugeClient() {
  client?.disconnect();
  client = null;
}
