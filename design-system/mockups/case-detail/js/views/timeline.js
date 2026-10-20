$("#v-timeline").innerHTML=`
<div class="head"><div><h1>Lịch sử hoạt động</h1><p class="note">Mọi thay đổi trạng thái, lượt chấm và cập nhật của dự án.</p></div></div>
<p class="note" style="margin:0 0 12px">Dữ liệu mẫu, không phải dữ liệu thật</p>
<div class="tabs" id="tseg" role="group" aria-label="Lọc theo loại"></div>
<div id="tgroups"></div>
<p class="mock">Dòng thời gian dọc như UI cũ: mỗi sự kiện một mốc có icon theo loại. Nhóm theo ngày, ngày mới nhất mở sẵn, các ngày khác gập trên điện thoại.</p>`;
let tf="all";
const TL_ICON={grade:"check",pay:"card",project:"compass"};
function renderTl(){
  let first=true;
  $("#tgroups").innerHTML=EVENTS.map(([day,list])=>{
    const l=list.filter(e=>tf==="all"||e[4]===tf);if(!l.length)return "";
    const keep=first?" data-keep":"";first=false;
    return '<details class="fold tld" open'+keep+'><summary>'+esc(day)+'<span class="note">'+l.length+' sự kiện</span>'+ic("down")+'</summary><ol class="tl">'+
      l.map(e=>'<li class="ev"><span class="mk '+e[4]+'">'+ic(TL_ICON[e[4]],16)+'</span><div><div class="et"><b>'+e[1]+'</b><span class="note">'+e[0]+'</span></div><p class="note">'+e[2]+'</p><p class="note">Thực hiện bởi '+e[3]+'.</p></div></li>').join("")+'</ol></details>';
  }).join("")||'<p class="empty-row">Chưa có hoạt động nào thuộc loại này.</p>';
  folds($("#tgroups")); // only the days just rendered; other folds keep the user's open state
}
const tcnt=k=>EVENTS.reduce((n,d)=>n+d[1].filter(e=>k==="all"||e[4]===k).length,0);
segs($("#tseg"),[["all","Tất cả ("+tcnt("all")+")"],["grade","Chấm bài ("+tcnt("grade")+")"],["pay","Lượt chấm ("+tcnt("pay")+")"],["project","Dự án ("+tcnt("project")+")"]],k=>{tf=k;renderTl()});
renderTl();
