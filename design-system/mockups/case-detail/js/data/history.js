const CASE_CODE="NX-894046"; // shown on Tổng quan and used in bank transfer content; defined once, here
// SAMPLE DATA (made up). Balances net to 2 lượt Ý tưởng, 0 lượt Thị trường.
const NOW=new Date("2026-10-12");
// [iso, display, title, stage note, type, amount, tone, status]
const MONEY=[
 ["2026-10-12","12/10/2026 02:20","Cộng lượt chấm vào số dư","Giai đoạn Ý tưởng","buy","+2","ok","Thành công"],
 ["2026-10-11","11/10/2026 16:48","Chấm bài","Giai đoạn Thị trường","use","−1","ok","Thành công"],
 ["2026-10-11","11/10/2026 16:20","Hoàn lượt chấm do lỗi hệ thống","Giai đoạn Thị trường","refund","+1","ok","Đã hoàn"],
 ["2026-10-11","11/10/2026 15:52","Chấm bài","Giai đoạn Thị trường","use","−1","warn","Lỗi, đã hoàn lượt"],
 ["2026-10-10","10/10/2026 21:07","Chấm bài","Giai đoạn Thị trường","use","−1","ok","Thành công"],
 ["2026-10-09","09/10/2026 10:30","Mua lượt chấm","Giai đoạn Thị trường · VietQR","buy","+2","ok","Thành công"],
 ["2026-10-08","08/10/2026 19:15","Chấm bài","Giai đoạn Ý tưởng","use","−1","ok","Thành công"],
 ["2026-10-07","07/10/2026 20:30","Chấm bài","Giai đoạn Ý tưởng","use","−1","ok","Thành công"],
 ["2026-10-06","06/10/2026 21:42","Chấm bài","Giai đoạn Ý tưởng","use","−1","ok","Thành công"],
 ["2026-10-06","06/10/2026 09:15","Mua lượt chấm","Giai đoạn Ý tưởng · VietQR","buy","+3","ok","Thành công"]
];
const U="Phung Luu Hoang Long (Sinh viên)";
// [day, list of [time, title, detail, actor, type]]
const EVENTS=[
 ["12/10/2026",[["02:20","Cộng 2 lượt chấm vào giai đoạn Ý tưởng","Số dư giai đoạn Ý tưởng tăng từ 0 lên 2 lượt.","Hệ thống","pay"],["02:20","Nâng cấp gói dịch vụ","Gói dịch vụ của hồ sơ đã được nâng cấp thành công.",U,"pay"]]],
 ["11/10/2026",[["16:48","Kết quả chấm giai đoạn Thị trường đã sẵn sàng","Lần chấm hoàn tất sau 4 phút. Xem ở mục Hành trình.","Hệ thống","grade"],["16:20","Hoàn 1 lượt chấm giai đoạn Thị trường","Lần chấm lúc 15:52 gặp lỗi hệ thống nên lượt chấm được hoàn lại tự động.","Hệ thống","pay"],["15:52","Chấm bài giai đoạn Thị trường gặp lỗi","Tiến trình chấm bị gián đoạn. Bài soạn được giữ nguyên, bạn có thể chấm lại.","Hệ thống","grade"]]],
 ["10/10/2026",[["21:07","Gửi chấm bài giai đoạn Thị trường","Dùng 1 lượt chấm. Còn 1 lượt.",U,"grade"]]],
 ["09/10/2026",[["10:30","Mua 2 lượt chấm giai đoạn Thị trường","Thanh toán thành công qua VietQR.",U,"pay"],["10:12","Mở giai đoạn Thị trường","Giai đoạn mở sau khi bạn trả lời đủ 22/22 câu của giai đoạn Ý tưởng.","Hệ thống","project"]]],
 ["08/10/2026",[["19:15","Gửi chấm bài giai đoạn Ý tưởng","Dùng 1 lượt chấm. Hết lượt chấm của giai đoạn Ý tưởng.",U,"grade"]]],
 ["07/10/2026",[["20:30","Gửi chấm bài giai đoạn Ý tưởng","Dùng 1 lượt chấm. Còn 1 lượt.",U,"grade"]]],
 ["06/10/2026",[["21:42","Gửi chấm bài giai đoạn Ý tưởng","Dùng 1 lượt chấm. Còn 2 lượt.",U,"grade"],["09:15","Mua 3 lượt chấm giai đoạn Ý tưởng","Thanh toán thành công qua VietQR.",U,"pay"],["09:05","Tạo dự án MentorMap","Bắt đầu trả lời các câu hỏi của giai đoạn Ý tưởng.",U,"project"]]]
];

// ---- Detail of each billing row, shown when the row is expanded. SAMPLE DATA (ids, prices, bank refs are made up).
// Field names follow the real contract: CreditEntry (id, reference_id, balance_after, service_type_code),
// Order and OrderItem (id, items, unit_price, amount, total_amount) and the Deposit bank fields
// (transfer_content, bank_transaction_id, bank_credited_at, verification_source). The product has to join these for the expanded view.
const SVC={"Ý tưởng":["cp1_audit","Lượt chấm vòng Ý tưởng"],"Thị trường":["cp2_audit","Lượt chấm vòng Thị trường"]};
const PRICE_PER_CREDIT=50000; // sample
const fmtVND=n=>n.toLocaleString("vi-VN")+" VND";
const hexOf=(seed,len)=>{let x=seed>>>0,o="";while(o.length<len){x=(Math.imul(x,1664525)+1013904223)>>>0;o+=(x>>>8).toString(16).padStart(6,"0")}return o.slice(0,len)};
const uid=n=>[8,4,4,4,12].map((l,j)=>hexOf(n*97+j*13+5,l)).join("-");
{
  const bal={"Ý tưởng":0,"Thị trường":0},runNo={"Ý tưởng":0,"Thị trường":0};
  const TT_JOB="1a913f8e-"+uid(901).slice(9); // the latest Thị trường run, same short id as the grading panel
  const failedJob=uid(402);
  for(let i=MONEY.length-1;i>=0;i--){ // oldest first so balance_after accumulates
    const r=MONEY[i],stage=r[3].includes("Ý tưởng")?"Ý tưởng":"Thị trường",delta=parseInt(r[5].replace("−","-"),10);
    bal[stage]+=delta;
    const d={id:uid(100+i),at:r[1]+":"+String((i*17+9)%60).padStart(2,"0"),stage,svc:SVC[stage][0],svcLabel:SVC[stage][1],delta:r[5],balance:bal[stage]};
    if(r[4]==="use"){
      runNo[stage]++;
      const failed=r[6]==="warn";
      d.ref=failed?failedJob:(stage==="Thị trường"&&i===1?TT_JOB:uid(300+i));
      d.refLabel="Mã lần chấm";d.run="Lần "+runNo[stage];
      d.how="Trừ khi bấm Chấm bài";
      if(failed)d.failed="Lần chấm bị gián đoạn. Lượt chấm được hoàn tự động, xem giao dịch hoàn bên trên.";
    }else if(r[4]==="refund"){
      d.ref=failedJob;d.refLabel="Mã lần chấm bị lỗi";d.how="Hoàn tự động sau lỗi hệ thống";
    }else if(r[2].startsWith("Mua")){
      const qty=delta,oid=uid(200+i);
      d.ref=oid;d.refLabel="Mã đơn hàng";d.how="Mua qua VietQR";
      d.order={id:oid,status:"Đã thanh toán",items:[[SVC[stage][1],qty,fmtVND(PRICE_PER_CREDIT),fmtVND(qty*PRICE_PER_CREDIT)]],total:fmtVND(qty*PRICE_PER_CREDIT)};
      d.pay={method:"VietQR",content:"NEXUS "+CASE_CODE.replace("-","")+" "+oid.slice(0,8).toUpperCase(),bank:"FT"+hexOf(i+7,12).toUpperCase(),credited:d.at,verify:"Tự động (khớp nội dung chuyển khoản)"};
    }else{
      d.ref=uid(500);d.refLabel="Mã nâng cấp gói";d.how="Nâng cấp gói dịch vụ (hệ thống cộng)";
    }
    r.push(d);
  }
}
