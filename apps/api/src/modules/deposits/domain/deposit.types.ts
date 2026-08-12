export interface CreateDepositRequest {
  amount: number;
  metadataJson?: Record<string, unknown>;
}

export interface VerifyDepositRequest {
  status: "verified" | "rejected";
  rejectionReason?: string;
}

export type DepositStatus = "pending" | "verified" | "rejected";

export const FINAL_DEPOSIT_STATUSES: DepositStatus[] = ["verified", "rejected"];

export function isFinalDepositStatus(s: string): boolean {
  return FINAL_DEPOSIT_STATUSES.includes(s as DepositStatus);
}
