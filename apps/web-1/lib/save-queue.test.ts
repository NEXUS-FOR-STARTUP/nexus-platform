import { test } from "node:test";
import assert from "node:assert/strict";
import { createSaveQueue, recoveredDraftIds, type Drafts } from "./save-queue.js";

function makeStore(initial: Drafts) {
  const state = { ...initial };
  return {
    state,
    read: () => ({ ...state }),
    clearIfUnchanged: (sent: Drafts) => {
      for (const [id, text] of Object.entries(sent)) if (state[id] === text) delete state[id];
    },
  };
}
test("text typed while a request is in flight is sent after it, in order, and never lost", async () => {
  const store = makeStore({ q1: "A" });
  const sent: string[] = [];
  const starts = [Promise.withResolvers<void>(), Promise.withResolvers<void>()];
  const releases = [Promise.withResolvers<void>(), Promise.withResolvers<void>()];
  const queue = createSaveQueue(store, (d) => {
    const n = sent.push(d.q1) - 1;
    starts[n].resolve();
    return releases[n].promise;
  });

  const done = queue.flush();
  await starts[0].promise;
  store.state.q1 = "AB"; // typed during request 1
  assert.deepEqual(sent, ["A"], "second request must not start while the first is in flight");
  releases[0].resolve();
  await starts[1].promise;
  assert.deepEqual(sent, ["A", "AB"]);
  releases[1].resolve();
  await done;
  assert.deepEqual(store.state, {});
});

test("an empty draft (deleted answer) is sent like any other", async () => {
  const store = makeStore({ q1: "" });
  const sent: Drafts[] = [];
  await createSaveQueue(store, async (d) => void sent.push(d)).flush();
  assert.deepEqual(sent, [{ q1: "" }]);
  assert.deepEqual(store.state, {});
});

test("flush rejects on send error and keeps the draft; a later flush retries it", async () => {
  const store = makeStore({ q1: "A" });
  let fail = true;
  const queue = createSaveQueue(store, async () => {
    if (fail) throw new Error("offline");
  });
  await assert.rejects(queue.flush(), /offline/);
  assert.deepEqual(store.state, { q1: "A" });
  fail = false;
  await queue.flush();
  assert.deepEqual(store.state, {});
});

test("concurrent flush calls share one in-flight loop", async () => {
  const store = makeStore({ q1: "A" });
  let calls = 0;
  const queue = createSaveQueue(store, async () => void calls++);
  await Promise.all([queue.flush(), queue.flush()]);
  assert.equal(calls, 1);
});

test("a draft restored from an earlier visit stays unresolved until the user queues it (explicit save) or drops it", () => {
  const restored: Drafts = { q1: "old text", q2: "typed now" };
  const queued = new Set(["q2"]);
  assert.deepEqual(recoveredDraftIds(restored, queued), ["q1"]);
  queued.add("q1"); // explicit save
  assert.deepEqual(recoveredDraftIds(restored, queued), []);
  assert.deepEqual(recoveredDraftIds({ q2: "typed now" }, new Set()), ["q2"], "nothing is queued after a reload");
});
