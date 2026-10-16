import { z } from "zod";

/** Trần mỗi khoản cấp ví cho một khoản nợ (VND). */
export const RECEIVABLE_GRANT_MAX_VND = 1_000_000;
export const RECEIVABLE_MAX_QUANTITY = 50;

export const RECEIVABLE_STATUSES = ["open", "partial", "overdue", "settled", "written_off"] as const;
export type ReceivableStatus = (typeof RECEIVABLE_STATUSES)[number];

export const RECEIVABLE_STATUS_LABELS: Record<ReceivableStatus, string> = {
  open: "Chưa thu",
  partial: "Thu một phần",
  overdue: "Quá hạn",
  settled: "Đã thu đủ",
  written_off: "Đã xoá nợ",
};

const VndSchema = z.number().int().min(1).max(RECEIVABLE_GRANT_MAX_VND);

/** "Mua lượt hộ": số tiền cấp do giá đơn quyết định, không nhập tay. */
export const ReceivablePurchaseSchema = z.object({
  package_id: z.string().min(1),
  quantity: z.number().int().min(1).max(RECEIVABLE_MAX_QUANTITY),
  /** Mặc định true: không tự chạy audit trước khi khách trả. */
  manual_trigger: z.boolean().optional(),
});

export const CreateReceivableSchema = z.object({
  request_key: z.uuid(),
  /** Người nợ lấy từ liên hệ của dự án này, không nhập tay. */
  case_id: z.string().min(1),
  amount_due: VndSchema,
  due_at: z.iso.datetime(),
  purchase: ReceivablePurchaseSchema.optional(),
});
export type CreateReceivableInput = z.infer<typeof CreateReceivableSchema>;

export const RecordReceivablePaymentSchema = z.object({
  gross_amount: z.number().int().min(1),
  bank_ref: z.string().trim().min(1).max(64),
  paid_at: z.iso.datetime(),
});
export type RecordReceivablePaymentInput = z.infer<typeof RecordReceivablePaymentSchema>;

export const WriteOffReceivableSchema = z.object({
  request_key: z.uuid(),
  amount: z.number().int().min(1),
  reason: z.string().trim().min(3).max(500),
});
export type WriteOffReceivableInput = z.infer<typeof WriteOffReceivableSchema>;

export const ReceivableListQuerySchema = z.object({
  status: z.enum(RECEIVABLE_STATUSES).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type ReceivableListQuery = z.infer<typeof ReceivableListQuerySchema>;

export interface AdminReceivable {
  id: string;
  code: string;
  customer_name: string;
  customer_contact: string;
  /** Null với khoản nợ tạo trước khi có snapshot liên hệ. */
  customer_phone: string | null;
  customer_email: string | null;
  case_id: string | null;
  case_code: string | null;
  order_id: string | null;
  amount_due: number;
  paid: number;
  written_off: number;
  outstanding: number;
  /** Tiền khách chuyển dư, cần hoàn lại. */
  overpaid: number;
  status: ReceivableStatus;
  review_reason: string | null;
  has_payment_link: boolean;
  due_at: string;
  created_at: string;
  /** Chỉ có khi tạo: request_key đã tồn tại và trả bản ghi cũ. */
  replayed?: boolean;
}

export interface AdminReceivableList {
  items: AdminReceivable[];
  page: number;
  page_size: number;
  total: number;
  /** Tổng còn nợ của toàn bộ khoản nợ khớp bộ lọc, và số khoản quá hạn. */
  total_outstanding: number;
  overdue_count: number;
}

export interface ReceivablePaymentLink {
  token: string;
  pay_url: string;
}

/** DTO công khai cho /pay/receivable/[token]: không tên, liên hệ, case, order hay id nội bộ. */
export interface PublicReceivable {
  code: string;
  amount_due: number;
  outstanding: number;
  status: ReceivableStatus;
  created_at: string;
  paid_at: string | null;
  bank_info: {
    bank_name: string;
    bank_short_code: string;
    account_number: string;
    account_name: string;
    transfer_content: string;
    qr_url: string;
  };
}
