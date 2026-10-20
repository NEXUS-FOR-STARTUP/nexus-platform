// Redesigned Wallet Balance Card & View Container
$("#v-wallet").innerHTML = `
<div class="head">
  <div>
    <h1>Ví của tôi</h1>
    <p class="note" style="margin-top:4px">Quản lý số dư trả trước và đối soát lịch sử giao dịch đánh giá dự án.</p>
  </div>
  <button class="btn" id="btn-topup-main" type="button">
    ${ic("plus", 16)} Nạp tiền
  </button>
</div>

<div class="balance-card">
  <div class="balance-top">
    <div class="balance-label">
      ${ic("wallet", 18)}
      <span>Số dư ví Nexus</span>
    </div>
    <span class="chip green">Đang hoạt động</span>
  </div>
  
  <div class="balance-figure">
    ${MOCK_WALLET.balance.toLocaleString("vi-VN")}<span class="unit">VND</span>
  </div>
  <p class="note" style="margin-bottom:0">Dùng để thanh toán các gói đánh giá dự án Ý tưởng (CP1) và Thị trường (CP2).</p>

  <div class="balance-meta">
    <div class="meta-item">
      <div class="lbl">Tổng tiền đã nạp</div>
      <div class="val" id="val-total-deposited">${MOCK_WALLET.totalDeposited.toLocaleString("vi-VN")} VND</div>
    </div>
    <div class="meta-item">
      <div class="lbl">Tổng tiền đã dùng</div>
      <div class="val" id="val-total-spent">${MOCK_WALLET.totalSpent.toLocaleString("vi-VN")} VND</div>
    </div>
    <div class="meta-item">
      <div class="lbl">Lượt đánh giá khả dụng</div>
      <div class="val" id="val-approx-credits">~${MOCK_WALLET.approxCredits} lượt chấm</div>
    </div>
  </div>
</div>

<div class="tabs" role="tablist">
  <button class="tab-btn on" data-view="history" role="tab" aria-selected="true" onclick="switchView('history')">
    Lịch sử giao dịch
  </button>
  <button class="tab-btn" data-view="proofs" role="tab" aria-selected="false" onclick="switchView('proofs')">
    Ảnh minh chứng
  </button>
</div>

<div class="wallet-panel on" id="panel-history"></div>
<div class="wallet-panel" id="panel-proofs" style="display:none"></div>
`;

// Sync display with panel-proofs visibility
const observer = new MutationObserver(() => {
  const isHistory = $("#panel-history").classList.contains("on");
  $("#panel-history").style.display = isHistory ? "block" : "none";
  $("#panel-proofs").style.display = isHistory ? "none" : "block";
});
observer.observe($("#panel-history"), { attributes: true, attributeFilter: ["class"] });

$("#btn-topup-main").onclick = () => openTopupModal();

window.updateBalanceUI = function() {
  const fig = $(".balance-figure");
  if (fig) fig.innerHTML = `${MOCK_WALLET.balance.toLocaleString("vi-VN")}<span class="unit">VND</span>`;
  const dep = $("#val-total-deposited");
  if (dep) dep.textContent = `${MOCK_WALLET.totalDeposited.toLocaleString("vi-VN")} VND`;
  const cred = $("#val-approx-credits");
  if (cred) {
    const approx = Math.floor(MOCK_WALLET.balance / 50000);
    cred.textContent = `~${approx} lượt chấm`;
  }
};
