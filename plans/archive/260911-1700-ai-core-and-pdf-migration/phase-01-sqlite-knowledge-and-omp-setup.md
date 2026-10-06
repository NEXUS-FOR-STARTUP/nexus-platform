# Phase 01: SQLite Knowledge Base & Multi-Provider OMP Setup
> **Trạng thái:** Completed (100% Hoàn thành)


## 1. Mục tiêu (Objective)
Đưa toàn bộ cơ sở tri thức CSDL SQLite (`startup_knowledge.db`) chứa dữ liệu 12 nhóm thực tế, 14 tiêu chí và 29 bẫy lỗi sang `nexus-platform`, đồng thời cấu hình môi trường thực thi cho OMP CLI hỗ trợ cả 2 provider CheapKeyAI và Xiaomi MiMo. Không cần viết thêm các file TypeScript rườm rà.

---

## 2. Quyền Sở hữu File (File Ownership)
- `apps/api/data/knowledge/startup_knowledge.db` (SQLite DB chứa toàn bộ dữ liệu 12 nhóm sinh viên FPT)
- `apps/api/data/knowledge/startup_knowledge.json` (File JSON đồng bộ v2.0.0)
- `apps/api/data/knowledge/generate_db.ts` (Script thêm/cập nhật dữ liệu nhóm mới vào SQLite)
- `apps/api/data/knowledge/AGENTS.md` (Hướng dẫn quy trình 2 bước cho OMP Worker tra cứu SQLite)
- `apps/api/data/system_prompt/triad_framework_v1_1.md` (System Prompt Step 1: Triad Context Opening)
- `apps/api/data/system_prompt/input_clarification_gate_lite_v1_1.md` (System Prompt Step 2: Evaluation Gate Lite)
- `apps/api/data/providers.json` (Cấu hình models cho CheapKeyAI và Xiaomi MiMo)

---

## 3. Các Bước Triển khai Chi tiết (Step-by-Step Implementation)

### Bước 1.1: Sao chép CSDL SQLite & Script vào `apps/api`
1. Tạo thư mục `apps/api/data/knowledge/` và `apps/api/data/system_prompt/`.
2. Sao chép trực tiếp từ `E:\Workspace\test-agent-sanbox-web`:
   - `data/knowledge/startup_knowledge.db` $\rightarrow$ `apps/api/data/knowledge/startup_knowledge.db`
   - `data/knowledge/startup_knowledge.json` $\rightarrow$ `apps/api/data/knowledge/startup_knowledge.json`
   - `data/knowledge/generate_db.ts` $\rightarrow$ `apps/api/data/knowledge/generate_db.ts`
   - `data/knowledge/AGENTS.md` $\rightarrow$ `apps/api/data/knowledge/AGENTS.md`
   - `data/system_prompt/triad_framework_v1_1.md` $\rightarrow$ `apps/api/data/system_prompt/triad_framework_v1_1.md`
   - `data/system_prompt/input_clarification_gate_lite_v1_1.md` $\rightarrow$ `apps/api/data/system_prompt/input_clarification_gate_lite_v1_1.md`
3. Thêm script vào `apps/api/package.json`:
   ```json
   "scripts": {
     "knowledge:generate": "tsx data/knowledge/generate_db.ts"
   }
   ```

### Bước 1.2: Cấu hình Multi-Provider cho OMP (`providers.json`)
Tạo `apps/api/data/providers.json`:
```json
{
  "providers": {
    "cheapkeyai": {
      "baseUrl": "https://cheapkeyai.shop/v1beta",
      "apiKey": "${CHEAPKEYAI_API_KEY}",
      "models": {
        "gemini-3.8-flash": { "id": "gemini-3.8-flash", "contextWindow": 1000000 }
      }
    },
    "mimo": {
      "baseUrl": "https://token-plan-sgp.xiaomimimo.com/v1",
      "apiKey": "${MIMO_API_KEY}",
      "models": {
        "mimo-v2.5": { "id": "mimo-v2.5", "contextWindow": 128000 },
        "mimo-v2.5-pro": { "id": "mimo-v2.5-pro", "contextWindow": 128000 }
      }
    }
  }
}
```

---

## 4. Tiêu chí Chấp thuận (Verification)
- Kiểm tra file `startup_knowledge.db` có dung lượng đầy đủ (~147 KB).
- Kiểm tra truy vấn bảng `evaluation_criteria` có đủ 14 hàng và `evaluation_indicators` có đủ 29 hàng qua lệnh SQLite CLI:
  ```bash
  sqlite3 apps/api/data/knowledge/startup_knowledge.db "SELECT count(*) FROM evaluation_criteria; SELECT count(*) FROM evaluation_indicators;"
  ```
