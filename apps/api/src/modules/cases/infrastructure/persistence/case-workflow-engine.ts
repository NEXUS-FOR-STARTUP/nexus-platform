import { Workflow, propertyMarkingStore } from "symflow/subject";
import { caseWorkflow } from "../../domain/case-workflow.js";

const workflow = new Workflow<any>(caseWorkflow, {
  markingStore: propertyMarkingStore("internal_status"),
});

// SLA trigger: set 48h when entering supporter_working
workflow.on("entered", (event) => {
  if (event.transition.tos.includes("supporter_working")) {
    event.subject.sla_deadline_at = new Date(Date.now() + 48 * 60 * 60 * 1000);
  }
});

export function applyTransition(caseRecord: any, transitionName: string): void {
  workflow.apply(caseRecord, transitionName);
}

export function canTransition(caseRecord: any, transitionName: string): boolean {
  const result = workflow.can(caseRecord, transitionName);
  return result.allowed;
}
