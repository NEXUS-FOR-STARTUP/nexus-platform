// Grading confirm dialog (AuditConfirmModal in web-1). Step 1 = what the team has to grade; step 2 = how to grade + cost.
// Only Thị trường (CP2) has the choice cards; Ý tưởng (CP1) goes straight to the cost line.
// Mock simplification: the real "answers ready" bar comes from the server summary; here it is "at least one answer".
const SOURCE_LABEL={both:"Cả câu trả lời và tài liệu",answers:"Chỉ câu trả lời",files:"Chỉ tài liệu"};
const SCOPE_LABEL={full:"Đánh giá toàn diện",questionnaire:"Chỉ soát bảng hỏi"};
const NOTE_MAX=2000, SUMMARY_MAX=5000;

const dlg=document.createElement("dialog");
dlg.id="audit";dlg.setAttribute("aria-labelledby","audit-t");
document.body.appendChild(dlg);
let A=null; // dialog state, rebuilt on every open

function auditFacts(){
  const [answered]=countQs(D),files=D.docs.length,isCp2=STAGE==="thi-truong";
  const hasAnswers=answered>0;
  const missing=D.phases.flatMap(p=>p.questions).filter(q=>q.classification==="required"&&!q.answer).length;
  const ready=src=>src==="files"?files>0:src==="answers"?hasAnswers:files>0&&hasAnswers; // the mock's bar is "at least one answer"; scope does not change it
  return {answered,files,isCp2,hasAnswers,missing,ready,blocked:!files&&!hasAnswers};
}
function auditDefaults(f){
  const source=["both","answers","files"].find(s=>f.ready(s))||"answers";
  return {source,scope:"full",kind:D.runs.length?"resubmit":"initial"};
}
const opt=(name,val,cur,label,desc,off)=>'<label class="rad'+(off?" off":"")+'"><input type="radio" name="'+name+'" value="'+val+'"'+(cur===val?" checked":"")+(off?" disabled":"")+'><span><b>'+label+'</b><span class="note">'+desc+'</span></span></label>';
const card=(open,title,cur,body)=>'<details'+(open?" open":"")+'><summary><span class="fs">'+title+'<span class="note"> · '+cur+'</span></span>'+ic("down")+'</summary><div class="inner">'+body+'</div></details>';

function auditHtml(){
  const f=auditFacts(),after=Math.max(D.credits-1,0);
  const head='<h2 id="audit-t">Xác nhận chấm bài - '+D.name+'</h2>';
  if(A.step===1){
    const row=(ok,t,n)=>'<li class="'+(ok?"done":"")+'"><span><b>'+t+'</b><span class="note">'+n+'</span></span></li>';
    return head+'<p class="step">Bước 1/2: bạn đang có gì để chấm?</p><ul class="have">'+
      row(f.hasAnswers,"Câu trả lời: "+f.answered+" câu",f.isCp2?"Không bắt buộc nếu bạn chấm bằng tài liệu. Nếu dùng, cần đủ số câu có nội dung thật, mỗi câu viết thành câu hoàn chỉnh":"")+
      row(f.files>0,"Tài liệu đính kèm: "+f.files+" tệp",f.isCp2?"Không bắt buộc nếu bạn chấm bằng câu trả lời. Khảo sát .xlsx, ghi chép phỏng vấn .docx/.pdf":"Không bắt buộc nếu bạn đã trả lời câu hỏi ở tab Soạn thảo")+'</ul>'+
      (f.files?"":'<p><button class="btn quiet" data-act="files">Sang tab Tài liệu để tải lên</button></p>')+
      (f.blocked?'<div class="alert bad"><b>Chưa có gì để chấm</b>'+(f.isCp2?"Bạn cần một trong hai: tải tài liệu lên ở tab Tài liệu, hoặc trả lời đủ câu ở tab Soạn thảo ("+f.answered+" câu hiện có nội dung nhưng quá ngắn hoặc chưa đủ số câu).":"Chưa có câu trả lời nào và chưa có tệp nào. Trả lời ít nhất một câu ở tab Soạn thảo hoặc tải một tệp lên ở tab Tài liệu trước khi chấm.")+'</div>':"")+
      (!f.blocked&&f.missing?'<div class="alert warn"><b>Còn câu điều kiện chưa điền</b>Bạn còn '+f.missing+' câu điều kiện chưa trả lời. Bạn vẫn có thể gửi chấm, nhưng hội đồng có thể trừ điểm phần này.</div>':"")+
      '<div class="dacts"><span></span><div><button class="btn quiet" data-act="close">Hủy</button><button class="btn" data-act="next"'+(f.blocked?" disabled":"")+'>Tiếp tục</button></div></div>';
  }
  const src=A.source,sc=A.scope,kind=sc==="questionnaire"?"initial":A.kind;
  const cp2=f.isCp2?
    card(true,"Chấm gì",SOURCE_LABEL[src],
      opt("source","both",src,"Cả câu trả lời và tài liệu","Đối chiếu lời trả lời với tệp bạn nộp",!f.ready("both",sc))+
      opt("source","answers",src,"Chỉ câu trả lời","Hợp khi chưa có tài liệu riêng",!f.ready("answers",sc))+
      opt("source","files",src,"Chỉ tài liệu","Hợp khi tài liệu đã chi tiết",!f.files))+
    card(false,"Chấm tới đâu",SCOPE_LABEL[sc],
      opt("scope","full",sc,"Toàn diện (Đề xuất)","Bảng hỏi, logic khảo sát và bằng chứng",!f.ready(src,"full"))+
      opt("scope","questionnaire",sc,"Chỉ soát bảng hỏi","Cấu trúc câu hỏi khảo sát",!f.ready(src,"questionnaire")))+
    card(false,"Lần chấm này",kind==="resubmit"?"Chấm lại":"Chấm mới",
      opt("kind","initial",kind,"Chấm mới từ đầu","Không đối chiếu bản cũ",false)+
      opt("kind","resubmit",kind,"Chấm lại sau khi sửa",sc==="full"?"Đối chiếu với kết quả lần trước":"Chỉ có ở chấm toàn diện",sc!=="full")+
      (kind==="resubmit"?'<div class="field" style="margin-top:12px"><label for="a-sum">Bạn đã sửa gì</label><textarea id="a-sum" rows="2" maxlength="'+SUMMARY_MAX+'" placeholder="Ví dụ: phỏng vấn thêm 3 chuyên gia, tính lại SOM">'+esc(A.summary)+'</textarea></div>':""))+
    card(false,"Ghi chú thêm",A.note.trim()?"đã viết":"không bắt buộc",
      '<textarea id="a-note" rows="2" maxlength="'+NOTE_MAX+'" placeholder="Ví dụ: soi kỹ phần SOM giúp mình">'+esc(A.note)+'</textarea>'):"";
  return head+'<p class="step">Bước 2/2: chọn cách chấm và xác nhận</p>'+cp2+
    (f.isCp2&&src==="answers"&&!f.files?'<div class="alert warn"><b>Chấm khi thiếu tệp</b>Vẫn chấm được theo lời nhóm mô tả, nhưng các tiêu chí thiếu bằng chứng sẽ bị đánh giá thấp.</div>':"")+
    '<div class="dacts"><span>Chi phí: <b class="cost">Tốn 1 lượt - còn lại '+after+' sau lần chấm này</b></span></div>'+
    '<div class="dacts"><button class="btn quiet" data-act="back">Quay lại</button><div><button class="btn quiet" data-act="close">Hủy</button><button class="btn" data-act="go"'+(f.isCp2&&!f.ready(src,sc)?" disabled":"")+'>Bắt đầu chấm bài</button></div></div>';
}

function paintAudit(){
  const openIds=[...dlg.querySelectorAll("details")].map(d=>d.open); // keep the accordion state across re-renders
  dlg.innerHTML=auditHtml();
  dlg.querySelectorAll("details").forEach((d,i)=>{if(i<openIds.length)d.open=openIds[i]});
}
function openAudit(){
  const f=auditFacts();
  A={step:1,...auditDefaults(f),summary:"",note:""};
  paintAudit();dlg.showModal();
}
dlg.addEventListener("click",e=>{
  const b=e.target.closest("[data-act]");
  if(!b){if(e.target===dlg)dlg.close();return} // a click on the backdrop closes it
  const act=b.dataset.act,p=new URLSearchParams(location.search);
  if(act==="close")dlg.close();
  else if(act==="next"){A.step=2;paintAudit()}
  else if(act==="back"){A.step=1;paintAudit()}
  else if(act==="files"){dlg.close();location.search="tab=journey&stage="+STAGE+"&view=files"}
  else if(act==="go"){dlg.close();location.search="tab=journey&stage="+STAGE+"&view="+(p.get("view")||"draft")+"&grading=queued"} // the sample queued state stands in for the real job
});
dlg.addEventListener("change",e=>{
  const r=e.target;if(r.type!=="radio")return;
  A[r.name]=r.value;
  if(r.name==="scope"&&r.value==="questionnaire")A.kind="initial"; // questionnaire has no resubmit plan
  paintAudit();
});
dlg.addEventListener("input",e=>{if(e.target.id==="a-sum")A.summary=e.target.value;if(e.target.id==="a-note")A.note=e.target.value});
