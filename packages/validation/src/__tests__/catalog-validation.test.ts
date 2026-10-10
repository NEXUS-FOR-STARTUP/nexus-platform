import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cp1, cp2, cp3, cp4, validateCatalog, CATALOG_VERSION, type Template } from "../index.js";
import { validateFurtherReading } from "../catalogs/validate-catalog.js";

describe("Catalog validation (@repo/validation)", () => {
  it("validates the CP1 template", () => {
    assert.doesNotThrow(() => validateCatalog(cp1));
  });

  it("validates the CP2 template", () => {
    assert.doesNotThrow(() => validateCatalog(cp2));
  });

  it("validates the CP3 template", () => {
    assert.doesNotThrow(() => validateCatalog(cp3));
  });

  it("validates the CP4 template", () => {
    assert.doesNotThrow(() => validateCatalog(cp4));
  });

  it("rejects a template with a dependency cycle", () => {
    const cycle: Template = {
      template_key: "cycle",
      title: "Cycle",
      description: "x",
      phases: [
        {
          id: "phase_a",
          title: "A",
          unlock_requires: ["cp1_main_problem"],
          questions: [{ question_id: "cp1_primary_customer", classification: "required" }],
        },
        {
          id: "phase_b",
          title: "B",
          unlock_requires: ["cp1_primary_customer"],
          questions: [{ question_id: "cp1_main_problem", classification: "required" }],
        },
      ],
    };
    assert.throws(() => validateCatalog(cycle), /cycle/i);
  });

  it("rejects a template referencing a missing question_id", () => {
    const missing: Template = {
      template_key: "missing",
      title: "Missing",
      description: "x",
      phases: [
        {
          id: "phase_a",
          title: "A",
          unlock_requires: [],
          questions: [{ question_id: "cp1_does_not_exist", classification: "required" }],
        },
      ],
    };
    assert.throws(() => validateCatalog(missing), /not present in the question registry/i);
  });

  it("rejects an invalid classification", () => {
    const invalid: Template = {
      template_key: "invalid",
      title: "Invalid",
      description: "x",
      phases: [
        {
          id: "phase_a",
          title: "A",
          unlock_requires: [],
          questions: [
            { question_id: "cp1_primary_customer", classification: "bogus" as unknown as "required" },
          ],
        },
      ],
    };
    assert.throws(() => validateCatalog(invalid), /classification/i);
  });

  describe("further_reading", () => {
    const link = (url: string, title = "Bài viết") => ({ url, title });
    const check = (further_reading: { url: string; title: string }[]) =>
      validateFurtherReading({ id: "q", text: "q", explanation: "", suggested_actions: [], further_reading });

    it("accepts https links and questions without links", () => {
      assert.doesNotThrow(() => check([link("https://example.com/a")]));
      assert.doesNotThrow(() => check([]));
    });

    it("rejects http and javascript urls", () => {
      assert.throws(() => check([link("http://example.com/a")]), /https/);
      assert.throws(() => check([link("javascript:alert(1)")]), /https/);
    });

    it("rejects unparsable urls, blank titles and duplicate urls", () => {
      assert.throws(() => check([link("not a url")]), /valid URL/);
      assert.throws(() => check([link("https://example.com/a", "  ")]), /title/);
      assert.throws(() => check([link("https://example.com/a"), link("https://example.com/a", "B")]), /duplicate/);
    });
  });

  it("exports a non-empty CATALOG_VERSION", () => {
    assert.ok(CATALOG_VERSION.length > 0);
  });
});
