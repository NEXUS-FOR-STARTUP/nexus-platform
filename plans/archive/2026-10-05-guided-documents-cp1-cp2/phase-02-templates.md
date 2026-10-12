# Phase 2: Hardcode Templates

Không dùng DB. Khai báo thẳng cấu trúc nội dung.

## 1. Cấu trúc Type (TypeScript)
Tạo `apps/api/src/modules/guided-documents/templates/types.ts`:

```typescript
export interface QuestionDef {
  id: string;
  title: string;
  instruction?: string;
  isRequired: boolean;
  unlock_requires?: string[]; // Mảng các question_id cần điền xong mới mở câu này
}

export interface SectionDef {
  id: string;
  title: string;
  questions: QuestionDef[];
}

export interface TemplateDef {
  id: string; // "cp1" | "cp2"
  title: string;
  sections: SectionDef[];
}
```

## 2. Định nghĩa CP1 & CP2
Tạo `cp1.ts`:
```typescript
import { TemplateDef } from './types';

export const CP1Template: TemplateDef = {
  id: 'cp1',
  title: 'Checkpoint 1: Problem & Customer',
  sections: [
    {
      id: 'sec_1',
      title: 'Problem Definition',
      questions: [
        { id: 'cp1_q1', title: 'What is the core problem?', isRequired: true },
        { id: 'cp1_q2', title: 'Who faces this problem?', isRequired: true, unlock_requires: ['cp1_q1'] }
      ]
    }
  ]
};
```
(Mở rộng đủ bộ câu hỏi thực tế từ file Word của trường).