import type { BankInfo } from "../../payments/application/payments.dto.js";

export type { BankInfo } from "../../payments/application/payments.dto.js";

export interface CreateDepositResponse {
  depositId: string;
  amount: number;
  transferContent: string;
  bankInfo: BankInfo;
}

export interface GetDepositResponse {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  transfer_content: string;
  status: string;
  proof_file_url: string | null;
  rejection_reason: string | null;
  bank_transaction_id: string | null;
  bank_credited_at: string | null;
  verified_by: string | null;
  verification_source: string | null;
  created_at: string;
  bankInfo: BankInfo;
}

export interface DepositHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  transfer_content: string;
  proof_file_url: string | null;
  verified_at: string | null;
  bank_transaction_id: string | null;
  created_at: string;
}

export interface ListDepositsResponse {
  deposits: DepositHistoryItem[];
}
