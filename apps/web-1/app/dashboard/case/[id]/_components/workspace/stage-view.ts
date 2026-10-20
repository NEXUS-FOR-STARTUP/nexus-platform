export type StageView = "draft" | "files" | "results";

const STAGE_VIEWS: readonly StageView[] = ["draft", "files", "results"];

/** URL `view` param is user-controlled: fall back to `draft` for anything unknown. */
export function parseStageView(raw: string | null | undefined): StageView {
  return STAGE_VIEWS.find((v) => v === raw) ?? "draft";
}
