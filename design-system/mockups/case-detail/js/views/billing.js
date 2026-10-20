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
    <div class="tabs" id="hseg" role="group" aria-label="Lọc theo loại" style="margin:0"></div>
    <select id="hrange" aria-label="Khoảng thời gian"><option value="999">Tất cả thời gian</option><option value="3">3 ngày qua</option><option value="7">7 ngày qua</option></select>
  </div>
  <div class="rows" id="hrows"></div>
  <p class="bar" style="margin:8px 0 0"><span class="note" id="hcount"></span><button class="btn quiet" id="hmore" hidden></button></p>
  <p class="mock">Bộ lọc hiện vì có hơn 5 dòng. Lần chấm lỗi được hoàn lượt tự động.</p>
</div>`;
let hf="all",hall=false;
const HIST_PREVIEW=5; // phone only: a longer list folds behind "Xem thêm" so the page stays short
const TYPE_LABEL={buy:"Nạp lượt chấm",use:"Trừ lượt chấm",refund:"Hoàn lượt chấm"};
const kv=(k,v)=>'<dt>'+k+'</dt><dd>'+v+'</dd>';
const code=v=>'<code>'+esc(v)+'</code><button type="button" class="ib cp" data-copy="'+esc(v)+'" aria-label="Sao chép '+esc(v)+'">'+ic("copy",14)+'</button>';
// Expanded detail: everything the real ledger, order and bank records carry (see the comment above SVC in history.js).
function txDetail(r){
  const d=r[8];
  let h='<p class="kvh">Giao dịch</p><dl class="kv">'+
    kv("Thời gian",d.at)+kv("Loại giao dịch",TYPE_LABEL[r[4]])+kv("Giai đoạn",d.stage)+
    kv("Dịch vụ",esc(d.svcLabel)+' <span class="note">· <code>'+d.svc+'</code></span>')+
    kv("Biến động",r[5]+" lượt")+kv("Số dư sau giao dịch",d.balance+" lượt")+kv("Trạng thái",r[7])+kv("Nguồn",d.how)+
    (d.run?kv("Lần chấm",d.run):"")+
    kv("ID giao dịch",code(d.id))+(d.order?"":kv(d.refLabel,code(d.ref)))+'</dl>';
  if(d.failed)h+='<p class="alert warn">'+d.failed+'</p>';
  if(d.order){const o=d.order;
    h+='<p class="kvh">Đơn hàng</p><dl class="kv">'+kv("Mã đơn hàng",code(o.id))+kv("Trạng thái đơn",o.status)+'</dl>'+
      '<div class="tw"><table class="items"><thead><tr><th>Dịch vụ</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>'+
      o.items.map(i=>'<tr><td>'+esc(i[0])+'</td><td>'+i[1]+'</td><td>'+i[2]+'</td><td>'+i[3]+'</td></tr>').join("")+
      '</tbody><tfoot><tr><td colspan="3">Tổng tiền</td><td>'+o.total+'</td></tr></tfoot></table></div>';}
  if(d.pay){const p=d.pay;
    h+='<p class="kvh">Thanh toán</p><dl class="kv">'+kv("Phương thức",p.method)+kv("Nội dung chuyển khoản",code(p.content))+
      kv("Mã giao dịch ngân hàng",code(p.bank))+kv("Ngân hàng ghi có lúc",p.credited)+kv("Xác minh",p.verify)+'</dl>';}
  return h;
}
function txHtml(r){
  return '<details class="tx"><summary class="row"><span class="note dt">'+r[1]+'</span><div class="tt">'+r[2]+'<div class="note">'+r[3]+'</div></div>'+
    '<span class="amt am'+(r[5][0]==="+"?" plus":"")+'">'+r[5]+' lượt</span><span class="chip ch '+r[6]+'">'+r[7]+'</span><span class="cv">'+ic("down",16)+'</span></summary>'+
    '<div class="txd">'+txDetail(r)+'</div></details>';
}
function renderHist(){
  const days=+$("#hrange").value;
  const rows=MONEY.filter(r=>(hf==="all"||r[4]===hf)&&(NOW-new Date(r[0]))/864e5<=days);
  const shown=phone.matches&&!hall?rows.slice(0,HIST_PREVIEW):rows;
  $("#hrows").innerHTML=rows.length?shown.map(txHtml).join(""):'<div class="empty-row">Không có giao dịch trong khoảng này.</div>';
  $("#hcount").textContent=phone.matches?"Hiện "+shown.length+" trên "+rows.length+" giao dịch":rows.length+" giao dịch";
  const more=$("#hmore");more.hidden=!phone.matches||rows.length<=HIST_PREVIEW;more.textContent=hall?"Thu gọn":"Xem thêm "+(rows.length-HIST_PREVIEW)+" giao dịch";
}
const cnt=k=>MONEY.filter(r=>k==="all"||r[4]===k).length;
segs($("#hseg"),[["all","Tất cả ("+cnt("all")+")"],["buy","Mua ("+cnt("buy")+")"],["use","Dùng ("+cnt("use")+")"],["refund","Hoàn ("+cnt("refund")+")"]],k=>{hf=k;hall=false;renderHist()});
$("#hrange").onchange=()=>{hall=false;renderHist()};$("#hmore").onclick=()=>{hall=!hall;renderHist()};
phone.addEventListener("change",()=>{hall=false;renderHist()});renderHist();
$("#hrows").addEventListener("click",e=>{
  const b=e.target.closest("[data-copy]");if(!b)return;
  const html=b.innerHTML;
  navigator.clipboard.writeText(b.dataset.copy).then(()=>{b.innerHTML=ic("tick",14);b.setAttribute("aria-label","Đã sao chép")},()=>{b.setAttribute("aria-label","Không sao chép được")});
  setTimeout(()=>{b.innerHTML=html},1500);
});
