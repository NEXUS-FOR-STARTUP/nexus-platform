// Expandable Deposit Proofs View matching case-detail billing UI
let proofFilterStatus = "all";

function proofDetail(d) {
  const st = STATUS_CONFIG[d.status] || { label: d.status, color: "gray" };
  return `
    <p class="kvh">Yêu cầu nạp tiền &amp; Đối soát</p>
    <dl class="kv">
      <dt>Mã nạp tiền</dt><dd><code>${esc(d.id)}</code><button type="button" class="copy-btn" data-copy="${esc(d.id)}" title="Sao chép">${ic("copy", 14)}</button></dd>
      <dt>Số tiền yêu cầu</dt><dd class="amt plus">+${d.amount.toLocaleString("vi-VN")} VND</dd>
      <dt>Số tiền thực nhận</dt><dd class="amt">${d.actual_amount ? `+${d.actual_amount.toLocaleString("vi-VN")} VND` : '<span class="note">Chưa ghi có</span>'}</dd>
      <dt>Nội dung chuyển khoản</dt><dd><code>${esc(d.transfer_content)}</code><button type="button" class="copy-btn" data-copy="${esc(d.transfer_content)}" title="Sao chép">${ic("copy", 14)}</button></dd>
      <dt>Trạng thái</dt><dd><span class="chip ${st.color}">${esc(st.label)}</span></dd>
      <dt>Tệp minh chứng</dt>
      <dd>
        <span style="display:inline-flex;align-items:center;gap:6px">
          ${ic("image", 16)}
          <span>${esc(d.proof_name)}</span>
        </span>
      </dd>
      <dt>Thời gian tạo</dt><dd>${formatDate(d.created_at)}</dd>
      <dt>Thời gian xác minh</dt><dd>${d.verified_at ? formatDate(d.verified_at) : '<span class="note">Đang chờ xử lý</span>'}</dd>
    </dl>
  `;
}

function proofHtml(d) {
  const st = STATUS_CONFIG[d.status] || { label: d.status, color: "gray" };
  return `
    <details class="tx">
      <summary class="row">
        <span class="note dt">${formatDate(d.created_at).split(' ')[0]}</span>
        <div class="tt">
          <div>Yêu cầu nạp tiền ${esc(d.id)}</div>
          <div class="note">Nội dung CK: ${esc(d.transfer_content)} · ${esc(d.proof_name)}</div>
        </div>
        <span class="amt plus am">+${d.amount.toLocaleString("vi-VN")} VND</span>
        <span class="chip ${st.color} ch">${esc(st.label)}</span>
        <span class="cv">${ic("down", 16)}</span>
      </summary>
      <div class="txd">${proofDetail(d)}</div>
    </details>
  `;
}

function renderProofList() {
  const container = $("#panel-proofs");
  if (!container) return;

  const countFor = s => MOCK_DEPOSITS.filter(d => s === "all" || d.status === s).length;
  let filtered = MOCK_DEPOSITS.filter(d => proofFilterStatus === "all" || d.status === proofFilterStatus);

  container.innerHTML = `
    <div class="filter-bar">
      <div class="filter-tabs">
        <button class="filter-tab ${proofFilterStatus === 'all' ? 'on' : ''}" data-status="all">Tất cả (${countFor('all')})</button>
        <button class="filter-tab ${proofFilterStatus === 'verified' ? 'on' : ''}" data-status="verified">Đã vào ví (${countFor('verified')})</button>
        <button class="filter-tab ${proofFilterStatus === 'pending' ? 'on' : ''}" data-status="pending">Chờ xác minh (${countFor('pending')})</button>
        <button class="filter-tab ${proofFilterStatus === 'amount_mismatch' ? 'on' : ''}" data-status="amount_mismatch">Sai số tiền (${countFor('amount_mismatch')})</button>
      </div>
      <button class="btn quiet sm" id="btn-refresh-proofs" type="button" title="Làm mới danh sách">
        ${ic("refresh", 14)} Làm mới
      </button>
    </div>

    <div class="rows">
      ${filtered.length === 0 ? `
        <div style="text-align:center;padding:36px" class="note">Không có ảnh minh chứng nào phù hợp với bộ lọc.</div>
      ` : filtered.map(proofHtml).join('')}
    </div>

    <div style="margin-top:12px">
      <span class="note">Hiển thị ${filtered.length} trên tổng số ${MOCK_DEPOSITS.length} yêu cầu nạp tiền</span>
    </div>
    <p class="mock" style="margin-top:16px">Bấm vào từng dòng để mở rộng thông tin chi tiết biên lai chuyển khoản và đối soát ngân hàng.</p>
  `;

  $$("#panel-proofs .filter-tab").forEach(btn => {
    btn.onclick = () => {
      proofFilterStatus = btn.dataset.status;
      renderProofList();
    };
  });

  $("#btn-refresh-proofs").onclick = () => {
    const btn = $("#btn-refresh-proofs");
    btn.innerHTML = `${ic("refresh", 14)} Đang tải...`;
    setTimeout(() => {
      renderProofList();
    }, 250);
  };
}

renderProofList();
