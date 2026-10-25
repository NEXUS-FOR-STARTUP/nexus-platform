import { test } from "node:test";
import assert from "node:assert/strict";
import { QUESTION_REGISTRY, serializeChoice, type Question } from "@repo/validation";
import { choiceStateFromValue, choiceValueFor, reconcileChoiceState } from "./choice-input-state.js";

const track = QUESTION_REGISTRY.cp4_fund_track as Question;
const traditional = serializeChoice({ value: "traditional", otherText: null });
const otherSaved = serializeChoice({ value: "other", otherText: "Hợp tác xã" });

test("late-loaded answer replaces an empty state", () => {
  const empty = choiceStateFromValue("", track);
  assert.deepEqual(empty, { pick: null, otherText: "" });
  assert.deepEqual(reconcileChoiceState(empty, traditional, "", track), { pick: "traditional", otherText: "" });
});

test("an unfinished Khác pick survives the component's own empty emission", () => {
  const pickedOther = { pick: "other", otherText: "" };
  assert.equal(choiceValueFor("other", ""), "");
  assert.deepEqual(reconcileChoiceState(pickedOther, "", "", track), pickedOther);
});

test("external clear (discarded draft) resets a saved Khác answer", () => {
  const saved = choiceStateFromValue(otherSaved, track);
  assert.deepEqual(saved, { pick: "other", otherText: "Hợp tác xã" });
  assert.deepEqual(reconcileChoiceState(saved, "", otherSaved, track), { pick: null, otherText: "" });
});

test("an external clear also drops a locally pending empty Khác pick", () => {
  assert.deepEqual(reconcileChoiceState({ pick: "other", otherText: "" }, "", "x", track), { pick: null, otherText: "" });
});
