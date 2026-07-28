---
trigger: always_on
---

# Nexus Frontend UI/UX Design Rules v2

## 1. Design Intent

Nexus stack: **HeroUI + Tailwind**.

Interface feel: clear, focused, calm, practical, trustworthy, modern, polished, slightly creative, never confusing.

No Material Design copy. No direct Google UI copy.
Use Google-like product thinking: clarity, hierarchy, useful defaults, visible system status, understandable language, predictable interaction.

HeroUI = component base, not ceiling. Custom layout, composition, spacing, visual rhythm, product-specific UI patterns allowed when they improve experience.

## 2. Rule Priority

Priority:
1. **Non-negotiable rules**: must follow
2. **Design principles**: guide decisions, adaptable by screen
3. **Pattern suggestions**: examples, not strict requirements

Conflict priority:
1. User understanding
2. User trust
3. Task completion
4. Accessibility
5. Visual polish
6. Visual creativity

Creativity OK when it improves clarity, hierarchy, emotion, memorability. Not OK when it makes user slower, confused, less confident.

## 3. Non-Negotiable Rules

### 3.1 AI Output Must Be Explainable

AI judgment must explain itself. No unsupported claims like "Pain point chưa rõ."

Each AI finding includes: Field (which part), Status (problem type), Evidence (from input/docs), Reason (why assessed), Question (user must answer), Next action (what to do).

Missing evidence → say so. Don't fake certainty on weak input.

### 3.2 Design for Trust, Not Magic

Nexus not magic AI tool.

Avoid: "Tối ưu ý tưởng để chắc chắn pass.", "AI đảm bảo ý tưởng của bạn tốt hơn.", "Tự động sửa toàn bộ bài cho bạn."

Use: "Nexus kiểm tra tài liệu theo tiêu chí checkpoint.", "Kết quả này là bản phản biện có cấu trúc, cần được xem lại bởi supporter.", "AI draft chỉ là bản nháp, không phải quyết định cuối cùng."

### 3.3 Status Must Be Visible

Show status clearly for: case, document, payment, report, AI draft, supporter review, revision/version.

Don't rely on color alone. Include readable labels: `Chưa thanh toán`, `Đang phản biện`, `Cần làm rõ`, `Đã gửi báo cáo`, `Bản mới nhất`

### 3.4 Separate Input, Output, and Decision

Keep layers separate:
1. **Student Input**: user submitted
2. **AI Output**: AI analyzed/drafted
3. **Supporter/Admin Decision**: human reviewed/approved/rejected/sent

Don't mix user data with AI interpretation. Don't make users think AI rewrote/approved work. Don't expose internal AI drafts to students unless approved for student view.

### 3.5 Error States Must Be Actionable

Every error tells: what happened, where, what to do next.

Bad: "Upload failed."
Better: "Không thể tải ảnh minh chứng. Hãy kiểm tra định dạng file hoặc thử tải lại."

Bad: "Something went wrong."
Better: "Không thể chạy phản biện lúc này. Hãy thử lại hoặc kiểm tra tài liệu đã được cấp quyền xem."

### 3.6 Empty States Must Guide Action

No blank pages or generic "No data." Say: what's missing, why, what to do next.

Example: "Chưa có dự án phản biện nào. Hãy gửi thông tin ý tưởng và link tài liệu để bắt đầu case đầu tiên."

### 3.7 Accessibility Is Default

Minimum: readable text, clear contrast, clickable buttons, labeled form fields, errors near field, keyboard nav not broken, states not color-only, motion not excessive.

Don't sacrifice accessibility for visual effects.

## 4. Core Design Principles

Guide decisions, not rigid laws.

### 4.1 Clarity Before Decoration

Decoration OK when: improves hierarchy, directs attention, makes product feel complete, helps workflow understanding, creates trust.

Not OK when: competes with main task, makes content harder to read, looks generic AI SaaS template, adds noise without meaning.

Design intentionally.

### 4.2 One Main Job Per Screen

Each screen = one dominant user goal.

Examples: Landing (understand + start), Auth (sign in/register), Dashboard (see cases + start new), Intake (submit project stepwise), Case Workspace (understand status + continue), Supporter Review (inspect/edit/approve report), Admin (process tasks quickly).

Multiple jobs → hierarchy, sections, tabs, progressive disclosure.

### 4.3 Clear Primary Action Per Context

One primary action per focused area. Not one per page — one per section.

Rules: one primary per area, no two equally loud buttons side by side, secondary quieter, destructive not look normal.

### 4.4 Progressive Disclosure

Show most important first. Order: status → action → summary → key result → evidence → details → history.

Use expandable areas, drawers, tabs for long content. Don't force reading long blocks before user knows what to do.

### 4.5 Familiar Patterns, Product-Specific Execution

Use: form, card, table, tabs, drawer, modal, accordion, timeline, stepper, toast, status badge.

Don't let patterns make UI generic. OK to create: case progress header, report finding cards, evidence/reason panels, revision timeline, supporter review workspace, intake guidance, payment status panel.

Interaction familiar; product not visually generic.

### 4.6 Calm but Not Boring

Calm + serious (academic/startup). Not plain/empty/dead.

Use: thoughtful spacing, subtle depth, clean typography, restrained accent colors, structured cards, timeline visuals, product preview blocks, soft gradients/surfaces, clear section rhythm, micro-interactions.

Avoid: excessive animation, glowing effects, random gradients, decorative icons everywhere, equal-looking cards, dashboard clutter.

### 4.7 Reduce User Thinking Load

Don't make user guess answer format.

Bad: "Mô tả khách hàng mục tiêu."
Better: "Ai là người trực tiếp gặp vấn đề này? Họ thuộc nhóm sinh viên nào, ở tình huống nào?"

Bad: "Phân tích giải pháp thay thế."
Better: "Hiện tại họ đang xử lý vấn đề này bằng cách nào nếu chưa dùng Nexus?"

### 4.8 Plain Language, Not Marketing Language

UI copy = direct Vietnamese.

Prefer: "Gửi tài liệu", "Chạy phản biện", "Cần bổ sung", "Xem lý do", "Xem bằng chứng", "Nộp bản sửa", "Bản mới nhất", "Đã được supporter duyệt"

Avoid: "Unlock", "Enhance", "Transform", "Leverage", "AI-powered journey", "Intelligent innovation platform"

English only for tech labels / familiar product terms.

## 5. Screen-Level Guidance

### 5.1 Landing Page

More creative than internal pages.

Goal: explain Nexus, build trust, show workflow + pricing, answer FAQs, move users toward starting.

Allowed: editorial/split layout, product mockups, workflow visualization, subtle gradients, visual metaphor for critique/audit/revision, stronger visual identity.

Avoid: vague AI SaaS slogans, overpromising, exposing syllabus details, making Nexus sound like homework-doer, page too minimal to persuade.

### 5.2 Auth

Secure, clean, low-friction.

Allowed: simple form, Google OAuth, light side panel, short post-login explanation.

Avoid: heavy marketing, unnecessary animation, too many choices, noisy background.

### 5.3 Student Dashboard

Not admin table (unless many cases). Prefer: case cards, status-first, clear next action, empty state with CTA, recent activity.

Tables OK when they improve scanning. Avoid making student experience feel like backend admin.

### 5.4 Intake Flow

Guided, not bureaucratic form. May include: stage, idea, customer, pain point, alternatives, team capability, deadline, Drive URL.

Conversational look OK, but remain structured.

Do: one question at a time, lightweight progress, review before submit, validation near input, save draft, redirect to workspace after submit.

Avoid: free-form chat, huge form exposed at once, oversized progress UI, over-animated bubbles.

### 5.5 Case Workspace

Core screen. User understands: current status, latest version, payment state, action needed?, where report/discussion is.

Structure: status/action header, main content (input/report/discussion), secondary panel/timeline, version switcher (only if versions exist), progressive disclosure for findings.

No fixed 3-column if crowded → tabs, panels, responsive.

Separate: submitted input, AI/supporter feedback, discussion, activity history, payment state.

### 5.6 Report/Finding Display

Reports scannable. No AI essay. Use structured cards: severity/status, field, summary, evidence, reason, question, next action.

Evidence/reasoning collapsed by default on dense screens. User should know what to fix without reading every detail.

## 6. Implementation Rules (Light/Dark Mode & Card)

### 6.1 Dark Mode Text Colors

Hardcoded text colors (`c="#115e59"`, `color: #115e59`) break in dark mode → use CSS variables or Mantine theme color.

Mantine `c="dimmed"` auto-adapts (ok).

### 6.2 Card Background Override

Global CSS overrides `.mantine-Card-root` background with `!important`. Tailwind gradient/background classes on Card ineffective.

Fix: use inline `style` or CSS vars instead of className.

### 6.3 No Shadow on Cards

No `shadow` on Card/Paper. Border only + `borderWidth: 1.5px` for slim, premium look.

### 6.4 No Gradient Backgrounds

Solid color, no gradient.

### 6.5 CSS Variables Pattern

```css
:root {
  --cta-bg: #f0fdfa;
  --cta-border: #99f6e4;
  --cta-title: #115e59;
}
[data-mantine-color-scheme="dark"] {
  --cta-bg: rgba(13, 148, 136, 0.15);
  --cta-border: #0f766e;
  --cta-title: #5eead4;
}
```

Define in `globals.css`, use via `style={{ background: "var(--cta-bg)" }}`.
