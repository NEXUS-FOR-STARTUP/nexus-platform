/**
 * Additive read contract for the document workspace.
 *
 * This contract is intentionally additive: legacy consumers of `GET /cases/:id`
 * continue to receive the existing top-level fields (`case`, `intake_snapshot`,
 * `latest_report`, `document_board_sections`, `round_history`,
 * `open_requests_for_more_info`) and can ignore `document_workspace` until they
 * migrate.
 *
 * Invariants:
 *
 * 1. `document_workspace` is always present in the response, even when the case
 *    has no documents. It is never `null`.
 * 2. `document_workspace.checkpoints` is always an array (`[]` when empty).
 * 3. Every checkpoint has `overview`, `version_units`, and `assessment_units`.
 *    All three are populated, never `null`.
 * 4. `version_units` and `assessment_units` are always arrays (`[]` when empty).
 * 5. `files` inside any unit is always an array (`[]` when empty).
 * 6. File URLs may be `null` for malformed or quarantined rows, but the file
 *    row itself remains visible with `open_action`/`download_action` set to
 *    `null` so the UI can render a broken-link state.
 * 7. Checkpoint selection for reads/writes:
 *    - Prefer `case.current_checkpoint` when it matches a real checkpoint.
 *    - Otherwise, pick the checkpoint with the highest `latest_version_no`.
 *    - Expose the selected checkpoint id on `document_workspace.selected_checkpoint_id`.
 *    - NEVER use `checkpoints[0]`.
 * 8. Document identity within a lifecycle unit is unique by
 *    `source_kind + canonical_name + seq`. When `canonical_name` is missing,
 *    the stable URL (`file_url` or `drive_url`) is the identity handle.
 * 9. `is_primary` is true for exactly one logical row per (unit, identity key)
 *    with the lowest `seq`; later duplicates share the same `seq` but are not
 *    primary.
 * 10. Unit semantics:
 *     - `v00` is the intake unit (version_no = 1, assessment_no = 0).
 *     - `vNN` (version_no > 0) is a revision unit.
 *     - `aNN-vNN` is an assessment unit where `NN` is the assessment number and
 *       the trailing `vNN` is the linked version number.
 * 11. Report artifact mapping: when a report is approved, a `DocumentRecord`
 *     with `doc_type = "assessment_report"` and `source_kind = "generated"` is
 *     created. It is linked to the report's `lifecycle_unit_id` when present,
 *     otherwise to the checkpoint only (orphan artifact).
 * 12. All document rows are always filtered by `case_id` before any join on
 *     `checkpoint_id` or `lifecycle_unit_id`.
 * 13. Source-aware open/download behavior:
 *     - Drive: open in a new tab via `file_url`; no server proxy.
 *     - Cloudinary: open via `file_url`/`download_url`; no server proxy.
 *     - Generated: download via `download_url`; no server proxy.
 */

export interface DocumentWorkspace {
  selected_checkpoint_id: string | null;
  checkpoints: DocumentCheckpoint[];
}

export interface DocumentCheckpoint {
  checkpoint_id: string;
  checkpoint_code: string;
  overview: DocumentCheckpointOverview;
  version_units: DocumentUnit[];
  assessment_units: DocumentUnit[];
  /** Additive UI-facing collections for 3-tab workspace */
  support_flow_documents: DocumentUnit[];
  external_feedback_documents: ExternalFeedbackUnit[];
  latest_version_no: number;
}

export interface ExternalFeedbackUnit {
  unit_code: string;
  assessment_no: number;
  linked_version_no: number | null;
  files: DocumentFile[];
  metadata: ExternalFeedbackMetadata | null;
}

export interface ExternalFeedbackMetadata {
  source: "lecturer" | "mentor" | "other";
  source_other_text?: string | null;
  timing: "pre_support" | "post_support";
  selected_version_no: number;
}

export interface DocumentCheckpointOverview {
  /** Total files across all version units in this checkpoint. */
  total_files: number;
  /** Number of distinct version units. */
  version_count: number;
  /** Number of distinct assessment units. */
  assessment_count: number;
  /** Human-readable label for the current checkpoint selection. */
  selected_label: string;
}

export interface DocumentUnit {
  unit_code: string;
  version_no: number;
  /** 0 for version units; > 0 for assessment units. */
  assessment_no: number;
  linked_version_no: number | null;
  files: DocumentFile[];
}

export interface DocumentFile {
  id: string;
  seq: number;
  is_primary: boolean;
  doc_type?: string | null;
  doc_type_label?: string | null;
  category?: string | null;
  source_kind: "drive" | "cloudinary" | "generated";
  canonical_name: string | null;
  original_name: string | null;
  extension: string | null;
  mime_type: string | null;
  file_url: string | null;
  download_url: string | null;
  open_action: "open_url_new_tab" | "download" | null;
  download_action: "open_url_new_tab" | "download" | null;
  uploaded_by_name?: string | null;
  uploaded_by_role?: string | null;
  created_at?: string | null;
}
