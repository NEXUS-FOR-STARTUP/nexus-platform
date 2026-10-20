// Mock deposit proofs list matching Deposit interface
const MOCK_DEPOSITS = [
  {
    id: "dep_884920",
    amount: 100000,
    actual_amount: 100000,
    transfer_content: "CRTOPUP884920",
    status: "verified",
    proof_url: "https://example.com/receipt-884920.jpg",
    proof_name: "bien_lai_mb_100k.jpg",
    created_at: "2026-10-18T14:15:00Z",
    verified_at: "2026-10-18T14:22:10Z"
  },
  {
    id: "dep_820194",
    amount: 79000,
    actual_amount: 0,
    transfer_content: "CRTOPUP820194",
    status: "pending",
    proof_url: "https://example.com/receipt-820194.png",
    proof_name: "chuyen_khoan_vietqr.png",
    created_at: "2026-10-17T20:45:10Z",
    verified_at: null
  },
  {
    id: "dep_771923",
    amount: 100000,
    actual_amount: 100000,
    transfer_content: "CRTOPUP771923",
    status: "verified",
    proof_url: "https://example.com/receipt-771923.jpg",
    proof_name: "minh_chung_vcb.jpg",
    created_at: "2026-10-01T08:20:00Z",
    verified_at: "2026-10-01T08:30:15Z"
  },
  {
    id: "dep_650112",
    amount: 50000,
    actual_amount: 30000,
    transfer_content: "CRTOPUP650112",
    status: "amount_mismatch",
    proof_url: "https://example.com/receipt-650112.jpg",
    proof_name: "chuyen_thieu_tien.jpg",
    created_at: "2026-09-25T15:10:00Z",
    verified_at: null
  }
];
