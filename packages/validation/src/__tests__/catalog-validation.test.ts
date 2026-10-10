import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cp1, cp2, cp3, validateCatalog, CATALOG_VERSION, type Template } from "../index.js";

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

  it("exports a non-empty CATALOG_VERSION", () => {
    assert.ok(CATALOG_VERSION.length > 0);
  });
});
