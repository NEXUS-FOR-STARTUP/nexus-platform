// Expandable Transaction History View matching case-detail billing UI
let hf = "all";
let hDays = 999;
let hall = false;
const HIST_PREVIEW = 5;

const kv = (k, v) => `<dt>${k}</dt><dd>${v}</dd>`;
const code = v => `<code>${esc(v)}</code><button type="button" class="copy-btn" data-copy="${esc(v)}" title="Sao chép ${esc(v)}">${ic("copy", 14)}</button>`;

function txDetail(t) {
  const d = t.detail;
  let h = `<p class="kvh">Giao dịch</p><dl class="kv">` +
    kv("Thời gian", t.timeDetail) +
    kv("Loại giao dịch", d.typeLabel) +
    kv("Biến động số dư", (t.amount > 0 ? "+" : "") + t.amount.toLocaleString("vi-VN") + " VND") +
    kv("Số dư trước giao dịch", d.balanceBefore.toLocaleString("vi-VN") + " VND") +
    kv("Số dư sau giao dịch", d.balanceAfter.toLocaleString("vi-VN") + " VND") +
    kv("Trạng thái", t.status) +
    kv("Nguồn phát sinh", d.how) +
    kv("ID giao dịch", code(t.id)) +
    (d.ref ? kv(d.refLabel, code(d.ref)) : "") +
    `</dl>`;

  if (d.note) {
    h += `<div class="alert warn" style="margin-top:12px;padding:10px 14px"><b>Ghi chú:</b> ${esc(d.note)}</div>`;
  }

  if (d.order) {
    const o = d.order;
    h += `<p class="kvh">Đơn hàng</p><dl class="kv">` +
      kv("Mã đơn hàng", code(o.id)) +
      kv("Trạng thái đơn", o.status) +
      `</dl>` +
      `<div class="tw"><table class="items"><thead><tr><th>Dịch vụ</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>` +
      o.items.map(i => `<tr><td>${esc(i[0])}</td><td>${i[1]}</td><td>${i[2]}</td><td>${i[3]}</td></tr>`).join("") +
      `</tbody><tfoot><tr><td colspan="3">Tổng tiền</td><td>${o.total}</td></tr></tfoot></table></div>`;
  }

  if (d.pay) {
    const p = d.pay;
    h += `<p class="kvh">Thanh toán &amp; Ngân hàng</p><dl class="kv">` +
      kv("Phương thức", p.method) +
      kv("Ngân hàng thụ hưởng", p.bank) +
      kv("Số tài khoản", `${p.accountNo} (${p.accountHolder})`) +
      kv("Nội dung chuyển khoản", code(p.content)) +
      kv("Mã GD ngân hàng", code(p.bankTxId)) +
      kv("Thời điểm ghi có", p.credited) +
      kv("Cơ chế xác minh", p.verify) +
      `</dl>`;
  }

  return h;
}

function txHtml(t) {
  const isPlus = t.amount > 0;
  const amtStr = (isPlus ? "+" : "") + t.amount.toLocaleString("vi-VN") + " VND";
  return `
    <details class="tx">
      <summary class="row">
        <span class="note dt">${esc(t.time)}</span>
        <div class="tt">
          <div>${esc(t.title)}</div>
          <div class="note">${esc(t.desc)}</div>
        </div>
        <span class="amt ${isPlus ? 'plus' : 'minus'} am">${amtStr}</span>
        <span class="chip ${t.statusTone} ch">${esc(t.status)}</span>
        <span class="cv">${ic("down", 16)}</span>
      </summary>
      <div class="txd">${txDetail(t)}</div>
    </details>
  `;
}

function renderTxList() {
  const container = $("#panel-history");
  if (!container) return;

  const countFor = k => MOCK_TRANSACTIONS.filter(t => k === "all" || t.type === k).length;

  let filtered = MOCK_TRANSACTIONS.filter(t => hf === "all" || t.type === hf);
  const isNarrow = matchMedia("(max-width:820px)").matches;
  const shown = isNarrow && !hall ? filtered.slice(0, HIST_PREVIEW) : filtered;

  container.innerHTML = `
    <div class="filter-bar">
      <div class="filter-tabs" id="hseg">
        <button class="filter-tab ${hf === 'all' ? 'on' : ''}" data-type="all">Tất cả (${countFor('all')})</button>
        <button class="filter-tab ${hf === 'deposit' ? 'on' : ''}" data-type="deposit">Nạp tiền (${countFor('deposit')})</button>
        <button class="filter-tab ${hf === 'service_payment' ? 'on' : ''}" data-type="service_payment">Mua gói (${countFor('service_payment')})</button>
        <button class="filter-tab ${hf === 'refund' ? 'on' : ''}" data-type="refund">Hoàn tiền (${countFor('refund')})</button>
        <button class="filter-tab ${hf === 'adjustment' ? 'on' : ''}" data-type="adjustment">Điều chỉnh (${countFor('adjustment')})</button>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <select id="hrange" aria-label="Khoảng thời gian" style="height:36px;font-size:var(--t-note)">
          <option value="999">Tất cả thời gian</option>
          <option value="3">3 ngày qua</option>
          <option value="7">7 ngày qua</option>
        </select>
        <button class="btn quiet sm" id="btn-refresh-tx" type="button" title="Làm mới danh sách">
          ${ic("refresh", 14)} Làm mới
        </button>
      </div>
    </div>

    <div class="rows" id="hrows">
      ${filtered.length === 0 ? `
        <div style="text-align:center;padding:36px" class="note">Không có giao dịch nào phù hợp với bộ lọc.</div>
      ` : shown.map(txHtml).join('')}
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
      <span class="note" id="hcount">
        ${isNarrow ? `Hiện ${shown.length} trên ${filtered.length} giao dịch` : `${filtered.length} giao dịch`}
      </span>
      ${isNarrow && filtered.length > HIST_PREVIEW ? `
        <button class="btn quiet sm" id="hmore" type="button">
          ${hall ? 'Thu gọn' : `Xem thêm ${filtered.length - HIST_PREVIEW} giao dịch`}
        </button>
      ` : ''}
    </div>
    <p class="mock" style="margin-top:16px">Giao diện danh sách dòng đơn giản, bấm vào từng dòng để mở rộng (expand) chi tiết giao dịch, vết kiểm toán và hóa đơn thanh toán.</p>
  `;

  // Attach tab filter clicks
  $$(".filter-tab").forEach(btn => {
    btn.onclick = () => {
      hf = btn.dataset.type;
      hall = false;
      renderTxList();
    };
  });

  $("#hrange").onchange = () => {
    hall = false;
    renderTxList();
  };

  const moreBtn = $("#hmore");
  if (moreBtn) {
    moreBtn.onclick = () => {
      hall = !hall;
      renderTxList();
    };
  }

  $("#btn-refresh-tx").onclick = () => {
    const btn = $("#btn-refresh-tx");
    btn.innerHTML = `${ic("refresh", 14)} Đang tải...`;
    setTimeout(() => {
      renderTxList();
    }, 250);
  };
}

// Copy button handler inside expanded rows
document.addEventListener("click", e => {
  const b = e.target.closest("[data-copy]");
  if (!b) return;
  const text = b.dataset.copy;
  const original = b.innerHTML;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }
  b.innerHTML = `${ic("tick", 14)} Đã chép`;
  setTimeout(() => { b.innerHTML = original; }, 1500);
});

// Initial render
renderTxList();
