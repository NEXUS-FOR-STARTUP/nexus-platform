export interface ListAdminCasesRequest {
  stage?: string;
  internal_status?: string;
  limit?: string;
}

export interface AdminCaseListItemDto {
  id: string;
  case_code: string;
  team_name: string | null;
  created_at: Date;
  deadline: Date | null;
  user_facing_stage: string;
  internal_status: string;
  payment_status: string;
  package_name: string;
  completeness: number;
  owner_name: string;
  assigned_supporter: { id: string; name: string } | null;
  sla_deadline_at: Date | null;
}
