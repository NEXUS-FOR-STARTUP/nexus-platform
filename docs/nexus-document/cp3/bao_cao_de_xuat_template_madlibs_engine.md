# BÁO CÁO ĐỀ XUẤT GIẢI PHÁP

## Hệ thống Template Mad Libs kết hợp Engine Đánh giá Team-Idea Fit
### Dành cho sinh viên EXE101 — Giai đoạn định hướng ý tưởng khởi nghiệp

---

## 1. Tóm tắt đề xuất

Đề xuất xây dựng một hệ thống gồm hai thành phần chính:

1. **Template Mad Libs (Fill-in-the-blank)**: Một câu template có sẵn với các ô trống, giúp sinh viên mô tả ý tưởng khởi nghiệp mà không cần hiểu thuật ngữ chuyên ngành phức tạp.
2. **Team-Idea Fit Engine**: Một engine đánh giá tự động, so khớp thông tin đội ngũ với yêu cầu kỹ năng của lĩnh vực dự án, trả về đánh giá sơ bộ về tính khả thi và điểm mạnh/điểm yếu của đội ngũ.

Mục tiêu: Giúp sinh viên mới tiếp cận EXE101 có thể **phát biểu ý tưởng có cấu trúc** và **tự đánh giá sự phù hợp giữa đội ngũ và ý tưởng** ngay từ giai đoạn đầu.

---

## 2. Phân tích vấn đề

### 2.1. Vấn đề của người dùng mục tiêu

Sinh viên năm nhất/năm hai khi bắt đầu học EXE101 thường gặp phải các khó khăn sau:

| Khó khăn | Biểu hiện |
|----------|-----------|
| **Chưa quen thuật ngữ** | Không hiểu rõ "pain point", "solution", "MVP", "target customer" là gì |
| **Không biết cách phát biểu ý tưởng** | Mô tả lan man, thiếu cấu trúc, không trả lời được "làm cho ai, giải quyết gì, bằng cách nào" |
| **Không đánh giá được đội ngũ** | Không biết background của mình có phù hợp với ý tưởng không, thiếu kỹ năng gì |
| **Thiếu công cụ định hướng** | Chưa có công cụ nào giúp sinh viên tự kiểm tra trước khi gặp mentor |

### 2.2. Bối cảnh sử dụng

- **Người dùng**: Sinh viên EXE101, nhóm 13, giai đoạn Checkpoint 3 (hoặc sớm hơn)
- **Mục đích**: Định hướng ý tưởng, đánh giá sơ bộ đội ngũ trước khi phát triển sâu
- **Yêu cầu**: Free version, không cần hiểu thuật ngữ chuyên ngành, chỉ cần điền ô trống

---

## 3. Mô tả giải pháp

### 3.1. Thành phần 1: Template Mad Libs — Mô tả ý tưởng

Một câu template duy nhất với 6 ô trống, mỗi ô có câu dẫn định hướng bằng tiếng Việt đơn giản:

> **"Dự án của chúng tôi tên là [tên dự án], thuộc lĩnh vực [lĩnh vực]. Chúng tôi giúp [khách hàng mục tiêu cụ thể] giải quyết [vấn đề/nhu cầu cụ thể] bằng cách [giải pháp/sản phẩm]. Sản phẩm khả dụng đầu tiên (MVP) sẽ là [mô tả MVP]."**

**Bảng câu dẫn cho từng ô trống:**

| Ô trống | Câu dẫn định hướng | Ví dụ điền |
|---------|-------------------|------------|
| [tên dự án] | "Đặt tên gì cho dự án của bạn?" | LearnPath |
| [lĩnh vực] | "Dự án thuộc lĩnh vực nào? (giáo dục, y tế, công nghệ, thương mại...)" | EdTech |
| [khách hàng mục tiêu] | "Ai là người bạn muốn giúp? Càng cụ thể càng tốt." | Sinh viên năm 1-2 đại học |
| [vấn đề/nhu cầu] | "Họ đang gặp khó khăn gì? Cần gì mà chưa được đáp ứng?" | Không biết cách học hiệu quả, lãng phí thời gian tìm phương pháp |
| [giải pháp] | "Bạn sẽ giúp họ bằng cách nào? Sản phẩm/dịch vụ gì?" | App gợi ý lộ trình học cá nhân hóa |
| [MVP] | "Phiên bản đầu tiên khả dụng của sản phẩm trông như thế nào?" | Web app cho phép nhập môn học → nhận lộ trình học 2 tuần |

**Nguyên tắc thiết kế:**
- Không sử dụng thuật ngữ chuyên ngành trong câu dẫn (không dùng "pain point", "value proposition")
- Sinh viên chỉ cần trả lời câu hỏi đời thường
- Output là một đoạn văn hoàn chỉnh, có cấu trúc logic

### 3.2. Thành phần 2: Bảng thông tin đội ngũ

Sau khi hoàn thành phần ý tưởng, người dùng khai báo thông tin đội ngũ:

| Trường | Mô tả | Giới hạn |
|--------|-------|----------|
| Số lượng thành viên | Nhập số (1-6) | Tối đa 6 người theo format syllabus |
| Chuyên ngành đào tạo | Ngành học chính thức | Ví dụ: CNTT, Sư phạm, Kinh tế |
| Sở trường / Kỹ năng nổi bật | Điều mỗi người làm tốt nhất | Ví dụ: Lập trình web, thiết kế bài giảng |
| Kinh nghiệm đặc biệt | Project, internship, hoạt động ngoại khóa | Ví dụ: 2 project React, 1 năm gia sư |

### 3.3. Thành phần 3: Team-Idea Fit Engine

Engine tự động đánh giá dựa trên dữ liệu từ 2 thành phần trên.

---

## 4. Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KIẾN TRÚC TỔNG QUAN                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐      ┌──────────────┐      ┌──────────────────────────┐  │
│   │  INPUT LAYER │      │ PROCESS LAYER│      │      OUTPUT LAYER        │  │
│   │              │      │              │      │                          │  │
│   │ • Template A │─────▶│ • Skill Map  │─────▶│ • Đánh giá tổng quan     │  │
│   │   (Ý tưởng)  │      │   Database   │      │ • Điểm mạnh / Điểm yếu   │  │
│   │              │      │              │      │ • Khuyến nghị cụ thể     │  │
│   │ • Template B │─────▶│ • Keyword    │      │                          │  │
│   │   (Đội ngũ)  │      │   Extractor  │      │                          │  │
│   │              │      │              │      │                          │  │
│   │              │      │ • Scoring    │      │                          │  │
│   │              │      │   Algorithm  │      │                          │  │
│   │              │      │              │      │                          │  │
│   │              │      │ • Report     │      │                          │  │
│   │              │      │   Generator  │      │                          │  │
│   └──────────────┘      └──────────────┘      └──────────────────────────┘  │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      FEEDBACK LOOP (Tùy chọn)                        │   │
│   │   Mentor đánh giá output → Điều chỉnh keyword mapping → Cải thiện   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Cơ chế hoạt động của Team-Idea Fit Engine

### 5.1. Bước 1: Xây dựng Skill Map theo lĩnh vực

Mỗi lĩnh vực được định nghĩa một bộ kỹ năng tối thiểu cần có, với mức độ quan trọng phân loại.

**Ví dụ: Skill Map cho lĩnh vực EdTech**

| Kỹ năng cần thiết | Mức quan trọng | Lý do |
|-------------------|----------------|-------|
| Technical (phát triển sản phẩm) | **Cao** | EdTech là sản phẩm công nghệ, cần người xây dựng |
| UX/UI / Pedagogy (hiểu người học) | **Cao** | Sản phẩm giáo dục phải phù hợp tâm lý và quá trình học |
| Business Model (mô hình kinh doanh) | Trung bình | Cần biết cách thu phí, nhưng có thể học sau |
| Marketing / Growth | Trung bình | Cần để có người dùng, nhưng MVP trước đã |
| Content / Curriculum | Trung bình | Cần nội dung học, có thể outsource ban đầu |

**Các lĩnh vực khác trong database:**
- HealthTech
- E-commerce
- Fintech
- AgriTech
- Logistics
- Social Impact
- (Có thể mở rộng thêm)

### 5.2. Bước 2: Trích xuất kỹ năng từ đội ngũ (Keyword Extraction)

Engine phân tích văn bản tự nhiên từ input của người dùng để xác định kỹ năng.

**Quy tắc mapping từ khóa → Skill Category:**

| Từ khóa trong input | Skill Category | Điểm cơ sở |
|---------------------|----------------|------------|
| CNTT, IT, lập trình, code, dev, software | Technical | 2 |
| React, Vue, Angular, mobile app, iOS, Android | Technical (specific) | +1 |
| Sư phạm, giáo dục, dạy học, pedagogy, giảng viên | Domain / Pedagogy | 2 |
| Thiết kế, UI, UX, Figma, Adobe | UX/UI | 2 |
| Kinh tế, business, marketing, bán hàng, sales | Business | 2 |
| Phân tích dữ liệu, Excel, data, SQL, Python data | Data / Analytics | 1 |
| "Chưa có", "không có", "đang học", "học thôi" | Không có kinh nghiệm | 0 |
| "project", "internship", "làm việc", "kinh nghiệm" + số lượng | Proof of experience | +1 |

**Ví dụ phân tích:**
- Input: "CNTT, Lập trình web, 2 project React"
- Kết quả: `{ Technical: 2, Technical_specific: 1, Experience: 1 }` → Tổng: 4 điểm

### 5.3. Bước 3: So khớp và tính điểm (Scoring Algorithm)

```
Với mỗi kỹ năng trong Skill Map của lĩnh vực:

    IF skill được phát hiện trong team:
        IF có kinh nghiệm thực tế (project, internship, chứng minh được):
            → Score = 2 (Đủ mạnh)
        ELSE (chỉ có học thuật / lý thuyết):
            → Score = 1 (Cơ bản, cần mentor / học thêm)
    ELSE (skill không có trong team):
        IF mức quan trọng = Cao:
            → Gap = Nghiêm trọng
        IF mức quan trọng = Trung bình:
            → Gap = Có thể chấp nhận tạm thời

TỔNG ĐIỂM = Σ(điểm các skill có) / Σ(điểm tối đa của tất cả skill cần) × 100%
```

**Phân loại kết quả:**

| Tổng điểm | Phân loại | Ý nghĩa |
|-----------|-----------|---------|
| 80-100% | **Strong fit** | Đội ngũ đủ kỹ năng cốt lõi, có thể bắt đầu ngay |
| 50-79% | **Moderate fit** | Có điểm mạnh nhưng thiếu 1-2 kỹ năng quan trọng |
| 30-49% | **Weak fit** | Thiếu nhiều kỹ năng, cần bổ sung thành viên hoặc đổi ý tưởng |
| <30% | **Poor fit** | Đội ngũ không phù hợp với lĩnh vực, nên xem xét lại |

### 5.4. Bước 4: Sinh báo cáo (Report Generator)

Output được cấu trúc thành 4 phần:

**Phần 1: Tổng quan (1 câu)**
> "Với đội ngũ [n] thành viên có nền tảng [liệt kê chuyên ngành], dự án [tên] trong lĩnh vực [lĩnh vực] — theo đánh giá sơ bộ ban đầu: [phân loại]."

**Phần 2: Điểm mạnh (list có bằng chứng)**
- Liệt kê các skill đã có, kèm thông tin thành viên cụ thể và bằng chứng (project, kinh nghiệm)

**Phần 3: Điểm yếu / Cần bổ sung (list có mức độ)**
- Liệt kê các skill thiếu, ghi rõ mức quan trọng (Cao / Trung bình)

**Phần 4: Khuyến nghị (1-2 câu hành động)**
- Nên tìm thêm vai trò gì
- Hoặc nên tập trung vào phần nào trước

---

## 6. Luồng dữ liệu end-to-end

```
Người dùng (Sinh viên)
    │
    ▼
┌─────────────────────────────────────┐
│ Bước 1: Điền Template A (Ý tưởng)   │
│ • Tên dự án                         │
│ • Lĩnh vực ←── Quyết định Skill Map │
│ • Khách hàng                        │
│ • Vấn đề                            │
│ • Giải pháp                         │
│ • MVP                               │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Bước 2: Điền Template B (Đội ngũ)   │
│ • Thành viên 1: Chuyên ngành,       │
│   Sở trường, Kinh nghiệm            │
│ • Thành viên 2: ...                 │
│ • Tối đa 6 người                    │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Bước 3: Engine xử lý                │
│ • Lấy lĩnh vực → Load Skill Map     │
│ • Extract skill từ mỗi thành viên   │
│ • So khớp: Có vs Cần                │
│ • Tính điểm + Phân loại             │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Bước 4: Trả kết quả (Free Version)  │
│ • Đánh giá sơ bộ bằng văn bản       │
│ • Điểm mạnh / Điểm yếu              │
│ • Khuyến nghị                       │
└─────────────────────────────────────┘
```

---

## 7. Ví dụ minh họa đầy đủ

### Input

**Phần A — Ý tưởng:**

| Trường | Giá trị |
|--------|---------|
| Tên dự án | LearnPath |
| Lĩnh vực | EdTech |
| Khách hàng | Sinh viên năm 1-2 đại học |
| Vấn đề | Không biết cách học hiệu quả, lãng phí thời gian tìm phương pháp |
| Giải pháp | App gợi ý lộ trình học cá nhân hóa dựa trên điểm mạnh |
| MVP | Web app cho phép nhập môn học → nhận lộ trình học 2 tuần |

**Phần B — Đội ngũ:**

| Thành viên | Chuyên ngành | Sở trường | Kinh nghiệm |
|------------|--------------|-----------|-------------|
| A | CNTT | Lập trình web | 2 project React |
| B | Sư phạm Tiếng Anh | Thiết kế bài giảng | 1 năm gia sư |
| C | Kinh tế | Phân tích dữ liệu, Excel | Chưa có |

### Xử lý Engine

**Skill Map EdTech cần:**
1. Technical (dev) — Cao — Tối đa 2 điểm
2. UX/UI / Pedagogy — Cao — Tối đa 2 điểm
3. Business model — Trung bình — Tối đa 2 điểm
4. Marketing / Growth — Trung bình — Tối đa 2 điểm
5. Content / Curriculum — Trung bình — Tối đa 2 điểm

**Extract skill từ team:**
- A: CNTT + Lập trình web + 2 project React → Technical = 2, Experience = 1
- B: Sư phạm + Thiết kế bài giảng + 1 năm gia sư → Pedagogy = 2, UX = 1, Experience = 1
- C: Kinh tế + Phân tích dữ liệu + Excel + Chưa có → Data = 1, Business = 0 (chưa có kinh nghiệm)

**So khớp:**

| Skill cần | Có trong team? | Điểm đạt | Gap? |
|-----------|----------------|----------|------|
| Technical (dev) | ✅ A | 2 | Không |
| UX/UI / Pedagogy | ✅ B | 2 | Không |
| Business model | ⚠️ C (lý thuyết, chưa thực tế) | 1 | Cần bổ sung |
| Marketing / Growth | ❌ Không ai | 0 | **Thiếu** |
| Content / Curriculum | ⚠️ B (có thể cover) | 1 | Tạm ổn |

**Tính điểm:**
- Tổng điểm đạt: 2 + 2 + 1 + 0 + 1 = 6
- Tổng điểm tối đa: 2 + 2 + 2 + 2 + 2 = 10
- Tỷ lệ: 6/10 = **60% → Moderate fit**

### Output

> **Đánh giá sơ bộ:**
>
> Với đội ngũ 3 thành viên có nền tảng CNTT, Sư phạm Tiếng Anh, Kinh tế — dự án **LearnPath** trong lĩnh vực **EdTech** — theo đánh giá sơ bộ ban đầu: **Moderate fit** (khá ổn nhưng cần bổ sung).
>
> **Điểm mạnh:**
> - ✅ **Phát triển sản phẩm**: Thành viên A (CNTT) có kinh nghiệm lập trình web thực tế (2 project React)
> - ✅ **Hiểu người học**: Thành viên B (Sư phạm) có kinh nghiệm thiết kế bài giảng và 1 năm gia sư
>
> **Cần bổ sung:**
> - ⚠️ **Mô hình kinh doanh**: Thành viên C có nền tảng Kinh tế nhưng chưa có kinh nghiệm thực tế về business model cho startup
> - ❌ **Marketing / Growth**: Chưa có ai trong team có kỹ năng này — mức quan trọng: Trung bình
>
> **Khuyến nghị:**
> - Nên tìm thêm 1 thành viên có kinh nghiệm **marketing/growth** hoặc **business development**, hoặc thành viên C cần tập trung học về monetization model cho EdTech trong tuần tới.
> - Ưu tiên xây dựng MVP trước (đội đã đủ kỹ năng technical + pedagogy), sau đó bổ sung business model.

---

## 8. Lợi ích của giải pháp

| Đối tượng | Lợi ích |
|-----------|---------|
| **Sinh viên** | Không cần hiểu thuật ngữ chuyên ngành vẫn mô tả được ý tưởng có cấu trúc; tự đánh giá được đội ngũ trước khi gặp mentor |
| **Mentor/Giảng viên** | Tiết kiệm thời gian hướng dẫn cơ bản; sinh viên đến gặp đã có nền tảng rõ ràng |
| **Nhóm dự án** | Có công cụ định hướng nội bộ, lặp đi lặp lại để giữ đúng hướng |
| **Nhà phát triển** | Kiến trúc đơn giản, dễ triển khai; có thể mở rộng thêm lĩnh vực và từ khóa |

---

## 9. Hạn chế và hướng phát triển

### 9.1. Hạn chế hiện tại

| Hạn chế | Mô tả |
|---------|-------|
| **Keyword extraction đơn giản** | Hiện tại dựa trên từ khóa cứng, chưa xử lý ngôn ngữ tự nhiên phức tạp |
| **Skill map cố định** | Mới có sẵn một số lĩnh vực phổ biến, chưa cover hết các ngành |
| **Đánh giá định tính** | Output là "sơ bộ", không thay thế đánh giá chuyên sâu của mentor |
| **Chưa có validation thực tế** | Cần test với nhiều nhóm sinh viên thực tế để điều chỉnh độ chính xác |

### 9.2. Hướng phát triển

| Giai đoạn | Nội dung |
|-----------|----------|
| **Ngắn hạn** | Triển khai với 5-7 lĩnh vực phổ biến; thu thập feedback từ mentor EXE101 |
| **Trung hạn** | Tích hợp NLP cơ bản để hiểu mô tả tự do của sinh viên tốt hơn; mở rộng database từ khóa |
| **Dài hạn** | Tích hợp vào hệ thống lớn hơn (ví dụ: nền tảng quản lý dự án EXE101); thêm tính năng gợi ý mentor phù hợp với skill gap |

---

## 10. Kết luận

Giải pháp **Template Mad Libs + Team-Idea Fit Engine** đáp ứng đúng yêu cầu của mentor: giúp sinh viên mới tiếp cận EXE101 có thể **phát biểu ý tưởng có cấu trúc** thông qua việc điền ô trống đơn giản, đồng thời **tự đánh giá sự phù hợp giữa đội ngũ và ý tưởng** ngay từ đầu.

Cơ chế engine dựa trên **so khớp skill map** và **keyword extraction**, đủ đơn giản để triển khai trong phiên bản miễn phí nhưng vẫn mang lại giá trị định hướng thực tế cho người dùng.

---

*Ngày lập báo cáo: 20/07/2026*
*Phiên bản: 1.0*
