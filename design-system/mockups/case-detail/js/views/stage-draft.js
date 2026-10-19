// Soạn thảo: mục lục | câu trả lời | gợi ý. Data: D.phases (CP1 or CP2, from the real catalog).
// Hint = catalog `explanation` split into: lead, "Cần nêu" bullets, good/bad example, notes, + `suggested_actions`.
const QS=D.phases.flatMap((p,pi)=>p.questions.map(q=>Object.assign(q,{phase:pi}))); // the catalog objects themselves, so Lưu updates the list
// Row states mirror GuidedTOC in web-1: answered, empty, thin (CP2 only), locked, active, "Quan trọng".
const IS_CP2=D.phases===CP2_PHASES;
const SELF_LABEL={ // CP2_SELF_CHECKS in cp2-readiness.ts; ticking saves at once in the product, here it is kept in memory
  cp2_expert_interviews:"Đã phỏng vấn ít nhất 2 chuyên gia có từ 6 tháng kinh nghiệm",
  cp2_survey:"Khảo sát có ít nhất 100 phản hồi, từ 7 câu hỏi, gồm ít nhất 2 loại câu hỏi",
  cp2_ai_disclosure:"Đã ghi rõ phần có dùng AI trong báo cáo"
};
const SELF={};
const words=t=>t.trim().split(/\s+/).filter(Boolean).length;
const has=q=>!!q&&q.answer.trim().length>0;
const isThin=(q,t=q.answer)=>IS_CP2&&words(t)>0&&words(t)<THIN_WORDS;
const answered=id=>has(QS.find(x=>x.id===id));
const unlocked=q=>{const r=UNLOCK[q.id]||{};return r.req?r.req.every(answered):r.prev?answered(r.prev):true};
const isCritical=q=>IS_CP2&&CP2_CRITICAL.includes(q.id);
const CLS={required:"Bắt buộc",recommended:"Nên có",supplemental:"Tuỳ chọn"};
let cur=0;

function parseHint(text){
  const h={lead:"",need:[],bad:"",good:"",ex:"",notes:[]};
  const clean=s=>s.replace(/"/g,"").trim();
  for(const line of text.split("\n")){
    let m;
    if(line.startsWith("- ")) h.need.push(line.slice(2));
    else if((m=line.match(/^Không đạt:\s*(.*)/))) h.bad=clean(m[1]);
    else if((m=line.match(/^Đạt:\s*(.*)/))) h.good=clean(m[1]);
    else if((m=line.match(/^Ví dụ( Pass)?:\s*(.*)/))) h.ex=(m[1]?"Pass: ":"")+clean(m[2]).replace(/ (Fail|Nếu fail): /g,"\n$1: ");
    else if(!h.lead) h.lead=line;
    else h.notes.push(line);
  }
  return h;
}

const checklist=items=>'<ul class="blt">'+items.map(t=>'<li>'+esc(t)+'</li>').join("")+'</ul>';
const section=(icon,title,body)=>'<div class="hs"><h4>'+ic(icon,16)+title+'</h4>'+body+'</div>';

function hintHtml(q){
  const h=parseHint(q.explanation);
  let out='<h3>Gợi ý cho câu này</h3><p class="lead">'+esc(h.lead.replace(/\s*Cần nêu:?$/,""))+'</p>';
  if(h.need.length) out+=section("list","Cần nêu",checklist(h.need));
  if(h.bad||h.good) out+=section("bulb","Ví dụ",
    (h.bad?'<div class="ex"><div class="chip warn">Chưa tốt</div>'+esc(h.bad)+'</div>':"")+
    (h.good?'<div class="ex"><div class="chip ok">Tốt</div>'+esc(h.good)+'</div>':""));
  else if(h.ex) out+=section("bulb","Ví dụ",'<div class="ex">'+esc(h.ex)+'</div>');
  if(q.actions.length) out+=section("check","Tự kiểm tra trước khi lưu",checklist(q.actions));
  if(q.further?.length) out+=section("book","Đọc thêm",q.further.map(r=>'<p><a href="'+r.url+'" target="_blank" rel="noopener">'+esc(r.title)+'</a></p>').join(""));
  if(h.notes.length) out+='<details><summary>Xem thêm lưu ý'+ic("down")+'</summary>'+h.notes.map(n=>'<p class="note">'+esc(n)+'</p>').join("")+'</details>';
  return out;
}

function stateIcon(q,on){
  if(!unlocked(q))return ic("lock",14);
  if(isThin(q))return '<span class="st-warn" title="Câu trả lời còn ngắn - bấm để viết thêm">'+ic("alert",14)+'</span>';
  if(has(q))return '<span class="tick'+(on?' on':'')+'">'+ic("tick",10)+'</span>';
  return ic("ring",14);
}
function renderToc(){
  let i=0;
  const done=QS.filter(has).length;
  $("#toc-s").innerHTML='<span class="fs">Câu '+(cur+1)+' trên '+QS.length+'<span class="note"> · '+esc(QS[cur].text)+'</span></span><span class="note">'+done+' đã trả lời</span>'+ic("down");
  $("#toc").innerHTML=D.phases.map(p=>'<div class="grp">'+esc(p.title)+'<span>'+p.questions.filter(has).length+'/'+p.questions.length+'</span></div>'+
    p.questions.map(q=>{const n=i++,on=n===cur,open=unlocked(q);
      return '<button type="button" class="it'+(on?' on':'')+(open?'':' locked')+'" data-i="'+n+'"'+(open?'':' disabled')+' title="'+esc(q.text)+'"'+(on?' aria-current="true"':'')+'>'+stateIcon(q,on)+'<span class="lb">'+esc(q.text)+'</span>'+
        (isCritical(q)?'<em class="crit" title="Mục quan trọng khi chấm điểm">Quan trọng</em>':on?ic("right",14):"")+'</button>'}).join("")).join("");
}
function thinNote(q,t){return isThin(q,t)?'Câu trả lời còn ngắn ('+words(t)+'/'+THIN_WORDS+' từ). Viết thêm để AI có đủ căn cứ chấm.':""}
function renderQ(){
  const q=QS[cur],nextOpen=cur<QS.length-1&&unlocked(QS[cur+1]);
  $("#q").innerHTML='<h2 tabindex="-1">'+esc(q.text)+'</h2><p class="note meta">Câu '+(cur+1)+' trên '+QS.length+' · '+CLS[q.classification]+'</p>'+
    '<textarea aria-label="Câu trả lời" placeholder="Nhập câu trả lời của nhóm">'+esc(q.answer)+'</textarea>'+
    '<p class="thinw" id="thinw" role="status"'+(isThin(q)?'':' hidden')+'>'+thinNote(q,q.answer)+'</p>'+
    (isCritical(q)?'<div class="selfbox"><label><input type="checkbox" id="selfc"'+(SELF[q.id]?' checked':'')+'><span>'+SELF_LABEL[q.id]+'</span></label><p class="note">Mục quan trọng khi chấm. Nhóm tự xác nhận, AI chấm sẽ đọc xác nhận này.</p></div>':"")+
    '<div class="foot"><span class="note" id="saved">'+(has(q)?"Đã lưu":"Chưa có câu trả lời")+'</span><div>'+
    '<button class="btn quiet" id="prev"'+(cur?'':' disabled')+'>'+ic("left")+'Câu trước</button>'+
    '<button class="btn quiet" id="save-q" disabled>Lưu</button>'+
    '<button class="btn quiet" id="next"'+(nextOpen?'':' disabled')+'>Câu tiếp'+ic("right")+'</button></div></div>';
  $("#hintp").innerHTML=hintHtml(q);
  const ta=$("#q textarea");
  ta.oninput=()=>{$("#save-q").disabled=false;$("#saved").textContent="Chưa lưu";const n=thinNote(q,ta.value);$("#thinw").textContent=n;$("#thinw").hidden=!n};
  $("#save-q").onclick=()=>{q.answer=ta.value;$("#save-q").disabled=true;$("#saved").textContent=has(q)?"Đã lưu":"Chưa có câu trả lời";renderToc();$("#next").disabled=!(cur<QS.length-1&&unlocked(QS[cur+1]))}; // a save can unlock the next question
  if(isCritical(q))$("#selfc").onchange=e=>{SELF[q.id]=e.target.checked};
  $("#prev").onclick=()=>go(cur-1);$("#next").onclick=()=>go(cur+1);
}
function go(n){cur=n;renderToc();renderQ();if(phone.matches){$("#tocd").open=false;$("#q h2").focus()}} // closing the fold would drop focus, so move it to the new question

$("#sv-draft").innerHTML='<div class="editor"><details class="toc fold" id="tocd" open><summary id="toc-s"></summary><div id="toc"></div></details><section class="q" id="q"></section><details class="hintp fold" id="hintd" open><summary><span class="fs">Gợi ý cho câu này</span>'+ic("down")+'</summary><div id="hintp" aria-label="Gợi ý"></div></details></div>'+
  '<p class="mock">Gợi ý tách từ catalog thật: ý chính ở đầu, "Cần nêu" và tự kiểm tra là danh sách thường (không lưu), ví dụ Tốt/Chưa tốt tách riêng. Trạng thái câu (đã trả lời, chưa trả lời, còn ngắn, khoá) dùng đúng icon và luật của UI cũ. Câu trả lời là dữ liệu mẫu bịa. Thêm ?answers=all để xem câu trả lời mẫu của catalog (26 trên 27 câu).</p>';
$("#toc").onclick=e=>{const it=e.target.closest(".it");if(it&&!it.disabled)go(+it.dataset.i)};
renderToc();renderQ();
