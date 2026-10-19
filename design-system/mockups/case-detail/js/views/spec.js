$("#v-spec").innerHTML=`
<div class="head"><div><h1>Quy ước chung</h1><p class="note">Áp dụng cho cả 5 tab.</p></div></div>
<h2>Thang chữ (4 bậc, sàn 14px)</h2>
<div class="sw"><span class="note">Tiêu đề trang · 24/500</span><span style="font-size:24px;font-weight:500">Tổng quan dự án</span></div>
<div class="sw"><span class="note">Tiêu đề mục · 18/500</span><span style="font-size:18px;font-weight:500">Hành trình</span></div>
<div class="sw"><span class="note">Thân, nhãn, nút · 16/400 hoặc 500</span><span>Đã trả lời 22/22 câu</span></div>
<div class="sw"><span class="note">Ghi chú, trạng thái · 14/400 mờ</span><span class="note">Còn thiếu 6 thông tin</span></div>
<h2 style="margin-top:40px">Trạng thái: nhãn bo tròn, nền màu nhạt, chữ đậm cùng tông (như Badge của Mantine)</h2>
<div class="sw"><span class="chip draft">Đang soạn</span><span class="chip ok">Đã có kết quả</span><span class="chip warn">Cần bổ sung</span><span class="chip lock">Sắp ra mắt</span></div>
<h2 style="margin-top:40px">Nút</h2>
<div class="sw"><button class="btn">Hành động chính (1 mỗi màn)</button><button class="btn quiet">Phụ</button><a>Liên kết</a><button class="btn" disabled>Đang khoá</button></div>
<h2 style="margin-top:40px">Bề mặt</h2>
<div class="card" style="max-width:420px"><p>Nền trang xám xanh rất nhạt (#f8fafc). Thẻ, hàng danh sách, hộp mục lục là bề mặt trắng, viền 1px #e2e8f0, bo 8px (radius md của Mantine, giống Paper withBorder trong web-1), không shadow. Chỉ menu nổi (như ⋯) và hộp thoại được có shadow. Phông là Inter Tight như web-1; mockup mở bằng file:// sẽ dùng phông hệ thống nếu máy chưa cài Inter Tight.</p></div>
<p class="note" style="margin-top:16px">Một màu nhấn (xanh #2563eb) cho nút chính và mục đang chọn. Xanh lục, vàng, đỏ chỉ dùng để báo trạng thái. Nút bo 8px như Button của Mantine. Màu cam và nút bo tròn hẳn của trang chủ chỉ dùng ở trang chủ, không dùng trong workspace.</p>`;
