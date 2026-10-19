// SAMPLE DATA (made up) for the Thị trường stage. Matches history.js: 2 successful grading runs, 0 credits left, no documents yet.
const MARKET_RUNS=[
 {n:2,when:"11/10/2026 16:48",pdf:"Bao-cao-Thi-truong-lan-2.pdf"},
 {n:1,when:"10/10/2026 21:07",pdf:"Bao-cao-Thi-truong-lan-1.pdf"}
];

// One entry per stage with a detail page. Views read D (the entry for ?stage=...) so they stay stage-agnostic.
// `more`: document categories the student can still add (labels from DOCUMENT_CATEGORY_LABELS).
const STAGE_DATA={
 "y-tuong":{name:"Ý tưởng",phases:CP1_PHASES,docs:DOCS,runs:RUNS,credits:2,more:"Kế hoạch tài chính, Tài liệu bổ sung"},
 "thi-truong":{name:"Thị trường",phases:CP2_PHASES,docs:[],runs:MARKET_RUNS,credits:0,more:"Nghiên cứu thị trường, Tài liệu bổ sung"}
};
const STAGE=new URLSearchParams(location.search).get("stage")||"";
// List views have no stage: fall back to y-tuong so their (hidden) panes still render.
const D=STAGE_DATA[STAGE]||STAGE_DATA["y-tuong"];
const countQs=d=>{const all=d.phases.flatMap(p=>p.questions);return[all.filter(q=>q.answer).length,all.length]};
for(const k in STAGE_DATA){const s=STAGE_DATA[k],[a,t]=countQs(s);
 s.note=a+"/"+t+" câu · "+s.docs.length+" tệp · "+(s.credits?"còn "+s.credits+" lượt chấm":"hết lượt chấm");}
