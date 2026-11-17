/* Drawings used by the game: sticks, bundles, base-ten blocks, bead strings, taka notes, ladders, scales. */
(function () {
  const BN = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  function bn(n) { return String(n).replace(/[0-9]/g, d => BN[d]); }
  function toLatin(s) { return String(s).replace(/[০-৯]/g, d => BN.indexOf(d)); }

  function stick(h) {
    h = h || 70;
    return `<svg class="stk" width="10" height="${h}" viewBox="0 0 10 ${h}" aria-hidden="true">
      <rect x="2" y="1" width="6" height="${h - 2}" rx="3" fill="#c68b4e" stroke="#8a5a2b" stroke-width="1"/>
      <rect x="2" y="1" width="6" height="7" rx="3" fill="#8a5a2b"/></svg>`;
  }
  function bundle(h) {
    h = h || 70;
    let s = '';
    for (let i = 0; i < 10; i++) {
      const x = 2 + i * 4.2;
      s += `<rect x="${x}" y="2" width="5" height="${h - 4}" rx="2.5" fill="${i % 2 ? '#c68b4e' : '#d29a5f'}" stroke="#8a5a2b" stroke-width=".8"/>
            <rect x="${x}" y="2" width="5" height="6" rx="2.5" fill="#8a5a2b"/>`;
    }
    const by = h * 0.55;
    s += `<rect x="0" y="${by}" width="48" height="8" rx="3" fill="#d9534f"/>`;
    return `<svg class="bdl" width="48" height="${h}" viewBox="0 0 48 ${h}" aria-hidden="true">${s}</svg>`;
  }
  function rod() {
    let s = '';
    for (let i = 0; i < 10; i++) s += `<rect x="1" y="${1 + i * 8}" width="14" height="8" fill="#5aa9e6" stroke="#2b6ea3" stroke-width="1"/>`;
    return `<svg width="16" height="82" viewBox="0 0 16 82" aria-hidden="true">${s}</svg>`;
  }
  function cube() {
    return `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="1" width="14" height="14" fill="#ffcf5c" stroke="#b8860b" stroke-width="1"/></svg>`;
  }
  function beadRod() {
    let s = '<line x1="2" y1="9" x2="118" y2="9" stroke="#666" stroke-width="2"/>';
    for (let i = 0; i < 10; i++) s += `<circle cx="${7 + i * 11.4}" cy="9" r="5.6" fill="${i < 5 ? '#e0483f' : '#f4f4f4'}" stroke="#555" stroke-width="1"/>`;
    return `<svg width="120" height="18" viewBox="0 0 120 18" aria-hidden="true">${s}</svg>`;
  }
  function bead() {
    return `<svg width="14" height="18" viewBox="0 0 14 18" aria-hidden="true"><line x1="0" y1="9" x2="14" y2="9" stroke="#666" stroke-width="2"/><circle cx="7" cy="9" r="5.6" fill="#3a8fd6" stroke="#555" stroke-width="1"/></svg>`;
  }
  function note10() {
    return `<svg width="70" height="36" viewBox="0 0 70 36" aria-hidden="true"><rect x="1" y="1" width="68" height="34" rx="4" fill="#f6b7c4" stroke="#b5476a" stroke-width="1.5"/>
      <circle cx="18" cy="18" r="10" fill="#fbd8df" stroke="#b5476a"/><text x="47" y="25" font-size="17" text-anchor="middle" fill="#7a1f3d" font-family="Kalpurush, sans-serif">১০</text></svg>`;
  }
  function coin1() {
    return `<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="13" fill="#e9c46a" stroke="#a07a1f" stroke-width="2"/><text x="15" y="21" font-size="15" text-anchor="middle" fill="#6b4f0f" font-family="Kalpurush, sans-serif">১</text></svg>`;
  }

  const MATS = {
    sticks: { name: 'কাঠি', ten: () => bundle(70), one: () => stick(70), tenName: 'দশের আঁটি', oneName: 'খোলা কাঠি', stack: false },
    blocks: { name: 'ব্লক', ten: rod, one: cube, tenName: 'দশের লম্বা ব্লক', oneName: 'ছোটো ঘনক', stack: false },
    beads: { name: 'পুঁতির মালা', ten: beadRod, one: bead, tenName: '১০ পুঁতির মালা', oneName: 'একটি পুঁতি', stack: true },
    taka: { name: 'টাকা', ten: note10, one: coin1, tenName: '১০ টাকার নোট', oneName: '১ টাকার কয়েন', stack: false }
  };

  function pv(t, o, mat) {
    const m = MATS[mat] || MATS.sticks;
    let a = '', b = '';
    for (let i = 0; i < t; i++) a += m.ten();
    for (let i = 0; i < o; i++) b += m.one();
    const dir = m.stack ? 'flex-direction:column;align-items:flex-start' : '';
    const label = `${bn(t)} দশ ${bn(o)} এক`;
    return `<div class="pv" role="img" aria-label="${label}">
      ${t ? `<div class="grp" style="${dir}">${a}</div>` : ''}
      ${t && o ? '<span class="sep"></span>' : ''}
      ${o ? `<div class="grp">${b}</div>` : ''}
      ${!t && !o ? '<span class="muted small">কিছু নেই</span>' : ''}
    </div>`;
  }
  function pvTable(t, o, num) {
    return `<table class="pvtable"><tr><th>দশক</th><th>একক</th></tr><tr><td>${t}</td><td>${o}</td></tr>
      ${num !== undefined ? `<tr><td colspan="2">${num}</td></tr>` : ''}</table>`;
  }

  function ladder(h) {
    const H = h, rungs = Math.floor((H - 10) / 16);
    let s = `<rect x="4" y="2" width="5" height="${H - 4}" rx="2" fill="#a56a33"/><rect x="31" y="2" width="5" height="${H - 4}" rx="2" fill="#a56a33"/>`;
    for (let i = 0; i < rungs; i++) s += `<rect x="8" y="${10 + i * 16}" width="24" height="4" fill="#c68b4e"/>`;
    return `<svg width="40" height="${H}" viewBox="0 0 40 ${H}" aria-hidden="true">${s}</svg>`;
  }
  function pole(h) {
    return `<svg width="14" height="${h}" viewBox="0 0 14 ${h}" aria-hidden="true"><rect x="4" y="1" width="6" height="${h - 2}" rx="3" fill="#a56a33" stroke="#6e4420"/></svg>`;
  }
  function scale(leftEmo, rightEmo, heavier) {
    // heavier: 'L' or 'R'
    const ang = heavier === 'L' ? -12 : 12;
    return `<svg viewBox="0 0 240 150" width="100%" style="max-width:340px" role="img" aria-label="দাঁড়িপাল্লা">
      <polygon points="120,70 100,140 140,140" fill="#8a5a2b"/>
      <g transform="rotate(${ang} 120 70)">
        <rect x="20" y="64" width="200" height="10" rx="5" fill="#c68b4e"/>
        ${svgPic(leftEmo, 20, 22, 40)}
        ${svgPic(rightEmo, 180, 22, 40)}
      </g></svg>`;
  }
  // ---- flat pictures: every emoji in the page is swapped for a flat drawing from window.ICONS ----
  const EMO_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\u{FE0F}?(?:\u{200D}[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\u{FE0F}?)*/gu;
  function iconURI(e) {
    const svg = window.ICONS && window.ICONS[String(e).replace(/️/g, '')];
    return svg ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) : null;
  }
  const iconSVG = e => (window.ICONS && window.ICONS[String(e).replace(/\uFE0F/g, '')]) || null;
  function svgPic(e, x, y, size) {
    const svg = iconSVG(e);
    return svg ? svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${size}" height="${size}" `)
      : `<text x="${x + size / 2}" y="${y + size * .9}" font-size="${size}" text-anchor="middle">${e}</text>`;
  }
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, OPTION: 1, TITLE: 1, text: 1 };
  let flatten = function (root) {
    if (!window.ICONS || !root) return;
    if (root.nodeType === 3) return flatText(root);
    if (root.nodeType !== 1 || SKIP[root.nodeName]) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentNode && !SKIP[n.parentNode.nodeName] && !(n.parentNode.closest && n.parentNode.closest('svg')) ? 1 : 2 });
    const list = []; let n; while ((n = w.nextNode())) list.push(n);
    list.forEach(flatText);
  }
  // Build each drawing as real SVG elements (correct namespace), parsed once and then copied.
  const svgCache = {};
  function svgNode(e) {
    const k = String(e).replace(/\uFE0F/g, '');
    if (!(k in svgCache)) {
      svgCache[k] = null;
      try {
        const src = iconSVG(k);
        if (src) { const d = new DOMParser().parseFromString(src, 'image/svg+xml'); if (d.documentElement && d.documentElement.nodeName === 'svg') svgCache[k] = d.documentElement; }
      } catch (err) { }
    }
    return svgCache[k] ? document.importNode(svgCache[k], true) : null;
  }
  function flatText(node) {
    const t = node.nodeValue; if (!t) return;
    EMO_RE.lastIndex = 0; if (!EMO_RE.test(t)) return;
    EMO_RE.lastIndex = 0;
    const frag = document.createDocumentFragment(); let last = 0, m, changed = false;
    while ((m = EMO_RE.exec(t))) {
      const svg = iconSVG(m[0]); if (!svg) continue;
      changed = true;
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      const pic = document.createElement('span'); pic.className = 'ei'; pic.setAttribute('aria-hidden', 'true');
      pic.dataset.e = m[0];
      const node = svgNode(m[0]);
      if (node) pic.appendChild(node); else pic.textContent = m[0];
      frag.appendChild(pic); last = m.index + m[0].length;
    }
    if (!changed) return;
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
  // Safety net: if this device cannot draw the flat pictures, put the original pictures back.
  let flatOK = true, repairRounds = 0;
  function restoreEmoji() {
    flatOK = false;
    document.querySelectorAll('.ei').forEach(el => el.replaceWith(document.createTextNode(el.dataset.e || '')));
  }
  function checkFlat() {
    try {
      if (!flatOK) return;
      const all = document.querySelectorAll('.ei');
      let seen = 0, ok = 0, repaired = 0;
      for (const el of all) {
        if (!el.offsetParent) continue;
        seen++;
        const svg = el.querySelector('svg'), kid = svg && svg.firstElementChild, r = svg && svg.getBoundingClientRect();
        if (!svg || !(svg instanceof SVGElement) || (kid && !(kid instanceof SVGElement))) {
          // something rebuilt the drawing in the wrong way: draw it again from scratch
          const fresh = svgNode(el.dataset.e || '');
          if (!fresh) { el.replaceWith(document.createTextNode(el.dataset.e || '')); continue; }
          el.textContent = ''; el.appendChild(fresh); repaired++;
          continue;
        }
        if (r && r.width >= 1) ok++;
      }
      if (repaired) { if (++repairRounds > 6) restoreEmoji(); } else repairRounds = 0;
      if (seen && !ok && !repaired) restoreEmoji();
    } catch (e) { restoreEmoji(); }
  }
  const _flatten = flatten;
  flatten = function (root) { if (!flatOK) return; try { _flatten(root); } catch (e) { restoreEmoji(); } };
  function watchFlat() {
    try { if (window.ICONS && window.ICONS.__defs && !document.getElementById('gdefs')) { const w = document.createElement('div'); w.id = 'gdefs'; w.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; w.innerHTML = window.ICONS.__defs; document.body.appendChild(w); } } catch (e) { }
    setTimeout(checkFlat, 300); setInterval(checkFlat, 1500);
    flatten(document.body);
    new MutationObserver(ms => ms.forEach(m => { if (m.type === 'characterData') flatText(m.target); else m.addedNodes.forEach(flatten); }))
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.body) watchFlat(); else document.addEventListener('DOMContentLoaded', watchFlat);

  function emo(e, size, n) {
    let s = '';
    // Munia, 17 Nov: pictures bigger for class 1 children (about a third larger everywhere)
    const px = Math.round((size || 48) * 1.35);
    for (let i = 0; i < (n || 1); i++) s += `<span class="emo" style="font-size:${px}px">${e}</span>`;
    return s;
  }

  window.V = { bn, toLatin, stick, bundle, rod, cube, beadRod, bead, note10, coin1, MATS, pv, pvTable, ladder, pole, scale, emo, iconURI };
})();
