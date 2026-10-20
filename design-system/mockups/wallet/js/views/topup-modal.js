// Topup Modal & VietQR Payment simulation matching WalletTopupModal
const topupModalEl = document.createElement("div");
topupModalEl.id = "topup-modal";
topupModalEl.className = "modal-scrim";
topupModalEl.hidden = true;

topupModalEl.innerHTML = `
<div class="modal" role="dialog" aria-labelledby="topup-title" aria-modal="true">
  <div class="modal-head">
    <div style="font-weight:500;font-size:var(--t-section)" id="topup-title">
      Nạp tiền vào ví Nexus
    </div>
    <button class="ib" id="btn-close-topup" aria-label="Đóng">${ic("x", 16)}</button>
  </div>
  <div class="modal-body" id="topup-body-step1">
    <div class="field">
      <label for="topup-amount-input">Số tiền cần nạp (VND) <span style="color:var(--err)">*</span></label>
      <input id="topup-amount-input" type="number" min="2000" step="1000" value="50000" placeholder="50000">
      <p class="note" style="margin-top:6px">Tối thiểu 2.000 VND · Gợi ý nạp 79.000 VND để mua gói 2 lượt đánh giá dự án.</p>
    </div>

    <div style="margin-bottom:12px">
      <span class="note" style="font-weight:500">Mức nạp gợi ý:</span>
      <div class="preset-grid">
        <button class="preset-btn" data-amt="50000" type="button">50.000đ</button>
        <button class="preset-btn on" data-amt="79000" type="button">79.000đ</button>
        <button class="preset-btn" data-amt="100000" type="button">100.000đ</button>
        <button class="preset-btn" data-amt="200000" type="button">200.000đ</button>
      </div>
    </div>
  </div>

  <div class="modal-body" id="topup-body-step2" style="display:none">
    <div style="text-align:center;margin-bottom:16px">
      <div class="chip green" style="margin-bottom:8px">Đã tạo mã nạp thành công</div>
      <p class="note">Quét mã VietQR hoặc chuyển khoản theo thông tin dưới đây:</p>
    </div>

    <div class="qr-box">
      <div class="qr-svg">
        <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--ink)">
          <rect width="6" height="6" x="2" y="2" rx="1"/>
          <rect width="6" height="6" x="16" y="2" rx="1"/>
          <rect width="6" height="6" x="2" y="16" rx="1"/>
          <path d="M5 5h.01M19 5h.01M5 19h.01"/>
          <path d="M12 2v4M12 9v4M12 16v6M2 12h7M16 12h6M16 16h2v2h-2zM20 20h2v2h-2z"/>
        </svg>
      </div>
      <div class="kv-row"><span class="k">Ngân hàng:</span><span class="v">MB Bank (Quân Đội)</span></div>
      <div class="kv-row"><span class="k">Số tài khoản:</span><span class="v">0987654321</span></div>
      <div class="kv-row"><span class="k">Chủ tài khoản:</span><span class="v">CONG TY CP NEXUS PLATFORM</span></div>
      <div class="kv-row"><span class="k">Số tiền:</span><span class="v amt plus" id="qr-amount-text">79.000 VND</span></div>
      <div class="kv-row">
        <span class="k">Nội dung CK:</span>
        <span class="v" style="color:var(--brand)">
          <span id="qr-memo-text">CRTOPUP891244</span>
          <button class="copy-btn" id="btn-copy-memo" title="Sao chép nội dung">${ic("copy", 12)}</button>
        </span>
      </div>
    </div>
    <div class="alert warn" style="margin-top:14px;padding:10px 12px;font-size:13px">
      <b>Đề xuất thử nghiệm (Unvalidated proposal):</b>
      <span>Quy trình thật trong web-1 chuyển hướng sang /dashboard/payment?pid=... để quét VietQR. Mockup hiển thị trực tiếp trong modal để kiểm thử UX tại chỗ.</span>
    </div>
  </div>
  <div class="modal-foot">
    <button class="btn quiet" id="btn-cancel-topup" type="button">Đóng</button>
    <button class="btn" id="btn-submit-topup" type="button">Tạo mã nạp tiền</button>
    <button class="btn" id="btn-done-topup" type="button" style="display:none">Tôi đã chuyển tiền</button>
  </div>
</div>
`;
document.body.appendChild(topupModalEl);

function openTopupModal(initAmt) {
  topupModalEl.hidden = false;
  $("#topup-body-step1").style.display = "block";
  $("#topup-body-step2").style.display = "none";
  $("#btn-submit-topup").style.display = "inline-flex";
  $("#btn-done-topup").style.display = "none";

  const input = $("#topup-amount-input");
  const amt = initAmt || 79000;
  input.value = amt;
  updatePresetActive(amt);
  input.focus();
}

function closeTopupModal() {
  topupModalEl.hidden = true;
}

function updatePresetActive(amt) {
  $$(".preset-btn").forEach(b => {
    const isMatch = parseInt(b.dataset.amt, 10) === amt;
    b.classList.toggle("on", isMatch);
  });
}

$("#btn-close-topup").onclick = closeTopupModal;
$("#btn-cancel-topup").onclick = closeTopupModal;

topupModalEl.onclick = (e) => {
  if (e.target === topupModalEl) closeTopupModal();
};

$$(".preset-btn").forEach(b => {
  b.onclick = () => {
    const val = parseInt(b.dataset.amt, 10);
    $("#topup-amount-input").value = val;
    updatePresetActive(val);
  };
});

$("#topup-amount-input").addEventListener("input", (e) => {
  const val = parseInt(e.target.value, 10) || 0;
  updatePresetActive(val);
  $("#btn-submit-topup").disabled = val < 2000;
});

$("#btn-submit-topup").onclick = () => {
  const val = parseInt($("#topup-amount-input").value, 10) || 0;
  if (val < 2000) return;

  const memo = "CRTOPUP" + Math.floor(100000 + Math.random() * 900000);
  $("#qr-amount-text").textContent = val.toLocaleString("vi-VN") + " VND";
  $("#qr-memo-text").textContent = memo;

  $("#topup-body-step1").style.display = "none";
  $("#topup-body-step2").style.display = "block";
  $("#btn-submit-topup").style.display = "none";
  $("#btn-done-topup").style.display = "inline-flex";
};

$("#btn-copy-memo").onclick = () => {
  const memo = $("#qr-memo-text").textContent;
  copyText(memo);
};

$("#btn-done-topup").onclick = () => {
  const val = parseInt($("#topup-amount-input").value, 10) || 0;
  const now = new Date();
  const dStr = now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const tStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const tDetStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const depId = "DEP-" + Math.floor(100000 + Math.random() * 900000);
  const memo = $("#qr-memo-text").textContent || "CRTOPUP891244";

  const newTx = {
    id: "tx_" + Date.now().toString().slice(-5),
    time: `${dStr} ${tStr}`,
    timeDetail: `${dStr} ${tDetStr}`,
    title: "Nạp tiền vào ví",
    desc: "Chuyển khoản VietQR · Khớp lệnh tự động",
    type: "deposit",
    amount: val,
    status: "Thành công",
    statusTone: "green",
    detail: {
      typeLabel: "Nạp tiền vào ví",
      how: "Chuyển khoản VietQR qua tài khoản ngân hàng",
      balanceBefore: MOCK_WALLET.balance,
      balanceAfter: MOCK_WALLET.balance + val,
      refLabel: "Mã yêu cầu nạp",
      ref: depId,
      pay: {
        method: "VietQR (SePay)",
        bank: "MB Bank (Ngân hàng Quân Đội)",
        accountNo: "0987654321",
        accountHolder: "CONG TY CP NEXUS PLATFORM",
        content: memo,
        bankTxId: "FT" + Date.now().toString().slice(-8),
        credited: `${dStr} ${tDetStr}`,
        verify: "Tự động (khớp nội dung chuyển khoản)"
      }
    }
  };
  MOCK_WALLET.balance += val;
  MOCK_WALLET.totalDeposited += val;
  MOCK_TRANSACTIONS.unshift(newTx);

  closeTopupModal();
  if (typeof window.updateBalanceUI === "function") window.updateBalanceUI();
  if (typeof renderTxList === "function") renderTxList();
  alert(`Nạp tiền thành công! Đã cộng ${val.toLocaleString("vi-VN")} VND vào ví Nexus.`);
};
