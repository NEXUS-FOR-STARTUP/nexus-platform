# Journal: Settings/UserMenu refactor (avatar modal + settings page) — hoàn tất

**Date:** 2026-08-13

**Branch:** `feat/ui-profile`

**Commit:** `9293531` — `feat(web): add settings sidebar and user menu modal refactor`

**Plan:** ck:cook — 3 fullstack-developer song song (phase 01; phase 02+03 gộp; phase 04)

**Status:** Done — F07 implemented, review PASS.

## Vấn đề gốc

Settings/profile UI cũ: avatar menu rời rạc, không có trang đổi profile/password tập trung, không có sidebar navigation. Người dùng phải tìm từng chức năng riêng lẻ. F07 yêu cầu hội tụ: avatar → Mantine Modal (UserMenu) + `/dashboard/settings` (sidebar profile + password), route cũ redirect về mới.

## Việc đã làm

1. **Avatar → Mantine Modal (UserMenu)** — modal 3 role, mở từ avatar header.
2. **`/dashboard/settings`** — sidebar layout (profile + password tabs).
3. **Route cũ redirect** — chuyển hướng về route mới, không duplicate.
4. **F07 implemented** — feature requirement đóng.

## Quy trình

- **ck:cook parallel**: 3 fullstack-developer chạy song song — phase 01 riêng; phase 02+03 gộp; phase 04 riêng.
- **Explore audit** trước khi code — blast radius rõ.
- **Code reviewer** 8.4/10 — **PASS**.
- **Tester** — **PASS**.
- **check-types** — **PASS**.
- **13 file mới** — eslint sạch (không warning).

## Bài học kỹ thuật

1. **Better Auth mutations trả `{data, error}` — KHÔNG throw.** `mutationFn` phải tự check `error` field, không thể dựa vào try/catch. Đây là khác biệt cốt lõi so với fetch/axios pattern.
2. **TanStack Form v1.33 FieldApi thiếu default generics** (23 type args khi viết tay) → **bỏ annotation hẳn**, để TS infer. Viết generics tay là tự bắn chân.
3. **`handleSubmit` re-throw** → dùng `mutate` thay vì `mutateAsync`. `mutateAsync` re-throw làm lộ error ra ngoài vòng lifecycle của form; `mutate` âm thầm xử lý trong mutation state.
4. **`onChangeListenTo`** — dùng cho linked fields (2 field phụ thuộc nhau cần re-validate khi field kia đổi).
5. **Turbo `check-types` kéo theo `prisma:generate`** — cần `DATABASE_URL` có mặt, nếu không task chết ngay từ prebuild. Env-dependent, không chỉ là type check thuần.

## Nợ phát sinh

- **Lint repo-wide: 206 vấn đề pre-existing** (react-hooks v6 `set-state-in-effect`...). KHÔNG phải do refactor này gây ra — file mới sạch. **Defer thành task riêng**, chưa fix. Nợ từ trước, không đổ vào PR này.

## QA thủ công còn lại

- [ ] Login redirect chain (sau login → về đúng trang).
- [ ] Đổi tên → refetch navbar.
- [ ] Đổi password 2 tab (profile + settings).
- [ ] Modal hoạt động cả 3 role.

## Cảm nghĩ

Phần khó không phải UI — là **trận chiến type**. TanStack Form v1.33 + Better Auth `{data,error}` pattern ăn nhiều thời gian nhất, toàn chuyện "thư viện không làm những gì mình nghĩ nó làm". Kinh nghiệm đắt: **đọc API signature trước khi viết, không đoán theo intuition của React 18**. `mutateAsync` re-throw và generics 23 args là 2 cú đau thật, sau này ai đụng form/profile phải nhớ.

Mát lòng: 13 file mới eslint sạch, review 8.4/10 PASS, cả tester lẫn check-types đều xanh. Nợ lint 206 vấn đề là cục nợ to đè vai repo từ lâu — defer đúng, không nhét vào PR profile.

## Pending

- [ ] Task riêng: triage + fix 206 lint pre-existing (react-hooks v6 set-state-in-effect trước)
- [ ] QA thủ công 4 mục trên (login chain, navbar refetch, đổi pass 2 tab, modal 3 role)
