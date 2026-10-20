import { QUESTION_REGISTRY, TEMPLATE_REGISTRY, type QuestionId, type TemplateKey } from "@repo/validation";
import { QuestionStack, type QuestionPreview } from "./QuestionStack";

/** Where the "Xem thêm" link on every sample card leads. */
const MORE_HREF = "/dashboard";

/** Display names of the rounds (CP1/CP2 codes are never shown on the UI). */
const STAGE_NAMES: Partial<Record<TemplateKey, string>> = { cp1: "Ý tưởng", cp2: "Thị trường" };

interface QuestionRef {
  template: TemplateKey;
  id: QuestionId;
}

const firstCp2Question = TEMPLATE_REGISTRY.cp2.phases[0]?.questions[0]?.question_id as QuestionId | undefined;
if (!firstCp2Question) throw new Error("Landing: CP2 template has no first question");

/** Six distinct questions: three shown in full, each followed by a faded one. */
const PAIRS: Array<{ main: QuestionRef; next: QuestionRef }> = [
  {
    main: { template: "cp1", id: "cp1_primary_customer" },
    next: { template: "cp1", id: "cp1_customer_story" },
  },
  {
    main: { template: "cp1", id: "cp1_main_problem" },
    next: { template: "cp1", id: "cp1_non_priority_customer" },
  },
  {
    main: { template: "cp1", id: "cp1_idea_name" },
    next: { template: "cp2", id: firstCp2Question },
  },
];

const NOT_PASSING_PREFIX = "Không đạt:";
const PASSING_PREFIX = "Đạt:";
const EXAMPLE_PREFIX = "Ví dụ:";
/** Trailing lead-in such as "Cần nêu đủ 6 ý:" that only introduces a bullet list. */
const LIST_LEAD_IN = /\s*[^.]*:$/;

/** Position of a question across the whole template, in catalog order (1-based). */
function questionNumber({ template, id }: QuestionRef): number {
  const ids = TEMPLATE_REGISTRY[template].phases.flatMap((phase) => phase.questions.map((q) => q.question_id));
  const index = ids.indexOf(id);
  if (index < 0) throw new Error(`Landing: ${id} is not in template ${template}`);
  return index + 1;
}

function stageLabel(ref: QuestionRef): string {
  return `Giai đoạn ${STAGE_NAMES[ref.template]} · Câu ${questionNumber(ref)}`;
}

/** Splits the catalog explanation into the intro sentence(s) and the verbatim examples. */
function parseExplanation(id: QuestionId) {
  const lines = QUESTION_REGISTRY[id].explanation.split("\n");
  const find = (prefix: string) => lines.find((line) => line.startsWith(prefix))?.slice(prefix.length).trim();
  const cut = lines.findIndex((line) => line.startsWith(NOT_PASSING_PREFIX) || line.startsWith(EXAMPLE_PREFIX));
  const intro = lines
    .slice(0, cut < 0 ? undefined : cut)
    .filter((line) => !line.startsWith("- "))
    .join(" ")
    .replace(LIST_LEAD_IN, "");
  return { description: intro, notPassing: find(NOT_PASSING_PREFIX), passing: find(PASSING_PREFIX) };
}

function buildPreview({ main, next }: (typeof PAIRS)[number]): QuestionPreview {
  const { description, notPassing, passing } = parseExplanation(main.id);
  if (!notPassing || !passing) throw new Error(`Landing: ${main.id} lacks Không đạt/Đạt examples`);
  return {
    stageLabel: stageLabel(main),
    text: QUESTION_REGISTRY[main.id].text,
    description,
    notPassing,
    passing,
    next: {
      stageLabel: stageLabel(next),
      text: QUESTION_REGISTRY[next.id].text,
      description: parseExplanation(next.id).description,
    },
  };
}

export function LandingQuestionCards() {
  return <QuestionStack questions={PAIRS.map(buildPreview)} moreHref={MORE_HREF} />;
}
