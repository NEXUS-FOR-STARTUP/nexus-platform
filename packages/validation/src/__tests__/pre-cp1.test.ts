import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PreCp1InputSchema,
  buildPreCp1Report,
  deriveTeamFitInput,
  computeRecruit,
  confirmedKinds,
  ideaModeOf,
  teamFitSkipReason,
  teamRule,
  type PreCp1Input,
} from "../index.js";

const base = (over: Partial<PreCp1Input> = {}): PreCp1Input =>
  PreCp1InputSchema.parse({
    school: "fpt",
    course: "exe101",
    goal: "pass",
    budget: "b1",
    team: [
      { major: "Công nghệ thông tin", caps: { code: 3 }, unsure: false },
      { major: "Marketing", caps: { sell: 2 }, unsure: false },
      { major: "Kinh doanh", caps: { finance: 2 }, unsure: false },
      { major: "Ngành khác", majorOther: "Ngôn ngữ Anh", roleTrackHint: "marketing", caps: {}, unsure: true },
    ],
    assets: {},
    assetsNone: ["family", "work", "people", "tools", "own"],
    network: ["classmates"],
    networkOther: "Bạn cùng lớp",
    ideaMode: "none",
    sensitive: ["none"],
    assetTags: {},
    ideaTags: {},
    ...over,
  });

const structured = (over: Partial<PreCp1Input> = {}) =>
  base({
    ideaMode: "structured",
    madlibs: {
      projectName: "Quán Xanh",
      field: "đồ uống",
      targetCustomer: "quán cà phê nhỏ quanh trường",
      problem: "khách đặt món qua ba kênh và chủ quán nhớ bằng đầu",
      solution: "một bảng Sheet chung và tin nhắn Zalo nhắc đơn",
      mvp: "một quán quen dùng thử trong một tuần",
    },
    ...over,
  });

describe("pre-CP1 rules", () => {
  it("counts size and majors against the school rule, never hiding a short team", () => {
    assert.equal(teamRule(base()).sizeOk, true);
    assert.equal(teamRule(base()).majorsOk, true);
    const short = teamRule(base({ team: [base().team[0]!] }));
    assert.equal(short.sizeOk, false);
    assert.equal(short.sizeMin, 4);
    assert.equal(short.majors, 1);
    assert.equal(teamRule(base({ school: "other" })).sizeMin, null);
  });

  it("only structured six boxes count as structured; a short one falls back to draft", () => {
    assert.equal(ideaModeOf(structured()), "structured");
    const short = structured({ madlibs: { projectName: "X", field: "", targetCustomer: "", problem: "", solution: "", mvp: "" } });
    assert.equal(ideaModeOf(short), "draft");
    assert.equal(ideaModeOf(base()), "none");
  });

  it("ignores idea kinds nobody confirmed", () => {
    const confirmed = structured({ ideaTags: { forbidden: "yes" } });
    assert.deepEqual([...confirmedKinds(confirmed)], ["forbidden"]);
    assert.deepEqual([...confirmedKinds(structured())], []);

    const blocked = buildPreCp1Report(confirmed).verdict.level;
    const unconfirmed = buildPreCp1Report(structured()).verdict.level;
    assert.equal(blocked, "blocked");
    assert.notEqual(unconfirmed, "blocked");
  });

  it("asks for a maker when nobody can build, and not twice", () => {
    const noMaker = base({ team: [{ major: "Marketing", caps: { sell: 3 }, unsure: false }] });
    const ids = computeRecruit(noMaker).map((role) => role.id);
    assert.equal(ids.filter((id) => id.startsWith("maker_")).length, 1);
    const withMaker = structured();
    assert.equal(computeRecruit(withMaker).some((role) => role.id.startsWith("maker_")), false);
  });

  it("keeps zones short, unique and tied to what the user confirmed", () => {
    const report = buildPreCp1Report(structured({ assetTags: { fnb: "yes", agri: "yes" } }));
    assert.ok(report.zones.length > 0 && report.zones.length <= 4);
    assert.equal(new Set(report.zones.map((zone) => zone.title)).size, report.zones.length);
  });

  it("derives the AI contract only from a complete six-box idea", () => {
    assert.equal(deriveTeamFitInput(base()), null);
    const draft = structured({ madlibs: { projectName: "X" } });
    assert.equal(deriveTeamFitInput(draft), null);
    assert.match(teamFitSkipReason(draft) ?? "", /sáu câu/);

    const derived = deriveTeamFitInput(structured());
    assert.ok(derived);
    assert.equal(derived.team[0]?.roleTrack, "ky_thuat", "CNTT maps to the engineering track");
    assert.equal(derived.team[0]?.major, "Công nghệ thông tin");
    assert.ok(derived.team[0]?.strengths.some((s) => s.includes("làm web, app")));
    assert.equal(derived.idea.targetCustomer.length > 0, true);

    const tooMany = structured({
      school: "other",
      team: Array.from({ length: 7 }, (_, i) => ({ major: "Kinh doanh" as const, caps: { sell: 2 as const }, unsure: false, name: `P${i}` })),
    });
    assert.match(teamFitSkipReason(tooMany) ?? "", /4–6/);
    assert.equal(deriveTeamFitInput(tooMany), null);
  });
});
