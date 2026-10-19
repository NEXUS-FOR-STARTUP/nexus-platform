// Soạn thảo: mục lục | câu trả lời | gợi ý. Data: D.phases (CP1 or CP2, from the real catalog).
// Hint = catalog `explanation` split into: lead, "Cần nêu" bullets, good/bad example, notes, + `suggested_actions`.
const QS=D.phases.flatMap((p,pi)=>p.questions.map(q=>({...q,phase:pi})));
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

const checklist=items=>'<ul class="chk">'+items.map(t=>'<li><label><input type="checkbox"><span>'+esc(t)+'</span></label></li>').join("")+'</ul>';
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
  if(q.further?.length) out+=section("file","Đọc thêm",q.further.map(r=>'<p><a href="'+r.url+'" target="_blank" rel="noopener">'+esc(r.title)+'</a></p>').join(""));
  if(h.notes.length) out+='<details><summary>Xem thêm lưu ý'+ic("down")+'</summary>'+h.notes.map(n=>'<p class="note">'+esc(n)+'</p>').join("")+'</details>';
  return out;
}

function renderToc(){
  let i=0;
  const done=QS.filter(q=>q.answer).length;
  $("#toc-s").innerHTML='<span class="fs">Câu '+(cur+1)+' trên '+QS.length+'<span class="note"> · '+esc(QS[cur].text)+'</span></span><span class="note">'+done+' đã trả lời</span>'+ic("down");
  $("#toc").innerHTML=D.phases.map(p=>'<div class="grp">'+esc(p.title)+'<span>'+p.questions.filter(q=>q.answer).length+'/'+p.questions.length+'</span></div>'+
    p.questions.map(q=>{const n=i++;return '<button type="button" class="it'+(n===cur?' on':'')+(q.answer?'':' todo')+'" data-i="'+n+'" title="'+esc(q.text)+'"'+(n===cur?' aria-current="true"':'')+'><span>'+esc(q.text)+'</span></button>'}).join("")).join("");
}
function renderQ(){
  const q=QS[cur];
  $("#q").innerHTML='<h2 tabindex="-1">'+esc(q.text)+'</h2><p class="note meta">Câu '+(cur+1)+' trên '+QS.length+' · '+CLS[q.classification]+'</p>'+
    '<textarea aria-label="Câu trả lời" placeholder="Nhập câu trả lời của nhóm">'+esc(q.answer)+'</textarea>'+
    '<div class="foot"><span class="note" id="saved">'+(q.answer?"Đã lưu":"Chưa có câu trả lời")+'</span><div>'+
    '<button class="btn quiet" id="prev"'+(cur?'':' disabled')+'>'+ic("left")+'Câu trước</button>'+
    '<button class="btn quiet" id="save-q" disabled>Lưu</button>'+
    '<button class="btn quiet" id="next"'+(cur<QS.length-1?'':' disabled')+'>Câu tiếp'+ic("right")+'</button></div></div>';
  $("#hintp").innerHTML=hintHtml(q);
  $("#q textarea").oninput=()=>{$("#save-q").disabled=false;$("#saved").textContent="Chưa lưu"};
  $("#prev").onclick=()=>go(cur-1);$("#next").onclick=()=>go(cur+1);
}
function go(n){cur=n;renderToc();renderQ();if(phone.matches){$("#tocd").open=false;$("#q h2").focus()}} // closing the fold would drop focus, so move it to the new question

$("#sv-draft").innerHTML='<div class="editor"><details class="toc fold" id="tocd" open><summary id="toc-s"></summary><div id="toc"></div></details><section class="q" id="q"></section><details class="hintp fold" id="hintd" open><summary><span class="fs">Gợi ý cho câu này</span>'+ic("down")+'</summary><div id="hintp" aria-label="Gợi ý"></div></details></div>'+
  '<p class="mock">Gợi ý tách từ catalog thật: ý chính ở đầu, "Cần nêu" tick được, ví dụ Tốt/Chưa tốt tách riêng, tự kiểm tra ở cuối. Câu trả lời là dữ liệu mẫu bịa.</p>';
$("#toc").onclick=e=>{const it=e.target.closest(".it");if(it)go(+it.dataset.i)};
renderToc();renderQ();
