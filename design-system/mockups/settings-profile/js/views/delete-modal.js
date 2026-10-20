// Delete Account Modal implementation matching DeleteAccountModal.tsx
const deleteModalEl = document.createElement("div");
deleteModalEl.id = "delete-modal";
deleteModalEl.className = "modal-scrim";
deleteModalEl.hidden = true;
deleteModalEl.innerHTML = `
<div class="modal" role="dialog" aria-labelledby="del-modal-title" aria-modal="true">
  <div class="modal-head">
    <div style="display:flex;align-items:center;gap:8px;font-weight:500;color:var(--err)" id="del-modal-title">
      ${ic("alert", 18)} Xác nhận xóa tài khoản
    </div>
    <button class="ib" id="btn-close-del-modal" aria-label="Đóng">${ic("x", 16)}</button>
  </div>
  <div class="modal-body">
    <p class="note" style="margin-bottom:16px;line-height:1.6">
      Bạn có chắc chắn muốn xóa tài khoản này không? Toàn bộ phiên đăng nhập sẽ bị hủy và thông tin tài khoản sẽ được ẩn danh hóa. Hành động này không thể hoàn tác.
    </p>
    <div class="field" style="margin-bottom:0">
      <label for="del-confirm-input">
        Nhập <strong>XOA</strong> hoặc <strong>XÓA</strong> để xác nhận:
      </label>
      <input id="del-confirm-input" type="text" placeholder="Nhập XOA hoặc XÓA" autocomplete="off">
    </div>
  </div>
  <div class="modal-foot">
    <button class="btn quiet" id="btn-cancel-delete" type="button">Hủy</button>
    <button class="btn danger" id="btn-confirm-delete" type="button" disabled>
      Xác nhận xóa tài khoản
    </button>
  </div>
</div>
`;
document.body.appendChild(deleteModalEl);

function openDeleteModal() {
  deleteModalEl.hidden = false;
  const input = $("#del-confirm-input");
  input.value = "";
  $("#btn-confirm-delete").disabled = true;
  input.focus();
}

function closeDeleteModal() {
  deleteModalEl.hidden = true;
}

$("#btn-close-del-modal").onclick = closeDeleteModal;
$("#btn-cancel-delete").onclick = closeDeleteModal;

deleteModalEl.onclick = (e) => {
  if (e.target === deleteModalEl) closeDeleteModal();
};

$("#del-confirm-input").addEventListener("input", (e) => {
  const text = e.target.value.trim().toUpperCase();
  const isValid = ["XOA", "XÓA"].includes(text);
  $("#btn-confirm-delete").disabled = !isValid;
});

$("#btn-confirm-delete").onclick = () => {
  closeDeleteModal();
  showProfileNotice("bad", "Tài khoản đã được yêu cầu xóa", "Đã gửi yêu cầu xóa tài khoản (mô phỏng). Trong hệ thống thật, bạn sẽ được đăng xuất và chuyển về trang đăng nhập.");
};
