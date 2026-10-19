// Wallet Design Spec View
$("#v-spec").innerHTML = `
<div class="head">
  <div>
    <h1>Quy ước giao diện Ví (Design Spec)</h1>
    <p class="note" style="margin-top:4px">Hệ thống token, bảng màu, thang chữ và nguyên tắc thiết kế tối giản áp dụng cho trang Ví &amp; Giao dịch.</p>
  </div>
</div>

<div class="card">
  <h2>1. Thang chữ &amp; Số liệu bảng (Typography &amp; Tabular)</h2>
  <p class="note" style="margin-bottom:16px">Tất cả số tiền VND bắt buộc dùng font-variant-numeric: tabular-nums để thẳng hàng theo cột.</p>
  <table class="tbl" style="margin-bottom:28px">
    <thead>
      <tr><th>Cấp bậc</th><th>Cỡ chữ / Dòng</th><th>Độ đậm</th><th>Mục đích sử dụng</th></tr>
    </thead>
    <tbody>
      <tr><td>Số dư chính (hero)</td><td>36px / 1.15</td><td>500 (tabular-nums)</td><td>Số dư khả dụng trong thẻ ví</td></tr>
      <tr><td>Tiêu đề trang (h1)</td><td>24px / 1.25</td><td>500</td><td>Tiêu đề Ví của tôi</td></tr>
      <tr><td>Tiêu đề mục (h2)</td><td>18px / 1.3</td><td>500</td><td>Tiêu đề nhóm chức năng / modal</td></tr>
      <tr><td>Thân chữ &amp; Số tiền GD</td><td>16px / 1.5</td><td>400 / 500</td><td>Biến động tiền, số dư sau GD, mô tả</td></tr>
      <tr><td>Ghi chú &amp; Nhãn cột</td><td>14px / 1.4</td><td>400 / 500</td><td>Tiêu đề cột bảng, chip trạng thái, mã ID</td></tr>
    </tbody>
  </table>

  <h2>2. Bảng phân loại giao dịch (Transaction Types)</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0 28px">
    <div style="background:var(--surface-2);border-radius:6px;padding:12px 14px">
      <span class="chip green" style="margin-bottom:6px">Nạp tiền</span>
      <div class="note">Cộng số dư qua VietQR (amount > 0)</div>
    </div>
    <div style="background:var(--surface-2);border-radius:6px;padding:12px 14px">
      <span class="chip red" style="margin-bottom:6px">Trừ ví</span>
      <div class="note">Khấu trừ số dư thanh toán (amount &lt; 0)</div>
    </div>
    <div style="background:var(--surface-2);border-radius:6px;padding:12px 14px">
      <span class="chip blue" style="margin-bottom:6px">Hoàn tiền</span>
      <div class="note">Hoàn credit do lỗi hệ thống worker</div>
    </div>
    <div style="background:var(--surface-2);border-radius:6px;padding:12px 14px">
      <span class="chip orange" style="margin-bottom:6px">Mua gói đánh giá</span>
      <div class="note">Chi trả cho các lượt phản biện CP1/CP2</div>
    </div>
  </div>
  <h2>3. Quyết định loại bỏ trang trí thừa (House Rules)</h2>
  <table class="tbl">
    <thead>
      <tr><th>Thành phần cũ trong web-1</th><th>Đề xuất mới trong Mockup</th><th>Lý do thiết kế</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Bảng Table cố định nhiều cột khó xem trên điện thoại</td>
        <td>Dòng details.tx đơn giản, bấm để mở rộng (expand/collapse) tại chỗ</td>
        <td>Theo đúng chuẩn case-detail/billing: dễ quét mắt, chi tiết kiểm toán xem ngay tại chỗ.</td>
      </tr>
      <tr>
        <td>Tabs dạng pills khối xám tròn</td>
        <td>Tabs kiểu chữ phẳng có thanh gạch chân xanh dày 3px</td>
        <td>Đồng bộ với tab Hành trình dự án và chuẩn Mantine/Nexus Type A.</td>
      </tr>
      <tr>
        <td>Nội dung giao dịch bị lặp chuỗi tiền "(+100.000 VND)"</td>
        <td>Lọc sạch chuỗi regex, chỉ hiện mô tả dịch vụ</td>
        <td>Cột "Số dư biến động" đã thể hiện rõ số tiền và màu sắc (+ xanh, - đỏ).</td>
      </tr>
      <tr>
        <td>Không xem được chi tiết giao dịch trừ ví</td>
        <td>Mở rộng chi tiết xem toàn bộ vết kiểm toán (audit trail) ngay tại chỗ</td>
        <td>Minh bạch số dư trước / sau, mã đơn hàng và thời gian đến từng giây mà không cần popup rời rạc.</td>
      </tr>
    </tbody>
  </table>
</div>
`;
