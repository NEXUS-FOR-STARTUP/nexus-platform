// SAMPLE STATES (made up) for the Thị trường question list, so every row state of the real GuidedTOC is visible:
// answered, empty, thin (a CP2 answer under 10 words), locked (needs an earlier answer), active, "Quan trọng".
// Default is "partial". Open the page with ?answers=all to see the catalog's own sample answers: 26 of 27, the last question stays empty on purpose.
const ANSWER_MODE=new URLSearchParams(location.search).get("answers")==="all"?"all":"partial";
const THIN_WORDS=10; // mirrors THIN_ANSWER_WORDS in answer-quality.ts; the server stays the authority at grading time
const CP2_CRITICAL=["cp2_expert_interviews","cp2_survey","cp2_ai_disclosure"]; // keys of CP2_SELF_CHECK_BY_QUESTION
if(ANSWER_MODE==="partial"){
 const patch={
  cp2_expert_interviews:"Đã phỏng vấn 3 chuyên gia.", // thin: 6 words
  cp2_survey:"",          // empty and required, so the next question is locked
  cp2_question_bank:"",   // locked by the survey; cannot hold an answer yet
  cp2_marketing_4p:""     // empty but open
 };
 for(const p of CP2_PHASES)for(const q of p.questions)if(q.id in patch)q.answer=patch[q.id];
}
