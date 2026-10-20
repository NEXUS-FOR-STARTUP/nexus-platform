// Spec, Sessions (4 mock devices), and Notifications (Switch toggles)
$("#v-password").innerHTML = `
<div class="head">
  <h1>Đổi mật khẩu</h1>
  <p class="note">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản sinh viên.</p>
</div>
<div class="col form-col">
  <div class="card">
    <div class="field">
      <label for="pwd-cur">Mật khẩu hiện tại</label>
      <input id="pwd-cur" type="text" placeholder="••••••••" disabled>
    </div>
    <div class="field">
      <label for="pwd-new">Mật khẩu mới</label>
      <input id="pwd-new" type="text" placeholder="Tối thiểu 8 ký tự" disabled>
    </div>
    <div class="field">
      <label for="pwd-cfm">Xác nhận mật khẩu mới</label>
      <input id="pwd-cfm" type="text" placeholder="Nhập lại mật khẩu mới" disabled>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:24px">
      <button class="btn" disabled>Đổi mật khẩu</button>
    </div>
  </div>
  <p class="mock">Màn hình phụ trong cụm Cài đặt. Mockup tập trung vào màn Cài đặt thông tin cá nhân (Profile).</p>
</div>
`;

// Render 4 mock sessions
let activeSessions = [...MOCK_SESSIONS];

function renderSessions() {
  const container = $("#session-list-container");
  if (!container) return;

  container.innerHTML = activeSessions.map(s => `
    <div class="session-item ${s.isCurrent ? 'current' : ''}" id="sess-item-${s.id}">
      <div class="session-info">
        <div class="session-icon">
          ${ic(s.type, 20)}
        </div>
        <div>
          <div style="font-weight:500;display:flex;align-items:center;gap:8px">
            <span>${esc(s.device)}</span>
            ${s.isCurrent ? '<span class="chip ok">Thiết bị này</span>' : ''}
          </div>
          <p class="note" style="margin-top:2px">
            ${esc(s.location)} · IP: ${esc(s.ip)} · ${esc(s.activeText)}
          </p>
        </div>
      </div>
      <div>
        ${s.isCurrent
          ? '<span style="font-size:var(--t-note);color:var(--ok);font-weight:500">Đang hoạt động</span>'
          : `<button class="btn quiet sm" onclick="logoutSession('${s.id}')" title="Đăng xuất khỏi thiết bị này">
               ${ic("logout", 14)} Đăng xuất
             </button>`
        }
      </div>
    </div>
  `).join('');
}

$("#v-sessions").innerHTML = `
<div class="head">
  <h1>Thiết bị &amp; Phiên đăng nhập</h1>
  <p class="note">Quản lý và đối soát các thiết bị đã đăng nhập vào tài khoản của bạn (4 phiên mẫu).</p>
</div>
<div id="sess-notice" role="status" hidden></div>
<div class="col" style="max-width:720px">
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div>
        <h2>Phiên đang hoạt động</h2>
        <p class="note">Nếu phát hiện thiết bị lạ, hãy đăng xuất ngay và đổi mật khẩu.</p>
      </div>
      <button class="btn quiet" id="btn-logout-others" type="button">
        ${ic("logout", 16)} Đăng xuất khỏi thiết bị khác
      </button>
    </div>
    <div class="session-list" id="session-list-container"></div>
  </div>
</div>
`;

window.logoutSession = (id) => {
  activeSessions = activeSessions.filter(s => s.id !== id);
  renderSessions();
  const sn = $("#sess-notice");
  if (sn) {
    sn.className = "alert ok";
    sn.innerHTML = "<div><b>Thành công</b><span>Đã đăng xuất phiên đăng nhập trên thiết bị đã chọn.</span></div>";
    sn.hidden = false;
  }
};

$("#btn-logout-others").onclick = () => {
  activeSessions = activeSessions.filter(s => s.isCurrent);
  renderSessions();
  const sn = $("#sess-notice");
  if (sn) {
    sn.className = "alert ok";
    sn.innerHTML = "<div><b>Thành công</b><span>Đã đăng xuất khỏi tất cả 3 thiết bị khác. Chỉ giữ lại phiên hiện tại.</span></div>";
    sn.hidden = false;
  }
};

renderSessions();

// Render Notifications with Toggle Switches (No checkboxes)
let activeNotifs = [...MOCK_NOTIFICATIONS];

function renderNotifications() {
  const container = $("#notif-list-container");
  if (!container) return;

  container.innerHTML = activeNotifs.map(n => `
    <div class="notif-row">
      <div>
        <div style="font-weight:500;font-size:var(--t-body)">${esc(n.title)}</div>
        <p class="note" style="margin-top:2px">${esc(n.desc)}</p>
      </div>
      <button class="switch" role="switch" aria-checked="${n.enabled ? 'true' : 'false'}" aria-label="${esc(n.title)}" onclick="toggleNotif('${n.id}')" onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();toggleNotif('${n.id}')}">
        <span class="thumb"></span>
      </button>
    </div>
  `).join('');
}

$("#v-notifications").innerHTML = `
<div class="head">
  <h1>Cài đặt thông báo</h1>
  <p class="note">Tùy chọn nhận thông báo kết quả phản biện và biến động tài khoản qua công tắc gạt (switch).</p>
</div>
<div id="notif-notice" role="status" hidden></div>
<div class="col" style="max-width:720px">
  <div class="card">
    <div class="notif-list" id="notif-list-container"></div>
  </div>
</div>
`;

window.toggleNotif = (id) => {
  const item = activeNotifs.find(n => n.id === id);
  if (!item) return;
  item.enabled = !item.enabled;
  renderNotifications();
  const nn = $("#notif-notice");
  if (nn) {
    nn.className = "alert ok";
    nn.innerHTML = `<div><b>Đã cập nhật</b><span>Tùy chọn "${esc(item.title)}" đã được ${item.enabled ? 'bật' : 'tắt'}.</span></div>`;
    nn.hidden = false;
  }
};

renderNotifications();

// Spec View
$("#v-spec").innerHTML = `
<div class="head">
  <h1>Quy ước giao diện (Design Spec)</h1>
  <p class="note">Thang đo, màu sắc, thành phần và quy tắc thiết kế áp dụng cho trang Cài đặt thông tin cá nhân.</p>
</div>

<div class="col">
  <div class="card">
    <h2>1. Thang chữ (Typography)</h2>
    <p class="note" style="margin-bottom:16px">Tối đa 4 bậc cỡ chữ, 2 mức độ đậm (400 thường, 500 vừa). Không sử dụng chữ dưới 14px.</p>
    <table class="spec-table">
      <thead>
        <tr><th>Cấp bậc</th><th>Cỡ chữ / Dòng</th><th>Độ đậm</th><th>Mục đích sử dụng</th></tr>
      </thead>
      <tbody>
        <tr><td>Tiêu đề trang (h1)</td><td>24px / 1.25</td><td>500</td><td>Tên trang Cài đặt</td></tr>
        <tr><td>Tiêu đề mục (h2)</td><td>18px / 1.3</td><td>500</td><td>Tên thẻ nhóm thông tin</td></tr>
        <tr><td>Thân văn bản (body)</td><td>16px / 1.5</td><td>400 / 500</td><td>Nhãn trường, nội dung nhập liệu, nút bấm</td></tr>
        <tr><td>Ghi chú (note)</td><td>14px / 1.4</td><td>400</td><td>Mô tả trường, thông báo, dòng cảnh báo</td></tr>
      </tbody>
    </table>

    <h2 style="margin-top:32px">2. Bảng màu &amp; Bề mặt (Colors &amp; Surfaces)</h2>
    <div class="spec-grid">
      <div>
        <div class="swatch" style="background:#f8fafc"></div>
        <div style="font-weight:500">Nền trang (--page)</div>
        <div class="note">#f8fafc (Slate 50)</div>
      </div>
      <div>
        <div class="swatch" style="background:#ffffff"></div>
        <div style="font-weight:500">Bề mặt thẻ (--surface)</div>
        <div class="note">#ffffff viền 1px #e2e8f0</div>
      </div>
      <div>
        <div class="swatch" style="background:#2563eb"></div>
        <div style="font-weight:500">Nhấn thương hiệu (--brand)</div>
        <div class="note">#2563eb (Blue 600)</div>
      </div>
      <div>
        <div class="swatch" style="background:#fee2e2"></div>
        <div style="font-weight:500">Vùng nguy hiểm (--err-soft)</div>
        <div class="note">#fee2e2 viền đỏ #ef4444</div>
      </div>
    </div>

    <h2 style="margin-top:32px">3. Nguyên tắc thiết kế (House Rules)</h2>
    <table class="spec-table">
      <thead>
        <tr><th>Quy tắc</th><th>Áp dụng trong trang Profile &amp; Settings</th></tr>
      </thead>
      <tbody>
        <tr><td>Không gradient</td><td>Thẻ phẳng trắng có viền, avatar nền màu nhạt thuần túy.</td></tr>
        <tr><td>Không đổ bóng khi nghỉ</td><td>Chỉ modal xác nhận xóa tài khoản mới có độ sâu nổi vì là lớp đè.</td></tr>
        <tr><td>Công tắc gạt (Switch)</td><td>Dùng switch thay vì checkbox cho tùy chọn bật/tắt thông báo.</td></tr>
        <tr><td>Đối soát phiên (Sessions)</td><td>4 phiên mẫu có icon thiết bị, địa điểm, IP và nút đăng xuất riêng.</td></tr>
        <tr><td>Xác nhận 2 bước an toàn</td><td>Xóa tài khoản yêu cầu gõ đúng "XOA" hoặc "XÓA" mới kích hoạt nút xóa.</td></tr>
      </tbody>
    </table>
  </div>
</div>
`;
