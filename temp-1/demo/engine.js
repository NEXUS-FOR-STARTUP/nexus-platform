'use strict';
/* Luật cố định. Bản demo đoán thẻ bằng từ khoá; bản thật dùng AI gán thẻ rồi người dùng xác nhận. */
(function () {
  const NX = window.NX;

  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const esc = (k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hit = (text, keys) => {
    const t = norm(text);
    return keys.some((k) => new RegExp('(^|[^a-z0-9])' + esc(k) + '([^a-z0-9]|$)').test(t));
  };
  const clip = (s, n = 90) => { const t = String(s || '').trim().replace(/\s+/g, ' '); return t.length > n ? t.slice(0, n) + '…' : t; };

  function detectAssets(s) {
    if (Array.isArray(s.aiAssets)) {
      return s.aiAssets
        .map((x) => ({ rule: NX.ASSET_RULES.find((r) => r.id === x.id), quote: x.quote || '', from: 'AI đọc câu trả lời của nhóm' }))
        .filter((a) => a.rule);
    }
    const out = [];
    for (const rule of NX.ASSET_RULES) {
      for (const p of NX.ASSET_PROMPTS) {
        const text = (s.assets || {})[p.id];
        if (text && hit(text, rule.keys)) { out.push({ rule, from: p.title, quote: clip(text) }); break; }
      }
    }
    return out;
  }
  const confirmedAssetIds = (s) => NX.ASSET_RULES.filter((r) => s.assetTags[r.id] === 'yes').map((r) => r.id);

  function detectIdea(s) {
    if (Array.isArray(s.aiIdea)) return s.aiIdea.map((x) => NX.IDEA_RULES.find((r) => r.id === x.id)).filter(Boolean);
    const text = ideaText(s);
    return text ? NX.IDEA_RULES.filter((r) => hit(text, r.keys)) : [];
  }
  const confirmedKinds = (s) => new Set(detectIdea(s).filter((r) => s.ideaTags[r.id] === 'yes').map((r) => r.id));

  /* ---------- ý tưởng: hai dạng, một nguồn ---------- */
  const madlibsFilled = (s) => {
    const m = s.madlibs || {};
    return NX.MAD_LIBS.every((f) => (m[f.id] || '').trim().length >= f.min);
  };
  // "Có ý tưởng cụ thể" chỉ tính là structured khi 6 ô đã đạt độ dài tối thiểu.
  const ideaMode = (s) => (s.ideaFork === 'yes' ? (madlibsFilled(s) ? 'structured' : 'draft')
    : [(s.pain || ''), (s.idea || '')].join('').trim() ? 'draft' : 'none');
  const ideaText = (s) => (s.ideaFork === 'yes'
    ? NX.MAD_LIBS.map((f) => ((s.madlibs || {})[f.id] || '').trim()).filter(Boolean).join('. ')
    : [s.pain, s.idea].filter((x) => (x || '').trim()).join('. '));
  const ideaTitle = (s) => (s.ideaFork === 'yes' && (s.madlibs || {}).projectName
    ? clip(s.madlibs.projectName, 40) + ' — ' + clip(s.madlibs.problem, 70)
    : clip(s.idea || s.pain, 120));

  /* ---------- mảng nghề: suy từ ngành, hỏi khi ngành mơ hồ ---------- */
  const roleTrack = (p) => p.track || NX.TRACK_BY_MAJOR[p.major] || '';
  function trackCoverage(s) {
    const c = { ky_thuat: 0, marketing: 0, kinh_doanh_tai_chinh: 0 };
    (s.team || []).forEach((p) => { const t = roleTrack(p); if (t) c[t] += 1; });
    return c;
  }

  function teamStats(s) {
    const best = {}, count = {};
    NX.CAPS.forEach((c) => { best[c.id] = 0; count[c.id] = 0; });
    s.team.forEach((p) => Object.entries(p.caps || {}).forEach(([k, v]) => { best[k] = Math.max(best[k], v); count[k] += 1; }));
    return { best, count };
  }

  // "mới biết" (1) chưa tính là làm được vai; từ "làm được" (2) trở lên mới tính.
  const COVER_LEVEL = 2;

  /** Ai làm được vai nào: tính theo từng thành viên, vì `best` của teamStats chỉ giữ
   *  mức cao nhất của cả nhóm và không cho biết vai đó có mấy người gánh. */
  function computeCoverage(s) {
    const team = s.team || [];
    const rule = teamRule(s);
    const exe = rule.exe;
    const roles = NX.CORE_ROLES.map((r) => ({
      ...r,
      members: team.map((p, i) => (r.caps.some((c) => (p.caps || {})[c] >= COVER_LEVEL) ? i : -1)).filter((i) => i >= 0),
    }));
    const empty = roles.filter((r) => !r.members.length).map((r) => r.id);
    const single = roles.filter((r) => r.members.length === 1).map((r) => r.id);
    // Cùng một `empty` lái cả mục "giữ được tới hết môn" và số người cần tuyển; overload chỉ
    // tính khi vai đó đúng 1 người, nếu không thì "gánh nhiều vai" là chia việc, không phải rủi ro.
    const overload = team
      .map((p, i) => ({ i, roles: roles.filter((r) => r.members.includes(i)).map((r) => r.id) }))
      .filter((x) => x.roles.length > 1 && x.roles.some((id) => single.includes(id)));
    // `null` = trường không đặt trần. Không dùng `Infinity`: JSON.stringify biến nó thành `null`
    // ở chỗ khác, còn schema/report thì nhận `null` một cách có chủ ý.
    const room = rule.sizeMax == null ? null : Math.max(0, rule.sizeMax - team.length);
    const byLaw = rule.sizeMin == null ? 0 : Math.max(0, rule.sizeMin - team.length);
    const want = Math.max(byLaw, empty.length);
    const need = room == null ? want : Math.min(want, room);
    return { exe, roles, empty, single, overload, want, need, room, capped: want > need };
  }

  const val = (list, id) => (list.find((x) => x.id === id) || {}).v;
  const mk = (axis, status, title, reason, fix) => ({ axis, status, title, reason, fix });

  function computeFlags(s) {
    const { best } = teamStats(s);
    const kinds = confirmedKinds(s);
    const assets = confirmedAssetIds(s);
    const hasIdea = kinds.size > 0;
    const budget = val(NX.BUDGETS, s.budget) ?? 0;
    const makerAsset = assets.includes('workshop') || assets.includes('lab');
    const hasMake = best.craft >= 2 || best.domain >= 2 || makerAsset;
    const flags = [];

    // 1. Năng lực
    let cap;
    if (kinds.has('physical') && !hasMake) {
      cap = mk('Năng lực của nhóm', 'hard', 'Chưa ai làm chắc việc chế tạo sản phẩm thật',
        'Ý tưởng cần làm ra vật thật bằng vật liệu hoặc máy móc. Hiện chưa ai trong nhóm làm chắc việc này, và chưa có xưởng hay phòng lab.',
        'Đừng tự chế tạo trong kỳ này. Thử bán hoặc phân phối sản phẩm có sẵn, hoặc làm dịch vụ đi kèm. Muốn chế tạo thật thì phải có một người làm chắc hoặc một chỗ làm ra sản phẩm.');
    } else if (kinds.has('ai') && best.code < 3) {
      cap = mk('Năng lực của nhóm', best.code < 2 ? 'hard' : 'warn', 'Tự xây AI cần người làm chắc phần kỹ thuật',
        best.code < 2 ? 'Chưa ai trong nhóm viết code ở mức làm được. Tự xây một hệ thống AI là việc rất nặng.' : 'Nhóm có người viết code nhưng chưa ai làm chắc. Hệ thống AI thật cần nhiều dữ liệu và nhiều lần thử.',
        'Dùng công cụ AI có sẵn hoặc làm tay trước để kiểm tra người ta có cần không. Chưa cần tự xây AI.');
    } else if (kinds.has('software') && best.code < 2) {
      cap = mk('Năng lực của nhóm', 'hard', 'Muốn làm phần mềm nhưng chưa ai viết được',
        'Ý tưởng là website hoặc app. Chưa ai trong nhóm chọn “làm được” trở lên ở mục làm website, app.',
        'Bắt đầu bằng bảng Sheet, biểu mẫu Google hoặc tin nhắn Zalo làm tay. Muốn làm app thật thì tuyển một người viết code.');
    } else if (!hasIdea && best.code < 2 && !hasMake) {
      cap = mk('Năng lực của nhóm', 'warn', 'Chưa ai trực tiếp làm ra sản phẩm',
        'Chưa ai chọn “làm được” trở lên ở việc làm website hoặc làm đồ thật.',
        'Bắt đầu bằng dịch vụ làm tay. Hoặc tuyển một người làm ra sản phẩm, xem mục “Nên tuyển thêm ai”.');
    } else {
      cap = mk('Năng lực của nhóm', 'ok', 'Chưa thấy chỗ nào lệch quá', 'Năng lực trong nhóm không mâu thuẫn với hướng bạn nêu.', 'Vẫn nên chia việc rõ ràng ngay từ đầu.');
    }
    flags.push(cap);

    // 2. Tiền và nguồn lực
    const heavy = ['physical', 'logistics', 'marketplace', 'superapp'].some((k) => kinds.has(k));
    if (kinds.has('physical') && budget <= 1 && !makerAsset) {
      flags.push(mk('Tiền và nguồn lực', 'hard', 'Làm đồ thật cần tiền và máy móc nhiều hơn bạn đang có',
        'Làm đồ thật cần nguyên liệu, máy, và nhiều lần làm thử hỏng. Ngân sách của nhóm hiện rất nhỏ.',
        'Chưa chọn hướng tự sản xuất. Thử bán sản phẩm làm sẵn hoặc làm dịch vụ liên quan trước.'));
    } else if (heavy && budget <= 1) {
      flags.push(mk('Tiền và nguồn lực', 'warn', 'Hướng này thường tốn tiền để chạy thử',
        'Giao hàng, sàn kết nối hoặc hệ thống lớn đều cần tiền và người vận hành.', 'Chọn một phần nhỏ nhất và làm tay bằng nhóm Zalo trước.'));
    } else if (!hasIdea && budget === 0) {
      flags.push(mk('Tiền và nguồn lực', 'warn', 'Gần như không có tiền',
        'Không có vốn thì chỉ nên chọn hướng làm tay, không cần mua gì.', 'Ưu tiên dịch vụ làm tay, bảng Sheet, nhóm Zalo.'));
    } else {
      flags.push(mk('Tiền và nguồn lực', 'ok', 'Tiền vừa đủ cho một lần thử nhỏ', 'Chưa thấy hướng nào vượt quá ngân sách bạn khai.', 'Ghi lại mỗi khoản đã chi để biết khi nào nên dừng.'));
    }

    // 3. Thời gian
    const timeHeavy = ['superapp', 'marketplace', 'logistics', 'physical', 'ai'].some((k) => kinds.has(k));
    if (timeHeavy) {
      const huge = kinds.has('superapp');
      flags.push(mk('Thời gian', huge ? 'hard' : 'warn', huge ? 'Khó xong trong một học kỳ' : 'Hướng này ngốn thời gian hơn vẻ ngoài của nó',
        'Hướng này cần nhiều tuần làm, nhiều lần thử. Kỳ nào nhiều môn nặng và deadline dày thì rất dễ trễ.', 'Thu nhỏ còn một việc thử được trong 1 tuần, và đặt mốc theo từng tuần.'));
    } else {
      flags.push(mk('Thời gian', 'ok', 'Thời gian không phải vấn đề lớn', 'Hướng này làm được từng phần nhỏ.', 'Đặt hạn cho từng việc, đừng để dồn cuối kỳ.'));
    }

    // 4. Luật và an toàn
    const sens = (s.sensitive || []).filter((x) => x !== 'none');
    if (kinds.has('forbidden') || kinds.has('illegal')) {
      flags.push(mk('Luật và an toàn', 'blocked', 'Hướng này nằm ngoài những gì Nexus có thể hỗ trợ',
        kinds.has('forbidden') ? 'Liên quan vũ khí, chất nổ, hạt nhân hoặc chất cấm: không hợp pháp với người không có giấy phép và cực kỳ nguy hiểm.' : 'Có thể vi phạm pháp luật hoặc bản quyền.',
        'Giữ lại nhu cầu phía sau (ví dụ cần điện, cần an toàn, cần học tốt hơn) và nghĩ lại cách giải quyết hợp pháp.'));
    } else if (kinds.has('regulated') || sens.some((x) => x === 'health' || x === 'money')) {
      flags.push(mk('Luật và an toàn', 'warn', 'Lĩnh vực cần giấy phép hoặc rất cẩn thận',
        'Liên quan sức khoẻ hoặc tiền bạc của người khác. Sai sót có thể gây hại thật.', 'Chỉ làm phần thông tin chung hoặc tìm hiểu, không đưa lời khuyên chuyên môn. Hỏi thầy cô trước khi đi tiếp.'));
    } else if (sens.length) {
      flags.push(mk('Luật và an toàn', 'warn', 'Có điểm cần kiểm tra', 'Bạn đã đánh dấu: ' + sens.map((x) => NX.SENSITIVE.find((i) => i.id === x).label.toLowerCase()).join(', ') + '.', 'Đọc kỹ quy định liên quan trước khi bán hoặc thu thập dữ liệu.'));
    } else {
      flags.push(mk('Luật và an toàn', 'ok', 'Chưa thấy vấn đề', 'Chưa thấy điểm nào đụng đến luật hoặc an toàn.', 'Nếu sau này đổi hướng, hãy kiểm tra lại mục này.'));
    }

    // 5. Gặp được khách
    const groups = (s.net || []).filter((x) => x !== 'none');
    if ((s.netOther || '').trim()) groups.push('other');
    const knowsDecider = groups.includes('work') || groups.includes('mentor');
    if (kinds.has('b2bLarge') && !knowsDecider) {
      flags.push(mk('Gặp được khách', 'hard', 'Chưa thấy đường tới người ra quyết định',
        'Khách là doanh nghiệp hoặc cơ quan lớn. Bạn chưa chọn nhóm người nào (nơi làm thêm, thầy cô, người đi làm) có thể dẫn tới họ.', 'Hạ khách xuống nhóm tiếp cận được ngay: chủ quán nhỏ, bạn cùng lớp, người bán online.'));
    } else if (!groups.length) {
      flags.push(mk('Gặp được khách', 'warn', 'Chưa có nhóm người nào để hỏi', 'Không có người để hỏi thì mọi hướng đều chỉ là đoán.',
        'Nhờ bạn bè giới thiệu hoặc đi hỏi thẳng chủ quán nhỏ quanh trường.'));
    } else {
      flags.push(mk('Gặp được khách', 'ok', 'Có nhóm người để hỏi', 'Bạn đã chọn những nhóm người có thể trò chuyện cùng.', 'Nhớ hỏi người thật, đừng chỉ nhờ bạn bè nói cho vui.'));
    }
    return flags;
  }

  const RANK = { ok: 0, warn: 1, hard: 2, blocked: 3 };
  function verdict(flags) {
    const worst = flags.reduce((m, f) => Math.max(m, RANK[f.status]), 0);
    return [
      { cls: 'ok', t: 'Chưa thấy chỗ nào quá vô lý', d: 'Nhưng đây chưa phải xác nhận có khách cần. Phần đó chỉ biết sau khi bạn đi hỏi người thật.' },
      { cls: 'warn', t: 'Làm được, nhưng cần chú ý vài chỗ', d: 'Đọc các mục màu vàng và làm theo cách xử lý.' },
      { cls: 'hard', t: 'Có chỗ rất khó', d: 'Đừng bỏ ngay. Mỗi chỗ khó đều có cách đổi hướng nhỏ hơn bên dưới.' },
      { cls: 'blocked', t: 'Hướng này nằm ngoài khả năng hỗ trợ', d: 'Hãy giữ lại nhu cầu phía sau và nghĩ cách khác. Xem gợi ý bên dưới.' },
    ][worst];
  }

  const DOWNSCALE = {
    ai: 'việc làm tay hoặc dùng công cụ AI có sẵn, còn việc tự xây AI thì chưa',
    physical: 'việc bán hoặc phân phối sản phẩm có sẵn, hoặc làm dịch vụ đi kèm, thay vì tự sản xuất',
    marketplace: 'việc làm người trung gian thủ công qua nhóm Zalo để kết nối vài người đầu tiên',
    superapp: 'một việc nhỏ nhất trong cả hệ thống đó, làm bằng Google Sheet',
    logistics: 'việc gom đơn theo nhóm nhỏ qua Zalo, chưa tự giao hàng',
    b2bLarge: 'nhóm khách gặp được ngay như chủ quán nhỏ, bạn cùng lớp và người bán online',
    software: 'bản Sheet, Form hoặc trang web một trang trước khi làm app',
    regulated: 'phần thông tin chung hoặc hỗ trợ việc không cần giấy phép',
  };

  function computeZones(s) {
    const zones = [];
    const used = new Set();
    const add = (z, because, tag) => {
      if (zones.length >= 4 || used.has(z.title)) return;
      used.add(z.title);
      zones.push({ ...z });
    };
    const kinds = confirmedKinds(s);
    const sorted = [...kinds].filter((k) => DOWNSCALE[k]);
    if (ideaMode(s) !== 'none') {
      const hasForbidden = kinds.has('forbidden') || kinds.has('illegal');
      add({
        title: hasForbidden ? 'Nhu cầu phía sau ý tưởng của bạn' : 'Ý tưởng nháp của bạn, thu nhỏ lại',
        prose: hasForbidden
          ? 'Từ ý tưởng “' + clip(ideaTitle(s), 60) + '” bạn đã nêu, cách an toàn là dừng lại ở việc viết rõ nhu cầu của chính mình, tức là bạn đang muốn giải quyết chuyện gì cho ai. Sau khi ghi rõ nhu cầu đó, bạn mới đi tìm cách giải quyết hợp pháp và vừa sức.'
          : 'Từ ý tưởng “' + clip(ideaTitle(s), 60) + '” bạn đã nêu, trước hết hãy tới hỏi người bạn muốn phục vụ, rồi làm bản thử nhỏ nhất chứ đừng vội làm lớn. Bản thử đó là ' + (sorted.length ? sorted.map((k) => DOWNSCALE[k]).join('; ') : 'giữ nguyên ý tưởng nhưng chỉ thử với 5 người đầu tiên') + '. Điều cần kiểm chứng là ý tưởng này giúp được ai trong số họ, và hiện tại họ đang xử lý chuyện đó bằng cách nào.',
      }, '', 'idea');
    }
    if (s.pain && s.pain.trim()) {
      add({
        title: 'Điều khó chịu bạn đã kể',
        prose: '“' + clip(s.pain, 60) + '” — câu chuyện bạn kể là chuyện không phải chỉ mình bạn gặp, nên trước hết hãy hỏi thêm vài người cũng đang gặp chuyện này xem họ có gặp tương tự không. Bạn chưa cần nghĩ giải pháp lúc này; điều cần kiểm chứng là chuyện này xảy ra bao lâu một lần và họ đang tạm xử lý bằng cách nào.',
      }, '', 'pain');
    }
    NX.ASSET_RULES.filter((r) => s.assetTags[r.id] === 'yes').forEach((r) => add(r.zone, 'Vì bạn đã xác nhận: ' + r.label.toLowerCase() + '.', 'asset'));
    (s.net || []).forEach((id) => { const n = NX.NET_OPTIONS.find((x) => x.id === id); if (n) add(n.zone, 'Vì bạn gặp được: ' + n.label.toLowerCase() + '.', 'net'); });
    const { best } = teamStats(s);
    ['sell', 'design', 'code', 'ops', 'craft'].forEach((k) => { if (best[k] >= 2) add(NX.STRENGTH_ZONES[k], 'Vì trong nhóm có người làm được việc này.', 'strength'); });
    return zones.slice(0, 4);
  }

  const ROLES = {
    maker_digital: { title: 'Người làm ra sản phẩm số (web, app, bảng tính tự động)', look: 'Hỏi: “Bạn đã tự làm được thứ gì chạy thật chưa? Cho mình xem.” Một sản phẩm nhỏ đã làm xong có giá trị hơn một bảng điểm đẹp.', ask: 'làm web, app hoặc bảng tính tự động' },
    maker_physical: { title: 'Người làm ra sản phẩm thật (thủ công, nấu ăn, chế tạo) hoặc có xưởng', look: 'Hỏi: “Bạn đã tự làm ra món gì bằng tay chưa? Có chỗ làm không?”', ask: 'làm đồ bằng tay hoặc có chỗ làm' },
    maker_any: { title: 'Người trực tiếp làm ra sản phẩm', look: 'Hỏi: “Bạn đã tự làm được thứ gì dùng được chưa?” Tuỳ hướng sau này mà là code hay làm thủ công.', ask: 'trực tiếp làm ra sản phẩm' },
    talker: { title: 'Người nói chuyện và gặp khách', look: 'Hỏi: “Tuần trước bạn có bắt chuyện với người lạ để hỏi một việc gì không?”', ask: 'nói chuyện, gặp khách' },
    organizer: { title: 'Người giữ nhịp việc và soạn tài liệu', look: 'Hỏi: “Bạn đã từng giữ việc cho một nhóm đến khi xong chưa? Lần gần nhất thế nào?”', ask: 'giữ tiến độ và viết tài liệu' },
    numbers: { title: 'Người tính tiền', look: 'Hỏi: “Nếu bán một cái giá X, nhóm lời hay lỗ bao nhiêu? Bạn tính thế nào?”', ask: 'tính chi phí và giá bán' },
  };

  function computeRecruit(s) {
    const { best } = teamStats(s);
    const kinds = confirmedKinds(s);
    const assets = confirmedAssetIds(s);
    const roles = [];
    const makerAsset = assets.includes('workshop') || assets.includes('lab');
    const noMaker = best.code < 2 && best.craft < 2 && best.domain < 2 && !makerAsset;
    if (kinds.has('physical') && best.craft < 2 && !makerAsset) roles.push(['maker_physical', 'Ý tưởng cần làm đồ thật mà chưa ai làm chắc việc đó.']);
    else if ((kinds.has('ai') || kinds.has('software')) && best.code < 2) roles.push(['maker_digital', 'Ý tưởng là sản phẩm số mà chưa ai làm được phần kỹ thuật.']);
    else if (noMaker) roles.push(['maker_any', 'Hiện chưa ai trong nhóm trực tiếp làm ra sản phẩm.']);
    // Cùng một bộ vai với mục "giữ được tới hết môn": vai nào trống thì gợi ý đúng vai đó,
    // không tự đặt điều kiện riêng để hai mục khỏi nói ngược nhau.
    const cov = computeCoverage(s);
    const taken = (id) => roles.some(([r]) => r === id) || (id === 'build' && roles.some(([r]) => r.startsWith('maker')));
    if (cov.empty.includes('reach') && !taken('talker')) roles.push(['talker', 'Chưa ai trong nhóm ở mức “làm được” ở việc nói chuyện, bán hàng, hỏi chuyện người lạ. Mà sắp tới phải đi hỏi khách thật.']);
    if (best.ops < 2 && best.write < 2) roles.push(['organizer', 'Chưa ai giữ nhịp việc hoặc viết tài liệu ở mức làm được.']);
    if ((kinds.has('physical') || kinds.has('marketplace') || kinds.has('logistics')) && best.finance < 2) roles.push(['numbers', 'Hướng này dễ lỗ nếu không ai tính chi phí.']);
    // Vai cốt lõi còn trống thì phải có người, kể cả khi ý tưởng chưa cho thấy điều đó:
    // tới giai đoạn phỏng vấn, làm sản phẩm hay làm kế hoạch sẽ lộ ra ngay.
    if (cov.empty.includes('build') && !taken('build')) roles.push(['maker_any', 'Nhóm chưa có ai trực tiếp làm ra sản phẩm, tới lúc khách cần dùng thử thì không ai làm được.']);
    if (cov.empty.includes('money') && !taken('numbers')) roles.push(['numbers', 'Nhóm chưa có ai tính tiền, tới lúc làm chi phí, giá bán và kế hoạch thì không ai làm được.']);
    return roles.map(([id, why]) => ({ ...ROLES[id], id, why }));
  }

  function recruitPost(s, role) {
    const n = s.team.length;
    const strengths = NX.CAPS.filter((c) => teamStats(s).best[c.id] >= 2).map((c) => c.label.toLowerCase()).slice(0, 3);
    return '[Tìm bạn cùng nhóm] ' + (n > 1 ? 'Nhóm mình hiện có ' + n + ' người' : 'Mình đang làm một mình') + ', làm dự án môn khởi nghiệp. Đang thiếu: ' + role.title.toLowerCase() + '. '
      + 'Bạn chỉ cần biết ' + role.ask + ' ở mức làm được. '
      + (strengths.length ? 'Phía mình có người ' + strengths.join('; ') + '. ' : '')
      + 'Nếu bạn quan tâm, nhắn mình để nói chuyện 15 phút.';
  }

  /** Ràng buộc của môn: số người 4–6, và với EXE101 là số chuyên ngành khác nhau. */
  function teamRule(s) {
    const r = NX.TEAM_RULES;
    const size = (s.team || []).length;
    // Trần 4–6 người và ≥2 ngành là luật của trường FPT. Trường khác không có luật này nên
    // `sizeMin`/`sizeMax` trả `null` và phần lớn báo cáo bỏ qua hẳn thay vì bịa ra một trần.
    const fpt = s.schoolKind === 'fpt';
    const major = (p) => (p.major === 'Ngành khác' ? (p.majorOther || '') : (p.major || '')).trim().toLowerCase();
    const majors = new Set((s.team || []).map(major).filter(Boolean)).size;
    const exe = fpt && s.subjectKind === 'exe101';
    return {
      fpt,
      exe,
      size,
      majors,
      sizeOk: !fpt || (size >= r.sizeMin && size <= r.sizeMax),
      majorsOk: !exe || majors >= r.majorsMin,
      sizeMin: fpt ? r.sizeMin : null,
      sizeMax: fpt ? r.sizeMax : null,
      majorsMin: r.majorsMin,
    };
  }

  NX.eng = { norm, hit, clip, detectAssets, confirmedAssetIds, detectIdea, confirmedKinds, ideaMode, ideaText, ideaTitle, madlibsFilled, roleTrack, trackCoverage, teamStats, computeCoverage, computeFlags, verdict, computeZones, computeRecruit, recruitPost, teamRule };
})();
