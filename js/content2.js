/* Chapters 2-9 and 12-17, built from the Room to Read Grade 1 worksheets.
   One worksheet page = one day. Loaded after content.js; fills in the chapter list. */
(function () {
  const { bn, emo, pv, stick, bundle } = window.V;

  // ======================= drawings =======================
  const pile = (n, e, sz) => n ? `<div class="pile">${emo(e, sz || (n > 12 ? 36 : n > 6 ? 48 : 62), n)}</div>` : `<div class="pile plate">${emo('🥣', 54)}<span class="small muted">খালি বাটি</span></div>`;
  const two = (a, b, mid) => `<div class="row" style="justify-content:center;align-items:center;flex-wrap:nowrap;gap:6px"><div style="flex:1;min-width:0">${a}</div><b style="font-size:1.8rem">${mid || '➕'}</b><div style="flex:1;min-width:0">${b}</div></div>`;
  const sticks = n => `<div class="pile" style="gap:3px">${n ? Array.from({ length: n }, () => stick(54)).join('') : '<span class="muted small">কোনো কাঠি নেই</span>'}</div>`;
  function crossed(n, k, e) {
    let s = '';
    for (let i = 0; i < n; i++) s += i >= n - k
      ? `<span class="gone">${e === '|' ? stick(54) : emo(e, n > 12 ? 36 : 50)}</span>`
      : (e === '|' ? stick(54) : emo(e, n > 12 ? 36 : 50));
    return `<div class="pile">${s}</div>`;
  }
  function frame10(a, b, c1, c2) {
    let s = '';
    for (let i = 0; i < 10; i++) {
      const x = 4 + (i % 5) * 34, y = 4 + Math.floor(i / 5) * 34;
      const f = i < a ? (c1 || '#d9534f') : i < a + (b || 0) ? (c2 || '#3a8fd6') : null;
      s += `<rect x="${x}" y="${y}" width="32" height="32" fill="#fff" stroke="#8aa" stroke-width="1.5"/>${f ? `<circle cx="${x + 16}" cy="${y + 16}" r="11" fill="${f}"/>` : ''}`;
    }
    return `<svg viewBox="0 0 178 76" width="178" height="76" role="img" aria-label="দশের ঘর">${s}</svg>`;
  }
  function nline(a, b, max) {
    max = max || 10; const W = 340, L = 14, step = (W - 2 * L) / max;
    let s = `<line x1="${L}" y1="50" x2="${W - L}" y2="50" stroke="#334" stroke-width="2"/>`;
    for (let i = 0; i <= max; i++) { const x = L + i * step; s += `<line x1="${x}" y1="44" x2="${x}" y2="56" stroke="#334"/><text x="${x}" y="69" font-size="${max > 12 ? 9 : 12}" text-anchor="middle" fill="#223">${bn(i)}</text>`; }
    const dir = Math.sign(b);
    for (let k = 0; k < Math.abs(b); k++) { const x1 = L + (a + k * dir) * step, x2 = x1 + dir * step; s += `<path d="M${x1} 44 Q${(x1 + x2) / 2} 20 ${x2} 44" fill="none" stroke="${dir > 0 ? '#2e9e5b' : '#d9534f'}" stroke-width="2.5"/>`; }
    s += `<circle cx="${L + a * step}" cy="50" r="6" fill="#ffb627" stroke="#a0700b"/>`;
    return `<svg viewBox="0 0 ${W} 74" width="100%" style="max-width:440px" role="img" aria-label="সংখ্যারেখা">${s}</svg>`;
  }
  const NUM = n => `<span class="bign">${bn(n)}</span>`;
  const TXT = t => `<span class="bigt">${t}</span>`;
  function vtab(a, b, op) {
    const r = n => `<td>${n >= 10 ? bn(Math.floor(n / 10)) : ''}</td><td>${bn(n % 10)}</td>`;
    return `<table class="vtab"><tr><th></th><th>দশক</th><th>একক</th></tr><tr><td></td>${r(a)}</tr><tr class="op"><td>${op}</td>${r(b)}</tr><tr class="ans"><td></td><td>?</td><td>?</td></tr></table>`;
  }
  function shp(kind, color, size) {
    const z = size || 56, c = color || '#3a8fd6';
    const body = kind === 'circle' ? `<circle cx="30" cy="30" r="26" fill="${c}"/>`
      : kind === 'tri' ? `<polygon points="30,4 56,54 4,54" fill="${c}"/>`
      : kind === 'square' ? `<rect x="6" y="6" width="48" height="48" fill="${c}"/>`
      : `<rect x="2" y="14" width="56" height="32" fill="${c}"/>`;
    return `<svg width="${z}" height="${z}" viewBox="0 0 60 60" aria-hidden="true" style="vertical-align:middle">${body}</svg>`;
  }
  const SHAPE_NAME = { circle: 'গোল আকৃতি', tri: 'তিনকোনা আকৃতি', square: 'চারকোনা আকৃতি', rect: 'চারকোনা আকৃতি' };
  const MONEY = {
    1: ['coin', '#e9c46a', '#a07a1f'], 2: ['coin', '#d8d8d8', '#888'], 5: ['coin', '#f0d27a', '#a07a1f'],
    10: ['note', '#f6b7c4', '#b5476a'], 20: ['note', '#bfe3b4', '#3c7f2d'], 50: ['note', '#f8d49a', '#a86a12'], 100: ['note', '#b7d3f2', '#2b5f9e']
  };
  function money(v, sz) {
    const [k, f, s] = MONEY[v]; const z = sz || 1;
    if (k === 'coin') return `<svg width="${46 * z}" height="${46 * z}" viewBox="0 0 46 46" role="img" aria-label="${bn(v)} টাকা"><circle cx="23" cy="23" r="21" fill="${f}" stroke="${s}" stroke-width="2.5"/><circle cx="23" cy="23" r="16" fill="none" stroke="${s}" stroke-width="1"/><text x="23" y="28" font-size="16" text-anchor="middle" fill="#333">${bn(v)}</text></svg>`;
    return `<svg width="${92 * z}" height="${46 * z}" viewBox="0 0 92 46" role="img" aria-label="${bn(v)} টাকা"><rect x="1" y="1" width="90" height="44" rx="5" fill="${f}" stroke="${s}" stroke-width="2"/><circle cx="22" cy="23" r="13" fill="#fff" opacity=".55" stroke="${s}"/><text x="62" y="29" font-size="19" text-anchor="middle" fill="#333">${bn(v)}</text><text x="62" y="41" font-size="8" text-anchor="middle" fill="#333">টাকা</text></svg>`;
  }
  const moneyRow = vs => `<div class="row" style="justify-content:center;gap:6px">${vs.map(v => money(v)).join('')}</div>`;

  // ======================= words =======================
  const WORDS = ['শূন্য', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ'];
  const seqTxt = n => Array.from({ length: n }, (_, i) => bn(i + 1)).join(', ');
  const cyc = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
  const near = (n, lo, hi) => { const c = [n + 1, n - 1, n + 2, n - 2].filter(x => x >= lo && x <= hi && x !== n); return c.slice(0, 2); };
  const H_COUNT = ['প্রতিটি ছবিতে একবার করে আঙুল রাখো আর গোনো: এক, দুই, তিন…', 'শেষ ছবিতে যে সংখ্যা বলো, সেটিই মোট। একটিও বাদ দিও না, একটি দুবারও গুনো না।'];

  // ======================= activity makers =======================
  // count pictures, write the number
  function count(n, e, s) {
    return {
      t: 'fill', s: s || '', q: 'ছবি গুনে সংখ্যা লিখি।', vis: pile(n, e), parts: ['মোট', { a: n }, 'টি'],
      h: n ? H_COUNT : ['বাটিতে কি কিছু আছে?', 'কিছু না থাকলে আমরা লিখি ০ (শূন্য)।'],
      ex: n ? (n <= 10 ? `গুনে দেখি: ${seqTxt(n)}। মোট ${bn(n)}টি।` : `একটি একটি করে গুনলে মোট ${bn(n)}টি।`) : 'বাটিতে কিছু নেই, তাই ০ (শূন্য)।',
      rem: () => count(n >= 9 ? n - 2 : n + 1, e, s)
    };
  }
  // number -> which picture group
  function numPic(n, e, s, max) {
    const o = near(n, 1, max || 10);
    return {
      t: 'pick', s: s || '', q: `কোথায় ${bn(n)}টি ছবি আছে? ছুঁয়ে দেখাও।`, cols: 1,
      opts: [{ v: pile(n, e), ok: true }, ...o.map(m => ({ v: pile(m, e) }))],
      h: ['প্রতিটি দলের ছবি গুনে দেখো।', `যে দলে ঠিক ${bn(n)}টি আছে, সেটিই উত্তর।`],
      ex: `এই দলে ${seqTxt(n)}, মোট ${bn(n)}টি।`, rem: () => numPic(n === (max || 10) ? n - 1 : n + 1, e, s, max)
    };
  }
  // picture group -> which number
  function picNum(n, e, s, max) {
    const o = near(n, 0, max || 10);
    return {
      t: 'pick', s: s || '', q: 'ছবিতে কয়টি আছে? সঠিক সংখ্যাটি ছুঁয়ে দেখাও।', vis: pile(n, e), cols: 3,
      opts: [{ v: NUM(n), ok: true }, ...o.map(m => ({ v: NUM(m) }))],
      h: H_COUNT, ex: `গুনে দেখি: মোট ${bn(n)}টি।`, rem: () => picNum(n > 3 ? n - 1 : n + 2, e, s, max)
    };
  }
  // sticks equal to the pictures
  function stickEq(n, e, s) {
    const o = near(n, 1, 10);
    return {
      t: 'pick', s: s || '', q: 'ছবির সমান কাঠি কোনটিতে? ছুঁয়ে দেখাও।', vis: pile(n, e), cols: 1,
      opts: [{ v: sticks(n), ok: true }, ...o.map(m => ({ v: sticks(m) }))],
      h: ['আগে ছবিগুলো গুনে নাও।', `ছবি ${bn(n)}টি। এবার কাঠি গুনে দেখো কোথায় ${bn(n)}টি।`],
      ex: `ছবি ${bn(n)}টি, তাই ${bn(n)}টি কাঠি।`, rem: () => stickEq(n > 2 ? n - 1 : n + 2, e, s)
    };
  }
  function tf(statement, ok, hints, ex, vis) {
    return {
      t: 'pick', q: 'ঠিক হলে ✓, ভুল হলে ✗ ছুঁয়ে দেখাও।', vis: (vis || '') + `<p class="q" style="text-align:center;font-size:1.6rem">${statement}</p>`,
      cols: 2, opts: [{ v: '<span style="font-size:3rem;color:#2e9e5b">✓</span>', lbl: 'ঠিক', ok }, { v: '<span style="font-size:3rem;color:#d9534f">✗</span>', lbl: 'ভুল', ok: !ok }],
      h: hints, ex
    };
  }
  const tfCount = (n, e, claim) => tf(`এখানে ${bn(claim)}টি`, n === claim, H_COUNT, n === claim ? `ঠিক! গুনলে ${bn(n)}টি।` : `ভুল। গুনলে ${bn(n)}টি, ${bn(claim)}টি নয়।`, pile(n, e));
  const nextN = (n, s) => ({ t: 'fill', s: s || '', q: `${bn(n)} এর পরের সংখ্যা কত?`, parts: [bn(n), '→', { a: n + 1 }], h: ['পরের সংখ্যা মানে ১ বেশি।', `গুনতে থাকো: …${bn(n)}, তারপর?`], ex: `${bn(n)} এর পরে ${bn(n + 1)}।`, rem: () => nextN(n + 2, s) });
  const prevN = (n, s) => ({ t: 'fill', s: s || '', q: `${bn(n)} এর আগের সংখ্যা কত?`, parts: [{ a: n - 1 }, '←', bn(n)], h: ['আগের সংখ্যা মানে ১ কম।', `গুনে দেখো: কোন সংখ্যার পরে ${bn(n)} আসে?`], ex: `${bn(n - 1)} এর পরে ${bn(n)} আসে, তাই আগের সংখ্যা ${bn(n - 1)}।`, rem: () => prevN(n > 3 ? n - 1 : n + 2, s) });
  const between = (a, s) => ({ t: 'fill', s: s || '', q: 'মাঝের সংখ্যাটি লিখি।', parts: [bn(a), { a: a + 1 }, bn(a + 2)], h: ['বাম দিক থেকে গুনতে থাকো।', `${bn(a)} এর ঠিক পরে কোন সংখ্যা?`], ex: `${bn(a)}, ${bn(a + 1)}, ${bn(a + 2)}`, rem: () => between(a + 1, s) });
  function seq(start, len, blanks, s) {
    const parts = []; for (let i = 0; i < len; i++) { const n = start + i; parts.push(blanks.includes(n) ? { a: n } : bn(n)); }
    return { t: 'fill', s: s || '', q: 'খালিঘরে সংখ্যা লিখি।', parts, h: ['সংখ্যাগুলো ক্রমে আছে: প্রতিবার ১ করে বাড়ে।', 'খালিঘরের আগের সংখ্যাটি দেখো, তার পরের সংখ্যা লেখো।'], ex: `ক্রম: ${Array.from({ length: len }, (_, i) => bn(start + i)).join(', ')}`, rem: () => seq(start, len, blanks.map(b => b + 1 < start + len ? b + 1 : b - 1), s) };
  }
  function pickN(nums, want, s) {
    const ans = want === 'big' ? Math.max(...nums) : Math.min(...nums);
    return {
      t: 'pick', s: s || '', q: want === 'big' ? 'বড়ো সংখ্যাটি ছুঁয়ে দেখাও।' : 'ছোটো সংখ্যাটি ছুঁয়ে দেখাও।', cols: nums.length > 2 ? 3 : 2,
      opts: nums.map(n => ({ v: NUM(n), ok: n === ans })),
      h: ['গুনতে গেলে যে সংখ্যা পরে আসে, সেটি বড়ো। আগে আসে যেটি, সেটি ছোটো।', nums.some(n => n > 9) ? 'আগে দশকের অঙ্ক দেখো, সমান হলে এককের অঙ্ক।' : `${bn(nums[0])} আর ${bn(nums[1])}: গুনে দেখো কোনটি আগে আসে।`],
      ex: `${bn(ans)} ${want === 'big' ? 'সবচেয়ে বড়ো' : 'সবচেয়ে ছোটো'}।`, rem: () => pickN(nums.map(n => n + 1), want, s)
    };
  }
  function ord(nums, dir, s) {
    const sorted = [...nums].sort((a, b) => dir === 'asc' ? a - b : b - a);
    return {
      t: 'order', s: s || '', q: dir === 'asc' ? 'ছোটো থেকে বড়ো ক্রমে সাজাও। সবচেয়ে ছোটোটি আগে ছোঁও।' : 'বড়ো থেকে ছোটো ক্রমে সাজাও। সবচেয়ে বড়োটি আগে ছোঁও।',
      nums, dir, h: [dir === 'asc' ? 'সবচেয়ে ছোটো সংখ্যাটি খোঁজো। গুনতে গেলে সেটি সবার আগে আসে।' : 'সবচেয়ে বড়ো সংখ্যাটি খোঁজো। গুনতে গেলে সেটি সবার শেষে আসে।', `শুরু হবে ${bn(sorted[0])} দিয়ে।`],
      ex: `সঠিক ক্রম: ${sorted.map(bn).join(', ')}`, rem: () => ord(nums.map(n => n + 1), dir, s)
    };
  }
  // number bond
  function bond(n, a, e, s) {
    return {
      t: 'fill', s: s || '', q: `${bn(n)}টিকে দুই ভাগে সাজাই। খালিঘর পূরণ করি।`, vis: two(pile(a, e || '🍬'), pile(n - a, e || '🍬'), '|'),
      parts: [bn(n), '=', bn(a), '+', { a: n - a }],
      h: [`মোট ${bn(n)}টি। এক ভাগে ${bn(a)}টি আছে।`, `${bn(a)} থেকে গুনতে থাকো ${bn(n)} পর্যন্ত। কত আঙুল লাগল?`],
      ex: `${bn(a)} আর ${bn(n - a)} মিলে ${bn(n)}। ${bn(n)} = ${bn(a)} + ${bn(n - a)}`, rem: () => bond(n, a > 1 ? a - 1 : a + 1, e, s)
    };
  }
  function make10(a, s) {
    return {
      t: 'fill', s: s || '', q: '১০ বানাতে আর কয়টি লাগবে?', vis: frame10(a),
      parts: [bn(a), '+', { a: 10 - a }, '=', '১০'],
      h: ['দশের ঘরে ১০টি জায়গা। ভরা ঘরগুলো গুনে দেখো।', `খালি ঘরগুলো গোনো। সেগুলোই আরও লাগবে।`],
      ex: `${bn(a)} আর ${bn(10 - a)} মিলে ১০।`, rem: () => make10(a === 9 ? 6 : a + 1, s)
    };
  }
  // addition with pictures; full = child writes the whole sentence
  function add(a, b, e, s, q, full) {
    const sum = a + b;
    return {
      t: 'fill', s: s || '', q: q || 'একসাথে কয়টি?', vis: two(pile(a, e), pile(b, e)),
      parts: full ? [{ a }, '+', { a: b }, '=', { a: sum }] : [bn(a), '+', bn(b), '=', { a: sum }],
      h: full ? ['প্রথম দলে কয়টি, দ্বিতীয় দলে কয়টি গুনে লেখো।', `${bn(a)} থেকে আরও ${bn(b)} গুনে যাও: ${Array.from({ length: b }, (_, i) => bn(a + i + 1)).join(', ')}।`]
        : [`দুই দল একসাথে করলে যোগ হয়। সব ছবি একসাথে গোনো।`, `${bn(a)} মনে রাখো, তারপর আরও ${bn(b)} গুনে যাও।`],
      ex: `${bn(a)} + ${bn(b)} = ${bn(sum)}`, rem: () => add(b, a + (a + b < 10 ? 1 : 0), e, s, q, full)
    };
  }
  const addSt = (a, b, s) => ({ ...add(a, b, '|', s, 'কাঠি গুনে যোগফল বের করি।'), vis: two(sticks(a), sticks(b)), rem: () => addSt(b, a, s) });
  const addNL = (a, b, s) => ({ t: 'fill', s: s || '', q: 'সংখ্যারেখায় লাফ দিয়ে যোগ করি।', vis: nline(a, b, a + b > 10 ? 20 : 10), parts: [bn(a), '+', bn(b), '=', { a: a + b }], h: [`হলুদ বিন্দু ${bn(a)} এ আছে। সামনে ${bn(b)}টি লাফ দাও।`, 'সবুজ লাফগুলো গোনো, শেষে কোন সংখ্যায় থামলে?'], ex: `${bn(a)} থেকে ${bn(b)} লাফ দিলে ${bn(a + b)}।`, rem: () => addNL(a - 1 > 0 ? a - 1 : a + 1, b, s) });
  const HAND = ['✊', '☝️', '✌️', '🤟', '🖖', '✋'];
  const hands = n => `<span style="display:inline-flex;gap:2px;flex-wrap:nowrap">${n <= 5 ? emo(HAND[n], 70) : emo('✋', 40) + emo(HAND[n - 5], 40)}</span>`;
  const addF = (a, b, s) => ({ t: 'fill', s: s || '', q: 'হাতের আঙুল গুনে যোগ করি।', vis: two(`<div class="fing">${bn(a)} আঙুল</div>${hands(a)}`, `<div class="fing">${bn(b)} আঙুল</div>${hands(b)}`), parts: [bn(a), '+', bn(b), '=', { a: a + b }], h: [`এক হাতে ${bn(a)}টি আঙুল তোলো।`, `এবার আরও ${bn(b)}টি আঙুল তোলো। মোট কয়টি আঙুল উঠল?`], ex: `${bn(a)} + ${bn(b)} = ${bn(a + b)}`, rem: () => addF(b, a, s) });
  function sumPick(target, exprs, s) {
    return {
      t: 'pick', s: s || '', q: `কোনটির যোগফল ${bn(target)}?`, cols: exprs.length > 2 ? 3 : 2,
      opts: exprs.map(([x, y]) => ({ v: TXT(`${bn(x)} + ${bn(y)}`), ok: x + y === target })),
      h: ['প্রতিটি যোগ করে দেখো।', 'আঙুল বা কাঠি দিয়ে যোগ করতে পারো।'], ex: exprs.map(([x, y]) => `${bn(x)} + ${bn(y)} = ${bn(x + y)}`).join('। '),
      rem: () => sumPick(target, exprs.map(([x, y]) => [y, x]), s)
    };
  }
  function ansPick(a, b, op, s) {
    const r = op === '+' ? a + b : a - b, o = [r + 1, r - 1 >= 0 ? r - 1 : r + 2];
    return {
      t: 'pick', s: s || '', q: `${bn(a)} ${op} ${bn(b)} = কত? সঠিক উত্তর ছুঁয়ে দেখাও।`, cols: 3,
      opts: [{ v: NUM(r), ok: true }, ...o.map(m => ({ v: NUM(m) }))],
      h: [op === '+' ? `${bn(a)} থেকে আরও ${bn(b)} গুনে যাও।` : `${bn(a)} থেকে ${bn(b)} পিছনে গুনে যাও।`, op === '+' ? 'আঙুল বা কাঠি দিয়ে দেখো।' : 'কাঠি কেটে দেখো কয়টি বাকি থাকে।'],
      ex: `${bn(a)} ${op} ${bn(b)} = ${bn(r)}`, rem: () => ansPick(a + 1, b, op, s)
    };
  }
  const missAdd = (a, sum, s) => ({ t: 'fill', s: s || '', q: 'খালিঘর পূরণ করি।', vis: frame10(a, 0), parts: [bn(a), '+', { a: sum - a }, '=', bn(sum)], h: [`${bn(a)} থেকে ${bn(sum)} পর্যন্ত গুনে দেখো।`, `${bn(a)} এর পরে গুনতে থাকো: কয়টি আঙুল লাগল ${bn(sum)} পৌঁছাতে?`], ex: `${bn(a)} + ${bn(sum - a)} = ${bn(sum)}`, rem: () => missAdd(a > 1 ? a - 1 : a + 1 < sum ? a + 1 : 0, sum, s) });
  // subtraction with pictures
  function sub(a, b, e, s, q, full) {
    return {
      t: 'fill', s: s || '', q: q || 'কয়টি বাকি রইল?', vis: crossed(a, b, e || '|'),
      parts: full ? [{ a }, '−', { a: b }, '=', { a: a - b }] : [bn(a), '−', bn(b), '=', { a: a - b }],
      h: [`মোট ${bn(a)}টি ছিল। কাটা দাগ দেওয়া ${bn(b)}টি চলে গেছে।`, 'কাটা দাগ ছাড়া বাকিগুলো গোনো।'],
      ex: `${bn(a)}টি থেকে ${bn(b)}টি গেলে থাকে ${bn(a - b)}টি। ${bn(a)} − ${bn(b)} = ${bn(a - b)}`, rem: () => sub(a, b > 1 ? b - 1 : b + 1, e, s, q, full)
    };
  }
  const subSt = (a, b, s) => ({ ...sub(a, b, '|', s, 'কাঠি কেটে বিয়োগ করি।'), rem: () => subSt(a, b > 1 ? b - 1 : b + 1, s) });
  const subNL = (a, b, s) => ({ t: 'fill', s: s || '', q: 'সংখ্যারেখায় পিছনে লাফ দিয়ে বিয়োগ করি।', vis: nline(a, -b, a > 10 ? 20 : 10), parts: [bn(a), '−', bn(b), '=', { a: a - b }], h: [`হলুদ বিন্দু ${bn(a)} এ। পিছনের দিকে ${bn(b)}টি লাফ দাও।`, 'লাল লাফগুলো গোনো, শেষে কোথায় থামলে?'], ex: `${bn(a)} থেকে পিছনে ${bn(b)} লাফ দিলে ${bn(a - b)}।`, rem: () => subNL(a, b > 2 ? b - 1 : b + 1, s) });
  const subF = (a, b, s) => ({ ...sub(a, b, '☝️', s, 'আঙুল দিয়ে বিয়োগ করি।'), h: [`${bn(a)}টি আঙুল তোলো।`, `এবার ${bn(b)}টি আঙুল নামাও। কয়টি উঠে আছে?`], rem: () => subF(a, b > 1 ? b - 1 : b + 1, s) });
  const missSub = (a, r, s) => ({ t: 'fill', s: s || '', q: `কত বিয়োগ করলে ${bn(r)} থাকবে?`, vis: sticks(a), parts: [bn(a), '−', { a: a - r }, '=', bn(r)], h: [`${bn(a)}টি কাঠি আছে। ${bn(r)}টি রেখে বাকিগুলো কাটতে হবে।`, `${bn(r)} থেকে ${bn(a)} পর্যন্ত গুনে দেখো কয়টি।`], ex: `${bn(a)} − ${bn(a - r)} = ${bn(r)}`, rem: () => missSub(a, r > 1 ? r - 1 : r + 1, s) });
  // which is more, then how many more
  function moreWhich(a, ea, la, b, eb, lb, s, want) {
    const ok = want === 'less' ? (a < b ? 0 : 1) : (a > b ? 0 : 1);
    return {
      t: 'pick', s: s || '', q: want === 'less' ? 'কোনটি কম? ছুঁয়ে দেখাও।' : 'কোনটি বেশি? ছুঁয়ে দেখাও।', cols: 2,
      opts: [{ v: pile(a, ea), lbl: la, ok: ok === 0 }, { v: pile(b, eb), lbl: lb, ok: ok === 1 }],
      h: ['দুই দলের ছবি গুনে দেখো।', 'পাশাপাশি জোড়া মেলাও। যার কিছু বাকি থাকে, সেটিতে বেশি।'],
      ex: `${la} ${bn(a)}টি, ${lb} ${bn(b)}টি।`
    };
  }
  const diff = (a, b, s, q) => ({ t: 'fill', s: s || '', q: q || 'কয়টি বেশি? বড়ো সংখ্যা থেকে ছোটো সংখ্যা বিয়োগ করি।', parts: [{ a: Math.max(a, b) }, '−', { a: Math.min(a, b) }, '=', { a: Math.abs(a - b) }], h: ['পার্থক্য মানে বড়ো সংখ্যা থেকে ছোটো সংখ্যা বিয়োগ।', `আগে বড়োটি (${bn(Math.max(a, b))}), তারপর ছোটোটি (${bn(Math.min(a, b))}) লেখো।`], ex: `${bn(Math.max(a, b))} − ${bn(Math.min(a, b))} = ${bn(Math.abs(a - b))}`, rem: () => diff(a + 1, b, s, q) });
  // word problem: child writes the whole sentence
  const story = (a, op, b, s, q, e) => op === '+' ? add(a, b, e || '🍬', s, q, true) : sub(a, b, e || '🍬', s, q, true);
  const storyN = (a, op, b, s, q) => ({ t: 'fill', s, q, parts: [{ a }, op === '+' ? '+' : '−', { a: b }, '=', { a: op === '+' ? a + b : a - b }], h: ['গল্পটি আবার শোনো। কোন দুটি সংখ্যা আছে?', op === '+' ? 'একসাথে করা বা বেড়ে যাওয়া মানে যোগ।' : 'চলে যাওয়া, খেয়ে ফেলা বা কমে যাওয়া মানে বিয়োগ।'], ex: `${bn(a)} ${op === '+' ? '+' : '−'} ${bn(b)} = ${bn(op === '+' ? a + b : a - b)}`, rem: () => storyN(a + 1, op, b, s, q) });
  // make ten to add (8 + 3 = 10 + 1)
  function m10(a, b, s) {
    const big = Math.max(a, b), sm = Math.min(a, b), need = 10 - big, rest = sm - need;
    return {
      t: 'fill', s: s || '', q: `১০ বানিয়ে যোগ করি: ${bn(a)} + ${bn(b)}`, vis: `<div class="row" style="justify-content:center">${frame10(big, need)}${frame10(rest, 0, '#3a8fd6')}</div>`,
      parts: [bn(a), '+', bn(b), '=', '১০', '+', { a: rest }, '=', { a: a + b }],
      h: [`${bn(big)} কে ১০ বানাতে ${bn(need)} লাগে। ছোটো সংখ্যা ${bn(sm)} কে ভাঙি: ${bn(need)} আর ${bn(rest)}।`, `১০ এর সাথে বাকি ${bn(rest)} যোগ করো।`],
      ex: `${bn(big)} + ${bn(need)} = ১০, তারপর ১০ + ${bn(rest)} = ${bn(a + b)}`, rem: () => m10(big === 9 ? 8 : big + 1, sm, s)
    };
  }
  const tenPlus = (o, s) => ({ t: 'fill', s: s || '', q: 'যোগ করি।', vis: `<div class="row" style="justify-content:center">${bundle(64)}<span class="sep"></span>${Array.from({ length: o }, () => stick(64)).join('')}</div>`, parts: ['১০', '+', bn(o), '=', '১ দশ', bn(o), '=', { a: 10 + o }], h: ['একটি আঁটিতে ১০টি কাঠি।', `১ দশ আর ${bn(o)} এক মিলে কত?`], ex: `১০ + ${bn(o)} = ${bn(10 + o)}`, rem: () => tenPlus(o > 2 ? o - 1 : o + 2, s) });
  const teenAdd = (a, b, s) => ({ t: 'fill', s: s || '', q: 'একক যোগ করি, দশ ঠিক থাকে।', vis: `<div class="row" style="justify-content:center">${bundle(60)}<span class="sep"></span>${Array.from({ length: a - 10 }, () => stick(60)).join('')}<b>+</b>${Array.from({ length: b }, () => stick(60)).join('')}</div>`, parts: [bn(a), '+', bn(b), '=', '১ দশ', '+', { a: a - 10 + b }, '=', { a: a + b }], h: [`${bn(a)} = ১ দশ ${bn(a - 10)}। এককগুলো যোগ করি: ${bn(a - 10)} + ${bn(b)}।`, 'এককের যোগফল পেলে তার সাথে ১ দশ রাখো।'], ex: `${bn(a - 10)} + ${bn(b)} = ${bn(a - 10 + b)}, তাই ${bn(a)} + ${bn(b)} = ${bn(a + b)}`, rem: () => teenAdd(a + 1 < 20 && a - 9 + b < 10 ? a + 1 : 11, b, s) });
  // place value count 11-100
  function pvCount(n, s) {
    const t = Math.floor(n / 10), o = n % 10;
    return {
      t: 'fill', s: s || '', q: 'কয়টি দশ, কয়টি এক? সংখ্যাটি লিখি।', vis: mat => pv(t, o, mat), mats: true,
      parts: [{ a: t }, 'দশ', { a: o }, 'এক', '=', { a: n }],
      h: ['প্রতিটি আঁটিতে ১০টি। আগে আঁটি গোনো, তারপর খোলা কাঠি।', `আঁটি ${bn(t)}টি, তাই ${bn(t)} দশ। খোলা কাঠি গোনো।`],
      ex: `${bn(t)} দশ ${bn(o)} এক = ${bn(n)}`, rem: () => pvCount(o < 8 ? n + 1 : n - 3, s)
    };
  }
  function wordPick(n, s) {
    const o = near(n, 1, 20);
    return { t: 'pick', s: s || '', q: `${bn(n)} কে কথায় কী লিখি?`, vis: `<p style="text-align:center">${NUM(n)}</p>`, cols: 3, opts: [{ v: TXT(WORDS[n]), ok: true }, ...o.map(m => ({ v: TXT(WORDS[m]) }))], h: ['সংখ্যাটি জোরে পড়ো।', `${bn(n)} পড়ি "${WORDS[n]}"।`], ex: `${bn(n)} = ${WORDS[n]}`, rem: () => wordPick(n > 2 ? n - 1 : n + 2, s) };
  }
  function wordNum(n, s) {
    const o = near(n, 1, 20);
    return { t: 'pick', s: s || '', q: `"${WORDS[n]}" কোন সংখ্যা?`, cols: 3, opts: [{ v: NUM(n), ok: true }, ...o.map(m => ({ v: NUM(m) }))], h: ['শব্দটি জোরে পড়ো।', 'এক থেকে গুনে গুনে মিলিয়ে দেখো।'], ex: `${WORDS[n]} = ${bn(n)}`, rem: () => wordNum(n > 2 ? n - 1 : n + 2, s) };
  }
  // shapes
  const SHP = ['circle', 'tri', 'square'];
  function shapePick(kind, s) {
    const others = SHP.filter(k => k !== kind && !(kind === 'rect' && k === 'square'));
    return { t: 'pick', s: s || '', q: `${SHAPE_NAME[kind]} কোনটি? ছুঁয়ে দেখাও।`, cols: 3, opts: [{ v: shp(kind, '#2e9e5b', 70), ok: true }, ...others.map((k, i) => ({ v: shp(k, ['#d9534f', '#3a8fd6'][i], 70) }))], h: [kind === 'circle' ? 'গোল আকৃতির কোনো কোণা নেই, চাকার মতো।' : kind === 'tri' ? 'তিনকোনা আকৃতির ৩টি কোণা।' : 'চারকোনা আকৃতির ৪টি কোণা।', 'প্রতিটি আকৃতির কোণা গুনে দেখো।'], ex: `${SHAPE_NAME[kind]}: ${kind === 'circle' ? 'কোনো কোণা নেই' : kind === 'tri' ? '৩টি কোণা' : '৪টি কোণা'}।`, rem: () => shapePick(cyc(SHP, SHP.indexOf(kind) + 1), s) };
  }
  function objShape(e, kind, name, s) {
    return { t: 'pick', s: s || '', q: `${name} দেখতে কোন আকৃতির মতো?`, vis: `<div style="text-align:center">${emo(e, 110)}</div>`, cols: 3, opts: SHP.map((k, i) => ({ v: shp(k, ['#ffb627', '#8a5cc2', '#2e9e5b'][i], 64), lbl: SHAPE_NAME[k], ok: k === kind || (kind === 'rect' && k === 'square') })), h: ['জিনিসটির কিনারা দেখো। কয়টি কোণা আছে?', kind === 'circle' ? 'কোনো কোণা নেই, গড়িয়ে যায়।' : kind === 'tri' ? '৩টি কোণা।' : '৪টি কোণা।'], ex: `${name} ${SHAPE_NAME[kind]}।` };
  }
  function shapeCount(list, kind, s) {
    const n = list.filter(k => k === kind || (kind === 'square' && k === 'rect')).length;
    const cols = ['#ffb627', '#3a8fd6', '#d9534f', '#2e9e5b', '#8a5cc2'];
    return { t: 'fill', s: s || '', q: `ছবিতে কয়টি ${SHAPE_NAME[kind]}?`, vis: `<div class="pile" style="gap:8px">${list.map((k, i) => shp(k, cyc(cols, i), 44)).join('')}</div>`, parts: ['মোট', { a: n }, 'টি'], h: [kind === 'circle' ? 'শুধু গোলগুলো গোনো।' : kind === 'tri' ? 'শুধু ৩ কোণার আকৃতিগুলো গোনো।' : 'শুধু ৪ কোণার আকৃতিগুলো গোনো।', 'গোনা হয়ে গেলে আঙুল দিয়ে আবার মিলিয়ে দেখো।'], ex: `${SHAPE_NAME[kind]} আছে ${bn(n)}টি।` };
  }
  function odd(items, oddI, s, why) {
    return { t: 'pick', s: s || '', q: 'অন্যরকম কোনটি? ছুঁয়ে দেখাও।', cols: items.length > 3 ? 2 : 3, opts: items.map((v, i) => ({ v, ok: i === oddI })), h: ['সবগুলো ভালো করে দেখো। কোনগুলো একই রকম?', 'যেটি বাকিগুলোর মতো নয়, সেটিই অন্যরকম।'], ex: why || 'এটি বাকিগুলোর থেকে আলাদা।' };
  }
  // pattern: what comes next
  function pat(items, ans, wrong, s, kind) {
    const cell = x => `<span class="patc">${x}</span>`;
    return {
      t: 'pick', s: s || '', q: 'খালিঘরে কোনটি বসবে?', vis: `<div class="patrow">${items.map(cell).join('')}<span class="patc q">?</span></div>`, cols: 2,
      opts: [{ v: cell(ans), ok: true }, { v: cell(wrong) }],
      h: [`${kind || 'নকশা'}টি জোরে বলো: কী কী ঘুরে ঘুরে আসছে?`, 'শেষে কী ছিল দেখো। তার পরে সবসময় কী আসে?'], ex: 'মিল রেখে ঘুরে ঘুরে আসাকেই প্যাটার্ন বলে।'
    };
  }
  // vertical addition / subtraction
  function vert(a, b, op, s, q) {
    const r = op === '+' ? a + b : a - b;
    return {
      t: 'fill', s: s || '', q: q || 'উপরে নিচে ' + (op === '+' ? 'যোগ' : 'বিয়োগ') + ' করি।', vis: vtab(a, b, op === '+' ? '+' : '−'),
      parts: ['দশক', { a: Math.floor(r / 10) }, 'একক', { a: r % 10 }, '=', { a: r }],
      h: [`আগে এককের ঘর: ${bn(a % 10)} ${op === '+' ? '+' : '−'} ${bn(b % 10)} = ${bn(op === '+' ? a % 10 + b % 10 : a % 10 - b % 10)}।`, `তারপর দশকের ঘর: ${bn(Math.floor(a / 10))} ${op === '+' ? '+' : '−'} ${bn(Math.floor(b / 10))}।`],
      ex: `${bn(a)} ${op === '+' ? '+' : '−'} ${bn(b)} = ${bn(r)}`, rem: () => vert(a + 1, b, op, s, q)
    };
  }
  const tensOp = (a, b, op, s) => { const r = op === '+' ? a + b : a - b; return { t: 'fill', s: s || '', q: 'দশের সাহায্যে ' + (op === '+' ? 'যোগ' : 'বিয়োগ') + ' করি।', vis: `<div class="pile">${bundle(56).repeat(a / 10)}</div>`, parts: [`${bn(a)} ${op === '+' ? '+' : '−'} ${bn(b)} = ${bn(a / 10)} দশ ${op === '+' ? '+' : '−'} ${bn(b / 10)} দশ =`, { a: r / 10 }, 'দশ =', { a: r }], h: [`${bn(a)} মানে ${bn(a / 10)}টি দশ, ${bn(b)} মানে ${bn(b / 10)}টি দশ।`, `${bn(a / 10)} ${op === '+' ? '+' : '−'} ${bn(b / 10)} = ${bn(r / 10)}, তাই ${bn(r / 10)} দশ।`], ex: `${bn(r / 10)} দশ = ${bn(r)}`, rem: () => tensOp(a, b === 10 ? 20 : 10, op, s) }; };
  const tensIs = (n, s) => ({ t: 'fill', s: s || '', q: `${bn(n)} এ কয়টি দশ?`, vis: `<div class="pile">${bundle(52).repeat(n / 10)}</div>`, parts: [bn(n), '=', { a: n / 10 }, 'দশ'], h: ['প্রতিটি আঁটিতে ১০টি।', 'আঁটিগুলো গোনো।'], ex: `${bn(n)} = ${bn(n / 10)} দশ` });
  // money
  function moneyName(v, s) {
    const o = [1, 2, 5, 10, 20, 50, 100].filter(x => x !== v).sort((x, y) => Math.abs(x - v) - Math.abs(y - v)).slice(0, 2);
    return { t: 'pick', s: s || '', q: 'এটি কত টাকা?', vis: `<div style="text-align:center">${money(v, 1.6)}</div>`, cols: 3, opts: [{ v: TXT(bn(v) + ' টাকা'), ok: true }, ...o.map(m => ({ v: TXT(bn(m) + ' টাকা') }))], h: ['নোট বা কয়েনের উপরে লেখা সংখ্যাটি দেখো।', `এখানে লেখা ${bn(v)}।`], ex: `এটি ${bn(v)} টাকার ${v < 10 ? 'কয়েন' : 'নোট'}।` };
  }
  function moneyBig(vs, s) {
    const m = Math.max(...vs);
    return { t: 'pick', s: s || '', q: 'বেশি টাকা কোনটি? ছুঁয়ে দেখাও।', cols: vs.length > 2 ? 3 : 2, opts: vs.map(v => ({ v: money(v), ok: v === m })), h: ['প্রতিটির উপরে লেখা সংখ্যা পড়ো।', 'যার সংখ্যা বড়ো, তার টাকা বেশি।'], ex: `${bn(m)} টাকা সবচেয়ে বেশি।` };
  }
  const moneySum = (vs, s) => { const t = vs.reduce((x, y) => x + y, 0); return { t: 'fill', s: s || '', q: 'মোট কত টাকা?', vis: moneyRow(vs), parts: [vs.map(bn).join(' + ') + ' =', { a: t }, 'টাকা'], h: ['প্রতিটি নোটের টাকা পড়ো।', vs.every(v => v % 10 === 0) ? 'দশ দশ করে গোনো: ১০, ২০, ৩০…' : 'বড়োটি থেকে শুরু করে বাকিগুলো যোগ করো।'], ex: `মোট ${bn(t)} টাকা।`, rem: () => moneySum(vs.slice(0, -1).concat([10]), s) }; };
  function pay(price, opts, s, q) {
    return { t: 'pick', s, q: q || 'কোনটি দিলে ঠিক দাম হবে?', cols: 1, opts: opts.map(vs => ({ v: moneyRow(vs), ok: vs.reduce((x, y) => x + y, 0) === price })), h: [`দাম ${bn(price)} টাকা।`, 'প্রতিটি সারির টাকা যোগ করে দেখো।'], ex: `${opts.find(vs => vs.reduce((x, y) => x + y, 0) === price).map(bn).join(' + ')} = ${bn(price)} টাকা।` };
  }

  // ======================= days =======================
  const D = (title, say, vis, acts) => ({ title, intro: { say, vis: vis || '' }, acts });
  const REVIEW = 'পুনরালোচনা';

  // ---------- Chapter 2 ----------
  const ch2 = [
    D('ছবি গুনি, মিল করি', 'চলো ছবি গুনি। প্রতিটি ছবিতে একবার আঙুল রেখে গুনব: এক, দুই, তিন।', pile(3, '🍎'), [
      numPic(3, '🍎', 'মিনা বাজার থেকে আপেল এনেছে।', 5), count(4, '🐟', 'বাবা পুকুর থেকে মাছ ধরেছেন।'), count(2, '🦆'), stickEq(5, '🍌', 'ঝুড়িতে কলা আছে।'), numPic(1, '🐅', '', 5), count(5, '🦋')]),
    D('ছবি গুনি, গোল পূরণ করি', 'গুনে গুনে মিলাই। যতগুলো ছবি, ঠিক ততগুলো কাঠি বা গোল।', pile(4, '🐔'), [
      count(3, '🐔', 'উঠানে মুরগি চরছে।'), numPic(4, '🥭', '', 5), count(5, '🎈', 'জন্মদিনে বেলুন এসেছে।'), stickEq(2, '🐄'), tfCount(4, '🍊', 4), tfCount(3, '🐐', 2)]),
    D(REVIEW, 'চলো যা শিখেছি তা আবার খেলি।', '', [
      numPic(2, '⚽', '', 5), count(5, '🥕'), stickEq(3, '🥚'), stickEq(4, '🍆'), tfCount(5, '🍪', 4), tfCount(1, '🐘', 1), picNum(3, '🐈', '', 5)])
  ];

  // ---------- Chapter 3 ----------
  const ch3 = [
    D('চিনি ও পড়ি (১-৫)', '১, ২, ৩, ৪, ৫। চলো গুনে গুনে সংখ্যা চিনি।', `<p style="text-align:center">${[1, 2, 3, 4, 5].map(NUM).join(' ')}</p>`, [
      count(1, '🍎'), count(2, '🐟'), picNum(3, '🐕', '', 5), numPic(4, '🍌', '', 5), count(5, '🌽'), tfCount(3, '🥭', 2), tfCount(5, '⚽', 5)]),
    D('সংখ্যার সাথে ছবি মিল করি', 'প্রতিটি সংখ্যার সাথে ঠিক ততগুলো ছবি মিলাই।', pile(4, '🍊'), [
      numPic(3, '🦆', '', 5), numPic(2, '🐄', '', 5), picNum(4, '🚲', '', 5), picNum(5, '🐔', '', 5), numPic(1, '🐒', '', 5), picNum(3, '🦌', '', 5)]),
    D('সংখ্যা ১-৫ গণনা করি, পড়ি ও লিখি', 'গুনি, পড়ি, তারপর সংখ্যা লিখি।', '', [
      picNum(2, '🍎', '', 5), count(3, '🐟'), count(4, '🍅'), count(5, '🥔'), pickN([3, 4], 'small'), pickN([2, 5], 'small')]),
    D('ছবি গুনে খালিঘরে সংখ্যা লিখি', 'সংখ্যা প্রতিবার ১ করে বাড়ে: ১, ২, ৩, ৪, ৫।', '', [
      seq(1, 5, [2, 3]), count(2, '🐐'), ord([3, 2, 4, 1, 5], 'asc'), ord([4, 5, 2, 3, 1], 'desc'), tfCount(5, '🍌', 4)]),
    D(REVIEW, '১ থেকে ৫ পর্যন্ত যা শিখেছি, চলো আবার খেলি।', '', [
      count(4, '🎈'), seq(1, 5, [3, 4]), nextN(1), nextN(3), prevN(2), prevN(5), between(2), ord([3, 1, 2, 4], 'desc')]),
    D('চিনি ও পড়ি (৬-১০)', '৬, ৭, ৮, ৯, ১০। পাঁচের পরে গুনতে থাকি।', `<p style="text-align:center">${[6, 7, 8, 9, 10].map(NUM).join(' ')}</p>`, [
      count(6, '🍎'), count(7, '🐟'), picNum(8, '🧅'), numPic(9, '🐝'), count(10, '🥚'), tfCount(7, '🍌', 6), tfCount(8, '⚽', 8)]),
    D('সংখ্যার সাথে ছবি মিল করি', 'বড়ো সংখ্যা মানে বেশি ছবি। গুনে মিলাই।', '', [
      numPic(7, '🦆'), numPic(8, '🍊'), picNum(10, '🍒'), picNum(9, '🐔'), picNum(6, '🥦'), tfCount(7, '🥭', 9)]),
    D('সংখ্যা ৬-১০ গণনা করি, পড়ি ও লিখি', 'গুনি, পড়ি, সংখ্যা লিখি: ৬ থেকে ১০।', '', [
      picNum(10, '🍎'), count(6, '🐐'), count(8, '🎈'), count(9, '🍍'), pickN([7, 6], 'small'), pickN([9, 10], 'small')]),
    D('ছবি গুনে খালিঘরে সংখ্যা লিখি', '১ থেকে ১০: প্রতিবার ১ করে বাড়ে।', '', [
      seq(1, 10, [2, 5, 8, 9]), count(7, '🍐'), ord([8, 7, 9, 6], 'asc'), ord([9, 10, 7, 8], 'desc'), tfCount(7, '🐟', 8)]),
    D(REVIEW, '১ থেকে ১০ পর্যন্ত যা শিখেছি, চলো আবার খেলি।', '', [
      count(8, '🍋'), seq(3, 6, [4, 7]), prevN(2), prevN(4), nextN(6), nextN(3), between(5), between(8), ord([10, 8, 6, 7, 9], 'desc'), ord([8, 5, 6, 7, 9], 'asc'), pickN([6, 7], 'big')]),
    D('শূন্যের ধারণা', 'কিছু না থাকলে আমরা বলি শূন্য, লিখি ০। বাটির সব আম খেয়ে ফেললে বাটিতে থাকে ০টি আম।', two(pile(2, '🥭'), pile(0), '→'), [
      count(2, '🥭', 'বাটিতে আম আছে।'), count(1, '🥭', 'মিনা একটি আম খেল।'), count(0, '🥭', 'রাজু শেষ আমটিও খেয়ে ফেলল।'), picNum(0, '🍎'), seq(0, 11, [0, 3, 6, 9]), tf('০ মানে কিছুই নেই', true, ['শূন্য মানে কতগুলো?', 'খালি বাটিতে কয়টি আম?'], 'ঠিক। ০ মানে কিছুই নেই।')]),
    D('১০টি পর্যন্ত বস্তু বিভিন্নভাবে সাজাই', 'একই সংখ্যাকে নানা ভাবে ভাগ করা যায়। ৫ = ৩ + ২, আবার ৫ = ৪ + ১।', two(pile(3, '🍬'), pile(2, '🍬'), '|'), [
      bond(3, 2, '🍬'), bond(5, 2, '🍊'), bond(7, 5, '🌸'), bond(6, 2, '🥚'), bond(9, 4, '🍒'), tf('৬ = ৪ + ২', true, ['৪ থেকে আরও ২ গুনে দেখো।', '৪, তারপর ৫, ৬।'], 'ঠিক। ৪ আর ২ মিলে ৬।'), tf('৭ = ৫ + ১', false, ['৫ থেকে আরও ১ গুনে দেখো।', '৫ এর পরে ৬।'], 'ভুল। ৫ + ১ = ৬, ৭ নয়।')]),
    D('১০ এর গঠন', 'আমার কাছে ৯টি রং পেনসিল আছে। আরও ১টি হলে ১০টি হবে। ৯ আর ১ মিলে ১০।', frame10(9, 1), [
      make10(9, 'রং পেনসিল ৯টি আছে।'), make10(3), make10(5), make10(6), make10(4), bond(10, 7, '🍌', '১০টি কলা দুই ঝুড়িতে রাখা হলো।')]),
    D(REVIEW, '১০ বানানো আর সংখ্যা ভাগ করা আবার খেলি।', '', [
      count(6, '🐦'), bond(4, 1, '🍎'), bond(6, 3, '🐟'), bond(8, 5, '🌸'), make10(2), make10(7), tf('১০ = ২ + ৫', false, ['২ থেকে আরও ৫ গুনে দেখো।', '২ + ৫ = ৭।'], 'ভুল। ২ + ৫ = ৭। ১০ = ২ + ৮।')]),
    D('সংখ্যার তুলনা (১-১০)', '৭টি আম আর ৪টি আম: ৭ বড়ো, ৪ ছোটো।', two(pile(7, '🥭', 40), pile(4, '🥭', 40), 'ও'), [
      pickN([1, 6], 'small'), pickN([7, 4], 'big'), pickN([5, 7], 'small'), pickN([3, 9], 'small'), pickN([1, 3], 'big'), pickN([5, 9], 'big'), moreWhich(6, '🍎', 'আপেল', 3, '🍌', 'কলা', '')]),
    D('ক্রমের ধারণা', 'ছোটো থেকে বড়ো: ১, ২, ৩… বড়ো থেকে ছোটো: ১০, ৯, ৮…', '', [
      pickN([4, 5], 'small'), prevN(8), pickN([5, 4], 'big'), pickN([3, 8], 'big'), nextN(9), nextN(2), tf('ছোটো থেকে বড়ো: ৬, ৭, ৮, ৯', true, ['প্রতিটি সংখ্যা কি আগেরটির চেয়ে বড়ো?', '৬ এর পরে ৭, ৭ এর পরে ৮।'], 'ঠিক। সংখ্যাগুলো ছোটো থেকে বড়ো।'), tf('বড়ো থেকে ছোটো: ১, ২, ৩, ৪', false, ['১ কি ২ এর চেয়ে বড়ো?', 'এগুলো বাড়ছে, কমছে না।'], 'ভুল। এগুলো ছোটো থেকে বড়ো।')]),
    D('ক্রমে সংখ্যা সাজাই', 'সংখ্যাগুলো সারি করে সাজাই, যেমন লাইনে দাঁড়ানো।', '', [
      pickN([5, 7, 9], 'small'), pickN([6, 1, 5], 'big'), ord([2, 10, 7, 5], 'asc'), ord([9, 2, 6], 'desc'), ord([5, 8, 6, 3], 'asc'), ord([0, 4, 9, 6, 7], 'desc')]),
    D('খালিঘরে সংখ্যা লিখি', 'আগের, পরের আর মাঝের সংখ্যা খুঁজি।', '', [
      ord([8, 3, 1, 5, 7], 'asc'), ord([6, 9, 0, 7, 2], 'desc'), between(2), between(6), nextN(5), nextN(7), prevN(3), prevN(7)]),
    D(REVIEW, '১ থেকে ১০ পর্যন্ত সব খেলা আবার।', '', [
      seq(0, 8, [1, 3, 5, 7]), pickN([4, 6], 'small'), pickN([8, 2], 'big'), ord([2, 4, 9, 6, 5], 'asc'), ord([3, 5, 10, 7, 1], 'desc'), between(8), prevN(9), nextN(4)])
  ];

  // ---------- Chapter 4: যোগ ----------
  const ch4 = [
    D('একসাথে করা', 'দুই দল একসাথে করলে মোট কত হয়? দুই হাতের লজেন্স এক বাটিতে রাখলে একসাথে গুনি।', two(pile(2, '🍬'), pile(2, '🍬')), [
      count(4, '🐔', 'উঠানে কয়টি মুরগি আছে?'), add(2, 2, '🍬'), add(3, 1, '🍎'), add(2, 3, '🐟'), add(1, 4, '🌸')]),
    D('যোগ ও সমান চিহ্ন', '+ চিহ্ন দিয়ে দুটি সংখ্যা একসাথে করি। = চিহ্নের পরে উত্তর লিখি। ১ + ২ = ৩।', two(pile(1, '🎈'), pile(2, '🎈')), [
      add(1, 2, '🎈'), add(2, 2, '🦆'), add(3, 3, '🍊'), add(2, 3, '🍌'), { t: 'pick', q: 'যোগ চিহ্ন কোনটি?', cols: 2, opts: [{ v: TXT('+'), ok: true }, { v: TXT('=') }], h: ['যোগ চিহ্ন দেখতে যোগ (যোগফল) এর মতো একটি দাঁড়ি আর একটি শোয়া দাগ।', 'সমান চিহ্নে দুটি শোয়া দাগ।'], ex: '+ হলো যোগ চিহ্ন, = হলো সমান চিহ্ন।' }]),
    D('গাণিতিক বাক্য লিখি', '৩ + ১ = ৪ একটি গাণিতিক বাক্য। এখানে ৪ হলো যোগফল।', '', [
      add(2, 1, '🐄', '', 'ছবি দেখে গাণিতিক বাক্য লিখি।', true), addSt(4, 2), addSt(3, 3), addSt(5, 3), story(3, '+', 2, 'মিনা ৩টি আম কুড়াল। রাজু বলল, আমিও ২টি আম পেয়েছি!', 'একসাথে কয়টি আম?', '🥭')]),
    D('একসাথে করা', 'কাঠি এঁকে বা আঙুল দিয়ে যোগ করা যায়।', '', [
      story(3, '+', 2, 'রাজুর ৩টি লাটিম, মিনার ২টি লাটিম।', 'একসাথে কয়টি লাটিম?', '🪀'), addSt(2, 3), addSt(7, 2), addSt(4, 3), addSt(6, 2), addSt(2, 4), storyN(7, '+', 2, 'মা ৭টি পিঠা বানালেন, নানু আরও ২টি দিলেন।', 'মোট কয়টি পিঠা?')]),
    D(REVIEW, 'যোগ নিয়ে যা শিখেছি, চলো আবার খেলি।', '', [
      story(3, '+', 2, 'রাজু বলল, আমি ৩টি মাছ ধরেছি। মিনা বলল, আমি ২টি মাছ ধরেছি।', 'একসাথে কয়টি মাছ?', '🐟'), addSt(3, 3), addSt(4, 4), addSt(2, 7), addSt(6, 2), sumPick(9, [[4, 5], [3, 4], [2, 5]]), sumPick(7, [[3, 4], [6, 2], [5, 3]])]),
    D('বৃদ্ধি', '৫টি ছিল, আরও ২টি এল। বেড়ে গিয়ে মোট ৭টি হলো। বেড়ে যাওয়া মানেও যোগ।', two(pile(5, '🐦'), pile(2, '🐦')), [
      nextN(2), nextN(7), story(5, '+', 2, 'গাছে ৫টি পাখি বসে ছিল। আরও ২টি পাখি উড়ে এল।', 'মোট কয়টি পাখি?', '🐦'), story(4, '+', 3, 'পুকুরে ৪টি হাঁস ছিল। আরও ৩টি হাঁস এল।', 'মোট কয়টি হাঁস?', '🦆'), addSt(3, 2), addSt(4, 3), addSt(2, 4)]),
    D('বৃদ্ধি', 'আঙুল আর সংখ্যারেখা দিয়ে বেড়ে যাওয়া দেখি।', nline(5, 3), [
      addSt(4, 4), addSt(5, 3), addF(4, 3), addF(5, 4), addNL(5, 3), story(3, '+', 4, 'ক্লাসে ৩ জন বসে ছিল। আরও ৪ জন এল।', 'মোট কয়জন?', '🧒')]),
    D('বৃদ্ধি', 'যোগ করার অনেক উপায়: আঙুল, কাঠি, সংখ্যারেখা।', '', [
      addF(4, 3), addF(3, 3), addF(2, 5), addSt(7, 3), addSt(5, 2), addNL(4, 5), addNL(7, 2), story(2, '+', 3, 'গাছে ২টি পাতা ছিল। বাহ! আরও ৩টি পাতা গজাল।', 'মোট কয়টি পাতা?', '🌿')]),
    D('একসাথে বৃদ্ধি', 'নিজে গল্প বানাতে পারো: আমার ৪টি বল ছিল, আরও ৩টি পেলাম, মোট ৭টি।', '', [
      addF(5, 3), addF(4, 2), addF(3, 6), ansPick(3, 4, '+'), ansPick(4, 5, '+'), ansPick(2, 6, '+'), story(3, '+', 2, 'আমার ৩টি খেলনা গাড়ি আছে। আরও ২টি খেলনা গাড়ি রাখছি।', 'মোট কয়টি হলো?', '🚗')]),
    D(REVIEW, 'যোগ আর বৃদ্ধি আবার অনুশীলন করি।', '', [
      addF(3, 5), addF(6, 4), addF(5, 2), addF(3, 6), sumPick(8, [[5, 3], [2, 5], [3, 4]]), sumPick(10, [[3, 7], [4, 5], [2, 6]]), story(4, '+', 2, 'টেবিলে ৪টি কাপ ছিল। মা আরও ২টি কাপ রাখলেন।', 'বেড়ে মোট কয়টি হলো?', '🥛')]),
    D('০ এর যোগ', 'কোনো সংখ্যার সাথে ০ যোগ করলে সংখ্যাটি একই থাকে। ৪ + ০ = ৪।', two(pile(4, '🍎'), pile(0)), [
      add(4, 0, '🍎'), add(0, 3, '🍊'), add(2, 0, '🐟'), add(6, 0, '🌸'), add(0, 1, '🍌'), tf('৫ + ০ = ০', false, ['০ যোগ করলে কি কিছু বাড়ে?', '০ মানে কিছু নেই। ৫ এর সাথে কিছু না যোগ করলে ৫ ই থাকে।'], 'ভুল। ৫ + ০ = ৫।')]),
    D('যোগের কার্ড', 'একই যোগফল নানা ভাবে পাওয়া যায়: ৫ = ১ + ৪ = ২ + ৩।', '', [
      addSt(3, 2), addSt(4, 3), sumPick(5, [[1, 4], [2, 4], [3, 3]]), sumPick(6, [[2, 4], [5, 2], [1, 4]]), sumPick(7, [[4, 3], [5, 3], [2, 4]]), ansPick(3, 7, '+'), ansPick(5, 4, '+'), ansPick(6, 2, '+')]),
    D('যোগের মিল', '৬ পাওয়ার কত উপায়? ১ + ৫, ২ + ৪, ৩ + ৩।', frame10(2, 4), [
      bond(6, 1, '🍬'), bond(6, 2, '🍬'), addSt(4, 5), addSt(7, 3), addSt(4, 6), addSt(5, 2), addSt(5, 5), sumPick(9, [[2, 7], [4, 4], [3, 5]])]),
    D('খালিঘর পূরণ', 'কত যোগ করলে যোগফল হবে? গুনে গুনে খুঁজি।', '', [
      addSt(7, 3), addSt(4, 3), missAdd(2, 5), missAdd(3, 5), missAdd(1, 4), missAdd(0, 1), story(5, '+', 4, '৫টি মাছ খেলছিল। আরও ৪টি মাছ খেলতে এল।', 'মোট কয়টি হলো?', '🐟')]),
    D('কথার অংক ও খালিঘর পূরণ', 'গল্প শুনি, সংখ্যা খুঁজি, তারপর যোগ করি।', '', [
      missAdd(4, 9), missAdd(3, 7), story(3, '+', 2, 'মাঠে ৩ জন ছিল। পরে ২ জন এল।', 'মোট কতজন?', '🧒'), story(5, '+', 3, 'রবির ৫টি আপেল, মনিরার ৩টি আপেল।', 'মোট কয়টি আপেল?', '🍎'), story(4, '+', 4, 'নীলের ৪টি আম, সবুজের ৪টি আম।', 'মোট কয়টি আম?', '🥭'), missAdd(5, 8), missAdd(2, 6)]),
    D('১০ খুঁজে বের করি', '৫ + ৫ = ১০, ৬ + ৪ = ১০। কোন দুটি সংখ্যা মিলে ১০ হয়?', frame10(6, 4), [
      add(5, 5, '🍌'), add(6, 4, '🍎'), make10(7), make10(8), make10(1), make10(3), sumPick(10, [[2, 8], [2, 7], [4, 5]])]),
    D(REVIEW, 'গল্পে গল্পে যোগ করি।', '', [
      story(3, '+', 2, 'নীলা ৩টি টমেটো কিনেছে, চাচা ২টি টমেটো কিনেছেন।', '২ জনে মোট কয়টি টমেটো কিনল?', '🍅'), story(2, '+', 6, 'দোকানে ২ জন ছিল, পরে আরও ৬ জন এল।', 'মোট কয়জন?', '🧑'), story(2, '+', 3, 'মাঠে ২টি ঘুড়ি উড়ছিল, আরও ৩টি ঘুড়ি নিয়ে এল।', 'মোট কয়টি হলো?', '🪁'), ansPick(2, 4, '+'), ansPick(3, 5, '+'), ansPick(1, 4, '+')])
  ];

  // ---------- Chapter 5: বিয়োগ ----------
  const ch5 = [
    D('বিয়োগের ধারণা', 'নিয়ে গেলে, চলে গেলে, উড়ে গেলে কমে যায়। ৪টি ছিল, ১টি নিয়ে গেল, ৩টি রইল।', crossed(4, 1, '🚗'), [
      prevN(2), prevN(6), sub(4, 1, '🚗', 'খেলার মাঠে ৪টি খেলনা গাড়ি ছিল। ১টি নিয়ে গেল।', 'কয়টি গাড়ি রইল?'), sub(5, 2, '🐦', 'গাছে ৫টি পাখি ছিল। ২টি উড়ে গেল।', 'কয়টি রইল?'), sub(3, 2, '🦋', '৩টি প্রজাপতি ছিল। ২টি উড়ে গেল।', 'কয়টি রইল?'), sub(4, 2, '🐐', '৪টি ছাগল ছিল। ২টি চলে গেল।', 'কয়টি রইল?')]),
    D('বিয়োগ চিহ্ন', 'কমে যাওয়া মানে বিয়োগ। − হলো বিয়োগ চিহ্ন। ৩ − ১ = ২।', crossed(3, 1, '🍎'), [
      sub(3, 1, '🍎'), sub(5, 2, '🍌', '', 'ছবি দেখে বিয়োগ করি।'), sub(4, 1, '🐟', '', 'ছবি দেখে বিয়োগ করি।', true), sub(6, 2, '🌸', '', 'ছবি দেখে বিয়োগ করি।', true), { t: 'pick', q: 'বিয়োগ চিহ্ন কোনটি?', cols: 3, opts: [{ v: TXT('−'), ok: true }, { v: TXT('+') }, { v: TXT('=') }], h: ['বিয়োগ চিহ্ন একটি ছোটো শোয়া দাগ।', 'যোগ চিহ্নে দুটি দাগ আড়াআড়ি, সমান চিহ্নে দুটি শোয়া দাগ।'], ex: '− হলো বিয়োগ চিহ্ন।' }]),
    D('বিয়োগের ধারণা', 'কাঠি কেটে আর সংখ্যারেখায় পিছনে লাফ দিয়ে বিয়োগ করি।', nline(9, -6), [
      sub(6, 2, '🍬', '', 'ছবি দেখে খালিঘর পূরণ করি।', true), subSt(5, 2), subSt(7, 3), subSt(8, 5), subNL(9, 6), subNL(8, 4)]),
    D('বিয়োগের ধারণা', 'কাঠি কেটে বিয়োগ করি, তারপর উত্তর মিলাই।', '', [
      subSt(6, 2), subSt(5, 4), subSt(8, 3), subSt(9, 6), subSt(7, 5), subSt(5, 1), ansPick(4, 3, '−'), ansPick(6, 4, '−')]),
    D('বিয়োগের ধারণা (কম বেশি)', '৫ আর ৩ এর মধ্যে কোনটি বেশি? ৫ − ৩ = ২, তাই ২টি বেশি।', two(pile(5, '🍎', 40), pile(3, '🍎', 40), 'ও'), [
      subSt(6, 4), subSt(7, 3), moreWhich(6, '🌱', 'গাছ', 4, '🏺', 'টব', 'রনির কাছে ৬টি গাছ ও ৪টি টব আছে।', 'less'), diff(6, 4, 'গাছ ৬টি, টব ৪টি।', 'কয়টি কম? বড়ো থেকে ছোটো বিয়োগ করি।'), moreWhich(7, '⚽', 'জনি', 2, '⚽', 'মিলি', 'জনির ৭টি বল, মিলির ২টি বল।'), diff(7, 2, 'জনির ৭টি, মিলির ২টি।')]),
    D('বিয়োগের ধারণা (পার্থক্য)', 'পার্থক্য মানে কত কম বা কত বেশি। মাঠে ৬ জন ছেলে আর ৪ জন মেয়ে খেলছে। পার্থক্য ৬ − ৪ = ২।', two(pile(6, '👦', 40), pile(4, '👧', 40), 'ও'), [
      moreWhich(8, '🍒', 'লিচু', 5, '🥭', 'আম', 'জনির ৮টি লিচু, মিলির ৫টি আম।'), diff(8, 5, 'লিচু ৮টি, আম ৫টি।'), diff(5, 3, '৫টি ব্যাগ আর ৩টি বই।', 'ব্যাগ ও বইয়ের পার্থক্য কত?'), diff(6, 4, '৬টি বানর আর ৪টি কলা।', 'বানর ও কলার পার্থক্য কত?'), diff(7, 5, 'কাঠবিড়ালি ৭টি, পেয়ারা ৫টি।', 'পার্থক্য কত?')]),
    D(REVIEW, 'আঙুল, কাঠি আর ছবি দিয়ে বিয়োগ আবার খেলি।', '', [
      subF(5, 3), subF(8, 3), subF(6, 2), subF(9, 6), subF(7, 4), ansPick(9, 4, '−'), sub(7, 5, '🥜', '৭টি বাদাম ছিল, ৫টি খেলাম।', 'কয়টি বাকি রইল?', true), sub(8, 2, '💍', 'বোনের ৮টি চুড়ি ছিল, ২টি দিয়ে দিল।', 'কয়টি বাকি রইল?', true), diff(9, 6, 'ঘুড়ি ৯টি, নাটাই ৬টি।', 'ঘুড়ি ও নাটাইয়ের পার্থক্য কত?')]),
    D('ছবি আঁকি, গল্প করি', '৭ − ৩ নিয়ে গল্প: গাছে ৭টি আম ছিল, ৩টি পড়ে গেল, ৪টি রইল।', crossed(7, 3, '🥭'), [
      moreWhich(4, '🍬', 'রাজুর মোয়া', 8, '🍪', 'রুনির পিঠা', 'রাজুর ৪টি মোয়া, রুনির ৮টি পিঠা।', 'less'), diff(8, 4, '', 'কয়টি কম?'), subSt(6, 3), subSt(9, 5), ansPick(7, 2, '−'), ansPick(9, 7, '−'), ansPick(8, 4, '−'), sub(7, 3, '🥭', 'গাছে ৭টি আম ছিল। ৩টি পড়ে গেল।', 'গাছে কয়টি রইল?', true)]),
    D('শূন্যের বিয়োগ', 'বাসে ২ জন। কেউ না নামলে ২ − ০ = ২। সবাই নামলে ২ − ২ = ০।', crossed(2, 2, '🧑'), [
      sub(2, 0, '🧑', 'রিকশায় ২ জন আছে। কেউ নামেনি।', 'কয়জন রইল?'), sub(2, 1, '🧑', 'রিকশায় ২ জন ছিল। ১ জন নামল।', 'কয়জন রইল?'), sub(2, 2, '🧑', 'রিকশায় ২ জন ছিল। ২ জনই নামল।', 'কয়জন রইল?'), subSt(4, 4), subSt(6, 0), subSt(9, 0), subSt(7, 1), subSt(8, 4)]),
    D('খালিঘর পূরণ করি', 'রাজু ৯টি লিচু কুড়াল, কিছু দাদিকে দিল, ৩টি রইল। দাদিকে দিল ৯ − ৩ = ৬টি।', '', [
      subSt(3, 3), subSt(4, 0), missSub(9, 3, 'রাজু ৯টি লিচু কুড়াল। কিছু দাদিকে দিল, তার কাছে ৩টি রইল।'), missSub(7, 2), missSub(6, 2), missSub(5, 3), missSub(8, 3), missSub(9, 4)]),
    D('খালিঘর পূরণ করি', 'বিয়োগের খালিঘর: কত থেকে কত গেল, কত রইল?', '', [
      subSt(7, 4), subSt(10, 5), missSub(7, 4), missSub(10, 6), missSub(8, 0), missSub(5, 5), ansPick(10, 6, '−')]),
    D('খালিঘর পূরণ করি', 'গল্প শুনে বিয়োগ করি।', '', [
      missSub(5, 1), missSub(4, 2), sub(6, 3, '🚗', 'নীলার ৬টি খেলনা গাড়ি আছে। বোনকে ৩টি দিয়ে দিল।', 'নীলার কয়টি রইল?', true), moreWhich(9, '🐟', 'রুমা', 4, '🐟', 'সাবা', 'রুমা ৯টি মাছ ধরেছে, সাবা ৪টি মাছ ধরেছে।', 'less'), diff(9, 4, '', 'কয়টি কম?'), storyN(7, '−', 4, 'শ্রেণিকক্ষে ৭ জন ছাত্র-ছাত্রী বসে আছে। তাদের মধ্যে ৪ জন ছাত্রী।', 'তাহলে কয়জন ছাত্র আছে?')]),
    D('সংখ্যার কার্ড', 'দুটি কার্ড নিই। বড়ো সংখ্যা থেকে ছোটো সংখ্যা বিয়োগ করি: ৪ − ২ = ২।', '', [
      subSt(8, 5), subSt(9, 7), subSt(7, 4), subSt(7, 7), diff(4, 2, 'কার্ড ৪ আর ২।', 'বড়ো থেকে ছোটো বিয়োগ করি।'), diff(5, 3, 'কার্ড ৩ আর ৫।', 'বড়ো থেকে ছোটো বিয়োগ করি।'), diff(1, 4, 'কার্ড ১ আর ৪।', 'বড়ো থেকে ছোটো বিয়োগ করি।'), sub(8, 4, '🍌', '৮টি কলা ছিল, ৪টি খাওয়া হলো।', 'কয়টি রইল?', true)]),
    D(REVIEW, 'মুদি দোকানে একদিন: বিয়োগের গল্প।', '', [
      subSt(8, 5), subSt(7, 3), sub(6, 2, '🍯', 'মুদি দোকানে ৬ বোতল মধু ছিল। ২ বোতল বিক্রি হলো।', 'কয়টি রইল?', true), moreWhich(9, '🧼', 'সাবান', 3, '🍪', 'বিস্কুট', '৯টি সাবান, ৩ প্যাকেট বিস্কুট।'), diff(9, 3, '', 'কয়টি বেশি?'), diff(8, 6, '৮টি গুঁড়া সাবান, ৬টি তেলের বোতল।', 'পার্থক্য কত?')])
  ];

  // ---------- Chapter 6: সংখ্যা ১১-২০ ----------
  const teen = (n, s) => ({ ...pvCount(n, s), rem: () => teen(n < 19 ? n + 1 : 14, s) });
  const mix6 = k => [teen(11 + (k * 3) % 9), seq(10 + k, 6, [11 + k, 13 + k]), nextN(12 + k), prevN(15 + k), pickN([11 + k, 17 - k > 11 + k ? 17 - k : 18], 'big'), ord([14 + (k % 3), 11 + k, 19, 16 + (k % 2)].filter((v, i, a) => a.indexOf(v) === i), k % 2 ? 'desc' : 'asc'), count(12 + k, '🍬')];
  const ch6 = [
    D('সংখ্যা ১১-১৫', '১০টি কাঠি দিয়ে একটি আঁটি বাঁধি। ১ দশ আর ১ এক মিলে ১১।', mat => pv(1, 1, mat), [
      teen(11), teen(13), teen(15), ord([7, 9, 8, 10], 'asc'), tf('১০ আর ৫ মিলে ১৫', true, ['১ দশ ৫ এক কত?', 'দশের পরে ৫ গুনে দেখো: ১১, ১২, ১৩, ১৪, ১৫।'], 'ঠিক। ১০ + ৫ = ১৫।'), prevN(13), prevN(12), prevN(15)]),
    D('সংখ্যা ১৬-২০', '১ দশ ৬ এক = ১৬। আর ২টি দশ মানে ২০।', mat => pv(2, 0, mat), [
      teen(16), teen(18), teen(20), ord([12, 14, 11, 13], 'asc'), tf('১ দশ ৯ এক = ১৯', true, ['দশকের অঙ্ক আগে, এককের অঙ্ক পরে।', '১ এর পরে ৯ লিখি।'], 'ঠিক। ১ দশ ৯ এক = ১৯।'), tf('১ দশ ৭ এক = ১৬', false, ['১ দশ ৭ এক লিখে দেখো।', '১ এর পরে ৭।'], 'ভুল। ১ দশ ৭ এক = ১৭।'), prevN(17), prevN(20), nextN(17), nextN(16)]),
    D('সংখ্যা ১১-২০', '১১ থেকে ২০ সব সংখ্যায় ১টি দশ আছে (২০ এ আছে ২টি দশ)।', '', [
      teen(17), teen(19), ord([17, 19, 18, 16], 'asc'), pickN([13, 11, 16, 19], 'small'), pickN([12, 15, 20, 17], 'big'), seq(10, 11, [11, 13, 14, 16, 17, 18, 20])]),
    D(REVIEW, '১১ থেকে ২০ আবার খেলি।', '', [
      seq(11, 10, [12, 13, 15, 16, 18, 19]), count(13, '🍎'), between(12), between(16), nextN(15), nextN(11), prevN(13), prevN(17), ord([18, 16, 20, 17, 19], 'desc')]),
    D(REVIEW + ' ১', 'গুনে গুনে ১১ থেকে ২০ মজবুত করি।', '', mix6(0)),
    D(REVIEW + ' ২', 'আঁটি আর খোলা কাঠি দিয়ে সংখ্যা চিনি।', '', mix6(1)),
    D(REVIEW + ' ৩', 'আগের, পরের, বড়ো, ছোটো সংখ্যা খুঁজি।', '', mix6(2)),
    D(REVIEW + ' ৪', 'অধ্যায়ের শেষ খেলা। চলো সব দেখাই!', '', mix6(3))
  ];

  // ---------- Chapter 7: যোগ (১১-২০) ----------
  const ch7 = [
    D('গল্প: স্কুলে বনভোজন', 'একদিন স্কুল থেকে বনভোজনের আয়োজন করা হলো। সবাই খাবার আর খেলনা নিয়ে এল। চলো বনভোজনে যোগ করি!', `<div style="text-align:center">${emo('🏫', 66)}${emo('🌳', 66)}${emo('🧑‍🎓', 66)}${emo('👧', 66)}</div>`, [
      addSt(3, 4), addSt(7, 3), addSt(6, 2), addSt(4, 5), tenPlus(2, 'বনভোজনে ১০ জন এসেছে।')]),
    D('১০ এর সাথে যোগ', '১০ + ৭ = ১ দশ ৭ = ১৭।', mat => pv(1, 7, mat), [
      tenPlus(7), tenPlus(4), tenPlus(3), tenPlus(8), storyN(10, '+', 2, 'বনভোজনে ১০ জন ছেলে-মেয়ে ছিল। আরও ২ জন এল।', 'মোট কয়জন হলো?')]),
    D('একক যোগ করি', '১২ + ৪: ১২ = ১ দশ ২। ২ + ৪ = ৬, তাই ১ দশ ৬ = ১৬।', '', [
      addSt(4, 3), addSt(5, 2), teenAdd(12, 4), teenAdd(13, 5), teenAdd(11, 6), ansPick(12, 5, '+'), ansPick(13, 2, '+'), ansPick(12, 7, '+')]),
    D('১০ বানিয়ে যোগ (৮ আর ৯)', '৮ + ৩: ৮ কে ১০ বানাতে ২ লাগে। ৩ কে ভাঙি ২ আর ১। ১০ + ১ = ১১।', frame10(8, 2), [
      make10(8), make10(9), m10(8, 3), m10(8, 4), m10(8, 5), m10(9, 5), m10(9, 6)]),
    D('১০ বানিয়ে যোগ (৬ আর ৭)', '৬ + ৫: ৬ কে ১০ বানাতে ৪ লাগে। ৫ কে ভাঙি ৪ আর ১। ১০ + ১ = ১১।', frame10(6, 4), [
      make10(6), make10(7), m10(6, 5), m10(6, 6), m10(7, 5), m10(7, 6), m10(7, 4)]),
    D(REVIEW, 'বনভোজনে আরও জিনিস এল। ১০ বানিয়ে যোগ করি।', '', [
      m10(9, 5), m10(8, 6), m10(7, 4), m10(6, 5), story(8, '+', 5, 'রাজু ৮টি বাটি আনল, পারু ৫টি বাটি আনল।', 'একসাথে কয়টি বাটি হলো?', '🥣'), storyN(13, '+', 6, 'রাজু ১৩টি চেয়ার আনল, মিনা ৬টি চেয়ার আনল।', 'একসাথে কয়টি চেয়ার হলো?')]),
    D('ছোটো সংখ্যা ভেঙে যোগ', '৫ + ৭: এখানে ছোটো কে? ৫। বড়ো ৭ কে ১০ বানাতে ৩ লাগে। ৫ = ৩ + ২। ১০ + ২ = ১২।', '', [
      addSt(1, 4), addSt(2, 4), addSt(4, 6), m10(5, 7), m10(3, 9), m10(6, 8), story(6, '+', 8, 'স্যার ৬টি মিষ্টি এনেছেন, ম্যাডাম ৮টি মিষ্টি এনেছেন।', 'মোট কয়টি মিষ্টি হলো?', '🍬')]),
    D('ছোটো সংখ্যা ভেঙে যোগ', 'আগে খুঁজি এখানে ছোটো কে, তাকে ভেঙে বড়োটিকে ১০ বানাই।', '', [
      sumPick(10, [[3, 7], [2, 7], [4, 5]]), sumPick(10, [[1, 9], [2, 9], [4, 4]]), m10(4, 7), m10(5, 9), m10(6, 7), m10(4, 8), story(3, '+', 9, 'স্যার ৩টি আম এনেছেন, ম্যাডাম ৯টি আম এনেছেন।', 'একসাথে কয়টি আম হলো?', '🥭')]),
    D('যোগ (১১ থেকে ২০)', 'মাঠের এক পাশে ৫ জন, অন্য পাশে ৬ জন। মোট কতজন? ৫ + ৬ = ১১।', '', [
      m10(6, 7), m10(7, 9), story(5, '+', 6, 'মাঠের এক পাশে ৫ জন ও অপর পাশে ৬ জন আছে।', 'মাঠে মোট কতজন আছে?', '🧒'), story(7, '+', 5, 'তারার কাছে ৭টি কলা, তাজের কাছে ৫টি কলা আছে।', 'একসাথে মোট কয়টি কলা আছে?', '🍌'), ansPick(5, 9, '+'), ansPick(9, 9, '+'), ansPick(4, 7, '+'), ansPick(8, 3, '+')]),
    D('সঠিক উত্তর খুঁজি', 'যোগফল ১৫ কোন কোন যোগে হয়? ৯ + ৬, ৮ + ৭, ১০ + ৫।', '', [
      ansPick(10, 5, '+'), ansPick(8, 2, '+'), ansPick(7, 3, '+'), ansPick(6, 4, '+'), sumPick(15, [[9, 6], [9, 5], [9, 3]]), sumPick(15, [[8, 7], [6, 8], [6, 7]]), sumPick(12, [[3, 9], [7, 7], [2, 3]])]),
    D(REVIEW, 'বনভোজনের শেষ খেলা! দেখি কে জেতে।', '', [
      m10(5, 9), m10(8, 5), story(9, '+', 5, 'রিমার হাতে ৯টি পেনসিল ছিল। ম্যাডাম তাকে আরও ৫টি দিলেন।', 'মোট কয়টি পেনসিল হলো?', '✏️'), story(6, '+', 5, 'দৌড়ে ৬ জন ছিল। আরও ৫ জন এল।', 'মোট কতজন ছাত্র-ছাত্রী হলো?', '🧑‍🎓'), ansPick(7, 8, '+'), ansPick(9, 4, '+')])
  ];

  // ---------- Chapter 8: বিয়োগ (১১-২০) ----------
  const ch8 = [
    D('গল্প: সকালের নাস্তা', 'সকালে মা নাস্তা বানালেন: ডিম, রুটি, মোয়া। সবাই খেল, কিছু বাকি রইল। চলো বিয়োগ করি!', `<div style="text-align:center">${emo('🥚', 44, 3)}${emo('🫓', 44, 2)}</div>`, [
      subSt(8, 8), subSt(7, 7), subSt(6, 4), subSt(5, 2)]),
    D('এক বাদ দিলে দশ', '১৭ − ৭: ১৭ = ১ দশ ৭। ৭টি খোলা কাঠি সরালে থাকে ১ দশ = ১০।', mat => pv(1, 7, mat), [
      subSt(12, 2), subSt(13, 3), subSt(15, 5), subSt(18, 8), sub(12, 2, '🥚', 'মা ১২টি ডিম ভাজলেন। দিশা ২টি ডিম খেল।', 'কয়টি ডিম রইল?', true)]),
    D('দশ বাদ দিই', '১৭ − ১০: আঁটিটি সরালে থাকে ৭টি খোলা কাঠি। ১৭ − ১০ = ৭।', mat => pv(1, 7, mat), [
      ansPick(11, 1, '−'), ansPick(14, 4, '−'), subSt(12, 10), subSt(13, 10), subSt(15, 10), subSt(18, 10), sub(12, 10, '🫓', 'মা ১২টি রুটি ভাজলেন। সবাই মিলে ১০টি রুটি খেল।', 'কয়টি রুটি রইল?', true), tf('১১ − ১০ = ১', true, ['১১ থেকে আঁটিটি সরাও।', 'থাকে ১টি খোলা কাঠি।'], 'ঠিক।'), tf('১৫ − ১০ = ১১', false, ['১৫ থেকে আঁটিটি সরাও।', 'থাকে ৫টি খোলা কাঠি।'], 'ভুল। ১৫ − ১০ = ৫।')]),
    D('সংখ্যারেখায় বিয়োগ', 'সংখ্যারেখায় পিছনে লাফ দিয়ে বিয়োগ করি। ১৩ − ৭ = ৬।', nline(13, -7, 20), [
      ansPick(12, 10, '−'), ansPick(16, 6, '−'), ansPick(19, 10, '−'), subNL(13, 7), subNL(11, 8), subNL(14, 9), subNL(15, 7), subNL(13, 5), sub(12, 8, '🌶️', 'বাটিতে ১২টি মরিচ ছিল। মা ৮টি মরিচ কাটলেন।', 'কয়টি মরিচ বাকি রইল?', true)]),
    D('সংখ্যারেখায় বিয়োগ', 'পিছনে লাফ দিতে দিতে ১০ পার হলেও থামবে না।', '', [
      ansPick(12, 5, '−'), ansPick(14, 6, '−'), ansPick(13, 9, '−'), subNL(16, 9), subNL(17, 8), subNL(18, 9), subNL(16, 7), sub(17, 8, '🍪', 'মা ১৭টি মোয়া বের করলেন। নাফি ৮টি খেল।', 'কয়টি মোয়া বাকি রইল?', true), tf('১৮ − ৯ = ৮', false, ['৯ + ৮ কত হয়?', '৯ + ৯ = ১৮।'], 'ভুল। ১৮ − ৯ = ৯।'), tf('১৭ − ৮ = ৯', true, ['৮ + ৯ কত হয়?', '৮ + ৯ = ১৭।'], 'ঠিক।')]),
    D('খালিঘর পূরণ করি', 'কত বিয়োগ করলে বিয়োগফল ৯ হবে? ১৬ − ৭ = ৯।', '', [
      missSub(9, 4), missSub(7, 4), missSub(15, 8), missSub(17, 11), missSub(18, 13), missSub(19, 15), missSub(13, 7, '১৩টি বিস্কুট ছিল। মা কিছু খেলেন। ৭টি বাকি রইল।')]),
    D(REVIEW, 'বাজার আর নাস্তার গল্পে বিয়োগ আবার খেলি।', '', [
      ansPick(16, 9, '−'), ansPick(18, 8, '−'), ansPick(13, 10, '−'), ansPick(14, 8, '−'), ansPick(15, 7, '−'), moreWhich(16, '🥚', 'ডিম', 9, '🍌', 'কলা', 'বাবা ১৬টি ডিম আর ৯টি কলা কিনলেন।'), diff(16, 9, '', 'কয়টি বেশি?'), diff(15, 7, 'দিশার ১৫টি চকলেট, নাফির ৭টি চকলেট।', 'কয়টি বেশি?')])
  ];

  // ---------- Chapter 9: সংখ্যা ২১-৪০ ----------
  const ch9num = (lo, ord1, ordDir, prevs) => [pvCount(lo), pvCount(lo + 2), pvCount(lo + 4), ord(ord1, ordDir), seq(lo - 1, 6, [lo, lo + 2, lo + 3]), numPic(lo + 2, '🍬', '', lo + 6), ...prevs.map(n => prevN(n))];
  const ch9 = [
    D('সংখ্যা ২১-২৫', '২টি দশ আর ১টি এক = ২১। দুই আঁটি কাঠি আর ১টি খোলা কাঠি।', mat => pv(2, 1, mat), ch9num(21, [20, 17, 19, 18], 'desc', [21, 24])),
    D('সংখ্যা ২৬-৩০', '২ দশ ৬ এক = ২৬। আর ৩টি দশ = ৩০।', mat => pv(3, 0, mat), ch9num(26, [22, 24, 23, 21], 'asc', [27, 30])),
    D('সংখ্যা ৩১-৩৫', '৩ দশ ১ এক = ৩১।', mat => pv(3, 1, mat), [...ch9num(31, [27, 29, 28, 26], 'asc', [32, 35]), tf('৩ দশ ৪ এক = ৩৪', true, ['দশকের অঙ্ক আগে লিখি।', '৩ এর পরে ৪।'], 'ঠিক।')]),
    D('সংখ্যা ৩৬-৪০', '৩ দশ ৬ এক = ৩৬। ৪টি দশ = ৪০।', mat => pv(4, 0, mat), ch9num(36, [32, 34, 33, 31], 'desc', [36, 40])),
    D('সংখ্যা কথায় লিখি (১-১০)', '১ এক, ২ দুই, ৩ তিন, ৪ চার, ৫ পাঁচ, ৬ ছয়, ৭ সাত, ৮ আট, ৯ নয়, ১০ দশ।', '', [
      seq(1, 10, [2, 3, 4, 6, 7, 8, 10]), wordPick(3), wordPick(6), wordNum(8), wordNum(5), wordPick(7), wordPick(4)]),
    D(REVIEW, '২১ থেকে ৪০ আর সংখ্যার নাম আবার খেলি।', '', [
      pvCount(22), pvCount(38), ord([28, 27, 30, 29, 32, 31], 'asc'), wordNum(1), wordNum(3), wordNum(9), wordPick(2), wordPick(10), seq(24, 13, [25, 26, 28, 30, 31, 33, 34, 35])])
  ];

  // ---------- Chapter 12: জ্যামিতি ----------
  const ch12 = [
    D('নানা আকৃতির জিনিস', 'আমাদের চারপাশের জিনিস একেকটি একেক রকম দেখতে। এগুলো নানা আকৃতির।', `<div style="text-align:center">${shp('circle', '#ffb627')} ${shp('tri', '#d9534f')} ${shp('square', '#2e9e5b')}</div>`, [
      odd([emo('⚽', 76), emo('⚽', 76), emo('📗', 76)], 2, '', 'বই দেখতে চারকোনা, বাকিগুলো গোল।'), odd([shp('tri', '#d9534f'), shp('circle', '#ffb627'), shp('tri', '#3a8fd6')], 1, '', 'গোলটি অন্যরকম।'), objShape('🥥', 'circle', 'ডাব'), objShape('📺', 'rect', 'টিভি'), shapeCount(['circle', 'tri', 'circle', 'square', 'circle'], 'circle')]),
    D('গোল আর তিনকোনা', 'গোল আকৃতির কোনো কোণা নেই, যেমন চাকা। তিনকোনা আকৃতির ৩টি কোণা, যেমন সমুচা।', `<div style="text-align:center">${shp('circle', '#ffb627', 70)} ${shp('tri', '#d9534f', 70)}</div>`, [
      odd([shp('circle', '#3a8fd6'), shp('circle', '#2e9e5b'), shp('square', '#ffb627')], 2), shapePick('circle'), shapePick('tri'), objShape('⚽', 'circle', 'বল'), objShape('🍉', 'tri', 'তরমুজের টুকরা'), shapeCount(['tri', 'circle', 'tri', 'tri', 'square'], 'tri')]),
    D('চারকোনা আকৃতি', 'চারকোনা আকৃতির ৪টি কোণা, যেমন দরজা, বই, জানালা।', `<div style="text-align:center">${shp('square', '#2e9e5b', 70)} ${shp('rect', '#8a5cc2', 70)}</div>`, [
      shapePick('square'), shapePick('tri'), objShape('📗', 'rect', 'বই'), objShape('🏡', 'square', 'ঘরের জানালা'), shapeCount(['square', 'tri', 'rect', 'circle', 'square'], 'square'), tf('তিনকোনা আকৃতির ৪টি কোণা', false, ['তিনকোনা নামেই আছে কয়টি কোণা।', 'তিন মানে ৩।'], 'ভুল। তিনকোনা আকৃতির ৩টি কোণা।'), tf('চারকোনা আকৃতির ৪টি কোণা', true, ['চারকোনা নামে কয়টি কোণা?', 'চার মানে ৪।'], 'ঠিক।')]),
    D('আকৃতি দিয়ে ছবি', 'চারকোনা কাগজ কোণাকুণি ভাঁজ করলে দুটি তিনকোনা হয়। আকৃতি জোড়া দিয়ে ঘর, নৌকা বানাই।', `<div style="text-align:center">${shp('tri', '#d9534f', 70)}<br>${shp('square', '#ffb627', 70)}</div>`, [
      { t: 'pick', q: 'চারকোনা কাগজ কোণাকুণি ভাঁজ করলে কোন আকৃতি হয়?', cols: 3, opts: [{ v: shp('tri', '#d9534f', 60), ok: true }, { v: shp('circle', '#ffb627', 60) }, { v: shp('square', '#2e9e5b', 60) }], h: ['এক কোণা থেকে উল্টো কোণা পর্যন্ত ভাঁজ করি।', 'ভাঁজের পরে কয়টি কোণা থাকে?'], ex: 'কোণাকুণি ভাঁজ করলে তিনকোনা হয়।' },
      { t: 'fill', q: 'ঘরের ছবিতে কয়টি তিনকোনা, কয়টি চারকোনা?', vis: `<div style="text-align:center">${shp('tri', '#d9534f', 80)}<br>${shp('square', '#ffb627', 80)}</div>`, parts: ['তিনকোনা', { a: 1 }, 'চারকোনা', { a: 1 }], h: ['ছাদটি দেখো, তার কয়টি কোণা?', 'দেয়ালটি দেখো, তার কয়টি কোণা?'], ex: 'ছাদ ১টি তিনকোনা, দেয়াল ১টি চারকোনা।' },
      shapeCount(['circle', 'circle', 'tri', 'square', 'circle', 'tri'], 'circle'), shapeCount(['square', 'rect', 'tri', 'square'], 'square')]),
    D(REVIEW, 'আকৃতির ধাঁধা! শুনে বলো আমি কে।', '', [
      shapeCount(['circle', 'tri', 'circle', 'circle', 'square', 'circle', 'tri', 'circle'], 'circle'), shapeCount(['tri', 'square', 'tri', 'circle', 'tri'], 'tri'),
      { t: 'pick', s: 'ধাঁধা: আমি দেখতে চাকার মতো। আমার কোনো কোণা নেই।', q: 'আমি কে?', cols: 3, opts: [{ v: shp('circle', '#ffb627', 60), ok: true }, { v: shp('tri', '#d9534f', 60) }, { v: shp('square', '#2e9e5b', 60) }], h: ['চাকা কেমন দেখতে?', 'কোণা নেই এমন আকৃতি খোঁজো।'], ex: 'আমি গোল আকৃতি।' },
      { t: 'pick', s: 'ধাঁধা: আমার তিনটি কোণা আছে। আমি দেখতে সমুচার মতো।', q: 'আমি কে?', cols: 3, opts: [{ v: shp('circle', '#ffb627', 60) }, { v: shp('tri', '#d9534f', 60), ok: true }, { v: shp('square', '#2e9e5b', 60) }], h: ['কোণা গুনে দেখো।', '৩টি কোণা কার?'], ex: 'আমি তিনকোনা আকৃতি।' },
      { t: 'pick', s: 'ধাঁধা: আমার চারটি কোণা আছে। আমি দেখতে দরজার মতো।', q: 'আমি কে?', cols: 3, opts: [{ v: shp('circle', '#ffb627', 60) }, { v: shp('tri', '#d9534f', 60) }, { v: shp('rect', '#2e9e5b', 60), ok: true }], h: ['দরজার কয়টি কোণা?', '৪টি কোণা কার?'], ex: 'আমি চারকোনা আকৃতি।' }])
  ];

  // ---------- Chapter 13: প্যাটার্ন ----------
  const S = (k, c) => shp(k, c, 44);
  const ch13 = [
    D('প্যাটার্ন কী?', 'মিল রেখে ঘুরে ঘুরে সাজানোকেই প্যাটার্ন বলে। যেমন: লাল, নীল, লাল, নীল…', `<div class="patrow">${[S('circle', '#d9534f'), S('circle', '#3a8fd6'), S('circle', '#d9534f'), S('circle', '#3a8fd6')].map(x => `<span class="patc">${x}</span>`).join('')}</div>`, [
      odd([emo('🍎', 66), emo('🍎', 66), emo('🍌', 66), emo('🍎', 66)], 2), pat([emo('🌸', 42), emo('🍃', 42), emo('🌸', 42), emo('🍃', 42), emo('🌸', 42)], emo('🍃', 42), emo('🌸', 42)), pat([S('circle', '#ffb627'), S('tri', '#d9534f'), S('circle', '#ffb627'), S('tri', '#d9534f')], S('circle', '#ffb627'), S('tri', '#d9534f')), pat([emo('⚽', 42), emo('⚽', 42), emo('🪁', 42), emo('⚽', 42), emo('⚽', 42)], emo('🪁', 42), emo('⚽', 42))]),
    D('বর্ণের প্যাটার্ন', 'ক খ ক খ ক খ… অক্ষর দিয়েও প্যাটার্ন হয়।', `<p class="bigt" style="text-align:center">ক খ ক খ ক খ</p>`, [
      pat(['ক', 'খ', 'ক', 'খ', 'ক'], 'খ', 'ক', '', 'বর্ণের প্যাটার্ন'), pat(['অ', 'ই', 'অ', 'ই', 'অ', 'ই'], 'অ', 'ই', '', 'বর্ণের প্যাটার্ন'), pat(['গ', 'ঘ', 'গ', 'ঘ', 'গ'], 'ঘ', 'গ', '', 'বর্ণের প্যাটার্ন'), pat(['ঊ', 'ঋ', 'ঊ', 'ঋ', 'ঊ', 'ঋ'], 'ঊ', 'ঋ', '', 'বর্ণের প্যাটার্ন'), pat(['ট', 'ঠ', 'ট', 'ঠ', 'ট', 'ঠ', 'ট'], 'ঠ', 'ঈ', '', 'বর্ণের প্যাটার্ন')]),
    D('সংখ্যার প্যাটার্ন', '১ ২ ১ ২ ১ ২… সংখ্যা দিয়েও প্যাটার্ন হয়। ১ ২ ৩ ১ ২ ৩ও প্যাটার্ন।', `<p class="bigt" style="text-align:center">১ ২ ১ ২ ১ ২</p>`, [
      pat(['১', '২', '১', '২', '১', '২', '১'], '২', '১', '', 'সংখ্যার প্যাটার্ন'), pat(['৫', '৬', '৫', '৬', '৫', '৬'], '৫', '৬', '', 'সংখ্যার প্যাটার্ন'), pat(['১', '২', '৩', '১', '২', '৩', '১'], '২', '৩', '', 'সংখ্যার প্যাটার্ন'), pat(['৭', '৮', '৭', '৮', '৭', '৮'], '৭', '৮', '', 'সংখ্যার প্যাটার্ন'), pat(['০', '১', '০', '১', '০', '১'], '০', '৯', '', 'সংখ্যার প্যাটার্ন'), pat(['৯', '৪', '৯', '৪', '৯', '৪'], '৯', '২', '', 'সংখ্যার প্যাটার্ন')]),
    D('আকৃতি ও রঙের প্যাটার্ন', 'আকৃতি বা রং ঘুরে ঘুরে এলেও প্যাটার্ন হয়।', '', [
      pat(['৮', '৯', '৮', '৯', '৮', '৯', '৮'], '৯', '৮', '', 'সংখ্যার প্যাটার্ন'), pat(['৩', '৪', '৩', '৪', '৩', '৪'], '৩', '৪', '', 'সংখ্যার প্যাটার্ন'), pat([S('square', '#2e9e5b'), S('tri', '#2e9e5b'), S('square', '#2e9e5b'), S('tri', '#2e9e5b'), S('square', '#2e9e5b')], S('tri', '#2e9e5b'), S('square', '#2e9e5b'), '', 'আকৃতির প্যাটার্ন'), pat([S('circle', '#d9534f'), S('circle', '#ffb627'), S('circle', '#2e9e5b'), S('circle', '#d9534f'), S('circle', '#ffb627')], S('circle', '#2e9e5b'), S('circle', '#d9534f'), '', 'রঙের প্যাটার্ন'), pat([S('tri', '#3a8fd6'), S('tri', '#3a8fd6'), S('circle', '#ffb627'), S('tri', '#3a8fd6'), S('tri', '#3a8fd6')], S('circle', '#ffb627'), S('tri', '#3a8fd6'), '', 'আকৃতির প্যাটার্ন')]),
    D(REVIEW, 'নানা রকম প্যাটার্ন আবার খুঁজি।', '', [
      pat(['ঊ', 'ই', 'ঊ', 'ই', 'ঊ', 'ই'], 'ঊ', 'ই'), pat(['উ', 'ঈ', 'উ', 'ঈ', 'উ', 'ঈ', 'উ'], 'ঈ', 'উ'), pat(['ড', 'ঢ', 'ড', 'ঢ', 'ড', 'ঢ'], 'ড', 'ঢ'), pat(['৪', '৬', '৪', '৬', '৪', '৬'], '৪', '৬'), pat(['চ', 'ছ', 'চ', 'ছ', 'চ', 'ছ', 'চ'], 'ছ', 'চ'), pat([emo('🐔', 42), emo('🦆', 42), emo('🦆', 42), emo('🐔', 42), emo('🦆', 42)], emo('🦆', 42), emo('🐔', 42))])
  ];

  // ---------- Chapter 14: সংখ্যা ৪১-১০০ ----------
  const decade = (d, extra) => {
    const lo = d * 10 + 1;
    return D(`সংখ্যা ${bn(lo)}-${bn(lo + 9)}`, `${bn(d)} দশ ১ = ${bn(lo)}, ${bn(d)} দশ ২ = ${bn(lo + 1)}… ${bn(d + 1)} দশ = ${bn(lo + 9)}। দশের সাহায্যে গুনি আর পড়ি।`, mat => pv(d, 1, mat),
      [pvCount(lo + 2), pvCount(lo + 5), pvCount(lo + 8), seq(lo, 10, [lo + 1, lo + 2, lo + 4, lo + 5, lo + 7, lo + 8]), ...extra]);
  };
  const mix14 = k => { const b = 41 + k * 9; return [pvCount(b + 3), between(b), nextN(b + 6), prevN(b + 4), pickN([b + 2, b + 7, b + 5], k % 2 ? 'big' : 'small'), ord([b + 1, b + 8, b + 4, b + 6], k % 2 ? 'desc' : 'asc'), wordPick(11 + (k * 2) % 9), seq(b, 6, [b + 1, b + 3])]; };
  const ch14 = [
    decade(4, [pickN([47, 43, 41], 'small'), pickN([46, 42, 49], 'small')]),
    decade(5, [prevN(57), prevN(51), nextN(53), nextN(59)]),
    decade(6, [pickN([67, 63, 61], 'big'), pickN([66, 62, 69], 'big')]),
    D(REVIEW, '৪১ থেকে ৭০ আবার খেলি।', '', [seq(42, 7, [43, 45, 46, 48]), pvCount(56), between(43), between(55), prevN(47), prevN(51), nextN(66), nextN(69), ord([62, 60, 59, 61], 'desc')]),
    decade(7, [tf('৭ দশ ৭ = ৭৭', true, ['দশকের অঙ্ক আগে।', '৭ এর পরে ৭।'], 'ঠিক।'), tf('৭ দশ ৯ = ৭৮', false, ['৭ দশ ৯ লিখে দেখো।', 'এককে ৯।'], 'ভুল। ৭ দশ ৯ = ৭৯।')]),
    decade(8, [prevN(87), prevN(81), nextN(83), nextN(89)]),
    decade(9, [pickN([91, 95, 96], 'small'), pickN([94, 93, 99], 'small'), { t: 'fill', q: '১০টি দশ মিলে কত হয়?', vis: `<div class="pile">${bundle(52).repeat(10)}</div>`, parts: ['১০ দশ =', { a: 100 }], h: ['দশ দশ করে গোনো: ১০, ২০, ৩০…', '৯০ এর পরে আরও ১০ মানে একশো।'], ex: '১০ দশ = ১০০ (একশো)।' }]),
    D(REVIEW, '৭১ থেকে ১০০ আবার খেলি।', '', [seq(71, 9, [72, 73, 75, 76, 78]), pvCount(84), between(73), between(95), prevN(77), prevN(96), nextN(80), nextN(99), ord([92, 90, 89, 91], 'asc')]),
    D('সংখ্যা কথায় লিখি (১১-১৫)', '১১ এগারো, ১২ বারো, ১৩ তেরো, ১৪ চৌদ্দ, ১৫ পনেরো।', '', [
      pickN([14, 15, 13], 'small'), pickN([11, 12, 14], 'small'), wordPick(12), wordPick(11), wordNum(14), wordNum(15), wordNum(13), count(13, '✏️')]),
    D('সংখ্যা কথায় লিখি (১৬-২০)', '১৬ ষোলো, ১৭ সতেরো, ১৮ আঠারো, ১৯ উনিশ, ২০ বিশ।', '', [
      wordPick(13), wordPick(15), wordNum(17), wordNum(16), wordNum(19), wordNum(20), wordPick(18), count(19, '🍎')]),
    D(REVIEW + ' ১', 'বড়ো সংখ্যা চিনি, পড়ি, লিখি।', '', mix14(0)),
    D(REVIEW + ' ২', 'আগের, পরের, মাঝের সংখ্যা খুঁজি।', '', mix14(1)),
    D(REVIEW + ' ৩', 'সংখ্যা সাজাই, তুলনা করি।', '', mix14(2)),
    D(REVIEW + ' ৪', 'দশ আর এক দিয়ে সংখ্যা বানাই।', '', mix14(3)),
    D(REVIEW + ' ৫', 'কথায় লেখা সংখ্যা চিনি।', '', mix14(4)),
    D(REVIEW + ' ৬', 'অধ্যায়ের শেষ খেলা! ১০০ পর্যন্ত সব।', '', mix14(5))
  ];

  // ---------- Chapter 15: উপরে নিচে যোগ ----------
  const ch15 = [
    D('দশের যোগ', '৫০ = ৫ দশ। ৫০ + ১০ = ৫ দশ + ১ দশ = ৬ দশ = ৬০।', `<div class="pile">${bundle(52).repeat(5)}</div>`, [
      addSt(5, 4), addSt(3, 4), tensIs(50), tensIs(60), tensOp(50, 10, '+'), tensOp(60, 20, '+'), tensOp(30, 20, '+'), { ...tensOp(30, 40, '+', 'প্রতি প্যাকেটে ১০টি ডিম। রাজু ৩টি প্যাকেট নিল, শুভ ৪টি প্যাকেট নিল।'), q: 'দুইজনে একসাথে কয়টি ডিম নিল?' }]),
    D('উপরে নিচে যোগ', 'দশক নিচে দশক, একক নিচে একক লিখি। আগে একক যোগ করি, তারপর দশক।', vtab(24, 12, '+'), [
      { t: 'fill', q: '৬৩ এ কয় দশক, কয় একক?', parts: ['৬৩ =', { a: 6 }, 'দশক', { a: 3 }, 'একক'], h: ['বাম দিকের অঙ্ক দশক।', 'ডান দিকের অঙ্ক একক।'], ex: '৬৩ = ৬ দশক ৩ একক।' },
      vert(24, 12, '+'), vert(22, 23, '+'), vert(54, 15, '+'), vert(43, 41, '+'), vert(48, 21, '+'), vert(65, 13, '+')]),
    D('উপরে নিচে যোগ (একক)', 'এককের সাথে একক যোগ করি। দুই অঙ্কের সংখ্যার নিচে এক অঙ্ক থাকলে সেটি এককের ঘরে বসে।', vtab(32, 3, '+'), [
      vert(32, 3, '+'), vert(52, 5, '+'), vert(47, 32, '+'), vert(21, 45, '+'), vert(76, 3, '+'), { ...vert(15, 4, '+', 'রিপা ১৫টি মুলা উঠিয়েছে, পারো ৪টি মুলা উঠিয়েছে।'), q: 'একসাথে কয়টি মুলা হলো?' }]),
    D('উপরে নিচে যোগ', 'আগে একক, তারপর দশক। ভুল হলে আবার এককের ঘর দেখো।', '', [
      vert(23, 6, '+'), vert(21, 45, '+'), vert(42, 4, '+'), vert(53, 5, '+'), vert(25, 14, '+'), vert(24, 75, '+'), { ...vert(24, 32, '+', 'জেলেরা প্রথম দিন ২৪টি মাছ ধরেছে, পরের দিন ৩২টি মাছ ধরল।'), q: 'মোট কয়টি মাছ ধরা হলো?' }]),
    D('গল্পে উপরে নিচে যোগ', 'মাঠে ছাত্র ২৩ জন, ছাত্রী ৩০ জন। মোট ২৩ + ৩০ = ৫৩ জন।', vtab(23, 30, '+'), [
      vert(64, 24, '+'), vert(93, 6, '+'), vert(62, 25, '+'), { ...vert(23, 30, '+', 'মাঠে ছাত্র আছে ২৩ জন, ছাত্রী আছে ৩০ জন।'), q: 'মাঠে মোট কয়জন ছাত্র-ছাত্রী আছে?' }, { ...vert(37, 12, '+', 'বাগানে ৩৭টি গাছ ছিল। আরও ১২টি লাগানো হলো।'), q: 'বাগানে মোট কয়টি গাছ হলো?' }, { ...vert(23, 34, '+', 'রাফিদের এলাকায় ২৩টি বাড়ি, মীনাদের এলাকায় ৩৪টি বাড়ি।'), q: 'দুই এলাকায় মোট কয়টি বাড়ি আছে?' }]),
    D(REVIEW, 'উপরে নিচে যোগ আবার খেলি।', '', [
      vert(46, 32, '+'), vert(83, 4, '+'), vert(55, 10, '+'), vert(4, 82, '+'), { ...vert(66, 23, '+', 'বিনার ৬৬টি চুড়ি, মীনার ২৩টি চুড়ি আছে।'), q: 'দুইজনের মোট কয়টি চুড়ি আছে?' }, { ...vert(14, 25, '+', 'লাবণি বাবাকে ১৪টি ফুল দিল, বড়ো আপু ২৫টি ফুল দিল।'), q: 'দুইজনে মিলে বাবাকে মোট কয়টি ফুল দিল?' }, { ...vert(20, 14, '+', 'কাছে আছে ২০টি ছাগল, দূরে আছে ১৪টি ছাগল।'), q: 'মোট কয়টি ছাগল আছে?' }])
  ];

  // ---------- Chapter 16: উপরে নিচে বিয়োগ ----------
  const vs = (a, b, s, q) => ({ ...vert(a, b, '−', s), q: q || 'উপরে নিচে বিয়োগ করি।' });
  const ch16 = [
    D('দশের বিয়োগ', '৫০ − ১০ = ৫ দশ − ১ দশ = ৪ দশ = ৪০।', `<div class="pile">${bundle(52).repeat(5)}</div>`, [
      subSt(6, 2), subSt(7, 3), subSt(9, 6), tensIs(20), tensOp(50, 10, '−'), tensOp(60, 20, '−'), tensOp(30, 20, '−'), { ...tensOp(20, 10, '−', 'দোকানে ২০টি খেলনা গাড়ি ছিল। দোকানদার ১০টি বিক্রি করলেন।'), q: 'দোকানে কয়টি খেলনা গাড়ি রইল?' }]),
    D('উপরে নিচে বিয়োগ', 'আগে একক থেকে একক বিয়োগ, তারপর দশক থেকে দশক।', vtab(25, 12, '−'), [
      { t: 'fill', q: '৫৩ এ কয় দশক, কয় একক?', parts: ['৫৩ =', { a: 5 }, 'দশক', { a: 3 }, 'একক'], h: ['বাম দিকের অঙ্ক দশক।', 'ডান দিকের অঙ্ক একক।'], ex: '৫৩ = ৫ দশক ৩ একক।' },
      vs(25, 12), vs(37, 13), vs(79, 38), vs(86, 24), vs(28, 13), vs(56, 21)]),
    D('উপরে নিচে বিয়োগ', 'নিচে এক অঙ্ক থাকলে সেটি এককের ঘরে বসে। দশক যেমন ছিল তেমন থাকে।', vtab(28, 3, '−'), [
      vs(67, 54), vs(96, 84), vs(58, 32), vs(28, 3), vs(86, 3), vs(35, 0), vs(74, 2), vs(36, 4, 'বাগানে ৩৬টি চারা গাছ ছিল। ৪টি চারা গাছ মরে গেল।', 'কয়টি চারা গাছ রইল?')]),
    D('কথার সমস্যা: কত বাকি', 'ছিল কত, গেল কত, বাকি কত? বিয়োগ করে বের করি।', '', [
      vs(96, 2), vs(79, 4), vs(87, 5), tensOp(50, 30, '−'), vs(26, 12, 'রাইদার ২৬টি সাদা কাগজ ছিল। ১২টি কাগজে ছবি এঁকেছে।', 'কয়টি সাদা কাগজ রইল?'), vs(36, 6, 'মা ৩৬টি চিংড়ি রান্না করেছেন। তারা ৬টি চিংড়ি খেল।', 'কয়টি চিংড়ি রইল?'), vs(17, 6, 'গাছের নিচে ১৭টি বানর ছিল। ৬টি বানর গাছে উঠল।', 'নিচে কয়টি বানর রইল?')]),
    D('কথার সমস্যা: কম বেশি', 'কার বেশি, কতটি বেশি? বড়ো থেকে ছোটো বিয়োগ করি।', '', [
      vs(37, 7, 'তামিমের ৩৭টি খেলনা আছে। ৭টি খেলনা সবুজকে দিয়ে দিল।', 'তামিমের কয়টি খেলনা রইল?'), { t: 'pick', s: 'নিলার ৩৪টি পুতুল আছে, লাবনির ২১টি পুতুল আছে।', q: 'কার পুতুল বেশি?', cols: 2, opts: [{ v: TXT('নিলা'), lbl: '৩৪টি', ok: true }, { v: TXT('লাবনি'), lbl: '২১টি' }], h: ['৩৪ আর ২১ তুলনা করো।', 'দশকের ঘর দেখো: ৩ আর ২।'], ex: '৩৪ বড়ো, তাই নিলার বেশি।' }, vs(34, 21, '', 'কয়টি বেশি?'), { t: 'pick', s: 'জিয়ার ৪৮টি রং আছে, দিনার ২৪টি রং আছে।', q: 'কার রং কম?', cols: 2, opts: [{ v: TXT('জিয়া'), lbl: '৪৮টি' }, { v: TXT('দিনা'), lbl: '২৪টি', ok: true }], h: ['৪৮ আর ২৪ তুলনা করো।', 'দশকের ঘর দেখো: ৪ আর ২।'], ex: '২৪ ছোটো, তাই দিনার কম।' }, vs(48, 24, '', 'কয়টি কম?')]),
    D('কথার সমস্যা: দুই রকম জিনিস', 'একটি শ্রেণিতে ৪৫ জন ছেলে-মেয়ে। মেয়ে ২১ জন হলে ছেলে ৪৫ − ২১ = ২৪ জন।', '', [
      { t: 'pick', s: 'তানিশার ৩৫টি তুলি, তাসিনের ১৩টি তুলি আছে।', q: 'কার তুলি বেশি?', cols: 2, opts: [{ v: TXT('তানিশা'), lbl: '৩৫টি', ok: true }, { v: TXT('তাসিন'), lbl: '১৩টি' }], h: ['৩৫ আর ১৩ তুলনা করো।', 'দশকের ঘর: ৩ আর ১।'], ex: '৩৫ বড়ো, তাই তানিশার বেশি।' }, vs(35, 13, '', 'কয়টি বেশি?'), vs(45, 21, 'একটি শ্রেণিতে ৪৫ জন ছেলে-মেয়ে আছে। মেয়ে ২১ জন।', 'ছেলের সংখ্যা কত?'), vs(35, 24, 'একটি বাগানে ৩৫টি ছোটো-বড়ো গাছ আছে। ২৪টি ছোটো গাছ।', 'বড়ো গাছ কয়টি?')]),
    D('মাঝখানে খালিঘর', '৩ এর সাথে কত যোগ করলে ৯ হবে? ৯ − ৩ = ৬। তাই ৩ + ৬ = ৯।', '', [
      vs(64, 3), vs(89, 24), vs(97, 7), missAdd(3, 9), { t: 'fill', s: 'মাঠে ৪ জন খেলছিল। পরে আরও কয়েকজন এল। এখন মাঠে ৮ জন।', q: 'পরে কয়জন এসেছিল?', parts: ['৪ +', { a: 4 }, '= ৮'], h: ['এখন কতজন, আগে কতজন ছিল?', '৮ − ৪ করে দেখো।'], ex: '৮ − ৪ = ৪, তাই ৪ জন এসেছিল।' }, vs(89, 57, 'পাঠাগারে ৫৭টি বই ছিল। নতুন করে আরও কিছু বই কেনা হলো। এখন মোট ৮৯টি বই।', 'কয়টি নতুন বই কেনা হয়েছিল?')]),
    D(REVIEW, 'উপরে নিচে বিয়োগ আবার খেলি।', '', [
      vs(56, 12), vs(34, 0), vs(27, 3), tensOp(90, 30, '−'), vs(35, 12, 'রাখীর ৩৫টি মার্বেল, মিকির ১২টি মার্বেল আছে।', 'রাখীর কয়টি বেশি?'), vs(95, 52, 'জঙ্গলে ৯৫টি হরিণ ও খরগোশ আছে। হরিণ আছে ৫২টি।', 'খরগোশ কয়টি?')])
  ];

  // ---------- Chapter 17: বাংলাদেশী মুদ্রা ----------
  const ch17 = [
    D('টাকা চিনি', 'আমাদের দেশের টাকা: ১, ২, ৫ টাকার কয়েন গোল। ১০, ২০, ৫০, ১০০ টাকার নোট চারকোনা।', moneyRow([1, 2, 5, 10, 20]), [
      { t: 'pick', q: 'কয়েন দেখতে কোন আকৃতির?', vis: `<div style="text-align:center">${money(5, 1.5)}</div>`, cols: 2, opts: [{ v: shp('circle', '#e9c46a', 60), lbl: 'গোল', ok: true }, { v: shp('rect', '#bfe3b4', 60), lbl: 'চারকোনা' }], h: ['কয়েনের কিনারা দেখো।', 'কোনো কোণা আছে কি?'], ex: 'কয়েন গোল।' },
      { t: 'pick', q: 'নোট দেখতে কোন আকৃতির?', vis: `<div style="text-align:center">${money(20, 1.5)}</div>`, cols: 2, opts: [{ v: shp('circle', '#e9c46a', 60), lbl: 'গোল' }, { v: shp('rect', '#bfe3b4', 60), lbl: 'চারকোনা', ok: true }], h: ['নোটের কোণা গুনে দেখো।', '৪টি কোণা।'], ex: 'নোট চারকোনা।' },
      moneyName(2), moneyName(10), moneyName(20), moneyBig([5, 10]), moneyBig([20, 10, 2]),
      { t: 'pick', s: 'এক কেজি আলুর দাম ১০ টাকা।', q: 'রাজু কোন নোটটি দেবে?', cols: 2, opts: [{ v: money(10), ok: true }, { v: money(20) }], h: ['আলুর দাম কত টাকা?', 'যে নোটে ১০ লেখা, সেটি দাও।'], ex: '১০ টাকার নোট দিলেই ঠিক দাম।' }]),
    D('টাকা যোগ করি', '১০ টাকার দুটি নোট মিলে ২০ টাকা। দশ দশ করে গুনি।', moneyRow([10, 10]), [
      moneySum([10, 10]), moneySum([50, 50]), moneySum([20, 50]), moneySum([20, 10]), moneySum([10, 50]),
      pay(70, [[50, 20], [50, 10], [20, 20]], 'জনি একটি বল কিনবে। বলের দাম ৭০ টাকা।', 'জনি কোন কোন নোট দেবে?'),
      storyN(60, '−', 10, 'তরুর আছে ৬০ টাকা। ১০ টাকায় একটি খাতা কিনল।', 'তরুর কত টাকা বাকি রইল?')]),
    D(REVIEW, 'বাজারে গিয়ে টাকা দিয়ে কেনাকাটা করি।', moneyRow([1, 2, 5, 20, 100]), [
      moneyName(5), moneyName(100), moneyName(1), moneyName(50),
      pay(7, [[5, 2], [5, 1], [2, 2]], 'জনি ৭ টাকার একটি চকলেট কিনবে।', 'জনি কোন কয়েনগুলো দেবে?'),
      pay(30, [[10, 20], [20, 20], [10, 50]], 'জনি ৩০ টাকার একটি খাতা কিনবে।', 'জনি কোন কোন নোট দেবে?'),
      moneySum([20, 20, 10]), storyN(50, '−', 20, 'মিনার কাছে ৫০ টাকা ছিল। ২০ টাকার ফল কিনল।', 'কত টাকা বাকি রইল?')])
  ];

  // ======================= attach =======================
  const DAYS = { 2: ch2, 3: ch3, 4: ch4, 5: ch5, 6: ch6, 7: ch7, 8: ch8, 9: ch9, 12: ch12, 13: ch13, 14: ch14, 15: ch15, 16: ch16, 17: ch17 };
  (window.CHAPTERS || []).forEach(c => { if (DAYS[c.id] && !c.days) c.days = DAYS[c.id]; });
})();
