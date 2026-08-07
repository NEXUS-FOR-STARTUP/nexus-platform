import { EventEmitter } from "node:events";
import type { DomainEvent } from "../domain/domain-events.js";

const emitter = new EventEmitter();
emitter.setMaxListeners(20);

export function emitEvent(event: DomainEvent): void {
  // Dispatch async. Không bao giờ throw về usecase.
  queueMicrotask(() => {
    try {
      // M3 note (review): EventEmitter.emit dừng khi 1 listener throw đồng bộ → các listener sau
      // (gồm notification) bị skip. Mọi listener PHẢI tự catch (notification-listener đã làm).
      // Nếu tương lai thêm listener sync-throw → đổi sang loop listeners riêng.
      emitter.emit(event.type, event);
    } catch (error) {
      console.error("[event-bus] listener error:", error);
    }
  });
}

export function onEvent(type: string, handler: (event: DomainEvent) => void): void {
  emitter.on(type, handler);
}
