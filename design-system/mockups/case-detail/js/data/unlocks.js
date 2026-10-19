// Generated from the real catalogs (cp1.ts, cp2.ts). Mirrors isQuestionUnlocked in useGuidedDocuments.ts:
// `req` = ids that must all be answered; `prev` = the previous required question must be answered; {} = always open.
const UNLOCK={
 "cp1_team_name": {},
 "cp1_team_members": {},
 "cp1_idea_name": {},
 "cp1_primary_customer": {},
 "cp1_non_priority_customer": {
  "req": [
   "cp1_primary_customer"
  ]
 },
 "cp1_role_breakdown": {
  "req": [
   "cp1_primary_customer"
  ]
 },
 "cp1_customer_story": {
  "req": [
   "cp1_primary_customer"
  ]
 },
 "cp1_main_problem": {
  "req": [
   "cp1_primary_customer"
  ]
 },
 "cp1_problem_severity": {
  "req": [
   "cp1_main_problem"
  ]
 },
 "cp1_current_alternatives": {
  "req": [
   "cp1_main_problem"
  ]
 },
 "cp1_alternatives_analysis": {
  "req": [
   "cp1_current_alternatives"
  ]
 },
 "cp1_required_improvement": {
  "req": [
   "cp1_current_alternatives"
  ]
 },
 "cp1_solution_description": {
  "req": [
   "cp1_main_problem"
  ]
 },
 "cp1_solution_mechanism": {
  "req": [
   "cp1_solution_description"
  ]
 },
 "cp1_core_features": {
  "req": [
   "cp1_solution_description"
  ]
 },
 "cp1_out_of_scope": {
  "req": [
   "cp1_solution_description"
  ]
 },
 "cp1_riskiest_assumption": {
  "req": [
   "cp1_solution_description"
  ]
 },
 "cp1_mvp_definition": {
  "req": [
   "cp1_riskiest_assumption"
  ]
 },
 "cp1_mvp_test_plan": {
  "req": [
   "cp1_mvp_definition"
  ]
 },
 "cp1_mvp_pass_fail": {
  "req": [
   "cp1_mvp_test_plan"
  ]
 },
 "cp1_evidence_assumptions": {},
 "cp1_revenue_model": {
  "req": [
   "cp1_solution_description"
  ]
 },
 "cp2_problem_need": {},
 "cp2_solution": {
  "prev": "cp2_problem_need"
 },
 "cp2_opportunity": {
  "prev": "cp2_solution"
 },
 "cp2_vpc_customer_profile": {
  "prev": "cp2_opportunity"
 },
 "cp2_vpc_value_map": {
  "prev": "cp2_vpc_customer_profile"
 },
 "cp2_research_objectives": {
  "req": [
   "cp2_problem_need"
  ]
 },
 "cp2_customer_discovery_process": {
  "prev": "cp2_research_objectives"
 },
 "cp2_expert_interviews": {
  "prev": "cp2_customer_discovery_process"
 },
 "cp2_survey": {
  "prev": "cp2_expert_interviews"
 },
 "cp2_question_bank": {
  "prev": "cp2_survey"
 },
 "cp2_pain_point_interviews": {},
 "cp2_tam_sam_som": {
  "req": [
   "cp2_research_objectives"
  ]
 },
 "cp2_porters_five_forces": {
  "prev": "cp2_tam_sam_som"
 },
 "cp2_competitive_analysis": {
  "prev": "cp2_porters_five_forces"
 },
 "cp2_invisible_competitors": {
  "prev": "cp2_competitive_analysis"
 },
 "cp2_competitor_criteria_table": {
  "prev": "cp2_invisible_competitors"
 },
 "cp2_mvp_demo": {
  "req": [
   "cp2_solution"
  ]
 },
 "cp2_iteration_refinement": {
  "prev": "cp2_mvp_demo"
 },
 "cp2_surprises_pivot": {
  "prev": "cp2_iteration_refinement"
 },
 "cp2_pmf_signals": {
  "req": [
   "cp2_mvp_demo"
  ]
 },
 "cp2_marketing_4p": {
  "prev": "cp2_pmf_signals"
 },
 "cp2_ai_disclosure": {},
 "cp2_harvard_referencing": {
  "prev": "cp2_ai_disclosure"
 },
 "cp2_appendix": {
  "prev": "cp2_harvard_referencing"
 },
 "cp2_format": {
  "prev": "cp2_appendix"
 },
 "cp2_debate_defense": {
  "req": [
   "cp2_expert_interviews"
  ]
 },
 "cp2_debate_attack": {}
};
