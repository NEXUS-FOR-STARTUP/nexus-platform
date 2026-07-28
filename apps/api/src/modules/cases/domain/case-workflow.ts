import { type WorkflowDefinition } from "symflow/engine";

export const caseWorkflow: WorkflowDefinition = {
  name: "case_workflow",
  type: "state_machine",
  places: [
    { name: "triage_pending" },
    { name: "accepted_unassigned" },
    { name: "assigned" },
    { name: "waiting_user" },
    { name: "supporter_working" },
    { name: "report_ready_to_publish" },
    { name: "done" },
    { name: "cancelled" },
  ],
  transitions: [
    { name: "accept_case",        froms: ["triage_pending"],             tos: ["accepted_unassigned"] },
    { name: "assign_supporter",   froms: ["accepted_unassigned"],        tos: ["assigned"] },
    { name: "start_work",         froms: ["assigned"],                   tos: ["supporter_working"] },
    { name: "request_info",       froms: ["supporter_working"],          tos: ["waiting_user"] },
    { name: "resume_work",        froms: ["waiting_user"],               tos: ["supporter_working"] },
    { name: "publish_report",     froms: ["supporter_working"],          tos: ["report_ready_to_publish"] },
    { name: "complete_case",      froms: ["report_ready_to_publish"],    tos: ["done"] },
    { name: "cancel",             froms: ["triage_pending", "accepted_unassigned"], tos: ["cancelled"] },
  ],
  initialMarking: ["triage_pending"],
};

export const statusToPlace: Record<string, string> = {
  "triage_pending": "triage_pending",
  "accepted_unassigned": "accepted_unassigned",
  "assigned": "assigned",
  "waiting_user": "waiting_user",
  "supporter_working": "supporter_working",
  "report_ready_to_publish": "report_ready_to_publish",
  "done": "done",
  "cancelled": "cancelled",
};
