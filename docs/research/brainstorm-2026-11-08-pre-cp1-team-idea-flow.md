# Brainstorm: luồng Pre-CP1 (cần tuyển ai, hướng ý tưởng, lọc ý tưởng ngáo)

**Ngày:** 2026-11-08 · **Cập nhật:** 2026-11-09 (theo demo đang chạy)
**Trạng thái:** đã thống nhất hướng + đã lập kế hoạch triển khai: `plans/261109-1500-pre-cp1-flow/plan.md`
**Nguồn nghiên cứu:** `temp-1/` (31 file, member đã làm dở) · **Demo UX:** `temp-1/demo/` · **Liên quan:** `docs/flows/team-fit-flow.md`, `packages/validation/src/catalogs/`

## 1. Vấn đề
Dịch vụ hiện tại phục vụ nhóm **đã có nhóm và ý tưởng**. Người đầu môn hoặc sắp vào môn chưa có gì để audit. Cần một luồng riêng, ngang cấp CP1 đến CP3, đặt **trước CP1**, để sau khi dùng khách biết: cần tuyển ai, nên kiểm chứng hướng nào, ý tưởng nào là vô lý.

"Triển khai lại" nghĩa là **giải bài toán mới**, web chưa có gì. `/dashboard/team-fit` hiện tại là công cụ kiểm tra nhanh cho nhóm có sẵn ý tưởng, chỉ cần cập nhật để nối với luồng mới.

## 2. Ràng buộc đã chốt
- "Tìm nhóm" = **cần tuyển người như thế nào**, không phải ghép người (không matchmaking, tránh cold-start).
- "Hợp thị trường" ở đây = **chặn sớm ý tưởng ngáo**, không chứng minh thị trường. Không được claim "ý tưởng này hợp". Không từ chối thẳng: cảnh báo và chỉ đường, chặn cứng chỉ với nhóm cấm thật (vũ khí, vi phạm pháp luật, crack bản quyền).
- **Không bắt sinh viên làm việc khó trước CP1.** Phỏng vấn khách hàng là việc của CP2. Luồng này chỉ thu dữ liệu tự khai được trong một lần ngồi (khoảng 10 phút). Mọi kết luận là **giả thuyết cần kiểm chứng**.
- Hướng toàn cầu, không gắn mã ngành đại học. Mô tả từng người bằng việc họ làm tốt và có thể làm.

## 3. Phương án đã loại
| Phương án | Lý do loại |
|---|---|
| Matchmaking người với người | Cần dân số hai phía, rủi ro kiểm duyệt và ghép sai |
| Thư viện hướng ý tưởng biên soạn tay làm trục chính | Đưa idea sẵn là sai điều nghiên cứu muốn tránh; idea phải sinh ra từ tài nguyên thật của nhóm |
| AI sinh ý tưởng tự do | Khó kiểm soát, dễ overclaim, dễ nịnh người dùng |
| Bắt phỏng vấn 5 người trước CP1 (quy tắc cô Hạnh) | Không ai làm; chuyển sang CP2 |
| Thang chấm 30 điểm của Step 4 (`sp v2.md`) | Cần dữ liệu khảo sát, chỉ dùng cho giai đoạn sau |

## 4. Thiết kế
```
Hồ sơ nhóm + tài sản  ->  Cờ cảnh báo 5 trục (luật cố định)
                      ->  Chân dung cần tuyển
                      ->  3-5 vùng khảo sát + idea nhỏ giả thuyết
                      ->  Gói chuyển giao CP2 (5 câu phỏng vấn)  ->  team-fit / CP1
```

### 4.1 Dữ liệu thu (mỗi câu phải rẻ, chủ yếu bấm chọn)
| Nhóm | Hình thức |
|---|---|
| Số người; **từng người: chuyên ngành, làm tốt gì, có thể làm gì** (chọn 9 trục năng lực mức 1 đến 3 + 1 ô mô tả ngắn) | chọn + ô ngắn |
| Ngân sách cả nhóm (không hỏi số giờ mỗi tuần: không ai đếm được, giờ thật phụ thuộc deadline các môn khác) | chọn |
| Mục tiêu (qua môn / startup thật) | chọn |
| Tầng network (bạn lớp, ký túc, quán quen, tiệm in, CLB, shop online, gia đình làm nghề...) | chọn nhiều |
| **Tài sản và nguồn lực: nhà làm nghề gì, có cửa hàng, thiết bị, xưởng, phòng lab, người quen chuyên môn...** | **mô tả tự do, có ví dụ gợi ý, không yes/no** |
| Mục nhạy cảm pháp lý (bản quyền, thực phẩm, y tế, tài chính...) | tick |
| Điều gì gần đây làm bạn hoặc người quanh bạn mất thời gian, tiền | ô tự do, không bắt buộc |
| Ý tưởng nháp nếu đã có | ô tự do, không bắt buộc |

**Lý do mô tả tự do cho tài sản:** ca đã cứu thực tế: nhóm bế tắc với dự án nông nghiệp; hỏi chuyện mới biết leader có cửa hàng bán vật tư nông nghiệp, nên pivot sang bán hạt giống và vật tư. Tài sản thật thường ẩn trong câu chuyện, không hiện ra khi hỏi có/không. Vì vậy:
- Ô tài sản có câu hỏi gợi mở và ví dụ (nhà làm nghề gì, ai quen ai, đã từng bán gì).
- AI đọc văn bản, trích **thẻ tài sản tiềm ẩn**, hiển thị lại cho người dùng xác nhận ("Mình hiểu nhà bạn có cửa hàng vật tư nông nghiệp, đúng không?"). Chỉ thẻ đã xác nhận mới vào luật.
- Tài sản đã xác nhận là nguồn **ưu tiên cao nhất** khi sinh vùng khảo sát.

### 4.2 Vai trò AI và luật
- **Luật cố định:** cờ cảnh báo, chân dung tuyển, lọc vùng khảo sát, rẽ nhánh. Không gọi AI.
- **AI chỉ làm hai việc:** (a) gán thẻ từ văn bản tự do (tài sản, ý tưởng nháp), người dùng xác nhận trước khi chạy luật; (b) diễn đạt lại phản hồi. Thiếu dữ liệu thì nói thiếu, không bịa (theo "Bước 0" của `sp v2.md`).
- Idea nhỏ đi kèm vùng khảo sát luôn ở dạng **giả thuyết**, dùng bảng thu nhỏ: app lớn thành web/Sheet; AI thành luật hoặc làm tay; marketplace thành môi giới thủ công; cấm "Nền tảng AI toàn diện", "Super app".

### 4.3 Cờ cảnh báo (5 trục)
Năng lực, Tài nguyên, Thời gian, Pháp lý, Tiếp cận khách. Cờ Thời gian suy ra từ độ nặng của ý tưởng, không hỏi người dùng. Mỗi trục trả `Ổn / Cảnh báo / Ngoài khả năng`, kèm lý do và hướng nắn. Ca mẫu (từ `temp-1/prompts/SinhVien.md`, `gg-doc/Sinh viên ngáo.md`):
- Team toàn marketing đòi làm AI sâu (năng lực) -> đổi sang dịch vụ thủ công hoặc template.
- Ly bã cà phê không xưởng, không kiến thức vật liệu (năng lực + tài nguyên) -> phân phối sản phẩm có sẵn hoặc dịch vụ gom.
- Siêu ứng dụng ERP cho quán (tài nguyên + thời gian) -> Sheet tự động hoá.
- Marketplace tài liệu (pháp lý + năng lực) -> dịch vụ audit slide.
- Giao đồ ăn nội khu (tài nguyên + thời gian + pháp lý) -> gom order theo nhóm.
- B2B với giám đốc bệnh viện (tiếp cận khách) -> hạ xuống nhóm gặp được ngay.
- "Có người quen trong ngành = validation" (năng lực + tiếp cận) -> chỉ là access để phỏng vấn, chưa phải nhu cầu thị trường.

Luật cứng từ giảng viên (`gg-doc/Tab 15.md`): vi phạm pháp luật hoặc crack bản quyền thì loại.

### 4.4 Đầu ra: một trang kết quả, 5 mục theo thứ tự người dùng cần
1. **Nhóm hiện tại** — từng người làm được gì (theo 9 trục), ai đã kể kinh nghiệm; số chuyên ngành, số mảng nghề có người.
2. **Nên tìm thêm ai** — 3 việc lõi còn trống, xếp theo mức thiếu, kèm tin đăng tuyển mẫu bấm là chép.
3. **Ý tưởng này có vấn đề gì không** — trích câu người dùng đã viết, kết luận 1 dòng, rồi 5 cảnh báo (Năng lực / Tiền / Thời gian / Luật / Gặp khách), mỗi cái có lý do và hướng nắn.
4. **Hướng thay thế để đi hỏi** — 3-5 vùng khảo sát, mỗi vùng ghi rõ là giả thuyết.
5. **Việc tiếp theo** — 5 câu hỏi phỏng vấn (`gg-doc/template 3_finnnnal3.md`) + nút **Tạo dự án từ kết quả này** (dự án giữ cả kết quả sơ bộ lẫn báo cáo AI, `Case` là nơi duy nhất chứa dữ liệu).

Dáng trang (đã dựng trong demo): khung một cột, thẻ kết luận ở đầu, hàng 3 số liệu, hàng 3 ô mảng nghề (ô "Chưa có ai" khi trống), danh sách cảnh báo xếp **2 cột từ 1024px** và 1 cột trên mobile; chữ dừng ở ~78 ký tự/dòng. Không dùng chữ "bản đồ" ở UI — gọi là **kết quả sơ bộ**. (Chi tiết kỹ thuật: 8 khối, trong đó 2 khối chỉ có khi server chấm theo ngành xong — `plans/261109-1500-pre-cp1-flow/phase-04-web-flow.md`.)

Giao diện ghi rõ "hướng nên kiểm chứng ở CP2", không ghi "ý tưởng phù hợp".

## 5. Tái sử dụng
| Nguồn | Dùng cho |
|---|---|
| `temp-1/prompts/bigboy.txt` §2, §3 | 8 module, 5 luật chống overfit network, nền cho cờ |
| `temp-1/gg-doc/template 1_finnnall.md` | khung hỏi năng lực, network, bối cảnh ngoài đời |
| `temp-1/gg-doc/Tab 15.md` | luật cứng của giảng viên |
| `temp-1/prompts/SinhVien.md`, `gg-doc/Sinh viên ngáo.md` | ca ngáo, 10 kiểu sinh viên, taxonomy bối cảnh |
| `temp-1/gg-doc/ứng dụng step 1.md` | 7 hệ khách hàng tránh tự quy chiếu về EXE |
| `temp-1/gg-doc/sp v2.md` | Bước 0 kiểm tra đủ dữ liệu, bảng thu nhỏ |
| `temp-1/gg-doc/template 3_finnnnal3.md` | 5 câu phỏng vấn cho gói chuyển giao CP2 |
| `apps/api/.../evaluate-team-fit.usecase.ts` (`ROLE_TRACK_CODES`, `computeMachineStats`) | đếm độ phủ vai trò |
| `packages/validation/src/catalogs/` | nơi đặt catalog câu hỏi, luật |

Bỏ qua: bản `(bỏ)`, bản trung gian của template, `Tab 1`, `Tab 4`, `giải thcihs`, `temp-1/prompts/systempropt.txt`, `Tab 7` (Stanford), phần triết học của `temp-1/prompts/TamDinh.md` (chỉ giữ công thức "cảnh báo + thu hẹp").

## 6. Rủi ro
- Không có bằng chứng thị trường: chắc chắn ở chiều loại vô lý, không chắc ở chiều chọn đúng. Mọi giao diện phải ghi nhãn giả thuyết.
- Chất lượng cờ phụ thuộc ngưỡng và danh mục thẻ tài sản. Ngưỡng sai thì cảnh báo oan hoặc để lọt.
- AI gán thẻ sai với tài sản lạ: giảm bằng bước xác nhận bắt buộc.
- Sinh viên khai bịa network hoặc tài sản: chưa có cách chặn ở bước này; chấp nhận vì cờ chỉ cảnh báo.
- Nghiên cứu của member nặng về IT: cần taxonomy cho ngành khác (kinh tế, ngôn ngữ, thiết kế...).
- Quyết định cũ trong `docs/nexus-document/cp2/cp2-market-research-document.md:492` (Nexus rút khỏi vai tìm ý tưởng) bị đảo ở đối tượng mới (người chưa có gì); cần ghi rõ lý do trong định vị.
- Đợt OJT sắp xong: phải ra mắt bản nhỏ nhất trước.

## 7. Còn mở
- **Thước đo thành công** chưa chốt (đề xuất: tỉ lệ người làm xong luồng rồi tạo case ở CP1).
- Kiểm tra CP2 hiện tại đã có kịch bản phỏng vấn nào để khớp gói chuyển giao.
- Ai rà ngưỡng và danh mục thẻ tài sản (member, giảng viên, bạn).
- **Thiết kế đồ hoạ có được tính là người "làm ra sản phẩm" không?** Hiện tại có (năng lực `craft`), nhưng nếu ý tưởng là web/app thì nhóm 2 người thiết kế vẫn bị báo thiếu vai sản phẩm — cần quyết trước khi làm Phase 01.
- Tên luồng: đã chốt `/dashboard/start` (không dùng "team-fit").
- Chưa đọc: nội dung link Notion ở `gg-doc/Tab 18.md`; diff `temp-1/prompts/step1.md` với `gg-doc/step1.md`.
