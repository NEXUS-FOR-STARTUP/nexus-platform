// SAMPLE DATA (made up) for the Ý tưởng stage.
// 20 grading runs, newest first. Each run is only a PDF file plus its creation time: scores live inside the PDF, not in the UI.
const RUNS=Array.from({length:20},(_,i)=>{
 const d=new Date(2026,8,10+Math.floor(i*1.45),19+(i%3),(i*17)%60);
 const p=n=>String(n).padStart(2,"0");
 return {n:i+1,when:p(d.getDate())+"/"+p(d.getMonth()+1)+"/2026 "+p(d.getHours())+":"+p(d.getMinutes()),pdf:"Bao-cao-Y-tuong-lan-"+(i+1)+".pdf"};
}).reverse();

// Categories come from DOCUMENT_CATEGORY_LABELS in packages/validation/src/index.ts.
// [category label, icon, name, meta]
const DOCS=[
 ["Bản mô tả ý tưởng","file","MentorMap_Mo-ta-y-tuong.docx","DOCX · 412 KB · Phung Luu Hoang Long · 06/10/2026 21:30","Bản 2"],
 ["Slide thuyết trình","slides","MentorMap_Pitch-deck.pptx","PPTX · 3,2 MB · Phung Luu Hoang Long · 06/10/2026 21:35",""],
 ["Nghiên cứu thị trường","sheet","Khao-sat-tan-sinh-vien.xlsx","XLSX · 86 KB · Phung Luu Hoang Long · 07/10/2026 20:10",""]
];
