// Latest 3 reports across stages, newest first (RECENT_REPORTS_LIMIT in web-1). Labels come from report.utils.ts; "bản NN" is version_no + 1.
const RECENT=[
  {stage:"thi-truong",label:"Chấm toàn bộ (vòng Thị trường)",run:MARKET_RUNS[0]},
  {stage:"thi-truong",label:"Chấm toàn bộ (vòng Thị trường)",run:MARKET_RUNS[1]},
  {stage:"y-tuong",label:"Đánh giá lại",run:RUNS[0]}
];
const CASE_CODE="NX-894046";
const versionLabel=n=>String(n).padStart(2,"0"); // taste-skill-ignore: "bản 02" is the product's own version label, not step numbering.
$("#v-overview").innerHTML=`
<div class="head"><div><h1>Tổng quan dự án</h1><p class="note" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">MentorMap <button class="chip" id="copy-code" aria-label="Sao chép mã dự án">${CASE_CODE}${ic("copy",14)}</button></p></div></div>
<div class="card">
  <h2>Việc tiếp theo: điền thông tin liên hệ</h2>
  <p class="lead">Còn thiếu họ tên, số điện thoại và email. Chúng tôi dùng để báo kết quả và gửi mã QR thanh toán.</p>
  <button class="btn" data-to="tab=settings">Điền thông tin liên hệ</button>
</div>
<div class="sec">
  <h2>Hành trình</h2>
  <div class="rows">
    <div class="row"><div><div class="name">Ý tưởng</div><div class="note">Đã trả lời 22/22 câu · 3 tài liệu</div></div><span class="chip ok">Đã có kết quả</span><button class="btn quiet" data-to="tab=journey&stage=y-tuong&view=results">Xem kết quả</button></div>
    <div class="row"><div><div class="name">Thị trường</div><div class="note">Đã trả lời 26/27 câu · 0 tài liệu</div></div><span class="chip ok">Đã có kết quả</span><button class="btn quiet" data-to="tab=journey&stage=thi-truong&view=results">Xem kết quả</button></div>
  </div>
  <p class="note" style="margin-top:8px">Sản phẩm &amp; mô hình và Gọi vốn &amp; tài chính sẽ mở sau.</p>
</div>
<div class="sec">
  <h2>Báo cáo gần đây</h2>
  <div class="rows">${RECENT.map(r=>`
    <div class="file"><div class="nm">${ic("file")}<div><div class="b">${r.label} (bản ${versionLabel(r.run.n)})</div><div class="note">${r.run.when.split(" ")[0]}</div></div></div>
    <div class="acts"><button class="btn quiet" data-to="tab=journey&stage=${r.stage}&view=results">Xem</button></div></div>`).join("")}
  </div>
</div>
<div class="sec">
  <details>
    <summary><span>Hồ sơ dự án</span> <span class="note">Còn thiếu 6 thông tin · <a data-to="tab=settings">Bổ sung</a></span>${ic("down")}</summary>
    <div class="inner">
      <dl class="kv"><dt>Tên đề tài</dt><dd>MentorMap</dd><dt>Vai trò</dt><dd>Trưởng nhóm</dd></dl>
      <p class="kvh">Ý tưởng khởi nghiệp</p>
      <dl class="kv"><dt>Lĩnh vực</dt><dd>EdTech &amp; Peer-to-Peer Learning, học tập cộng đồng</dd>
        <dt>Khách hàng mục tiêu</dt><dd>Tân sinh viên năm nhất gặp khó khăn với các môn đại cương (Toán rời rạc, Lập trình C, Tiếng Anh).</dd>
        <dt>Vấn đề cốt lõi</dt><dd>Sinh viên năm nhất dễ rớt môn đại cương, trung tâm gia sư ngoài quá đắt, học cùng bạn bè thiếu định hướng.</dd>
        <dt>Giải pháp</dt><dd>Nền tảng kết nối 1-1 giữa sinh viên năm nhất và anh chị khóa trên điểm A/A+ để kèm học theo buổi.</dd>
        <dt>Sản phẩm tối thiểu</dt><dd>Hệ thống kết nối mentor 1-1 online, đã thu hút 40 mentor khóa trên và tổ chức các buổi kèm thử nghiệm.</dd></dl>
      <p class="kvh">Đội ngũ (5 thành viên)</p>
      <dl class="kv"><dt>Thành viên 1</dt><dd>Công nghệ phần mềm, quản lý dự án</dd><dt>Thành viên 2</dt><dd>Công nghệ phần mềm, full-stack web</dd>
        <dt>Thành viên 3</dt><dd>Quản trị kinh doanh, tài chính</dd><dt>Thành viên 4</dt><dd>Sư phạm Anh, nội dung học liệu</dd>
        <dt>Thành viên 5</dt><dd>Chăm sóc sinh viên, truyền thông học thuật</dd></dl>
      <p class="kvh">Rủi ro về đội ngũ</p>
      <dl class="kv"><dt>Kỹ thuật và phát triển sản phẩm</dt><dd>Chưa có người chuyên trách.</dd>
        <dt>Vận hành và kiểm định chất lượng</dt><dd>Nhóm đã có quy trình kèm mentor, nhưng cần đo chất lượng.</dd>
        <dt>Marketing và phát triển thị trường</dt><dd>Nhóm cần người phụ trách thu hút sinh viên.</dd></dl>
    </div>
  </details>
</div>
<p class="mock">Đã bỏ: card Zalo cuối trang (sidebar đã có), 14 dòng "Chưa cập nhật". Báo cáo gần đây là dữ liệu mẫu bịa.</p>`;
$("#copy-code").onclick=e=>{
  const b=e.currentTarget,html=b.innerHTML;
  const done=t=>{b.textContent=t;setTimeout(()=>{b.innerHTML=html},1500)};
  navigator.clipboard.writeText(CASE_CODE).then(()=>done("Đã sao chép"),()=>done("Không sao chép được"));
};
