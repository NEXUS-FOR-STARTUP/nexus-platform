export interface UploadPaymentProofRequest {
  caseId: string;
  file: {
    name: string;
    size: number;
    arrayBuffer: () => Promise<ArrayBuffer>;
  };
}

export interface VerifyPaymentRequest {
  status: "paid" | "rejected";
  rejection_reason?: string;
}

export interface CreatePaymentRequest {
  caseId: string;
  amount: number;
  metadataJson?: Record<string, unknown>;
}

export interface CreatePaymentResponse {
  paymentId: string;
  bankInfo: BankInfo;
}

export interface GetPaymentResponse {
  id: string;
  case_id: string;
  case_code?: string;
  package_id: string;
  amount: number;
  status: string;
  proof_file_url: string | null;
  metadata_json: Record<string, unknown> | null;
  rejection_reason: string | null;
  verified_by_auth_user_id: string | null;
  verified_at: string | null;
  verification_source: string | null;
  currency: string;
  payment_method: string;
  transfer_content?: string;
  bank_transaction_id?: string;
  bank_credited_at?: string;
  payer?: { id: string; name: string; display_username?: string | null } | null;
  created_at: string;
  bankInfo: BankInfo;
}

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

export interface ListMyPaymentsResponse {
  payments: PaymentHistoryItem[];
}

export interface BankInfo {
  bankName: string;
  bankShortCode: string;
  accountNumber: string;
  accountName: string;
  transferContent: string;
  qrUrl: string;
}
