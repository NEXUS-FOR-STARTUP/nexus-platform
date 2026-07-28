export enum IntakeStep {
  SITUATION = 0,
  CONTACT = 1,
  PROJECT_CONTEXT = 2,
  SUPPORT_NEEDS = 3,
  DOCUMENTS = 4,
  BOUNDARY = 5,
  REVIEW = 6,
}

export interface IntakeContact {
  full_name: string;
  student_code: string;
  team_role: string;
  zalo: string;
  email: string;
  telegram?: string;
}

export interface IntakeTeamContext {
  group_no?: string;
  project_name?: string;
  team_status_summary?: string;
}

export interface IntakeSupportNeeds {
  primary_need: string;
  extra_notes?: string;
}

export interface IntakeDocument {
  source_type: "drive" | "upload";
  drive_url?: string;
  file_url?: string;
  document_type: string;
  role_description: string;
}

export interface IntakeData {
  package_id: string;
  current_blocker: string;
  current_situations: string[];
  case_summary: string;
  contact: IntakeContact;
  team_context: IntakeTeamContext;
  support_needs: IntakeSupportNeeds;
  documents: IntakeDocument[];
  lecturer_feedback?: string;
  expected_outputs: string;
  boundary_confirmations: string[];
  school?: string;
  course_context?: string;
}
