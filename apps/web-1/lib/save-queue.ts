export type Drafts = Record<string, string>;

export interface DraftStore {
  /** Drafts that are due to be sent, read fresh on every pass. */
  read: () => Drafts;
  /** Drop each sent draft unless the user changed it while the request was in flight. */
  clearIfUnchanged: (sent: Drafts) => void;
}

/**
 * Serial save loop: one request at a time, and each pass re-reads the store, so an older
 * request can never finish after (and overwrite) a newer one. `flush()` resolves only once
 * the store is empty, and rejects with the send error, leaving the drafts in place.
 */
export interface SaveQueue {
  /** Resolves once nothing is left to send; rejects with the send error. Concurrent calls share one loop. */
  flush(): Promise<void>;
}

export function createSaveQueue(store: DraftStore, send: (drafts: Drafts) => Promise<void>): SaveQueue {
  let current: Promise<void> | null = null;

  const drain = async () => {
    // Defers the loop so `current` is assigned before the `finally` below can reset it.
    await Promise.resolve();
    try {
      for (;;) {
        const snapshot = store.read();
        if (Object.keys(snapshot).length === 0) return;
        await send(snapshot);
        store.clearIfUnchanged(snapshot);
      }
    } finally {
      current = null;
    }
  };

  return {
    flush(): Promise<void> {
      current ??= drain();
      return current;
    },
  };
}
