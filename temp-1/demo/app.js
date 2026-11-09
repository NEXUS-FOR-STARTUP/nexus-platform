'use strict';
(function () {
  const NX = window.NX, E = NX.eng;
  const $ = (q) => document.querySelector(q);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEY = 'nexusPreCp1Demo.v1';

  const STEPS = [
    { id: 'intro', name: 'Bắt đầu', min: 0 },
    { id: 'basics', name: 'Mục tiêu', min: 1 },
    { id: 'team', name: 'Nhóm', min: 3 },
    { id: 'assets', name: 'Điều bạn đang có', min: 4 },
    { id: 'network', name: 'Người quen', min: 1 },
    { id: 'fork', name: 'Ý tưởng', min: 1 },
    { id: 'six', name: 'Sáu câu', min: 3 },
    { id: 'draft', name: 'Kể chuyện', min: 2 },
    { id: 'sens', name: 'Điều nhạy cảm', min: 1 },
    { id: 'result', name: 'Kết quả', min: 0 },
  ];

  const STEP_IDS = STEPS.map((s) => s.id);
  const at = (id) => STEP_IDS.indexOf(id);
  const RESULT = at('result');
  /* Mỗi loại câu hỏi một dáng: chọn, viết, chip, soát. render() gắn lớp shape-* lên #main. */
  const SHAPES = { basics: 'pick', fork: 'pick', six: 'write', draft: 'write', assets: 'write', network: 'write', team: 'chip', sens: 'chip' };

  // Bước hiện tại ghi lên URL để tải lại/mở lại vẫn đúng chỗ và theo dõi được đang ở đâu.
  function syncUrl() {
    const q = '?step=' + STEPS[S.step].id + (S.phase === 'confirm' ? '&phase=confirm' : '');
    if (location.search !== q) history.replaceState(null, '', location.pathname + q);
  }

  const fresh = () => ({ step: 0, phase: 'write', schoolKind: null, schoolName: '', subjectKind: null, subjectName: '', goal: null, budget: null, teamSize: 3, team: [], assets: {}, assetsNone: {}, assetTags: {}, net: [], netOther: '', ideaFork: null, pain: '', idea: '', madlibs: {}, ideaTags: {}, sensitive: [], aiAssets: null, aiIdea: null, err: '' });
  let S = load();
  // `?step=assets` mở thẳng bước đó; không có thì dùng bước đã lưu. `idea` là link cũ của bước ngã rẽ.
  (function fromUrl() {
    const p = new URLSearchParams(location.search);
    const raw = p.get('step') || '';
    const i = STEP_IDS.indexOf({ idea: 'fork' }[raw] || raw);
    if (i < 0) return;
    S.step = i;
    S.phase = p.get('phase') === 'confirm' ? 'confirm' : 'write';
    save();
  })();
  function load() { try { const s = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); s.busy = false; if (!(s.netOther || '').trim()) s.net = []; if (!s.ideaFork && ((s.idea || '') + (s.pain || '')).trim()) s.ideaFork = 'no'; if (!s.madlibs || typeof s.madlibs !== 'object') s.madlibs = {}; s.team = (s.team || []).map((p) => Object.assign({ track: '' }, p)); return s; } catch (e) { return fresh(); } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* demo: bỏ qua nếu storage bị chặn */ } }
  function ensureTeam() {
    while (S.team.length < S.teamSize) S.team.push({ name: '', major: '', majorOther: '', track: '', caps: {}, unsure: false, extra: '' });
    S.team.length = S.teamSize;
  }

  /* ---------- khối giao diện dùng lại ---------- */
  const callout = (kind, html) => '<div class="callout ' + kind + '">' + html + '</div>';
  const head = (title, lead, why) => '<h1>' + title + '</h1>' + (lead ? '<p class="lead">' + lead + '</p>' : '') + (why ? callout('why', '<strong>Vì sao hỏi?</strong> ' + why) : '');
  // Đoạn giải thích dài gấp vào một dòng mở ra được, để trang chỉ còn câu hỏi.
  const more = (txt) => '<details class="more"><summary>Gợi ý thêm</summary><p>' + txt + '</p></details>';
  const chip = (act, attrs, on, label, extra = '') => '<button type="button" class="chip" data-act="' + act + '" ' + attrs + ' aria-pressed="' + !!on + '">' + label + extra + '</button>';
  const card = (act, attrs, on, title, sub) => '<button type="button" class="pick" data-act="' + act + '" ' + attrs + ' aria-pressed="' + !!on + '"><span class="pick-t">' + title + '</span>' + (sub ? '<span class="pick-s">' + sub + '</span>' : '') + '</button>';
  const nav = (backLabel, nextLabel) => '<div class="nav">' + (backLabel ? '<button class="btn ghost" data-act="back">' + backLabel + '</button>' : '<span></span>') + '<button class="btn primary" data-act="next">' + nextLabel + '</button></div>' + (S.err ? '<p class="err" role="alert">' + S.err + '</p>' : '');

  /* ---------- từng màn ---------- */
  function vIntro() {
    return head('Chưa có nhóm hoặc ý tưởng? Bắt đầu từ đây.',
      'Sáu đến bảy trang ngắn, mỗi trang một câu hỏi, mất khoảng 10 đến 12 phút, chủ yếu là bấm chọn. Không cần chuẩn bị gì. Không có đáp án đúng hay sai. Có nhóm hay chưa, có ý tưởng hay chưa đều đi được.')
      + '<div class="gets"><h2>Cuối cùng bạn nhận được</h2><ul>'
      + '<li><b>Nhóm hiện tại đang mạnh và thiếu gì</b>, và <b>nên tìm thêm ai</b>, kèm sẵn tin đăng tuyển để dán.</li>'
      + '<li><b>Ý tưởng nháp của bạn có ổn không</b> — chỉ hiện khi bạn đã viết vài dòng về ý tưởng.</li>'
      + '<li><b>Vài hướng thay thế hợp với nhóm</b> để đi hỏi thử. Đây là hướng để kiểm tra, chưa phải kết luận ý tưởng nào đúng.</li>'
      + '<li>Nếu bạn mô tả được ý tưởng trong 6 câu: thêm <b>phần hợp với mảng việc</b> và <b>câu hội đồng sẽ hỏi</b>.</li></ul></div>'
      + nav('', 'Bắt đầu');
  }

  function vBasics() {
    const q = (n, t, hint) => '<h2>' + n + '. ' + t + '</h2>' + (hint ? '<p class="hint">' + hint + '</p>' : '');
    const isFpt = S.schoolKind === 'fpt';
    return head('Trước hết, vài điều chung', 'Phần lớn là bấm chọn. Không có đáp án sai.')
      + q(1, 'Bạn học trường nào?')
      + '<div class="row">'
      + chip('school', 'data-val="fpt"', S.schoolKind === 'fpt', 'Đại học FPT')
      + chip('school', 'data-val="other"', S.schoolKind === 'other', 'Trường khác')
      + '</div>'
      + (S.schoolKind === 'other' ? '<label class="field"><span>Tên trường</span><input type="text" maxlength="60" data-bind="schoolName" value="' + esc(S.schoolName) + '" placeholder="Ví dụ: ĐH Bách khoa TP.HCM"></label>' : '')
      + (isFpt ? q(2, 'Bạn đang học EXE101 phải không?', 'Trường FPT còn nhiều môn khác, nên hỏi cho chắc.')
        + '<div class="row">'
        + chip('subject', 'data-val="exe101"', S.subjectKind === 'exe101', 'Đúng, là EXE101')
        + chip('subject', 'data-val="other"', S.subjectKind === 'other', 'Môn khác')
        + '</div>'
        + (S.subjectKind === 'other' ? '<label class="field"><span>Tên môn</span><input type="text" maxlength="60" data-bind="subjectName" value="' + esc(S.subjectName) + '" placeholder="Ví dụ: Khởi nghiệp"></label>' : '') : '')
      + q(isFpt ? 3 : 2, 'Bạn học môn này để làm gì?')
      + '<div class="stack">' + NX.GOALS.map((g) => card('pick', 'data-key="goal" data-val="' + g.id + '"', S.goal === g.id, g.title, g.sub)).join('') + '</div>'
      + q(isFpt ? 4 : 3, 'Cả nhóm có thể bỏ ra bao nhiêu tiền cho dự án?', 'Không phải để làm giàu. Chỉ để in tờ rơi, chạy thử quảng cáo, mua nguyên liệu làm thử.')
      + '<div class="stack tight">' + NX.BUDGETS.map((b) => card('pick', 'data-key="budget" data-val="' + b.id + '"', S.budget === b.id, b.title, b.sub)).join('') + '</div>'
      + nav('Quay lại', 'Tiếp tục');
  }

  function personHtml(p, i) {
    const label = S.teamSize === 1 ? 'Bạn' : 'Người ' + (i + 1) + (i === 0 ? ' (bạn)' : '');
    const chosen = NX.CAPS.filter((c) => p.caps[c.id]);
    return '<fieldset class="person"><legend>' + label + '</legend>'
      + '<label class="field"><span>Tên gọi tắt (để dễ nhớ)</span><input type="text" maxlength="30" data-bind="name" data-i="' + i + '" value="' + esc(p.name) + '" placeholder="Ví dụ: Minh"></label>'
      + '<label class="field"><span>Ngành học</span><select data-bind="major" data-i="' + i + '"><option value="">— chọn ngành —</option>'
        + NX.MAJORS.map((m) => '<option' + (p.major === m ? ' selected' : '') + '>' + m + '</option>').join('') + '</select></label>'
      + (p.major === 'Ngành khác' ? '<label class="field"><span>Ngành của bạn</span><input type="text" maxlength="40" data-bind="majorOther" data-i="' + i + '" value="' + esc(p.majorOther) + '" placeholder="Ví dụ: Quản trị khách sạn"></label>' : '')
      + (NX.ASKED_MAJORS.includes(p.major) ? '<p class="q">' + (i === 0 ? 'Bạn' : 'Người này') + ' làm việc thiên về đâu? <span class="hint">Ngành bạn ghi không tự xếp được vào một mảng, nên hỏi cho đúng.</span></p>'
        + '<div class="row">' + NX.TRACKS.map((t) => chip('track', 'data-i="' + i + '" data-id="' + t.id + '"', p.track === t.id, t.label)).join('') + '</div>'
        + '<p class="hint">Chỉ để báo cáo đếm đúng người theo mảng công việc.</p>' : '')
      + '<p class="q">' + (i === 0 ? 'Bạn' : 'Người này') + ' làm tốt hoặc làm được việc nào? <span class="hint">Chọn tất cả những gì đúng.</span></p>'
      + '<div class="row">' + NX.CAPS.map((c) => chip('cap', 'data-i="' + i + '" data-c="' + c.id + '"', p.caps[c.id], c.label)).join('') + '</div>'
      + (chosen.length ? '<div class="levels"><p class="hint">Mỗi việc đã chọn, bạn ở mức nào?</p>' + chosen.map((c) => '<div class="lvl"><span>' + c.label + '</span><span class="seg">'
        + NX.LEVELS.map((l) => '<button type="button" data-act="lvl" data-i="' + i + '" data-c="' + c.id + '" data-v="' + l.v + '" aria-pressed="' + (p.caps[c.id] === l.v) + '">' + l.label + '</button>').join('') + '</span></div>').join('') + '</div>' : '')
      + '<label class="check"><input type="checkbox" data-act="unsure" data-i="' + i + '" ' + (p.unsure ? 'checked' : '') + '> Mình chưa rõ ' + (i === 0 ? 'mình' : 'bạn này') + ' làm được gì' + (i ? ' (hỏi lại bạn ấy sau)' : '') + '</label>'
      + '<label class="field"><span>Còn gì nữa mà các ô trên không có? <em>(không bắt buộc)</em></span><textarea rows="2" data-bind="extra" data-i="' + i + '" placeholder="Ví dụ: biết lái xe, nói được tiếng Nhật, từng làm ở quán cà phê 1 năm">' + esc(p.extra) + '</textarea></label>'
      + '</fieldset>';
  }
  function ruleLine(tr) {
    const parts = [];
    parts.push(tr.sizeOk ? 'đủ ' + tr.sizeMin + '–' + tr.sizeMax + ' người' : (tr.size < tr.sizeMin ? 'thiếu ' + (tr.sizeMin - tr.size) + ' người' : 'thừa ' + (tr.size - tr.sizeMax) + ' người'));
    if (tr.exe) parts.push(tr.majorsOk ? 'đủ ' + tr.majorsMin + ' ngành' : 'thiếu ' + (tr.majorsMin - tr.majors) + ' ngành');
    const ok = tr.sizeOk && tr.majorsOk;
    const cls = ok ? 'tip' : 'demo';
    const body = ok
      ? '<strong>Nhóm đã đủ điều kiện' + (tr.exe ? ' của EXE101' : '') + '.</strong>'
      : '<strong>Nhóm chưa đủ điều kiện' + (tr.exe ? ' của EXE101' : '') + '.</strong> Hiện có ' + tr.size + ' người' + (tr.exe ? ', ' + tr.majors + ' ngành' : '') + ' —';
    const txt = parts.join(', ');
    const tail = txt.charAt(0).toUpperCase() + txt.slice(1) + '.';
    return '<div id="ruleLine">' + callout(cls, body + ' ' + tail) + '</div>';
  }

  function vTeam() {
    ensureTeam();
    const tr = E.teamRule(S);
    return head('Nhóm bạn gồm những ai?', 'Mỗi người một khung. Gần đúng là đủ. Chưa có nhóm thì để 1 người (chỉ mình bạn).',
      'Để biết nhóm đang thiếu người làm việc gì. Việc nhóm chưa ai làm được thì sẽ được gợi ý tuyển thêm.')
      + ruleLine(tr)
      + '<h2>Cả nhóm có mấy người (tính cả bạn)?</h2><p class="hint">Chuẩn chung của các môn khởi nghiệp: ' + tr.sizeMin + ' đến ' + tr.sizeMax + ' người' + (tr.exe ? ', tối thiểu ' + tr.majorsMin + ' chuyên ngành khác nhau.' : '.') + '</p>'
      + '<div class="stepper"><button type="button" class="btn ghost" data-act="size" data-d="-1" aria-label="Bớt một người">−</button><strong>' + S.teamSize + ' người</strong><button type="button" class="btn ghost" data-act="size" data-d="1" aria-label="Thêm một người">+</button></div>'
      + S.team.map(personHtml).join('') + nav('Quay lại', 'Tiếp tục');
  }

  function vAssets() {
    if (S.phase === 'confirm') return vAssetsConfirm();
    const done = NX.ASSET_PROMPTS.filter((p) => (S.assets[p.id] || '').trim() || S.assetsNone[p.id]).length;
    const why = '<details class="more"><summary>Năm câu này để làm gì?</summary><ul>'
      + NX.ASSET_PROMPTS.map((p) => '<li><b>' + p.title + '</b> ' + p.why + '</li>').join('') + '</ul>'
      + '<p>Nhiều nhóm bế tắc, cho tới khi nói chuyện mới biết trưởng nhóm có cửa hàng vật tư nông nghiệp ở nhà. Cả nhóm đổi sang bán và tư vấn hạt giống, vật tư. Thứ bạn thấy bình thường có thể là lợi thế lớn.</p></details>';
    return head('Nhóm bạn đang có gì mà chưa nghĩ là quan trọng?', 'Năm câu ngắn, cả nhóm trả lời chung: mỗi người góp vài chữ, ghi tên cho dễ nhớ. Hoặc bấm “Mình không có”.')
      + why
      + NX.ASSET_PROMPTS.map((p) => '<div class="ask"><h2>' + p.title + '</h2>'
        + '<textarea rows="3" aria-label="' + esc(p.title) + '" data-bind="asset" data-k="' + p.id + '" placeholder="' + esc(p.ph) + '">' + esc(S.assets[p.id] || '') + '</textarea>'
        + '<button type="button" class="chip" data-act="none" data-k="' + p.id + '" aria-pressed="' + !!S.assetsNone[p.id] + '">Mình không có / không nhớ</button></div>').join('')
      + '<p class="count" id="assetCount">Đã trả lời ' + done + '/5</p>' + nav('Quay lại', 'Tiếp tục');
  }
  function vAssetsConfirm() {
    const cands = E.detectAssets(S);
    const answered = NX.ASSET_PROMPTS.filter((p) => (S.assets[p.id] || '').trim()).length;
    return head(answered ? 'Mình hiểu như sau. Có đúng không?' : 'Chưa có câu trả lời nào để đối chiếu', cands.length ? 'Bấm “Đúng” hoặc “Không đúng” cho từng mục. Chỉ mục đúng mới được dùng để gợi ý.' : 'Không sao, bạn vẫn đi tiếp được.')
      + callout('demo', (() => {
        const n = NX.ASSET_PROMPTS.filter((p) => (S.assets[p.id] || '').trim()).length;
        if (!Array.isArray(S.aiAssets)) return 'Chưa gọi được AI nên đang đoán bằng từ khoá.';
        if (!n) return 'Bạn chọn “Mình không có” cho cả 5 câu nên không có gì để đọc. Bạn vẫn đi tiếp được; nếu nhớ ra điều gì, quay lại viết thêm.';
        if (!S.aiAssets.length) return 'AI đã đọc ' + n + ' câu trả lời nhưng chưa thấy nguồn lực nào đủ rõ để gán thẻ. Bạn đi tiếp được, hoặc quay lại viết cụ thể hơn.';
        return 'AI đọc ' + n + ' câu trả lời và gán ' + S.aiAssets.length + ' thẻ. Bạn vẫn là người xác nhận từng thẻ.';
      })())
      + (cands.length ? '<div class="stack">' + cands.map((a) => '<div class="confirm"><div><p class="ct">' + a.rule.label + '</p><p class="cq">Bạn đã viết: “' + esc(a.quote) + '”</p></div><div class="row">'
        + chip('tag', 'data-kind="asset" data-id="' + a.rule.id + '" data-val="yes"', S.assetTags[a.rule.id] === 'yes', 'Đúng') + chip('tag', 'data-kind="asset" data-id="' + a.rule.id + '" data-val="no"', S.assetTags[a.rule.id] === 'no', 'Không đúng') + '</div></div>').join('') + '</div>' : '')
      + nav('Quay lại sửa câu trả lời', 'Tiếp tục');
  }

  const NONE_NET = { id: 'none', label: 'Mình chưa có ai trong số này' };
  function NET_ALL() { return NX.NET_OPTIONS.concat([NONE_NET]); }
  const netSegments = () => (S.netOther || '').split(';').map((x) => x.trim()).filter(Boolean);
  /** Bấm gợi ý: thêm/bỏ đúng câu đó trong ô, và thêm/bỏ mã nhóm tương ứng.
   *  Chữ tự gõ không đổi mã nhóm; chỉ khi xoá sạch ô thì mới bỏ hết. */
  function toggleNetPreset(id) {
    const opt = NET_ALL().find((x) => x.id === id);
    if (!opt) return;
    const segs = netSegments().filter((s) => s !== opt.label);
    if (S.net.includes(id)) {
      S.netOther = segs.join('; ');
      S.net = S.net.filter((x) => x !== id);
    } else {
      const base = id === 'none' ? [] : segs.filter((s) => s !== NONE_NET.label);
      S.netOther = [...base, opt.label].join('; ');
      S.net = id === 'none' ? ['none'] : [...new Set([...S.net.filter((x) => x !== 'none'), id])];
    }
    if (!S.netOther.trim()) S.net = [];
  }
  function vNetwork() {
    return head('Bạn có thể trò chuyện với những nhóm người nào?', 'Ghi tự do vào ô dưới đây. Bấm một gợi ý để nó điền sẵn câu vào ô, rồi sửa lại theo ý bạn.',
      'Muốn biết hướng nào đáng làm, sau này bạn phải đi hỏi người thật. Nên cần biết bạn dễ tiếp cận nhóm người nào.')
      + '<div class="ask"><h2>Bạn nhắn tin hoặc gặp mặt được ai?</h2><p class="hint">Không cần biết chính xác ai. Ghi vài nhóm, hoặc một người cụ thể.</p>'
      + '<textarea id="netOther" rows="4" aria-label="Bạn nhắn tin hoặc gặp mặt được ai?" data-bind="netOther" placeholder="Ví dụ: bạn cùng lớp; chủ quán cà phê trước cổng trường; anh họ làm y tá ở phòng khám tư.">' + esc(S.netOther || '') + '</textarea></div>'
      + '<p class="hint">Gợi ý, bấm để điền vào ô trên:</p>'
      + '<div class="row">' + NET_ALL().map((n) => chip('netpre', 'data-id="' + n.id + '"', S.net.includes(n.id), n.label)).join('') + '</div>'
      + nav('Quay lại', 'Tiếp tục');
  }

  const sensChips = () => '<div class="row">' + NX.SENSITIVE.map((x) => chip('sens', 'data-id="' + x.id + '"', S.sensitive.includes(x.id), x.label)).join('') + '</div>';
  /* Bước ngã rẽ: một câu, hai thẻ. Mỗi nhánh là một trang riêng. */
  function vFork() {
    return head('Bạn đã có ý tưởng cụ thể chưa?', 'Không có thì không sao. Kể một chuyện bạn thấy khó chịu cũng đi tiếp được.')
      + '<div class="stack tight">'
      + card('fork', 'data-val="no"', S.ideaFork === 'no', 'Chưa, mình đang mò', 'Hai ô nháp, không bắt buộc.')
      + card('fork', 'data-val="yes"', S.ideaFork === 'yes', 'Có, mình mô tả được', 'Sáu câu ngắn.')
      + '</div>'
      + more('Có ý tưởng rồi thì Nexus kiểm tra sớm chỗ dễ vấp. Chưa có thì Nexus gợi ý hướng từ những gì bạn đã kể.')
      + nav('Quay lại', 'Tiếp tục');
  }

  function vSix() {
    if (S.phase === 'confirm') return vIdeaConfirm();
    const field = (f) => '<label class="field"><span>' + f.n + '</span><textarea rows="2" data-bind="madlib" data-k="' + f.id + '" placeholder="' + esc(f.ph) + '">' + esc((S.madlibs || {})[f.id] || '') + '</textarea></label>';
    const pick = (...ids) => ids.map((id) => field(NX.MAD_LIBS.find((f) => f.id === id)));
    return head('Mô tả ý tưởng trong sáu câu')
      + '<div class="ask cluster"><h2>Ý tưởng là gì</h2>' + pick('projectName', 'field', 'targetCustomer').join('') + '</div>'
      + '<div class="ask cluster"><h2>Ai đang gặp chuyện gì, bạn làm gì trước</h2>' + pick('problem', 'solution', 'mvp').join('') + '</div>'
      + more('Viết như đang kể cho bạn cùng lớp; câu ngắn cũng được, miễn đủ ý. Sáu câu này là dữ kiện để chấm: hợp với ngành nào, chỗ nào dễ vấp, và hội đồng sẽ hỏi lại điều gì. Không có đáp án đúng hay sai.')
      + nav('Quay lại', 'Tiếp tục');
  }

  function vDraft() {
    if (S.phase === 'confirm') return vIdeaConfirm();
    return head('Kể một chuyện bạn thấy khó chịu', 'Không bắt buộc. Bỏ trống vẫn đi tiếp được.')
      + '<div class="ask"><h2>Gần đây, điều gì làm bạn hoặc người quanh bạn mất thời gian, mất tiền hoặc bực mình?</h2><p class="hint">Chuyện nhỏ cũng được. Không cần nghĩ ra giải pháp.</p>'
      + '<textarea rows="3" aria-label="Gần đây, điều gì làm bạn hoặc người quanh bạn mất thời gian, mất tiền hoặc bực mình?" data-bind="pain" placeholder="Ví dụ: Mẹ mình hay than quán cà phê quá rối vào giờ cao điểm vì khách đặt món qua nhiều kênh.">' + esc(S.pain) + '</textarea></div>'
      + '<div class="ask"><h2>Bạn hoặc nhóm đã có ý tưởng sơ bộ chưa?</h2><p class="hint">Một hai câu: làm cái gì, cho ai.</p>'
      + '<textarea rows="3" aria-label="Bạn hoặc nhóm đã có ý tưởng sơ bộ chưa?" data-bind="idea" placeholder="Ví dụ: Làm ly và hộp đựng từ bã cà phê, thân thiện với môi trường.">' + esc(S.idea) + '</textarea></div>'
      + more('Chuyện bạn thấy khó chịu là chỗ hay có ý tưởng nhất. Nexus đọc để gợi ý hướng, không phán đúng sai.')
      + nav('Quay lại', 'Tiếp tục');
  }

  function vSens() {
    return head('Ý nghĩ của bạn có dính đến mục nào dưới đây không?', 'Chọn tất cả những gì đúng. Không có thì chọn dòng cuối.')
      + sensChips()
      + nav('Quay lại', 'Tiếp tục');
  }
  function vIdeaConfirm() {
    const tags = E.detectIdea(S);
    const mode = E.ideaMode(S), hasText = mode !== 'none';
    return head(hasText ? 'Mình đọc ý tưởng của bạn như thế này. Có đúng không?' : 'Bạn chưa viết ý tưởng nào', hasText ? 'Bấm “Đúng” hoặc “Không đúng” cho từng mục. Chỉ mục đúng mới được tính.' : 'Không sao, Nexus dùng phần bạn đã kể ở các bước trước để gợi ý hướng đi.')
      + callout('demo', !Array.isArray(S.aiIdea) ? 'Chưa gọi được AI nên đang đoán bằng từ khoá.'
        : !hasText ? 'Bạn để trống cả hai ô nên không có gì để AI đọc. Bạn vẫn xem được gợi ý hướng đi.'
          : !S.aiIdea.length ? 'AI đã đọc nhưng chưa thấy ý tưởng dính loại rủi ro nào. Bạn vẫn xem được gợi ý hướng đi.'
            : 'AI đọc cả câu và gán ' + S.aiIdea.length + ' thẻ. Bạn vẫn là người xác nhận từng thẻ.')
      + (hasText ? '<p class="quote">“' + esc(E.ideaTitle(S)) + '”</p>' : '') + '<div class="stack">' + tags.map((t) => '<div class="confirm"><div><p class="ct">' + t.label + '</p></div><div class="row">'
        + chip('tag', 'data-kind="idea" data-id="' + t.id + '" data-val="yes"', S.ideaTags[t.id] === 'yes', 'Đúng') + chip('tag', 'data-kind="idea" data-id="' + t.id + '" data-val="no"', S.ideaTags[t.id] === 'no', 'Không đúng') + '</div></div>').join('') + '</div>'
      + nav('Quay lại sửa', 'Tiếp tục');
  }

  const STATUS = { ok: ['✓', 'Ổn'], warn: ['!', 'Cần lưu ý'], hard: ['✕', 'Khó làm nổi'], blocked: ['⛔', 'Không thể làm'] };

  /* Bản demo mô phỏng hai khối mà bản thật chấm bằng AI. Nói rõ để không ai tưởng là AI thật. */
  function aiTrackBody() {
    const tc = E.trackCoverage(S);
    const tr = E.teamRule(S);
    const majors = tr.majors;
    const exp = S.team.filter((p) => (p.extra || '').trim()).length;
    const covered = NX.TRACKS.filter((t) => tc[t.id]).length;
    const missing = NX.TRACKS.filter((t) => !tc[t.id]);
    const strengths = NX.CAPS.filter((c) => E.teamStats(S).best[c.id] >= 2).map((c) => c.label.split(',')[0].toLowerCase()).slice(0, 2);
    return '<div class="stats">'
      + '<div class="stat"><b>' + majors + '</b><span>ngành đào tạo</span></div>'
      + '<div class="stat"><b>' + covered + '/' + NX.TRACKS.length + '</b><span>mảng nghề có người</span></div>'
      + '<div class="stat"><b>' + exp + '</b><span>người đã kể kinh nghiệm</span></div>'
      + '</div>'
      + '<div class="tiles">' + NX.TRACKS.map((t) => '<div class="tile' + (tc[t.id] ? '' : ' miss') + '"><b>' + t.label + '</b><span>' + (tc[t.id] ? tc[t.id] + ' người' : 'Chưa có ai') + '</span></div>').join('') + '</div>'
      + '<p><b>Nhóm dựa vào:</b> ' + (strengths.join('; ') || 'chưa rõ điểm mạnh nào') + '.</p>'
      + (missing.length
        ? '<p>Chưa có ai thuộc mảng <b>' + missing.map((t) => t.label).join(', ') + '</b>, nên ' + missing.map((t) => NX.TRACK_WORK[t.id]).join(' và ') + ' sẽ dồn cho người khác. Không sai, nhưng phải chia việc trước khi tới hạn.</p>'
        : '<p>Ba mảng đều có người. Việc còn lại là chốt ai làm phần nào, tránh hai người cùng làm một việc.</p>');
  }
  function aiCommitteeBody() {
    const m = S.madlibs || {};
    const f = (id, d) => esc((m[id] || '').trim() || d);
    const qs = [
      'Vì sao bạn chọn ' + f('field', 'lĩnh vực này') + '? Ai đang trả tiền cho việc này trước bạn?',
      'Khách cụ thể nhất bạn từng nói chuyện là ai? Họ nói gì, bạn ghi lại thế nào?',
      'Bản thử nhỏ nhất của bạn chứng minh được điều gì mà trước đó chưa ai chứng minh?',
      'Nếu chỉ còn 2 tuần và 0 đồng, bạn cắt phần nào trong ' + esc((m.projectName || 'dự án').trim()) + '?',
      'Vì sao là nhóm bạn, chứ không phải nhóm khác trong lớp?',
    ];
    return '<ol class="qs">' + qs.map((q) => '<li>' + q + '</li>').join('') + '</ol>';
  }
  function vResult() {
    const flags = E.computeFlags(S), v = E.verdict(flags), zones = E.computeZones(S), roles = E.computeRecruit(S);
    const cov = E.computeCoverage(S), tr = E.teamRule(S);
    const best = E.teamStats(S).best, mode = E.ideaMode(S), hasIdea = mode !== 'none', structured = mode === 'structured';
    const lv = (n) => (NX.LEVELS.find((l) => l.v === n) || {}).label || '';
    const short = (c) => c.label.split(',')[0];
    const who = (i) => esc((S.team[i] || {}).name || 'Người ' + (i + 1));
    const roleLabel = (id) => (NX.CORE_ROLES.find((r) => r.id === id) || {}).duty || id;
    const sec = (t, id) => '<h2' + (id ? ' id="' + id + '"' : '') + '>' + t + '</h2>';
    const people = S.team.map((p, i) => '<li><b>' + esc(p.name || 'Người ' + (i + 1)) + '</b>: ' + (NX.CAPS.filter((c) => p.caps[c.id]).map((c) => short(c).toLowerCase() + ' (' + lv(p.caps[c.id]).toLowerCase() + ')').join('; ') || 'chưa rõ làm được gì') + (p.extra ? '. Thêm: ' + esc(p.extra) : '') + '</li>').join('');
    const have = NX.CAPS.filter((c) => best[c.id] >= 2).map((c) => short(c).toLowerCase());
    const gap = NX.CAPS.filter((c) => best[c.id] < 2).map((c) => short(c).toLowerCase());
    // Mỗi vai: trạng thái → hệ quả → việc cần làm.
    const roleLine = (r) => (r.members.length === 0
      ? 'Nhóm chưa có ai làm được việc ' + r.label + ', nên ' + r.stage + ' nhóm sẽ kẹt; cần ' + r.need + '.'
      : r.members.length === 1
        ? 'Chỉ có ' + who(r.members[0]) + ' làm được việc ' + r.label + ', nên ' + r.stage + ' mà bạn ấy vắng hoặc quá tải thì nhóm sẽ kẹt.'
        : 'Có ' + r.members.length + ' người làm được việc ' + r.label + ', nên ' + r.stage + ' nhóm không phải lo.');
    const over = cov.overload.map((o) => who(o.i) + ' đang gánh cả ' + o.roles.map(roleLabel).join(' và ') + ', tới các giai đoạn đó dễ quá tải.');
    const showCover = cov.empty.length + cov.single.length + cov.overload.length > 0;
    const coverBody = showCover
      ? '<p>' + cov.roles.map(roleLine).join(' ') + (over.length ? ' ' + over.join(' ') : '') + '</p>'
        + (cov.exe ? '<p>Suốt môn nhóm không đổi người được, nên chỗ nào hôm nay chưa có ai làm thì tới lúc đó sẽ lộ ra.</p>' : '')
      : '';
    const head = cov.need > 0
      ? cov.capped
        ? 'Còn ' + Math.max(cov.want, roles.length) + ' việc chưa có người nhưng nhóm chỉ nhận thêm được ' + cov.need + ' người (trần ' + tr.sizeMax + '), nên phải chọn vai quan trọng nhất hoặc chia lại việc.'
        : 'Cần tuyển thêm ' + cov.need + ' người' + (showCover && cov.empty.length ? ' để có người làm những việc còn trống ở trên' : ' cho đủ số người của môn') + '.'
      : cov.capped
        ? 'Nhóm đã chạm trần ' + tr.sizeMax + ' người nên không tuyển thêm được; phải chia lại việc hoặc đổi người.'
        : 'Nhóm không cần tuyển thêm người.';
    const teamBlock = '<div class="role"><ul class="recap">' + people + '</ul>'
      + '<p><b>Đã có người làm được:</b> ' + (have.join('; ') || 'chưa ai làm được việc nào trong danh sách') + '.</p>'
      + '<p><b>Chưa ai làm được:</b> ' + (gap.join('; ') || 'không còn việc nào trống') + '.</p>'
      + '<p><b>Điều kiện nhóm' + (tr.exe ? ' (EXE101)' : '') + ':</b> ' + (() => { const ok = tr.sizeOk && tr.majorsOk; return (ok ? 'đã đủ — ' : 'chưa đủ — ') + tr.size + ' người (cần ' + tr.sizeMin + '–' + tr.sizeMax + ')' + (tr.exe ? ', ' + tr.majors + ' chuyên ngành (cần ' + tr.majorsMin + ')' : '') + '.'; })() + '</p></div>';
    const recruitBlock = '<p>' + head + '</p>'
      + (roles.length ? '<p class="hint">Xếp theo mức cần thiết, từ trên xuống. Một người có thể đảm nhiệm nhiều việc, nên không cần tuyển đủ ' + roles.length + ' người.</p>' + roles.map((r, i) => '<div class="role"><h3>' + (i + 1) + '. ' + r.title + '</h3><p>' + r.why + '</p><p class="hint">' + r.look + '</p><details><summary>Tin đăng tuyển mẫu</summary><p class="post" id="post' + i + '">' + esc(E.recruitPost(S, r)) + '</p><button class="btn ghost sm" data-act="copy" data-t="post' + i + '">Sao chép</button></details></div>').join('') : callout('tip', 'Nhóm đã phủ đủ các việc chính. Việc cần chú ý bây giờ là chia việc rõ ràng.'));
    const flagGrid = '<div class="flags">' + flags.map((f) => '<div class="flag ' + f.status + '"><div class="fh"><span class="pill ' + f.status + '"><i aria-hidden="true">' + STATUS[f.status][0] + '</i>' + STATUS[f.status][1] + '</span><b>' + f.axis + '</b></div><p class="ft">' + f.title + '</p><p>' + f.reason + '</p><p class="fix"><b>Nên làm:</b> ' + f.fix + '</p></div>').join('') + '</div>';
    const zonesBlock = '<p class="hint">Mỗi hướng là một giả thuyết. Hướng đầu tiên' + (hasIdea ? ' là ý tưởng của bạn sau khi thu nhỏ; các hướng còn lại dựa vào điểm mạnh, nguồn lực và người quen của nhóm.' : ' dựa vào điều bạn kể.') + ' Bạn chưa cần làm sản phẩm, chỉ cần đi hỏi.</p>'
      + (zones.length ? zones.map((z) => '<div class="zone"><span class="tag">Giả thuyết</span><h3>' + z.title + '</h3><p>' + z.prose + '</p></div>').join('') : callout('tip', 'Chưa đủ thông tin để gợi ý hướng. Quay lại bước “Điều bạn đang có” và kể thêm.'));
    const ready = cov.empty.length === 0;
    const roleName = (id) => (NX.CORE_ROLES.find((r) => r.id === id) || {}).label || id;
    const vcard = '<div class="vcard"><p class="vq">Đội ngũ có đủ người không?</p>'
      + '<p class="vt ' + (ready ? 'ok' : 'warn') + '">' + (ready ? 'Sẵn sàng đi tiếp' : 'Cần cân nhắc') + '</p>'
      + (ready ? '' : '<p class="vs">Thiếu: ' + cov.empty.map(roleName).join(', ') + '.</p>')
      + '</div>';
    return '<h1>Bản đồ xuất phát của nhóm bạn</h1>'
      + callout('why', '<strong>Đọc trước khi xem:</strong> đây là các hướng nên đi kiểm tra, chưa phải kết luận ý tưởng nào đúng. Chỉ khi bạn đi hỏi người thật mới biết có khách cần hay không.')
      + vcard
      + (S.ideaFork === 'yes' && !structured ? callout('demo', 'Bạn chọn “Có ý tưởng cụ thể” nhưng 6 ô chưa đủ, nên phần chấm theo ngành và câu hội đồng chưa chạy. Các cờ bên dưới chỉ dựa trên phần bạn đã viết.') : '')
      + '<div class="map">'
      + '<nav class="toc" aria-label="Trong bản đồ"><p>Trong bản đồ</p><a href="#m-nhom">Nhóm</a><a href="#m-idea">Ý tưởng</a><a href="#m-next">Việc tiếp theo</a></nav>'
      + '<div class="map-a">'
      + sec('Số liệu nhóm') + aiTrackBody()
      + sec('Nhóm hiện tại của bạn', 'm-nhom') + teamBlock
      + (coverBody ? sec('Nhóm có giữ được tới hết môn không?') + coverBody : '')
      + sec('Nên tìm thêm ai vào nhóm') + recruitBlock
      + sec('Ý tưởng này có vấn đề gì không?', 'm-idea')
      + (hasIdea ? '<p class="idea-quote">“' + esc(E.ideaTitle(S)) + '”</p>' : callout('tip', 'Bạn chưa ghi ý tưởng nên mục này chỉ kiểm tra nhóm và nguồn lực. Xem hướng gợi ý ở mục dưới.'))
      + '<div class="verdict ' + v.cls + '"><strong>' + v.t + '</strong><span>' + v.d + '</span></div>'
      + flagGrid
      + '</div>'
      + '<aside class="map-b">'
      + sec(hasIdea ? 'Hướng thay thế hợp với nhóm' : 'Hướng nên đi hỏi thử') + zonesBlock
      + (structured ? sec('Hội đồng sẽ hỏi gì?') + callout('demo', 'Bản demo: câu hỏi mô phỏng từ 6 ô bạn viết. Bản thật do AI soạn theo đúng ý tưởng của bạn.') + aiCommitteeBody() : '')
      + sec('Việc tiếp theo: đi hỏi người thật', 'm-next')
      + '<p class="hint">Chọn một hướng ở trên. Tìm vài người thuộc nhóm đó và hỏi theo 5 câu này. Ghi lại nguyên văn câu họ nói. Đây là việc của bước phỏng vấn khách hàng ở giai đoạn sau. Hiện bạn chưa cần làm.</p>'
      + '<ol class="qs">' + NX.INTERVIEW_QS.map((q) => '<li>' + q + '</li>').join('') + '</ol>'
      + (structured ? '<div class="role upsell"><h3>Đi xa hơn với bản đồ này</h3><p>Bạn đã có nhóm, mảng việc và chỗ dễ vấp. Nếu muốn người thật đọc lại và hẹn lịch cùng bạn, xem các gói đồng hành.</p><div class="row"><button class="btn ghost sm" data-act="plans">Xem các gói đồng hành</button></div></div>' : '')
      + '</aside>'
      + '</div>'
      + '<div class="cta"><button class="btn primary" data-act="create">Tạo dự án từ bản đồ này</button><button class="btn ghost" data-act="edit" data-step="1">Sửa câu trả lời</button><button class="btn ghost" data-act="restart">Làm lại từ đầu</button></div>';
  }

  const VIEWS = { intro: vIntro, basics: vBasics, team: vTeam, assets: vAssets, network: vNetwork, fork: vFork, six: vSix, draft: vDraft, sens: vSens, result: vResult };

  /* ---------- thanh tiến trình và bảng bên phải ---------- */
  /* Đường đi thực tế: chỉ nhánh ý tưởng đã chọn được tính vào thanh tiến trình. */
  function pathSteps() {
    const p = ['basics', 'team', 'assets', 'network', 'fork'].map(at);
    if (S.ideaFork === 'yes') p.push(at('six'));
    else if (S.ideaFork === 'no') p.push(at('draft'));
    p.push(at('sens'));
    return p;
  }
  function stepper() {
    const p = pathSteps();
    const pos = p.indexOf(S.step);
    if (pos < 0) return '';
    const left = p.slice(pos).reduce((a, i) => a + STEPS[i].min, 0) + (S.ideaFork ? 0 : 2);
    const total = p.length + (S.ideaFork ? 0 : 1);
    const marks = p.map((i, k) => (k < pos ? 'done' : k === pos ? 'now' : ''));
    if (!S.ideaFork) marks.splice(p.indexOf(at('fork')) + 1, 0, '');
    const bars = marks.map((m) => '<span class="' + m + '"></span>').join('');
    return '<div class="prog"><p>Bước ' + (pos + 1) + '/' + total + ' · <b>' + STEPS[S.step].name + '</b> · còn khoảng ' + left + ' phút</p>'
      + '<div class="track" aria-hidden="true">' + bars + '</div></div>';
  }
  function summary() {
    const row = (k, v, flag) => '<div class="sr ' + (v ? 'has ' : '') + (flag && v ? flag : '') + '"><dt>' + k + '</dt><dd>' + v + '</dd></div>';
    const cov = E.trackCoverage(S);
    const missing = NX.TRACKS.filter((t) => !cov[t.id]).map((t) => t.label);
    const strong = NX.CAPS.filter((c) => E.teamStats(S).best[c.id] >= 2).map((c) => c.label.split(',')[0].toLowerCase());
    const lines = [row('Số người', S.team.length + ' người')];
    if (S.team.length) lines.push(row('Mảng việc', missing.length ? 'thiếu ' + missing.join(', ') : 'đủ ba mảng', 'warn'));
    if (strong.length) lines.push(row('Làm được', strong.join('; ')));
    return '<h2>Nhóm của bạn</h2><dl>' + lines.join('') + '</dl>';
  }

  /* ---------- điều hướng ---------- */
  function render(top) {
    const y = window.scrollY;
    syncUrl();
    $('#stepper').innerHTML = stepper();
    const main = $('#main');
    main.innerHTML = S.busy ? busyView() : VIEWS[STEPS[S.step].id]();
    const shape = 'shape-' + (S.phase === 'confirm' ? 'review' : SHAPES[STEPS[S.step].id] || 'plain');
    main.className = [main.className.replace(/\bshape-\S+/g, '').trim(), shape].filter(Boolean).join(' ');
    const hasTeam = S.team.length > 0;
    $('#aside').innerHTML = summary();
    $('#aside').hidden = S.step < at('assets') || S.step === RESULT || !hasTeam;
    document.body.classList.toggle('wide-result', S.step === RESULT);
    window.scrollTo(0, top ? 0 : y);
  }
  // Trong lúc AI đọc thì không cho nhảy bước: nếu không, màn "đang đọc" sẽ nằm nhầm bước.
  function go(step, phase) { if (S.busy) return; S.step = step; S.phase = phase || 'write'; S.err = ''; save(); render(true); }
  function fail(msg) { S.err = msg; render(false); }

  function validate() {
    const id = STEPS[S.step].id;
    if (id === 'basics') {
      const miss = [!S.schoolKind && 'trường', S.schoolKind === 'fpt' && !S.subjectKind && 'môn có phải EXE101 không', !S.goal && 'mục tiêu', !S.budget && 'ngân sách'].filter(Boolean);
      return miss.length ? 'Còn thiếu: ' + miss.join(', ') + '. Chọn ô gần đúng nhất.' : '';
    }
    if (id === 'team') {
      const noMajor = S.team.map((p, i) => (p.major ? null : i + 1)).filter(Boolean);
      if (noMajor.length) return 'Người ' + noMajor.join(', ') + ' chưa chọn chuyên ngành.';
      const noOther = S.team.map((p, i) => (p.major === 'Ngành khác' && !(p.majorOther || '').trim() ? i + 1 : null)).filter(Boolean);
      if (noOther.length) return 'Người ' + noOther.join(', ') + ' chọn “Ngành khác” nhưng chưa ghi tên ngành.';
      const noTrack = S.team.map((p, i) => (NX.ASKED_MAJORS.includes(p.major) && !p.track ? i + 1 : null)).filter(Boolean);
      if (noTrack.length) return 'Người ' + noTrack.join(', ') + ' chưa chọn phần việc thiên về đâu. Ngành này cần một chip để báo cáo đếm đúng.';
      const bad = S.team.map((p, i) => (Object.keys(p.caps).length || p.unsure ? null : i + 1)).filter(Boolean);
      return bad.length ? 'Người ' + bad.join(', ') + ' chưa chọn việc nào. Chọn ít nhất 1 ô, hoặc tick “Mình chưa rõ…”.' : '';
    }
    if (id === 'assets' && S.phase === 'write') {
      const left = NX.ASSET_PROMPTS.filter((p) => !(S.assets[p.id] || '').trim() && !S.assetsNone[p.id]).length;
      return left ? 'Còn ' + left + ' câu chưa trả lời. Viết vài chữ, hoặc bấm “Mình không có / không nhớ”.' : '';
    }
    if (id === 'assets') return E.detectAssets(S).some((a) => !S.assetTags[a.rule.id]) ? 'Hãy bấm “Đúng” hoặc “Không đúng” cho từng mục.' : '';
    if (id === 'network') return (S.netOther || '').trim() ? '' : 'Hãy ghi ít nhất một nhóm hoặc một người bạn nhắn tin được, hoặc bấm gợi ý “Mình chưa có ai trong số này”.';
    if (id === 'fork') return S.ideaFork ? '' : 'Chọn một trong hai: đã có ý tưởng cụ thể, hoặc chưa có.';
    if (id === 'six' && S.phase === 'write') {
      const short = NX.MAD_LIBS.filter((f) => ((S.madlibs || {})[f.id] || '').trim().length < f.min);
      return short.length ? 'Còn ' + short.length + ' ô chưa đủ ý: ' + short.map((f) => f.n.toLowerCase().replace(/[?]/g, '')).join('; ') + '. Viết thêm vài chữ, hoặc quay lại chọn “Chưa, mình đang mò”.' : '';
    }
    if ((id === 'six' || id === 'draft') && S.phase === 'confirm') return E.detectIdea(S).some((t) => !S.ideaTags[t.id]) ? 'Hãy bấm “Đúng” hoặc “Không đúng” cho từng mục.' : '';
    if (id === 'sens') return S.sensitive.length ? '' : 'Hãy chọn các mục dính đến ý nghĩ của bạn, hoặc chọn “Không có mục nào ở trên”.';
    return '';
  }
  function busyView() {
    const isAssets = STEPS[S.step].id === 'assets';
    return '<div class="ask"><h1>Nexus đang đọc ' + (isAssets ? 'câu trả lời của nhóm' : 'ý tưởng của bạn') + '…</h1>'
      + '<p class="hint">' + (isAssets
        ? 'AI đọc cả câu để nhận ra nguồn lực: nghề của gia đình, người quen, đồ nghề, chỗ làm, hiểu biết riêng. Năm câu này quyết định nó gợi ý hướng đi nào.'
        : 'AI đọc cả câu để biết ý tưởng dính đến loại nào: cần làm đồ thật, cần code, cần giấy phép, hay bán cho khách lớn.')
      + ' Thường mất 3 đến 10 giây, lúc chậm có thể lâu hơn. Bạn không cần bấm gì.</p></div>';
  }
  async function next() {
    const e = validate(); if (e) return fail(e);
    const id = STEPS[S.step].id;
    if (id === 'intro') return go(at('basics'));
    if (id === 'assets' && S.phase === 'write') {
      const answered = NX.ASSET_PROMPTS.filter((p) => (S.assets[p.id] || '').trim()).length;
      if (!answered) { S.aiAssets = []; return go(at('network')); } // không có câu nào để đọc thì không vào màn xác nhận rỗng
      S.busy = true; render(false);
      await aiLabel('assets');
      S.busy = false;
      return go(at('assets'), 'confirm');
    }
    if (id === 'fork') return go(S.ideaFork === 'yes' ? at('six') : at('draft'));
    if ((id === 'six' || id === 'draft') && S.phase === 'write') {
      if (E.ideaMode(S) === 'none') { S.aiIdea = []; return go(at('sens')); }
      S.busy = true; render(false);
      await aiLabel('idea');
      S.busy = false;
      return go(S.step, 'confirm');
    }
    if ((id === 'six' || id === 'draft') && S.phase === 'confirm') return go(at('sens'));
    if (id === 'sens') return go(RESULT);
    go(S.step + 1);
  }

  /** Gán thẻ bằng AI thật. Lỗi mạng thì trả null và rơi về đoán bằng từ khoá. */
  async function aiLabel(kind) {
    const payload = kind === 'assets'
      ? { answers: NX.ASSET_PROMPTS.map((p) => ({ q: p.title, answer: (S.assets[p.id] || '').trim() })).filter((a) => a.answer) }
      : S.ideaFork === 'yes' ? { madlibs: S.madlibs } : { pain: S.pain, idea: S.idea };
    toast('Đang nhờ AI đọc câu trả lời…');
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, payload }) });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'AI lỗi');
      if (kind === 'assets') S.aiAssets = json.ids; else S.aiIdea = json.ids;
      save();
      hideToast();
      return json.ids;
    } catch (err) {
      toast('Không gọi được AI. Tạm đoán bằng từ khoá. (' + (err.message || err) + ')');
      return null;
    }
  }
  function back() {
    if (S.phase === 'confirm') return go(S.step, 'write');
    const id = STEPS[S.step].id;
    if (id === 'six' || id === 'draft') return go(at('fork'));
    if (id === 'sens') return go(at(S.ideaFork === 'yes' ? 'six' : 'draft'));
    go(S.step - 1);
  }

  let tt;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => { t.hidden = true; }, 3800); }
  function hideToast() { const t = $('#toast'); t.hidden = true; clearTimeout(tt); }

  function applyPreset(p) {
    S = Object.assign(fresh(), JSON.parse(JSON.stringify(p.s)));
    S.team = S.team.map((m) => Object.assign({ name: '', major: '', majorOther: '', track: '', caps: {}, unsure: false, extra: '' }, m));
    if (!S.madlibs || typeof S.madlibs !== 'object') S.madlibs = {};
    if (!S.ideaFork) S.ideaFork = S.madlibs.projectName ? 'yes' : 'no';
    NX.ASSET_PROMPTS.forEach((a) => { if (!(S.assets[a.id] || '').trim()) S.assetsNone[a.id] = true; });
    if (Array.isArray(S.net) && S.net.length) S.netOther = S.net.map((id) => (NET_ALL().find((n) => n.id === id) || {}).label).filter(Boolean).join('; ');
    toast('Đã điền sẵn dữ liệu mẫu. Bấm “Tiếp tục” để đi qua từng bước.');
    go(at('basics'));
  }

  /* ---------- sự kiện ---------- */
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-act]'); if (!t) return;
    const d = t.dataset, a = d.act;
    if (a === 'next') return next();
    if (a === 'back') return back();
    if (a === 'create') return toast('Bản demo: bản thật mở form tạo dự án, điền sẵn trường/môn và lưu bản đồ vào chính dự án đó.');
    if (a === 'plans') return toast('Bản demo: bản thật mở danh sách gói đồng hành, kèm phần bạn đã nhập.');
    if (a === 'restart') { S = fresh(); save(); return go(0); }
    if (a === 'edit') return go(+d.step);
    if (a === 'copy') { const txt = $('#' + d.t).textContent; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { t.textContent = 'Đã sao chép'; }, () => toast('Không sao chép tự động được. Bôi đen đoạn tin và nhấn Ctrl+C.')); return; }
    if (a === 'preset') { $('#demoMenu').hidden = true; return applyPreset(NX.PRESETS[+d.i]); }
    if (a === 'pick') S[d.key] = d.val;
    else if (a === 'school') { S.schoolKind = d.val; if (d.val !== 'other') S.schoolName = ''; if (d.val !== 'fpt') { S.subjectKind = null; S.subjectName = ''; } }
    else if (a === 'subject') { S.subjectKind = d.val; if (d.val !== 'other') S.subjectName = ''; }
    else if (a === 'size') { S.teamSize = Math.min(8, Math.max(1, S.teamSize + (+d.d))); ensureTeam(); }
    else if (a === 'fork') { S.ideaFork = d.val; if (d.val !== 'yes') S.aiIdea = null; }
    else if (a === 'track') { const p = S.team[+d.i]; p.track = p.track === d.id ? '' : d.id; }
    else if (a === 'cap') { const p = S.team[+d.i]; if (p.caps[d.c]) delete p.caps[d.c]; else { p.caps[d.c] = 2; p.unsure = false; } }
    else if (a === 'lvl') S.team[+d.i].caps[d.c] = +d.v;
    else if (a === 'unsure') { const p = S.team[+d.i]; p.unsure = t.checked; if (p.unsure) p.caps = {}; }
    else if (a === 'none') { S.assetsNone[d.k] = !S.assetsNone[d.k]; if (S.assetsNone[d.k]) S.assets[d.k] = ''; S.aiAssets = null; }
    else if (a === 'tag') (d.kind === 'asset' ? S.assetTags : S.ideaTags)[d.id] = d.val;
    else if (a === 'netpre') toggleNetPreset(d.id);
    else if (a === 'sens') {
      if (d.id === 'none') S.sensitive = S.sensitive.includes('none') ? [] : ['none'];
      else { S.sensitive = S.sensitive.filter((x) => x !== 'none'); S.sensitive = S.sensitive.includes(d.id) ? S.sensitive.filter((x) => x !== d.id) : [...S.sensitive, d.id]; }
    } else return;
    S.err = ''; save(); render(false);
  });

  function onField(ev) {
    const t = ev.target, b = t.dataset && t.dataset.bind; if (!b) return;
    if (b === 'name' || b === 'extra' || b === 'major' || b === 'majorOther') {
      const p = S.team[+t.dataset.i];
      p[b] = t.value;
      if (b === 'major') {
        if (t.value !== 'Ngành khác') p.majorOther = '';
        if (!NX.ASKED_MAJORS.includes(t.value)) p.track = '';
        const i = t.dataset.i; save(); render(false); const n = document.querySelector('select[data-bind="major"][data-i="' + i + '"]'); if (n) n.focus(); return;
      }
      if (b === 'majorOther') { const l = $('#ruleLine'); if (l) l.innerHTML = ruleLine(E.teamRule(S)); }
    }
    else if (b === 'madlib') {
      S.madlibs[t.dataset.k] = t.value;
      S.aiIdea = null;
    }
    else if (b === 'asset') {
      S.assets[t.dataset.k] = t.value;
      S.aiAssets = null;
      if (t.value.trim() && S.assetsNone[t.dataset.k]) { S.assetsNone[t.dataset.k] = false; const btn = document.querySelector('[data-act="none"][data-k="' + t.dataset.k + '"]'); if (btn) btn.setAttribute('aria-pressed', 'false'); }
      const c = $('#assetCount'); if (c) c.textContent = 'Đã trả lời ' + NX.ASSET_PROMPTS.filter((p) => (S.assets[p.id] || '').trim() || S.assetsNone[p.id]).length + '/5';
    } else {
      S[b] = t.value;
      if (b === 'idea' || b === 'pain') S.aiIdea = null;
      if (b === 'netOther' && !t.value.trim()) S.net = [];
    }
    save(); $('#aside').innerHTML = summary();
  }
  document.addEventListener('input', onField);
  document.addEventListener('change', onField); // <select> không phải lúc nào cũng phát 'input'

  $('#demoBtn').addEventListener('click', () => { const m = $('#demoMenu'); m.hidden = !m.hidden; });
  $('#demoMenu').innerHTML = '<p>Điền sẵn một kịch bản. Sau đó bấm “Tiếp tục” để đi lần lượt; bấm “Quay lại” để lùi một bước.</p>'
    + NX.PRESETS.map((p, i) => '<button type="button" data-act="preset" data-i="' + i + '">' + p.name + '</button>').join('');
  render(true);
})();
