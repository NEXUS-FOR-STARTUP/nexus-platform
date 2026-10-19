// Tài liệu: grouped by category (replaces the 7-column table). Data: D.docs.
const docs=D.docs,cats=[...new Set(docs.map(d=>d[0]))];
$("#sv-files").innerHTML=`${STAGE==="thi-truong"?'<div class="alert"><b>Lưu ý quyền riêng tư</b>Nếu tải lên tệp khảo sát hoặc ghi chép phỏng vấn, vui lòng xóa hoặc ẩn các thông tin cá nhân (email, số điện thoại, tên người trả lời).</div>':""}
<div class="bar">
  <div><h2 style="margin:0">Tài liệu đã nộp (${docs.length})</h2><p class="note">PDF, DOCX, XLSX, PPTX, TXT · tối đa 5 tệp, mỗi tệp 25 MB</p></div>
  <button class="btn quiet" id="up-open">${ic("upload")}Tải tài liệu lên</button>
</div>
${!docs.length?'<div class="card"><h2>Chưa có tài liệu nào</h2><p class="note">Chưa có tài liệu nào được nộp cho giai đoạn này. Bạn có thể trả lời câu hỏi ở tab Soạn thảo hoặc tải tài liệu trực tiếp tại đây.</p></div>':""}${cats.map(c=>`<p class="gh">${c}</p><div class="rows">`+docs.filter(d=>d[0]===c).map(d=>`
  <div class="file"><div class="nm">${ic(d[1])}<div><div class="b">${d[2]}${d[4]?'<span class="chip">'+d[4]+'</span>':""}</div><div class="note">${d[3]}</div></div></div>
  <div class="acts"><button class="ib" aria-label="Tải xuống ${d[2]}">${ic("download")}</button><button class="ib" aria-label="Xoá ${d[2]}">${ic("trash")}</button></div></div>`).join("")+`</div>`).join("")}
<p class="note" style="margin-top:16px">Có thể thêm: ${D.more}.</p>
<p class="mock">Nhóm theo phân loại thay cho bảng 7 cột; mỗi tệp một dòng, tải xuống và xoá là nút icon. Tệp là dữ liệu mẫu bịa.</p>`;
$("#up-open").onclick=()=>openUpload(); // upload.js loads after this file
