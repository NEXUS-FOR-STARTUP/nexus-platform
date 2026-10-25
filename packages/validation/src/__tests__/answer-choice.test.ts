import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  QUESTION_REGISTRY,
  checkChoiceAnswer,
  formatChoice,
  parseChoice,
  serializeChoice,
  MAX_OTHER_TEXT_LENGTH,
  type Question,
} from "../index.js";
import { validateChoiceOptions } from "../catalogs/validate-catalog.js";
const track = QUESTION_REGISTRY.cp4_fund_track as Question;

describe("choice answers", () => {
  it("round-trips a regular option", () => {
    const raw = serializeChoice({ value: "scalable", otherText: null });
    assert.deepEqual(parseChoice(raw, track), { value: "scalable", otherText: null });
    assert.equal(formatChoice(raw, track), "Phát triển nhanh (Scalable)");
  });

  it("keeps free text under Khác as Khác even when it equals an option label", () => {
    const raw = serializeChoice({ value: "other", otherText: "Phát triển nhanh (Scalable)" });
    assert.equal(parseChoice(raw, track)?.value, "other");
    assert.equal(formatChoice(raw, track), "Phát triển nhanh (Scalable)");
  });

  it("rejects bad writes: broken JSON, unknown value, empty other, text on a regular option, too long", () => {
    const bad = [
      "không phải json",
      "[]",
      serializeChoice({ value: "unknown", otherText: null }),
      serializeChoice({ value: "other", otherText: "   " }),
      serializeChoice({ value: "other", otherText: null }),
      serializeChoice({ value: "traditional", otherText: "ghi chú" }),
      serializeChoice({ value: "other", otherText: "x".repeat(MAX_OTHER_TEXT_LENGTH + 1) }),
    ];
    for (const raw of bad) assert.equal(checkChoiceAnswer(raw, track).ok, false, raw);
  });

  it("rejects Khác when the question does not allow it", () => {
    const noOther: Question = { ...track, allow_other: false };
    assert.equal(checkChoiceAnswer(serializeChoice({ value: "other", otherText: "x" }), noOther).ok, false);
  });

  it("reads stale or invalid stored data as not chosen instead of throwing", () => {
    assert.equal(parseChoice("{", track), null);
    assert.equal(parseChoice(serializeChoice({ value: "removed_option", otherText: null }), track), null);
    assert.equal(parseChoice("", track), null);
    assert.equal(formatChoice(undefined, track), "");
  });
});

describe("validateChoiceOptions", () => {
  const base: Question = { id: "q", text: "t", explanation: "", suggested_actions: [] };
  const opt = (value: string) => ({ value, label: value, description: "" });

  it("accepts the real track question and plain questions", () => {
    assert.doesNotThrow(() => validateChoiceOptions(track));
    assert.doesNotThrow(() => validateChoiceOptions(base));
  });

  it("rejects fewer than 2 options, duplicate values, the reserved other value, allow_other without options", () => {
    assert.throws(() => validateChoiceOptions({ ...base, options: [opt("a")] }), /at least 2/);
    assert.throws(() => validateChoiceOptions({ ...base, options: [opt("a"), opt("a")] }), /duplicate/);
    assert.throws(() => validateChoiceOptions({ ...base, options: [opt("a"), opt("other")] }), /reserved/);
    assert.throws(() => validateChoiceOptions({ ...base, allow_other: true }), /no options/);
  });
});
