$("#v-billing").innerHTML=`
<div class="head"><div><h1>Lượt chấm &amp; thanh toán</h1><p class="note">Mỗi lần bấm chấm trừ 1 lượt của đúng giai đoạn đó.</p></div></div>
<div class="bal">
  <div class="card"><div><p class="note">Ý tưởng</p><p class="big">2 lượt</p></div><button class="btn">Mua thêm</button></div>
  <div class="card"><div><p class="note">Thị trường</p><p class="big">0 lượt</p></div><button class="btn">Mua thêm</button></div>
</div>
<p class="note" style="margin-top:12px">Hai giai đoạn sau chưa mở nên chưa có lượt chấm.</p>
<div class="sec hist">
  <h2>Lịch sử lượt chấm <span class="note">· Dữ liệu mẫu, không phải dữ liệu thật</span></h2>
  <div class="bar">
    <div class="seg" id="hseg" style="margin:0"></div>
    <select id="hrange" aria-label="Khoảng thời gian"><option value="999">Tất cả thời gian</option><option value="3">3 ngày qua</option><option value="7">7 ngày qua</option></select>
  </div>
  <div class="rows" id="hrows"></div>
  <p class="bar" style="margin:8px 0 0"><span class="note" id="hcount"></span><button class="btn quiet" id="hmore" hidden></button></p>
  <p class="mock">Bộ lọc hiện vì có hơn 5 dòng. Lần chấm lỗi được hoàn lượt tự động.</p>
</div>`;
let hf="all",hall=false;
const HIST_PREVIEW=5; // phone only: a longer list folds behind "Xem thêm" so the page stays short
function renderHist(){
  const days=+$("#hrange").value;
  const rows=MONEY.filter(r=>(hf==="all"||r[4]===hf)&&(NOW-new Date(r[0]))/864e5<=days);
  const shown=phone.matches&&!hall?rows.slice(0,HIST_PREVIEW):rows;
  $("#hrows").innerHTML=rows.length?shown.map(r=>'<div class="row"><span class="note">'+r[1]+'</span><div>'+r[2]+'<div class="note">'+r[3]+'</div></div><span class="amt'+(r[5][0]==="+"?" plus":"")+'">'+r[5]+' lượt</span><span class="chip '+r[6]+'">'+r[7]+'</span></div>').join(""):'<div class="empty-row">Không có giao dịch trong khoảng này.</div>';
  $("#hcount").textContent=phone.matches?"Hiện "+shown.length+" trên "+rows.length+" giao dịch":rows.length+" giao dịch";
  const more=$("#hmore");more.hidden=!phone.matches||rows.length<=HIST_PREVIEW;more.textContent=hall?"Thu gọn":"Xem thêm "+(rows.length-HIST_PREVIEW)+" giao dịch";
}
const cnt=k=>MONEY.filter(r=>k==="all"||r[4]===k).length;
segs($("#hseg"),[["all","Tất cả ("+cnt("all")+")"],["buy","Mua ("+cnt("buy")+")"],["use","Dùng ("+cnt("use")+")"],["refund","Hoàn ("+cnt("refund")+")"]],k=>{hf=k;hall=false;renderHist()});
$("#hrange").onchange=()=>{hall=false;renderHist()};$("#hmore").onclick=()=>{hall=!hall;renderHist()};
phone.addEventListener("change",()=>{hall=false;renderHist()});renderHist();
