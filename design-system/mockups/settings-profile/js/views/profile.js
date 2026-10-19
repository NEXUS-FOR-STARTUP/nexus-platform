// Profile Information Form View matching apps/web-1/app/dashboard/settings/profile
let currentUser = { ...MOCK_USER };

function renderAvatar() {
  const av = $("#user-avatar");
  if (!av) return;
  if (currentUser.image) {
    av.innerHTML = `<img src="${esc(currentUser.image)}" alt="${esc(currentUser.name)}">`;
  } else {
    const initials = (currentUser.name || "U").substring(0, 2).toUpperCase();
    av.textContent = initials;
  }
}

function showProfileNotice(kind, title, text) {
  const n = $("#p-notice");
  if (!n) return;
  n.className = "alert " + kind;
  n.innerHTML = `<div><b>${esc(title)}</b><span>${esc(text)}</span></div>`;
  n.hidden = false;
}

$("#v-profile").innerHTML = `
<div class="head">
  <h1>Cài đặt</h1>
  <p class="note">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
</div>

<div id="p-notice" role="status" hidden></div>

<div class="col form-col">
  <div class="card">
    <h2>Thông tin cơ bản</h2>
    <p class="note" style="margin-bottom:20px">Thông tin hiển thị trên hệ thống và trong các báo cáo phản biện.</p>

    <div class="avatar-row">
      <div class="avatar" id="user-avatar" aria-label="Ảnh đại diện"></div>
      <div class="avatar-actions">
        <button class="btn quiet" id="btn-change-avatar" type="button">
          ${ic("image", 16)} Đổi ảnh
        </button>
        <input type="file" id="avatar-input" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden>
        <span class="note">Dung lượng tối đa 2MB (.jpg, .png, .webp)</span>
      </div>
    </div>

    <form id="profile-form" novalidate>
      <div class="field">
        <label for="input-name">Tên hiển thị <span class="req">*</span></label>
        <input id="input-name" name="name" type="text" value="${esc(currentUser.name)}" placeholder="Nhập tên hiển thị" aria-required="true" aria-describedby="err-name">
        <p class="ferr" id="err-name" hidden></p>
      </div>

      <div class="field">
        <label for="input-email">
          Email đăng nhập
          <span class="note" style="display:inline-flex;align-items:center;gap:4px;margin-left:4px" title="Email dùng để đăng nhập, không thể thay đổi.">
            ${ic("info", 14)} Không thể thay đổi
          </span>
        </label>
        <input id="input-email" name="email" type="email" value="${esc(currentUser.email)}" disabled aria-disabled="true">
      </div>

      <div style="display:flex;justify-content:flex-end;margin-top:24px">
        <button class="btn" id="btn-save-profile" type="submit" disabled>
          Lưu thay đổi
        </button>
      </div>
    </form>
  </div>

  <div class="danger-box">
    <div class="danger-head">
      ${ic("alert", 18)} Vùng nguy hiểm
    </div>
    <p class="note" style="margin-bottom:16px">Xóa tài khoản của bạn và toàn bộ thông tin cá nhân. Hành động này không thể hoàn tác.</p>
    <button class="btn danger-quiet" id="btn-open-delete" type="button">
      ${ic("trash", 16)} Xóa tài khoản
    </button>
  </div>
</div>
`;

// Initial avatar render
renderAvatar();

// Avatar change interaction
const avatarInput = $("#avatar-input");
const btnChangeAvatar = $("#btn-change-avatar");
const btnSave = $("#btn-save-profile");
const nameInput = $("#input-name");
const errName = $("#err-name");

btnChangeAvatar.onclick = () => avatarInput.click();

avatarInput.onchange = (e) => {
  const file = e.target.files?.[0];
  avatarInput.value = "";
  if (!file) return;

  if (file.size > AVATAR_CONFIG.maxSizeBytes) {
    showProfileNotice("bad", "Tệp quá lớn", "Dung lượng ảnh vượt quá 2MB. Vui lòng chọn tệp nhỏ hơn.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    currentUser.image = ev.target?.result;
    renderAvatar();
    btnSave.disabled = false;
    showProfileNotice("info", "Đã chọn ảnh mới", "Bấm 'Lưu thay đổi' để cập nhật ảnh đại diện vào hồ sơ.");
  };
  reader.readAsDataURL(file);
};

nameInput.addEventListener("input", () => {
  btnSave.disabled = false;
  errName.hidden = true;
  nameInput.setAttribute("aria-invalid", "false");
});

$("#profile-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const val = nameInput.value.trim();
  if (!val) {
    errName.textContent = "Tên hiển thị không được để trống.";
    errName.hidden = false;
    nameInput.setAttribute("aria-invalid", "true");
    nameInput.focus();
    return;
  }

  currentUser.name = val;
  renderAvatar();
  btnSave.disabled = true;
  showProfileNotice("ok", "Thành công", "Đã cập nhật thông tin tài khoản thành công.");
});

$("#btn-open-delete").onclick = () => openDeleteModal();
