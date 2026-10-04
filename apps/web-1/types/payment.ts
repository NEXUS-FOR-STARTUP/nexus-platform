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
  verification_source?: "auto" | "manual" | null;
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

/** Narrow history item returned by `GET /payments/my` — payer-visible only, no admin/internal fields. */
export type PaymentHistoryStatus = "unpaid" | "pending_verification" | "paid" | "rejected";

export interface PaymentHistoryItem {
  id: string;
  case_id: string;
  case_code: string;
  package_name?: string | null;
  amount: number;
  currency: string;
  status: PaymentHistoryStatus;
  verified_at?: string | null;
  bank_transaction_id?: string | null;
  created_at: string;
}

export interface Deposit {
  id: string;
  amount: number;
  currency: string;
  transfer_content: string;
  status: "pending" | "verified" | "rejected";
  proof_file_url: string | null;
  bank_transaction_id: string | null;
  bank_credited_at: string | null;
  verified_by: string | null;
  verification_source: string | null;
  created_at: string;
  user?: { id: string; name: string; display_username?: string | null };
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: "pending" | "paid" | "refunded" | "cancelled";
  items: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: string;
  service_type: string;
  quantity: number;
  unit_price: number;
  amount: number;
  metadata_json?: Record<string, unknown> | null;
}
