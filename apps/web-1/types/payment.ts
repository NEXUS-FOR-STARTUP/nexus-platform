import { User } from "./user";
import { ServicePackage } from "./package";
import { Case } from "./case";

export interface Payment {
  id: string;
  case_id: string;
  package_id: string;
  amount: number;
  status: "unpaid" | "pending_verification" | "paid" | "rejected" | string;
  proof_file_url?: string | null;
  rejection_reason?: string | null;
  verified_by_auth_user_id?: string | null;
  verified_at?: string | null;
  currency: string;
  payment_method: string;
  transfer_content?: string | null;
  bank_transaction_id?: string | null;
  bank_credited_at?: string | null;
  payer_auth_user_id?: string | null;
  payer?: { id: string; name: string; display_username?: string | null } | null;
  created_at: string;
  updated_at: string;

  package?: ServicePackage;
  verified_by?: User | null;
  case?: Case;
}
