// Journey = stage list + stage detail shell. The three tabs are filled by stage-*.js.
$("#v-journey").innerHTML=`
<div id="j-list">
  <div class="head"><div><h1>Hành trình</h1><p class="note">4 giai đoạn từ ý tưởng đến gọi vốn.</p></div></div>
  <div class="rows">
    <div class="row"><div><div class="name">Ý tưởng</div><div class="note">Làm rõ ý tưởng, khách hàng và giá trị cốt lõi · 22/22 câu · 3 tài liệu · còn 2 lượt chấm</div></div><span class="chip ok">Đã có kết quả</span><button class="btn quiet" data-to="tab=journey&stage=y-tuong&view=results">Xem kết quả</button></div>
    <div class="row"><div><div class="name">Thị trường</div><div class="note">Phân tích thị trường, đối thủ và xác thực nhu cầu · ${MARKET_COUNT[0]}/${MARKET_COUNT[1]} câu · hết lượt chấm</div></div><span class="chip ok">Đã có kết quả</span><button class="btn quiet" data-to="tab=journey&stage=thi-truong&view=results">Xem kết quả</button></div>
    <div class="row locked"><div><div class="name">${ic("lock",16)} Sản phẩm &amp; mô hình</div><div class="note">Mở sau khi hoàn thành các giai đoạn trước.</div></div><span class="chip lock">Sắp ra mắt</span><span></span></div>
    <div class="row locked"><div><div class="name">${ic("lock",16)} Gọi vốn &amp; tài chính</div><div class="note">Mở sau khi hoàn thành các giai đoạn trước.</div></div><span class="chip lock">Sắp ra mắt</span><span></span></div>
  </div>
  <p class="mock" id="j-nodetail" hidden>Giai đoạn này chưa mở nên chưa có trang chi tiết.</p>
  <p class="mock">Danh sách chỉ có nút phụ vì không có hành động cấp màn. Nút chính nằm ở trang chi tiết giai đoạn. Giai đoạn khoá có thể gộp thành 1 dòng như ở Tổng quan.</p>
</div>
<div id="j-stage" hidden>
  <p class="crumb"><a data-to="tab=journey">Hành trình</a> / <span id="j-name"></span></p>
  <div class="head">
    <div><h1 id="j-title"></h1><p class="note" id="j-note"></p></div>
    <div style="display:flex;gap:8px">
      <details class="menu" id="j-menu"><summary aria-label="Thêm">${ic("more")}</summary><div class="pop"><div>Đồng bộ thông tin</div><div>Xuất file DOCX</div></div></details>
      <button class="btn" id="j-cta">Chấm bài</button>
    </div>
  </div>
  <div id="j-grade" hidden></div>
  <div class="tabs" role="tablist" aria-label="Nội dung giai đoạn">
    <button role="tab" id="t-draft" aria-controls="sv-draft" aria-selected="true" class="on" data-sv="draft">Soạn thảo</button><button role="tab" id="t-files" aria-controls="sv-files" aria-selected="false" data-sv="files"></button><button role="tab" id="t-results" aria-controls="sv-results" aria-selected="false" data-sv="results">Kết quả chấm</button>
  </div>
  <div id="sv-draft" role="tabpanel" aria-labelledby="t-draft"></div>
  <div id="sv-files" role="tabpanel" aria-labelledby="t-files" hidden></div>
  <div id="sv-results" role="tabpanel" aria-labelledby="t-results" hidden></div>
  <p class="mock" id="j-gmock"></p>
</div>`;
// Called by initRouter() with the stage/view read from the URL.
function showStage(stage,view){
  const detail=stage in STAGE_DATA;
  $("#j-list").hidden=detail;$("#j-stage").hidden=!detail;
  $("#v-journey").classList.toggle("wide",detail);
  $("#j-nodetail").hidden=!stage||detail;
  if(!detail)return;
  $("#j-name").textContent=$("#j-title").textContent=D.name;
  $("#j-note").textContent=D.note;
  $$("[data-sv]").forEach(b=>{const on=b.dataset.sv===view;b.dataset.to="tab=journey&stage="+stage+"&view="+b.dataset.sv;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});
  $("[data-sv=files]").textContent="Tài liệu ("+D.docs.length+")";
  // "Đồng bộ thông tin" and "Xuất file DOCX" act on the question-and-answer template, so they only exist in the Soạn thảo tab.
  // Next to the results or files tabs, "DOCX" would read as exporting the report.
  $("#j-menu").hidden=view!=="draft";$("#j-menu").open=false;
  const grading=renderGrading(stage,view);
  const busy=grading==="queued"||grading==="running";
  // Same rules as StageHeader in web-1: no credits means buy; a stage with a result says re-grade; nothing is gradable while a run is active.
  const cta=$("#j-cta");cta.textContent=D.credits?(D.runs.length?"Chấm lại":"Chấm bài"):"Mua lượt chấm";
  cta.disabled=busy&&!!D.credits;
  if(D.credits)delete cta.dataset.to;else cta.dataset.to="tab=billing";
  cta.onclick=D.credits?openAudit:null; // opens the confirm dialog; without credits the data-to button goes to billing
  const title=$("#j-title");title.querySelector(".chip")?.remove();
  if(busy)title.insertAdjacentHTML("beforeend",' <span class="chip draft">Đang chấm</span>');
  else if(D.runs.length)title.insertAdjacentHTML("beforeend",' <span class="chip ok">Đã có kết quả</span>');
  VIEWS.forEach(k=>$("#sv-"+k).hidden=k!==view);
}
