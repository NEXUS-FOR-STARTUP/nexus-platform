import type { SSEStreamingApi } from "hono/streaming";

type Client = { stream: SSEStreamingApi; userId: string };

const MAX_CONNECTIONS_PER_USER = 100; // chống DoS — mở vô hạn connection

// Map<userId, Set<Client>> — 1 user nhiều tab
const connections = new Map<string, Set<Client>>();

export function hasCapacity(userId: string): boolean {
  return (connections.get(userId)?.size ?? 0) < MAX_CONNECTIONS_PER_USER;
}

export function addConnection(userId: string, stream: SSEStreamingApi): boolean {
  const userConns = connections.get(userId) ?? new Set<Client>();
  if (userConns.size >= MAX_CONNECTIONS_PER_USER) return false; // quá cap → từ chối
  userConns.add({ stream, userId });
  connections.set(userId, userConns);
  return true;
}

export function removeConnection(userId: string, stream: SSEStreamingApi): void {
  const userConns = connections.get(userId);
  if (!userConns) return;
  // Set.delete dùng reference equality — phải tìm client theo stream reference
  for (const client of userConns) {
    if (client.stream === stream) {
      userConns.delete(client);
      break;
    }
  }
  if (userConns.size === 0) connections.delete(userId);
}

export async function ping(userId: string): Promise<void> {
  const userConns = connections.get(userId);
  if (!userConns) return;
  for (const client of userConns) {
    try {
      await client.stream.writeSSE({ event: "ping", data: JSON.stringify({ at: Date.now() }) });
    } catch {
      removeConnection(userId, client.stream); // write fail = connection chết
    }
  }
}
