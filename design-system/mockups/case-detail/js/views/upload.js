// Document upload dialog (StageDocumentUploadModal in web-1): pick files, give each a type, save once.
// Limits, error messages and type labels are the product's own. Nothing is uploaded; Save only confirms.
const UP_MAX_FILES=5, UP_MAX_MB=25, UP_EXT=[".pdf",".docx",".xlsx",".pptx",".txt"];
const UP_TYPES=[["idea_report","Bạn mô tả ý tưởng"],["pitch_deck","Slide thuyết trình"],["market_research","Nghiên cứu thị trường"],["financial_plan","Kế hoạch tài chính"],["other","Tài liệu bổ sung"]];

const upDlg=document.createElement("dialog");
upDlg.id="upload";upDlg.setAttribute("aria-labelledby","up-t");
document.body.appendChild(upDlg);
let UP={files:[],types:[],error:""};

function upHtml(){
  const ok=UP.files.length>0&&UP.types.every(Boolean);
  return '<h2 id="up-t">Tải tài liệu mới</h2><p class="note">Chọn tệp, gắn loại cho từng tệp, rồi bấm Lưu</p>'+
    (UP.error?'<div class="alert bad" role="alert">'+esc(UP.error)+'</div>':"")+
    '<label class="drop" id="up-drop"><input type="file" id="up-input" multiple accept="'+UP_EXT.join(",")+'">'+ic("upload",24)+
    '<b>Kéo thả tệp vào đây hoặc bấm để chọn</b><span class="note">Tối đa '+UP_MAX_FILES+' tệp, mỗi tệp '+UP_MAX_MB+'MB</span><span class="note">PDF, DOCX, XLSX, PPTX, TXT</span></label>'+
    (UP.files.length?'<div class="rows">'+UP.files.map((f,i)=>'<div class="file up-f"><div class="nm">'+ic("file")+'<div><div class="b">'+esc(f.name)+'</div><div class="note">'+(f.size/1024/1024).toFixed(2)+' MB</div></div></div>'+
      '<button class="ib" data-rm="'+i+'" aria-label="Xóa '+esc(f.name)+'">'+ic("trash")+'</button>'+
      '<div class="field up-t"><label for="up-s'+i+'">Loại tài liệu</label><select id="up-s'+i+'" data-i="'+i+'"><option value="">Chọn loại tài liệu</option>'+
      UP_TYPES.map(([v,l])=>'<option value="'+v+'"'+(UP.types[i]===v?" selected":"")+'>'+l+'</option>').join("")+'</select><span class="note">AI dùng loại này để phân loại tài liệu của bạn</span></div></div>').join("")+'</div>':"")+
    '<div class="dacts"><span></span><div><button class="btn quiet" data-up="close">Hủy</button><button class="btn" data-up="save"'+(ok?"":" disabled")+'>Lưu</button></div></div>';
}
function upPaint(){upDlg.innerHTML=upHtml()}
function openUpload(){UP={files:[],types:[],error:""};upPaint();upDlg.showModal()}

function upAdd(list){
  const picked=[...list];
  const bad=picked.find(f=>!UP_EXT.includes("."+f.name.split(".").pop().toLowerCase()));
  if(UP.files.length+picked.length>UP_MAX_FILES){UP.error="Chỉ được tải tối đa "+UP_MAX_FILES+" tài liệu. Bạn đã chọn "+(UP.files.length+picked.length)+" tệp."}
  else if(picked.some(f=>f.size>UP_MAX_MB*1024*1024)){UP.error="Mỗi tệp tối đa "+UP_MAX_MB+"MB."}
  else if(bad){UP.error="Định dạng tệp không được hỗ trợ. Vui lòng dùng PDF, DOCX, XLSX, PPTX hoặc TXT."}
  else{UP.error="";UP.files.push(...picked);UP.types.push(...picked.map(()=>""))}
  upPaint();
}
upDlg.addEventListener("change",e=>{
  if(e.target.id==="up-input")upAdd(e.target.files);
  else if(e.target.dataset.i!==undefined){UP.types[+e.target.dataset.i]=e.target.value;upPaint()}
});
upDlg.addEventListener("click",e=>{
  if(e.target===upDlg){upDlg.close();return}
  const rm=e.target.closest("[data-rm]"),act=e.target.closest("[data-up]");
  if(rm){const i=+rm.dataset.rm;UP.files.splice(i,1);UP.types.splice(i,1);upPaint()}
  else if(act&&act.dataset.up==="close")upDlg.close();
  else if(act&&act.dataset.up==="save"){
    const n=UP.files.length;upDlg.close();
    $("#sv-files").insertAdjacentHTML("afterbegin",'<div class="alert ok" role="status"><b>Tải tệp thành công</b>Đã tải '+n+' tài liệu (chưa lưu thật).</div>');
  }
});
upDlg.addEventListener("dragover",e=>{if(e.target.closest("#up-drop"))e.preventDefault()});
upDlg.addEventListener("drop",e=>{if(e.target.closest("#up-drop")){e.preventDefault();upAdd(e.dataTransfer.files)}});
