// Same rules as TabCaseSettings in web-1: required fields are checked on save, each shows its own message, and a notice summarises the result.
// Required: team name, school, class (project) and full name, phone, email (contact). Messages are the product's own.
const SETTINGS_REQUIRED={
  team_name:"Tên nhóm / Tên đề tài là bắt buộc.",
  school:"Trường học / Viện đào tạo là bắt buộc.",
  course_context:"Lớp học / Môn học là bắt buộc.",
  full_name:"Vui lòng nhập họ tên người liên hệ.",
  zalo:"Vui lòng nhập số điện thoại Zalo.",
  email:"Vui lòng nhập email liên hệ."
};
const SETTINGS_FIELD=(name,label,ph,{type="text",value="",req=false}={})=>
  '<div class="field"><label for="s-'+name+'">'+label+(req?" *":"")+'</label><input id="s-'+name+'" name="'+name+'" type="'+type+'" value="'+esc(value)+'" placeholder="'+esc(ph)+'"'+(req?' aria-required="true"':"")+' aria-describedby="e-'+name+'"><p class="ferr" id="e-'+name+'" hidden></p></div>';

$("#v-settings").innerHTML=`
<div class="head"><div><h1>Cài đặt</h1><p class="note">Cập nhật tên nhóm, trường học và bối cảnh lớp học để báo cáo phản biện hiển thị chính xác. Mục có dấu * là bắt buộc.</p></div></div>
<div id="s-notice" role="status" hidden></div>
<form id="f" novalidate>
  <h2>Thông tin dự án</h2>
  <div class="two">
    ${SETTINGS_FIELD("team_name","Tên nhóm / Tên đề tài","Nhập tên nhóm hoặc đề tài",{value:"MentorMap",req:true})}
    ${SETTINGS_FIELD("group_no","Mã số nhóm / Số thứ tự","Ví dụ: 5")}
    ${SETTINGS_FIELD("school","Trường học / Viện đào tạo","Ví dụ: Đại học FPT",{req:true})}
    ${SETTINGS_FIELD("course_context","Lớp học / Môn học","Ví dụ: EXE101",{req:true})}
  </div>
  <h2 style="margin-top:40px">Người liên hệ</h2>
  <p class="note" style="margin:-4px 0 16px">Chỉ áp dụng cho dự án này, không thay đổi hồ sơ tài khoản của bạn. Dùng để báo kết quả và thanh toán.</p>
  <div class="two">
    ${SETTINGS_FIELD("full_name","Họ tên","Nguyễn Văn A",{req:true})}
    ${SETTINGS_FIELD("student_code","Mã sinh viên","SE123456")}
    ${SETTINGS_FIELD("team_role","Vai trò trong nhóm","Trưởng nhóm")}
    ${SETTINGS_FIELD("zalo","Số điện thoại / Zalo","10 chữ số",{type:"tel",req:true})}
    ${SETTINGS_FIELD("email","Email","ten@example.com",{type:"email",req:true})}
    ${SETTINGS_FIELD("telegram","Telegram","@username")}
  </div>
  <div style="display:flex;justify-content:flex-end;margin-top:8px"><button class="btn" id="save" type="submit" disabled>Lưu thay đổi</button></div>
  <p class="mock">Nút Lưu chỉ bật khi bạn sửa một ô. Bấm Lưu khi còn ô bắt buộc trống để thấy lỗi từng ô; điền đủ rồi bấm Lưu để thấy thông báo thành công (chưa lưu thật).</p>
</form>
<div class="danger"><div class="card"><h2>Xoá dự án</h2><p class="lead">Hành động này không thể hoàn tác. Chỉ hiện khi hồ sơ ở trạng thái đã nộp.</p><button class="btn" style="background:var(--err)">Xoá dự án</button></div></div>`;

function settingsNotice(kind,title,msg){
  const n=$("#s-notice");n.className="alert "+kind;n.innerHTML="<b>"+title+"</b>"+msg;n.hidden=false;
}
function setFieldError(name,msg){
  const input=$("#s-"+name),p=$("#e-"+name);
  p.textContent=msg||"";p.hidden=!msg;
  input.setAttribute("aria-invalid",msg?"true":"false");
}
$("#f").addEventListener("input",e=>{
  $("#save").disabled=false;
  if(e.target.name)setFieldError(e.target.name,""); // an error clears as soon as the field is edited
});
$("#f").addEventListener("submit",e=>{
  e.preventDefault();
  const bad=Object.keys(SETTINGS_REQUIRED).filter(k=>!$("#s-"+k).value.trim());
  Object.keys(SETTINGS_REQUIRED).forEach(k=>setFieldError(k,bad.includes(k)?SETTINGS_REQUIRED[k]:""));
  if(bad.length){
    settingsNotice("bad","Chưa thể lưu cài đặt","Vui lòng kiểm tra và điền đầy đủ các trường thông tin bắt buộc.");
    $("#s-"+bad[0]).focus();
    return;
  }
  settingsNotice("ok","Thành công","Đã lưu thông tin dự án và liên hệ. Bạn sẽ nhận thông báo qua số điện thoại và email này.");
  $("#save").disabled=true;
});
