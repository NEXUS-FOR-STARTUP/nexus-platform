import { type WorkflowDefinition } from "symflow/engine";

export const caseWorkflow: WorkflowDefinition = {
  name: "case_workflow",
  type: "state_machine",
  places: [
    { name: "draft" },
    { name: "submitted" },
    { name: "under_review" },
    { name: "supporter_working" },
    { name: "completed" },
    { name: "rejected" },
  ],
  transitions: [
    { name: "submit_intake",    froms: ["draft"],             tos: ["submitted"] },
    { name: "admin_review",     froms: ["submitted"],         tos: ["under_review"] },
    { name: "assign_supporter", froms: ["under_review"],      tos: ["supporter_working"] },
    { name: "submit_revision",  froms: ["supporter_working"], tos: ["supporter_working"] },
    { name: "complete",         froms: ["supporter_working"], tos: ["completed"] },
    { name: "reject",           froms: ["under_review"],      tos: ["rejected"] },
    { name: "veto",             froms: ["submitted", "under_review"], tos: ["rejected"] },
  ],
  initialMarking: ["draft"],
};

export const statusToPlace: Record<string, string> = {
  "draft": "draft",
  "submitted": "submitted",
  "under_review": "under_review",
  "supporter_working": "supporter_working",
  "completed": "completed",
  "rejected": "rejected",
};
