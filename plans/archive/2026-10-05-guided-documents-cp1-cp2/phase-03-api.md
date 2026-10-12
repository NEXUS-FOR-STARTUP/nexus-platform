# Phase 3: API Authoring (Upsert)

API rất mỏng, chỉ thực hiện lưu và đọc state mới nhất. Không chứa logic rà soát (needs_review).

## 1. GET /api/v1/guided-documents/:caseId
**Logic:**
- Nhận `templateId` (hoặc lookup từ case_id).
- Lấy `TemplateDef` từ TS.
- Query `ProjectAnswer` theo `case_id`.
- Trả về JSON trộn lẫn (Cấu trúc Template + nội dung current answers).

## 2. PUT /api/v1/guided-documents/:caseId/answers
**Body:**
```json
{
  "answers": [
    { "question_id": "cp1_q1", "answer_text": "Lỗi phần mềm..." },
    { "question_id": "cp1_q2", "answer_text": "Sinh viên..." }
  ]
}
```
**Logic:**
- Lặp qua mảng answers, dùng `prisma.projectAnswer.upsert()` (hoặc batch upsert raw query tùy tối ưu).
- Cập nhật text mới nhất. Không check logic mâu thuẫn, không check `needs_review`.
- Trả về OK 200.