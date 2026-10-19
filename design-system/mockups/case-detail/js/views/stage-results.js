// Results = one PDF per grading run. Left: scrollable run list (scales to 20+). Right: the selected PDF.
// No scores or deltas here: they only exist inside the PDF, not as stored fields.
$("#sv-results").innerHTML=`
<div id="r-data">
  <div class="rv">
    <details class="rlist fold" id="rld" open aria-label="Lịch sử chấm">
      <summary id="rl-s"></summary>
      <div class="rlh"><h2>Lịch sử chấm</h2><span class="note">${D.runs.length} lần</span></div>
      <div class="rl" id="rl"></div>
    </details>
    <section class="rdoc">
      <div class="file rfile"><div class="nm">${ic("file")}<div><div class="b" id="r-name"></div><div class="note" id="r-meta"></div></div></div>
        <div class="acts"><button class="btn quiet">Mở toàn màn hình</button><button class="btn">${ic("download")}Tải PDF</button></div></div>
      <div class="paper"><div class="pg pdfph"><p class="note" id="r-when"></p><p class="note">Vùng này hiển thị file PDF (iframe). Mockup không có file PDF thật.</p></div></div>
    </section>
  </div>
  <p class="mock">Danh sách mẫu bịa để minh hoạ. <a id="show-empty">Xem trạng thái chưa chấm lần nào</a></p>
</div>
<div id="r-empty" class="empty" hidden>
  <h2>Chưa có kết quả chấm</h2>
  <p class="note">Làm theo 3 bước để nhận kết quả:</p>
  <ol><li>Trả lời các câu hỏi ở mục Soạn thảo.</li><li>Tải tài liệu ở mục Tài liệu.</li><li>Bấm Chấm bài.</li></ol>
  <button class="btn" id="r-grade">Chấm bài</button>
  <p class="mock"><a id="show-data">Quay lại màn có kết quả</a></p>
</div>`;
function renderRun(i){const r=D.runs[i];
  $("#rl").innerHTML=D.runs.map((x,k)=>`<button class="ri${k===i?" on":""}" data-i="${k}">
    <div><div class="b">Lần ${x.n}${k===0?'<span class="chip">Mới nhất</span>':""}</div><div class="note">${x.when}</div></div></button>`).join("");
  $("#r-name").textContent=r.pdf;
  $("#r-meta").textContent="PDF · Chấm lúc "+r.when;
  $("#r-when").textContent="Lần "+r.n+" · "+r.when;
  $("#rl-s").innerHTML='<span class="fs">Lịch sử chấm<span class="note"> · Lần '+r.n+', '+r.when+'</span></span><span class="note">'+D.runs.length+' lần</span>'+ic("down");}
$("#rl").onclick=e=>{const b=e.target.closest(".ri");if(b){renderRun(+b.dataset.i);if(phone.matches){$("#rld").open=false;$("#rl-s").focus()}}};
renderRun(0);
$("#show-empty").onclick=()=>{$("#r-data").hidden=true;$("#r-empty").hidden=false};
$("#show-data").onclick=()=>{$("#r-data").hidden=false;$("#r-empty").hidden=true};
$("#r-grade").onclick=()=>{if(D.credits)openAudit();else location.search="tab=billing"};
