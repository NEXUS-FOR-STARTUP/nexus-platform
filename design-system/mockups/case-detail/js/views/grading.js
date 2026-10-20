// Grading panel above the stage tabs, visible from every tab (StageGradingPanel in web-1).
// Mock-only: the state is chosen with ?grading=queued|running|failed|cancelled|completed. Without it there is no panel.
// Steps are the real progressSteps of each checkpoint (packages/shared/src/audit-checkpoints.ts).
const GRADE_STEPS={
  "y-tuong":["Tiếp nhận dự án","Xây ma trận Vấn đề - Giải pháp - Khách hàng","Phản biện các giả định","Hoàn tất báo cáo"],
  "thi-truong":["Đọc tài liệu của nhóm","Trích bằng chứng","Viết báo cáo thẩm định","Tổng hợp điểm"]
};
const GRADE_DONE={queued:0,running:1,failed:2,cancelled:2,completed:4}; // steps finished in the sample state
const GRADE_CHIP={queued:["warn","Hàng đợi"],running:["draft","Đang chấm"],completed:["ok","Hoàn tất"],failed:["err","Gián đoạn"],cancelled:["lock","Đã dừng"]};
const GRADE_SAMPLE_JOB="1a913f8e";
const GRADE_SAMPLE_ELAPSED="01:42";

function gradeHead(st,steps,done){
  return {queued:"Đang xếp hàng, sắp bắt đầu chấm",
    running:"Bước "+(done+1)+"/"+steps.length+": "+steps[done],
    completed:"Chấm xong. Báo cáo đã sẵn sàng",
    failed:"Lần chấm bị gián đoạn. Lượt chấm đã được hoàn lại, bạn có thể chạy lại",
    cancelled:"Lần chấm đã dừng. Lượt chấm đã được hoàn lại"}[st];
}

// Returns the state shown (or null) so showStage can lock the grade button while a run is active.
function renderGrading(stage,view){
  const st=new URLSearchParams(location.search).get("grading"),box=$("#j-grade");
  const links=Object.keys(GRADE_CHIP).map(k=>'<a href="?tab=journey&stage='+stage+'&view='+view+'&grading='+k+'">'+GRADE_CHIP[k][1]+'</a>').join(" · ");
  $("#j-gmock").innerHTML="Bảng tiến trình chấm hiện trên mọi tab khi đang chấm, lỗi hoặc vừa xong. Xem thử: "+links+".";
  if(!(st in GRADE_CHIP)){box.hidden=true;return null}
  const steps=GRADE_STEPS[stage],done=GRADE_DONE[st],[cls,label]=GRADE_CHIP[st];
  const active=st==="queued"||st==="running";
  const acts=(st==="failed"||st==="cancelled"?'<button class="btn">Chạy lại</button>':"")+
    (st==="failed"?'<button class="btn quiet">Báo lỗi qua Zalo</button>':"")+
    (st==="completed"?'<button class="btn" data-to="tab=journey&stage='+stage+'&view=results">Xem kết quả</button><button class="btn quiet" id="gp-close">Đóng</button>':"")+
    (st!=="completed"?'<button class="ib" id="gp-toggle" aria-label="Thu gọn" aria-expanded="true">'+ic("down")+'</button>':"");
  const body=st==="completed"?"":'<div class="gpb" id="gp-body">'+
    (stage==="thi-truong"?'<p class="note">Đang đọc: câu trả lời và tài liệu / đánh giá toàn diện</p>':"")+
    (st==="failed"?'<p class="note err" title="Chi tiết kỹ thuật dành cho hỗ trợ (mock).">Hệ thống chưa tạo được báo cáo hoàn chỉnh. Di chuột để xem chi tiết kỹ thuật cho hỗ trợ.</p>':"")+
    '<div class="pbar'+(st==="failed"?" err":"")+'"><i style="width:'+Math.round(done/steps.length*100)+'%"></i></div>'+
    '<ol class="gst">'+steps.map((s,i)=>'<li class="'+(i<done?"done":i===done&&active?"on":"")+'">'+s+'</li>').join("")+'</ol></div>';
  box.className="gp"+(st==="failed"?" bad":"");
  box.innerHTML='<div class="gph"><span class="chip '+cls+'">'+label+'</span><b>'+gradeHead(st,steps,done)+'</b>'+
    (active?'<span class="note">'+GRADE_SAMPLE_ELAPSED+'</span>':"")+'<span class="note">#'+GRADE_SAMPLE_JOB+'</span><div class="acts">'+acts+'</div></div>'+body;
  box.hidden=false;
  const toggle=$("#gp-toggle");
  if(toggle)toggle.onclick=()=>{const b=$("#gp-body"),open=b.hidden;b.hidden=!open;toggle.setAttribute("aria-expanded",open);toggle.classList.toggle("flip",!open)};
  const close=$("#gp-close");if(close)close.onclick=()=>{box.hidden=true};
  return st;
}
