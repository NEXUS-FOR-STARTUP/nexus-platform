import type { DocumentWriteInput } from "../../documents/application/document-dto.js";
import type {
  DocumentTypeFlow,
  DocumentUnitScope,
  ExternalFeedbackSource,
  ExternalFeedbackTiming,
} from "../../documents/domain/document-types.js";

export interface CreateCaseRequest {
  package_id: string;
  school?: string;
  course_context?: string;
  deadline?: string;
  team_context?: {
    project_name?: string;
    group_no?: string;
  };
  contact?: {
    full_name: string;
    student_code: string;
    team_role: string;
    zalo: string;
    email: string;
  };
  current_blocker?: string;
  current_situations?: string[];
  case_summary?: string;
  support_needs?: {
    primary_need: string;
  };
  /** Backward-compatible documents array; fields are validated and canonicalized by the server. */
  documents?: Array<DocumentWriteInput>;
  boundary_confirmations?: string[];
}

export interface SubmitRevisionRequest {
  change_summary: string;
  /** Intake remains URL-based; post-intake revision route now uses uploaded files instead. */
  documents?: Array<DocumentWriteInput>;
  remaining_blockers?: string;
}

export interface UploadedDocumentDraftInput {
  original_name: string;
  file_url: string;
  download_url: string;
  cloudinary_public_id: string;
  extension: string;
  mime_type: string;
  doc_type: string;
}

export interface SubmitRevisionUploadRequest {
  change_summary: string;
  remaining_blockers?: string;
  documents: UploadedDocumentDraftInput[];
}

export interface SupporterOutputUploadRequest {
  document_type_code?: string;
  note?: string;
  documents: UploadedDocumentDraftInput[];
}

export interface ExternalFeedbackUploadRequest {
  document_type_code: string;
  source: ExternalFeedbackSource;
  source_other_text?: string;
  timing: ExternalFeedbackTiming;
  selected_version_no: number;
  note?: string;
  documents: UploadedDocumentDraftInput[];
}

export interface DocumentTypeQueryRequest {
  flow?: DocumentTypeFlow;
  unit_scope?: DocumentUnitScope;
}

export interface IntakeRequest {
  school?: string;
  course_context?: string;
  team_context?: {
    project_name?: string;
    group_no?: string;
  };
  contact: {
    full_name: string;
    student_code: string;
    team_role: string;
    zalo: string;
    email: string;
  };
  current_blocker: string;
  support_needs: {
    primary_need: string;
  };
  documents: Array<{
    file_url?: string;
    drive_url?: string;
    document_type: string;
  }>;
  boundary_confirmations: string[];
}

export interface UpdateCaseSettingsRequest {
  team_name?: string;
  school?: string;
  course_context?: string;
  group_no?: string;
  contact?: {
    full_name?: string;
    student_code?: string;
    team_role?: string;
    email?: string;
    zalo?: string;
    phone?: string;
  };
  idea?: {
    field?: string;
    targetCustomer?: string;
    target_customer?: string;
    problem?: string;
    solution?: string;
    mvp?: string;
  };
  current_blocker?: string;
  support_needs?: {
    primary_need?: string;
    extra_notes?: string;
  };
  boundary_confirmations?: string[];
}
