// ── Page Setup ──────────────────────────────────────────────────────────────
#set page(
  paper: "a4",
  margin: (top: 20mm, right: 16mm, bottom: 20mm, left: 18mm),
  header: context {
    if counter(page).get().first() > 1 {
      set text(size: 9pt, fill: rgb(100, 116, 139))
      [BÁO CÁO THẨM ĐỊNH Ý TƯỞNG KHỞI NGHIỆP]
      h(1fr)
      counter(page).display()
      v(4pt)
      line(length: 100%, stroke: 0.4pt + rgb(180, 180, 180))
    }
  },
  footer: context {
    line(length: 100%, stroke: 0.4pt + rgb(180, 180, 180))
    v(4pt)
    set text(size: 9pt, fill: rgb(130, 130, 130))
    
    h(1fr)
    [Trang #counter(page).display("1 / 1", both: true)]
  },
)

// ── Typography ──────────────────────────────────────────────────────────────
#set text(font: "Merriweather", size: 12pt, lang: "vi")
#set par(justify: false, leading: 0.75em, spacing: 1.6em)
#set heading(numbering: none)

// Heading styles
#show heading.where(level: 1): it => {
  set text(size: 16pt, weight: "bold", fill: rgb(15, 23, 42))
  v(24pt)
  it
  v(4pt)
  line(length: 100%, stroke: 0.5pt + rgb(180, 180, 180))
  v(14pt)
}

#show heading.where(level: 2): it => {
  set text(size: 14pt, weight: "bold", fill: rgb(15, 23, 42))
  v(18pt)
  it
  v(8pt)
}

#show heading.where(level: 3): it => {
  set text(size: 12pt, weight: "bold", fill: rgb(15, 23, 42))
  v(12pt)
  it
  v(6pt)
}

// Table styling
#set table(
  stroke: 0.5pt + rgb(203, 213, 225),
  fill: (col, row) => if row == 0 { rgb(241, 245, 249) } else { none },
  inset: (x: 12pt, y: 10pt),
)
#show table.cell: it => { set align(left); set text(size: 12pt); it }
#show table.cell.where(y: 0): it => { set align(left); set text(weight: "bold", size: 12pt); it }

// List styling
#set list(
  spacing: 1.0em,
  marker: text(size: 1.6em, baseline: -1.5pt)[•],
)
#set enum(spacing: 1.0em)
// ── Load metadata from JSON sidecar (safe injection) ────────────────────────
#let meta = json("meta.json")

#set document(
  title: "Báo Cáo Phản Biện — " + meta.project_name,
  author: "FPT Startup Benchmark",
)

// ── Title & Document Header ──────────────────────────────────────────────────
#align(center)[
  #text(size: 18pt, weight: "bold", fill: rgb(15, 23, 42), tracking: 0.5pt)[BÁO CÁO PHẢN BIỆN]
  #v(3pt)
  #text(size: 13pt, weight: "bold", fill: rgb(30, 58, 138))[#meta.project_name]
  #v(5pt)
  #text(size: 9.5pt, fill: rgb(100, 116, 139))[
    Job ID: #text(fill: rgb(71, 85, 105))[#meta.job_id]
    #h(12pt) #text(fill: rgb(203, 213, 225))[|] #h(12pt)
    Thời điểm xuất tài liệu: #text(fill: rgb(71, 85, 105))[#meta.created_at]
  ]
]

#v(6pt)
#line(length: 100%, stroke: 0.6pt + rgb(203, 213, 225))
#v(12pt)

// ── Scorecard Box ───────────────────────────────────────────────────────────
#let scores = meta.scores
#let total = meta.overall_score
#let verdict = meta.verdict
#let slash100 = "/ 100"

// Verdict text color only — no badge fill
#let verdict-color = if total >= 80 {
  rgb(22, 101, 52)
} else if total >= 60 {
  rgb(120, 53, 15)
} else {
  rgb(127, 29, 29)
}

#block(
  width: 100%,
  inset: (x: 14pt, y: 12pt),
  stroke: 1pt + rgb(203, 213, 225),
  fill: white,
)[
  #text(size: 12pt, fill: rgb(100, 116, 139), tracking: 0.8pt)[ĐIỂM TỔNG QUÁT]
  #v(6pt)
  // Left: big score | Right: sub-score list
  #grid(
    columns: (1fr, 1fr),
    gutter: 20pt,
    [
      #text(size: 30pt, weight: "bold", fill: rgb(15, 23, 42))[#total] #h(4pt) #text(size: 14pt, fill: rgb(100, 116, 139))[#slash100]
      #v(10pt)
      #text(size: 12pt, weight: "bold", fill: verdict-color)[#upper(verdict)]
    ],
    [
      #set text(size: 12pt)
      #grid(
        columns: (1fr, auto),
        row-gutter: 8pt,
        [#text(fill: rgb(100, 116, 139))[Rõ ràng]], [#align(right)[#text(weight: "bold", fill: rgb(15, 23, 42))[#scores.problemClarity/100]]],
        [#text(fill: rgb(100, 116, 139))[Thị trường]], [#align(right)[#text(weight: "bold", fill: rgb(15, 23, 42))[#scores.marketViability/100]]],
        [#text(fill: rgb(100, 116, 139))[Kinh doanh]], [#align(right)[#text(weight: "bold", fill: rgb(15, 23, 42))[#scores.businessModel/100]]],
        [#text(fill: rgb(100, 116, 139))[Cạnh tranh]], [#align(right)[#text(weight: "bold", fill: rgb(15, 23, 42))[#scores.competitiveMoat/100]]],
        [#text(fill: rgb(100, 116, 139))[Thực thi]], [#align(right)[#text(weight: "bold", fill: rgb(15, 23, 42))[#scores.executionFeasibility/100]]],
      )
    ],
  )
]

#v(20pt)

// ── Report Body ─────────────────────────────────────────────────────────────
{{BODY_CONTENT}}
