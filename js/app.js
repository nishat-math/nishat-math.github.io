/* গণিতের গ্রাম — game engine */
(function () {
  const { bn, toLatin, pv, pvTable, MATS } = window.V;
  const CH = window.CHAPTERS;
  const CFG = Object.assign({ backendUrl: '', localTeacherCode: '1234' }, window.GAME_CONFIG || {});
  const app = document.getElementById('app');
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const BUILT = CH.filter(c => c.days);

  // ---------------- storage ----------------
  const KEY = 'gonit-gram-v1';
  let D = { profile: null, roster: [], results: [], progress: {}, pending: [], mat: 'sticks', teacherKey: '' };
  try { const s = localStorage.getItem(KEY); if (s) D = Object.assign(D, JSON.parse(s)); } catch (e) { }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { } }

  const normName = s => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const normPhone = s => toLatin(s || '').replace(/[^0-9]/g, '').slice(-10);
  const normCls = s => toLatin(String(s || '').trim()).toUpperCase().replace(/\s+/g, '');
  const fmtPhone = ph => { ph = String(ph || ''); return bn(ph.length === 10 && ph[0] === '1' ? '0' + ph : ph); };
  const sid = (cls, name, phone) => `${normCls(cls)}|${normPhone(phone)}|${normName(name)}`;
  const isTeacher = () => D.profile && D.profile.role === 'teacher';
  const myProg = () => { const id = D.profile ? D.profile.id : '_'; return (D.progress[id] = D.progress[id] || {}); };

  // ---------------- backend (Google Sheet via Apps Script) ----------------
  const online = () => !!CFG.backendUrl;
  async function api(action, params) {
    if (!online()) return null;
    const u = new URL(CFG.backendUrl);
    u.searchParams.set('action', action);
    Object.entries(params || {}).forEach(([k, v]) => u.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : v));
    const r = await fetch(u.toString(), { method: 'GET', redirect: 'follow' });
    return r.json();
  }
  async function flushPending() {
    if (!online() || !D.pending.length) return;
    const left = [];
    for (const p of D.pending) {
      try { const r = await api('result', p); if (r && r.status === 'removed') { kicked(); return; } }
      catch (e) { left.push(p); }
    }
    D.pending = left; save();
  }

  // ---------------- sound & speech ----------------
  let actx = null;
  function tone(freqs, dur) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.frequency.value = f; o.type = 'triangle';
        g.gain.setValueAtTime(.12, actx.currentTime + i * dur);
        g.gain.exponentialRampToValueAtTime(.001, actx.currentTime + (i + 1) * dur);
        o.connect(g); g.connect(actx.destination);
        o.start(actx.currentTime + i * dur); o.stop(actx.currentTime + (i + 1) * dur);
      });
    } catch (e) { }
  }
  const sndOk = () => tone([660, 880, 1100], .1);
  const sndNo = () => tone([220, 180], .12);
  // ---------------- read aloud ----------------
  // Order: 1) teacher's own recording  2) ready-made voice file (audio/ folder)  3) the phone's Bangla voice
  let bnVoice = null;
  function findVoice() { try { const vs = speechSynthesis.getVoices(); bnVoice = vs.find(v => /^bn[-_]BD/i.test(v.lang)) || vs.find(v => /^bn/i.test(v.lang)) || null; } catch (e) { } }
  try { findVoice(); speechSynthesis.onvoiceschanged = findVoice; } catch (e) { }
  const hasTTS = () => { try { return 'speechSynthesis' in window; } catch (e) { return false; } };
  function plain(html) {
    return String(html || '').replace(/<[^>]+>/g, ' ').replace(/✓/g, ' টিক ').replace(/✗/g, ' ক্রস ')
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}★☆▶◀↺⌫]/gu, ' ').replace(/\s+/g, ' ').trim();
  }
  function hashText(t) { let h = 5381; for (const c of t) h = (Math.imul(h, 33) ^ c.codePointAt(0)) >>> 0; return 'a' + h.toString(36); }
  const REC = {};      // hash -> data URL, the teacher's own voice
  let FILES = {};      // hash -> file name in audio/, ready-made voice
  try { Object.assign(REC, JSON.parse(localStorage.getItem(KEY + '-rec') || '{}')); } catch (e) { }
  function saveRec() { try { localStorage.setItem(KEY + '-rec', JSON.stringify(REC)); } catch (e) { toast('ফোনে জায়গা কম, রেকর্ডটি এই ফোনে রাখা গেল না।'); } }
  try { fetch('audio/index.json').then(r => r.ok ? r.json() : {}).then(j => { FILES = j || {}; }).catch(() => { }); } catch (e) { }
  if (D.autoRead === undefined) D.autoRead = true;
  let player = null;
  function stopAudio() {
    try { speechSynthesis.cancel(); } catch (e) { }
    if (player) { try { player.pause(); } catch (e) { } player = null; }
    document.querySelectorAll('.say.playing').forEach(b => b.classList.remove('playing'));
  }
  function noVoice() { toast(isTeacher() ? 'এই ফোনে বাংলা কণ্ঠ নেই। "সেটআপ" পাতায় উপায় দেখুন।' : 'এই ফোনে পড়ে শোনানো যাচ্ছে না। শিক্ষককে জানাও।'); }
  // text may hold several sentences joined by "¦"; each is played in turn, so each can have its own recording
  let speakRun = 0;
  function speak(text, btn, quiet) {
    const parts = String(text || '').split('¦').map(plain).filter(Boolean);
    if (!parts.length) return;
    stopAudio();
    const run = ++speakRun;
    if (btn) btn.classList.add('playing');
    const end = () => { if (btn) btn.classList.remove('playing'); };
    const next = i => {
      if (run !== speakRun) return end();
      if (i >= parts.length) return end();
      const t = parts[i], h = hashText(t);
      const src = REC[h] || (FILES[h] ? 'audio/' + FILES[h] : null);
      if (src) { player = new Audio(src); player.onended = () => next(i + 1); player.play().catch(end); return; }
      if (!hasTTS()) { end(); if (!quiet) noVoice(); return; }
      try {
        const u = new SpeechSynthesisUtterance(t);
        if (bnVoice) u.voice = bnVoice;
        u.lang = bnVoice ? bnVoice.lang : 'bn-BD'; u.rate = .85;
        let started = false;
        u.onstart = () => { started = true; };
        u.onend = () => next(i + 1);
        u.onerror = () => { end(); if (!started && !quiet) noVoice(); };
        speechSynthesis.speak(u);
        if (!bnVoice) setTimeout(() => { if (!started && run === speakRun) { end(); try { speechSynthesis.cancel(); } catch (e) { } if (!quiet) noVoice(); } }, 2500);
      } catch (e) { end(); if (!quiet) noVoice(); }
    };
    next(0);
  }
  const sayBtn = text => {
    const parts = String(text || '').split('¦').map(plain).filter(Boolean);
    if (!parts.length) return '';
    return `<button class="iconbtn say" data-say="${esc(parts.join('¦'))}" aria-label="শুনি">🔊</button>` + (isTeacher() ? parts.map(recBtn).join('') : '');
  };
  const recBtn = t => `<button class="iconbtn rec" data-rec="${esc(t)}" aria-label="আমার কণ্ঠে রেকর্ড করি" title="${esc(t)}">🎙️${REC[hashText(t)] ? '<small>✓</small>' : ''}</button>`;
  const autoSay = text => { if (D.autoRead !== false) setTimeout(() => speak(text, null, true), 350); };

  // teacher records the text in their own voice
  let recState = null;
  async function toggleRecord(btn) {
    if (recState) { recState.stop(); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { toast('এখানে মাইক্রোফোন চালু করা যাচ্ছে না। ফোনের ব্রাউজারে মাইক্রোফোনের অনুমতি দিন।'); return; }
    stopAudio();
    const t = btn.dataset.rec, h = hashText(t), chunks = [];
    let mr;
    try { mr = new MediaRecorder(stream, { audioBitsPerSecond: 24000 }); } catch (e) { mr = new MediaRecorder(stream); }
    mr.ondataavailable = e => chunks.push(e.data);
    const timer = setTimeout(() => recState && recState.stop(), 15000);
    recState = { stop: () => { clearTimeout(timer); try { mr.stop(); } catch (e) { } } };
    btn.classList.add('recording'); btn.innerHTML = '⏹️ থামাই';
    toast('বলুন... শেষ হলে ⏹️ চাপুন (সর্বোচ্চ ১৫ সেকেন্ড)');
    mr.onstop = () => {
      stream.getTracks().forEach(tr => tr.stop());
      recState = null;
      const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
      const fr = new FileReader();
      fr.onload = () => {
        REC[h] = fr.result; saveRec();
        btn.classList.remove('recording'); btn.innerHTML = '🎙️<small>✓</small>';
        player = new Audio(fr.result); player.play().catch(() => { });
        toast('রেকর্ড রাখা হয়েছে। এখন শিক্ষার্থীরা আপনার কণ্ঠ শুনবে।');
        if (online()) uploadRec(h, fr.result);
      };
      fr.readAsDataURL(blob);
    };
    mr.start();
  }
  function uploadRec(h, data) {
    try { fetch(CFG.backendUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'saveAudio', key: D.teacherKey, h, data }) }); } catch (e) { }
  }
  async function loadRecs(texts) {
    if (!online()) return;
    const hs = [...new Set(texts.map(t => hashText(plain(t))).filter(h => !REC[h]))];
    for (let i = 0; i < hs.length; i += 40) {
      try { const r = await api('audio', { hs: hs.slice(i, i + 40).join(',') }); if (r && r.audio) Object.assign(REC, r.audio); } catch (e) { }
    }
    saveRec();
  }
  function dayTexts(day) {
    const out = [];
    if (day.intro && day.intro.say) out.push(day.intro.say);
    day.acts.forEach(a => { if (a.s) out.push(a.s); out.push(a.q); (a.h || []).forEach(x => out.push(x)); if (a.ex) out.push(a.ex); });
    return out;
  }

  function toast(msg) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = 'show';
    clearTimeout(toast._t); toast._t = setTimeout(() => t.className = '', 2600);
  }
  const PRAISE = ['দারুণ!', 'চমৎকার!', 'খুব ভালো!', 'সাবাশ!', 'অসাধারণ!'];
  const TRY = ['প্রায় হয়েছে! আরেকবার ভাবো।', 'ভুল হলে ভয় নেই। আবার চেষ্টা করো, তুমি পারবে!', 'একটু থেমে ভালো করে দেখো।'];
  const pickR = a => a[Math.floor(Math.random() * a.length)];
  const starStr = n => '★'.repeat(n) + '☆'.repeat(3 - n);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------------- progress & unlocking ----------------
  const chById = id => CH.find(c => c.id === id);
  const dayDone = (c, d) => !!(myProg()[`${c.id}-${d}`] || {}).done;
  const chDone = c => c.days && c.days.every((_, i) => dayDone(c, i));
  function chUnlocked(c) {
    if (!c.days) return false;
    if (isTeacher()) return true;
    for (const b of BUILT) { if (b === c) return true; if (!chDone(b)) return false; }
    return true;
  }
  const dayUnlocked = (c, d) => isTeacher() || (chUnlocked(c) && (d === 0 || dayDone(c, d - 1)));
  const chStars = c => { const p = myProg(); const s = c.days.map((_, i) => (p[`${c.id}-${i}`] || {}).stars || 0); return s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : 0; };

  // ---------------- routing ----------------
  function go(h) { if (location.hash === '#' + h) route(); else location.hash = h; }
  window.addEventListener('hashchange', route);
  function route() {
    stopAudio();
    const h = location.hash.replace('#', '');
    if (!D.profile) return viewLogin();
    let m;
    if (h === 'teacher' && isTeacher()) return viewTeacher();
    if ((m = h.match(/^ch(\d+)-d(\d+)$/))) { const c = chById(+m[1]); if (c && c.days && c.days[+m[2] - 1]) return viewDay(c, +m[2] - 1); }
    if ((m = h.match(/^ch(\d+)$/))) { const c = chById(+m[1]); if (c && c.days) return viewChapter(c); }
    return viewMap();
  }
  function topbar(extra) {
    const p = D.profile;
    return `<div class="topbar">
      <button class="iconbtn" data-go="map" aria-label="গ্রামের পথ">🏡</button>
      <div class="who">${isTeacher() ? '<span class="teacher-tag">শিক্ষক মোড</span>' : `👋 ${esc(p.name)} <span class="small">(${esc(p.cls)})</span>`}</div>
      <span class="spacer"></span>${extra || ''}
      <button class="iconbtn" id="autoread" aria-label="প্রশ্ন নিজে থেকে পড়ে শোনাও" title="প্রশ্ন নিজে থেকে পড়ে শোনাও">${D.autoRead !== false ? '🔊 চালু' : '🔇 বন্ধ'}</button>
      ${isTeacher() ? '<button class="btn small ghost" data-go="teacher">📋 ফলাফল</button>' : ''}
      <button class="btn small ghost" id="logout">বের হই</button></div>`;
  }
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g) { go(g.dataset.go); return; }
    const s = e.target.closest('.say'); if (s) { speak(s.dataset.say, s); return; }
    const rb = e.target.closest('.rec'); if (rb) { toggleRecord(rb); return; }
    const ar = e.target.closest('#autoread'); if (ar) { D.autoRead = D.autoRead === false; save(); ar.textContent = D.autoRead ? '🔊 চালু' : '🔇 বন্ধ'; if (!D.autoRead) stopAudio(); toast(D.autoRead ? 'প্রশ্ন নিজে থেকে পড়ে শোনানো হবে।' : 'নিজে থেকে পড়া বন্ধ। 🔊 চাপলে শোনা যাবে।'); return; }
    if (e.target.closest('#logout')) { D.profile = null; save(); go(''); }
  });

  function kicked() {
    D.profile = null; save();
    go('');
    setTimeout(() => { const m = $('#loginmsg'); if (m) { m.className = 'msg err'; m.textContent = 'তোমাকে এই শ্রেণির তালিকা থেকে সরানো হয়েছে। তোমার শিক্ষকের সাথে কথা বলো।'; m.hidden = false; } }, 50);
  }

  // ---------------- login ----------------
  function viewLogin() {
    app.innerHTML = `
      <div class="hero"><div class="logo">🏡🌳🧮</div><h1>গণিতের গ্রাম</h1><p class="muted">প্রথম শ্রেণির গণিত, খেলতে খেলতে শিখি</p></div>
      <div class="card stack" id="stuform">
        <h2>শিক্ষার্থী</h2>
        <div class="field"><label for="cls">শ্রেণি কোড</label><input id="cls" autocomplete="off" placeholder="যেমন: 1A"></div>
        <div class="field"><label for="nm">নাম</label><input id="nm" autocomplete="name" placeholder="তোমার নাম"></div>
        <div class="field"><label for="ph">ফোন নম্বর (অভিভাবকের)</label><input id="ph" inputmode="tel" autocomplete="off" placeholder="০১৭XXXXXXXX"></div>
        <div id="loginmsg" class="msg err" hidden></div>
        <button class="btn green" id="go">খেলা শুরু করি ▶</button>
        <p class="small muted">শ্রেণি কোড, নাম আর ফোন নম্বর তোমার শিক্ষক দেবেন। শিক্ষক যেভাবে লিখে দিয়েছেন, ঠিক সেভাবে লেখো।</p>
      </div>
      <div class="stack" style="margin-top:16px">
        <button class="linkbtn" id="tshow">আমি শিক্ষক</button>
        <div class="card stack" id="tform" hidden>
          <h3>শিক্ষক প্রবেশ</h3>
          <div class="field"><label for="tc">শিক্ষক কোড</label><input id="tc" type="password" autocomplete="off"></div>
          <div id="tmsg" class="msg err" hidden></div>
          <button class="btn" id="tgo">প্রবেশ করুন</button>
          ${online() ? '' : `<p class="small muted">এটি পরীক্ষামূলক সংস্করণ। শিক্ষক কোড: ${bn(CFG.localTeacherCode)}</p>`}
        </div>
      </div>
      <p class="small muted" style="text-align:center;margin-top:24px">ছবি: Twemoji (CC-BY 4.0) ও এই গেমের জন্য আঁকা মানুষ · ফন্ট: কালপুরুষ · বিষয়বস্তু: প্রথম শ্রেণির গণিত ওয়ার্কশিট</p>`;
    $('#tshow').onclick = () => { $('#tform').hidden = !$('#tform').hidden; };
    const msg = (el, t, cls) => { el.textContent = t; el.className = 'msg ' + (cls || 'err'); el.hidden = false; };
    $('#go').onclick = async () => {
      const cls = $('#cls').value, name = $('#nm').value, phone = $('#ph').value, m = $('#loginmsg');
      if (!normCls(cls) || !normName(name) || normPhone(phone).length < 6) return msg(m, 'শ্রেণি কোড, নাম আর ফোন নম্বর তিনটিই লেখো।');
      const id = sid(cls, name, phone);
      if (online()) {
        msg(m, 'একটু অপেক্ষা করো...', 'info');
        try {
          const r = await api('join', { cls: normCls(cls), name: name.trim(), phone: normPhone(phone) });
          if (!r || r.status === 'notfound') return msg(m, 'এই নামটি শ্রেণির তালিকায় পাওয়া যায়নি। শিক্ষক যেভাবে দিয়েছেন, সেভাবে লেখো।');
          if (r.status === 'removed') return msg(m, 'তোমাকে এই শ্রেণির তালিকা থেকে সরানো হয়েছে। তোমার শিক্ষকের সাথে কথা বলো।');
          const p = (D.progress[id] = D.progress[id] || {});
          Object.entries(r.progress || {}).forEach(([k, v]) => { if (!p[k] || (v.stars || 0) > (p[k].stars || 0)) p[k] = { stars: v.stars, done: true }; });
          D.profile = { role: 'student', id, cls: normCls(cls), name: r.name || name.trim(), phone: normPhone(phone) };
        } catch (e) { return msg(m, 'ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। একটু পরে আবার চেষ্টা করো।'); }
      } else {
        const listed = D.roster.filter(s => !s.sample);
        if (listed.length) {
          const s = D.roster.find(x => x.id === id);
          if (!s) return msg(m, 'এই নামটি শ্রেণির তালিকায় পাওয়া যায়নি। শিক্ষক যেভাবে দিয়েছেন, সেভাবে লেখো।');
          if (s.status === 'removed') return msg(m, 'তোমাকে এই শ্রেণির তালিকা থেকে সরানো হয়েছে। তোমার শিক্ষকের সাথে কথা বলো।');
        }
        D.profile = { role: 'student', id, cls: normCls(cls), name: name.trim(), phone: normPhone(phone) };
      }
      save(); go('map');
    };
    $('#tgo').onclick = async () => {
      const code = toLatin($('#tc').value.trim()), m = $('#tmsg');
      if (online()) {
        try { const r = await api('teacher', { key: code }); if (!r || !r.ok) return msg(m, 'কোডটি ঠিক নয়।'); }
        catch (e) { return msg(m, 'ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না।'); }
      } else if (code !== String(CFG.localTeacherCode)) return msg(m, 'কোডটি ঠিক নয়।');
      D.teacherKey = code; D.profile = { role: 'teacher', id: '_teacher', name: 'শিক্ষক', cls: '' }; save(); go('teacher');
    };
  }

  // ---------------- village map ----------------
  function viewMap() {
    let html = topbar() + `<div class="stack" style="margin-top:14px"><h2>গ্রামের পথ</h2>
      <p class="muted">${isTeacher() ? 'শিক্ষক হিসেবে আপনি যেকোনো অধ্যায় খুলে দেখতে পারবেন।' : 'একটি অধ্যায় শেষ করলে পরের অধ্যায়ের দরজা খুলবে।'}</p><div class="path">`;
    CH.forEach(c => {
      const soon = !c.days, open = chUnlocked(c), done = c.days && chDone(c);
      const cls = soon ? 'soon' : !open ? 'locked' : done ? 'done' : '';
      const badge = soon ? '<span class="small muted">শীঘ্রই</span>' : !open ? '🔒' : done ? `<span class="stars">${starStr(chStars(c))}</span>` : '▶';
      html += `<button class="station ${cls}" data-ch="${c.id}"><span class="num">${bn(c.id)}</span>
        <span class="t"><b>${c.icon} ${esc(c.title)}</b><span class="small muted">${esc(c.sub || '')}${c.days ? ` · ${bn(c.days.length)} দিন` : ''}</span></span>${badge}</button>`;
    });
    app.innerHTML = html + '</div></div>';
    app.querySelectorAll('.station').forEach(b => b.onclick = () => {
      const c = chById(+b.dataset.ch);
      if (!c.days) return toast('এই অধ্যায়টি শীঘ্রই আসছে।');
      if (!chUnlocked(c)) return toast('আগের অধ্যায়টি শেষ করলে এটি খুলবে।');
      go('ch' + c.id);
    });
  }

  // ---------------- chapter page ----------------
  function viewChapter(c) {
    if (!chUnlocked(c)) return go('map');
    const p = myProg();
    let html = topbar() + `<div class="stack" style="margin-top:14px"><div class="dayhead"><div class="ttl"><small>অধ্যায় ${bn(c.id)}</small><h2>${c.icon} ${esc(c.title)}</h2></div></div>
      <p class="muted">প্রতিদিন একটি পাতা। আগের দিনের পাতা যেকোনো সময় আবার খেলা যায়।</p><div class="days">`;
    c.days.forEach((d, i) => {
      const pr = p[`${c.id}-${i}`] || {}, open = dayUnlocked(c, i);
      html += `<button class="daycard ${pr.done ? 'done' : ''} ${open ? '' : 'locked'}" data-d="${i}">
        <span class="d">দিন ${bn(i + 1)} ${open ? '' : '🔒'}</span><b>${esc(d.title)}</b>
        <span class="stars">${pr.done ? starStr(pr.stars || 0) : ''}</span>
        <span class="small muted">${pr.done ? 'আবার খেলো ↺' : open ? 'শুরু করো ▶' : 'আগের দিন শেষ করো'}</span></button>`;
    });
    app.innerHTML = html + '</div></div>';
    app.querySelectorAll('.daycard').forEach(b => b.onclick = () => {
      const i = +b.dataset.d;
      if (!dayUnlocked(c, i)) return toast('আগের দিনের পাতাটি শেষ করো।');
      go(`ch${c.id}-d${i + 1}`);
    });
  }

  // ---------------- material switch & visuals ----------------
  let visFns = [];
  const resolve = v => typeof v === 'function' ? v(D.mat) : (v || '');
  function visSlot(v) { if (typeof v !== 'function') return v || ''; visFns.push(v); return `<div data-vis="${visFns.length - 1}">${v(D.mat)}</div>`; }
  function matBar() {
    return `<div class="mats" role="group" aria-label="উপকরণ">${Object.entries(MATS).map(([k, m]) => `<button data-mat="${k}" class="${D.mat === k ? 'on' : ''}">${m.name}</button>`).join('')}</div>`;
  }
  function wireMats(root, onChange) {
    root.querySelectorAll('[data-mat]').forEach(b => b.onclick = () => {
      D.mat = b.dataset.mat; save();
      root.querySelectorAll('[data-mat]').forEach(x => x.classList.toggle('on', x.dataset.mat === D.mat));
      root.querySelectorAll('[data-vis]').forEach(el => el.innerHTML = visFns[+el.dataset.vis](D.mat));
      onChange && onChange();
    });
  }

  // ---------------- day player ----------------
  let S = null; // current session
  function viewDay(c, d) {
    if (!dayUnlocked(c, d)) return go('ch' + c.id);
    const day = c.days[d];
    loadRecs(dayTexts(day));
    S = { c, d, day, acts: day.acts.slice(), idx: -1, res: [], rem: [], remIdx: -1, phase: 'intro', t0: Date.now() };
    render();
  }
  function dayFrame(inner) {
    const { c, d } = S;
    const prev = d > 0, next = d < c.days.length - 1;
    const total = S.acts.length;
    let dots = '';
    for (let i = 0; i < total; i++) {
      const r = S.res[i];
      dots += `<i class="${i === S.idx && S.phase === 'play' ? 'on' : r ? (r.stars >= 2 ? 'ok' : 'bad') : ''} ${r && r.flag ? 'rem' : ''}"></i>`;
    }
    for (let i = 0; i < S.rem.length; i++) dots += `<i class="${S.phase === 'rem' && i === S.remIdx ? 'on' : (S.rem[i].res ? (S.rem[i].res.stars >= 2 ? 'ok' : 'bad') : '')} rem"></i>`;
    return topbar() + `<div class="stack" style="margin-top:14px">
      <div class="dayhead">
        <button class="iconbtn" ${prev ? `data-go="ch${c.id}-d${d}"` : 'disabled'} aria-label="আগের দিন">◀</button>
        <div class="ttl"><small><a class="link" href="#ch${c.id}">অধ্যায় ${bn(c.id)}: ${esc(c.title)}</a> · দিন ${bn(d + 1)}</small><h2>${esc(S.day.title)}</h2></div>
        <button class="iconbtn" id="nextday" aria-label="পরের দিন" ${next ? '' : 'disabled'}>▶</button>
      </div>
      ${S.phase === 'intro' || S.phase === 'end' ? '' : `<div class="dots" aria-hidden="true">${dots}</div>`}
      ${inner}</div>`;
  }
  function wireDayNav() {
    const nb = $('#nextday'); if (!nb) return;
    nb.onclick = () => {
      const { c, d } = S;
      if (dayUnlocked(c, d + 1)) go(`ch${c.id}-d${d + 2}`);
      else toast('আজকের পাতা শেষ করলে পরের দিন খুলবে।');
    };
  }
  function render() {
    visFns = [];
    if (S.phase === 'intro') {
      const it = S.day.intro || {};
      app.innerHTML = dayFrame(`
        <div class="teach"><div class="face">👩‍🏫</div><div class="bubble stack"><b>আজ আমরা শিখব</b><p>${esc(it.say || '')}</p>${sayBtn(it.say || '')}</div></div>
        ${it.mats ? matBar() : ''}
        ${it.vis ? `<div class="card">${visSlot(it.vis)}</div>` : ''}
        <p class="muted small">আজ ${bn(S.acts.length)}টি কাজ। কঠিন লাগলে 💡 সাহায্য নিও। ভুল হলে আবার চেষ্টা করা যায়।</p>
        <button class="btn green" id="start">শুরু করি ▶</button>`);
      wireDayNav(); wireMats(app);
      $('#start').onclick = () => { S.phase = 'play'; S.idx = 0; render(); };
      autoSay(it.say || '');
      return;
    }
    if (S.phase === 'end') return renderEnd();
    const isRem = S.phase === 'rem';
    const act = isRem ? S.rem[S.remIdx].act : S.acts[S.idx];
    const label = isRem ? `<div class="msg info">🔁 আরেকবার অনুশীলন: আগে যেটি কঠিন লেগেছিল, তার মতো আরেকটি।</div>` : '';
    app.innerHTML = dayFrame(label + '<div id="act"></div>');
    wireDayNav();
    playAct(act, $('#act'), result => {
      if (isRem) { S.rem[S.remIdx].res = result; } else { S.res[S.idx] = result; }
      advance();
    });
  }
  function advance() {
    if (S.phase === 'play') {
      if (S.idx < S.acts.length - 1) { S.idx++; return render(); }
      // remedial round for tasks that needed the answer shown or many tries
      S.rem = S.res.map((r, i) => r.flag ? { i, act: S.acts[i].rem ? S.acts[i].rem() : S.acts[i] } : null).filter(Boolean);
      if (S.rem.length) { S.phase = 'rem'; S.remIdx = 0; return render(); }
      S.phase = 'end'; return render();
    }
    if (S.phase === 'rem') {
      if (S.remIdx < S.rem.length - 1) { S.remIdx++; return render(); }
      S.phase = 'end'; return render();
    }
  }
  function renderEnd() {
    const { c, d } = S;
    const scores = S.res.map(r => r.stars);
    S.rem.forEach(x => { if (x.res && x.res.stars >= 2) scores[x.i] = Math.max(scores[x.i], 2); });
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const stars = avg >= 2.5 ? 3 : avg >= 1.6 ? 2 : 1;
    const first = S.res.filter(r => r.first).length, hints = S.res.reduce((a, r) => a + r.hints, 0);
    const secs = Math.round((Date.now() - S.t0) / 1000);
    const key = `${c.id}-${d}`, p = myProg();
    const old = p[key] || {};
    p[key] = { done: true, stars: Math.max(old.stars || 0, stars), plays: (old.plays || 0) + 1, last: stars };
    if (!isTeacher()) {
      const rec = { id: D.profile.id, cls: D.profile.cls, name: D.profile.name, phone: D.profile.phone, ch: c.id, day: d + 1, stars, first, total: S.res.length, hints, secs, ts: new Date().toISOString() };
      D.results.push(rec);
      if (D.results.length > 3000) D.results = D.results.slice(-3000);
      if (online()) { D.pending.push(rec); flushPending(); }
    }
    save();
    const next = d < c.days.length - 1;
    const chFinished = chDone(c);
    const nextCh = BUILT[BUILT.indexOf(c) + 1];
    const msg = stars === 3 ? 'অসাধারণ! তুমি আজকের সব কাজ খুব ভালো করেছ।' : stars === 2 ? 'খুব ভালো! আরেকবার খেললে আরও তারা পাবে।' : 'তুমি চেষ্টা করেছ, এটাই সবচেয়ে জরুরি! আবার খেলে দেখো, এবার আরও সহজ লাগবে।';
    app.innerHTML = dayFrame(`<div class="card stack summary">
      <div class="big pop">${stars === 3 ? '🏆' : stars === 2 ? '🌟' : '🌱'}</div>
      <div class="stars" style="font-size:2.4rem">${starStr(stars)}</div>
      <div class="row" style="justify-content:center"><p>${msg}</p>${sayBtn(msg)}</div>
      <p class="muted small">প্রথম চেষ্টায় সঠিক: ${bn(first)}/${bn(S.res.length)} · সাহায্য নিয়েছ: ${bn(hints)} বার · সময়: ${bn(Math.max(1, Math.round(secs / 60)))} মিনিট</p>
      ${chFinished && !next ? `<div class="msg ok">🎉 অধ্যায় ${bn(c.id)} শেষ! ${nextCh ? `এবার অধ্যায় ${bn(nextCh.id)} খুলে গেছে।` : ''}</div>` : ''}
      ${isTeacher() ? '<p class="small muted">শিক্ষক মোডে খেলা ফলাফলে যোগ হয় না।</p>' : ''}
    </div>
    <div class="daynav">
      <button class="btn ghost" id="again">↺ আবার খেলি</button>
      ${next ? `<button class="btn green" data-go="ch${c.id}-d${d + 2}">পরের দিন ▶</button>` : nextCh ? `<button class="btn green" data-go="ch${nextCh.id}">পরের অধ্যায় ▶</button>` : `<button class="btn green" data-go="map">গ্রামের পথে ফিরি</button>`}
    </div>`);
    wireDayNav();
    sndOk();
    $('#again').onclick = () => viewDay(c, d);
    autoSay(msg);
  }

  // ---------------- one activity ----------------
  function playAct(act, root, done) {
    const st = { wrong: 0, hints: 0, finished: false };
    const hasMats = act.mats || act.t === 'build';
    const qText = `${act.s ? act.s + '¦' : ''}${act.q}`;
    root.innerHTML = `<div class="card task">
      ${act.s ? `<p class="story">${esc(act.s)}</p>` : ''}
      <div class="q-row"><p class="q">${esc(act.q)}</p>${sayBtn(qText)}</div>
      ${hasMats ? matBar() : ''}
      ${act.vis ? visSlot(act.vis) : ''}
      <div id="body"></div>
      <div id="fb"></div>
      <div class="actions"><button class="btn ghost hintbtn" id="hint">💡 সাহায্য</button><span class="spacer"></span><span id="right"></span></div>
    </div>`;
    const body = $('#body', root), fb = $('#fb', root), right = $('#right', root), hintB = $('#hint', root);
    let onMat = null;
    wireMats(root, () => onMat && onMat());
    const feedback = (kind, icon, html, sayText) => {
      fb.innerHTML = `<div class="feedback ${kind}"><span class="fi">${icon}</span><div style="flex:1;min-width:0">${html}</div>${sayText ? `<span class="row" style="gap:6px;flex-wrap:nowrap">${sayBtn(sayText)}</span>` : ''}</div>`;
      if (sayText) autoSay(sayText);
    };
    autoSay(qText);
    const hints = act.h || [];
    function showHint() {
      if (st.hints >= hints.length) return;
      feedback('hint', '💡', esc(hints[st.hints]), hints[st.hints]);
      st.hints++;
      hintB.classList.remove('glow');
      if (st.hints >= hints.length) hintB.disabled = true;
    }
    hintB.onclick = showHint;
    function finish(stars, flag) {
      st.finished = true; hintB.disabled = true;
      right.innerHTML = `<button class="btn green" id="nextq">পরের কাজ ▶</button>`;
      $('#nextq', root).onclick = () => done({ stars, first: st.wrong === 0 && st.hints === 0, hints: st.hints, flag });
      $('#nextq', root).focus({ preventScroll: true });
    }
    const api = {
      correct() {
        if (st.finished) return;
        const stars = st.wrong === 0 && st.hints === 0 ? 3 : st.wrong + st.hints <= 2 ? 2 : 1;
        sndOk();
        const pr = pickR(PRAISE);
        feedback('good', '🎉', `<b>${pr}</b> ${act.ex ? esc(act.ex) : ''}`, act.ex ? pr + '¦' + act.ex : pr);
        finish(stars, st.wrong >= 2);
      },
      wrong(extra) {
        if (st.finished) return;
        st.wrong++; sndNo();
        if (st.wrong >= 3) {
          api.reveal && api.reveal();
          feedback('show', '👀', `<b>দেখো কীভাবে হয়:</b> ${esc(act.ex || '')}<br><span class="small muted">একটু পরে এর মতো আরেকটি কাজ আবার আসবে।</span>`, act.ex);
          finish(0, true);
        } else if (st.wrong === 2 && st.hints < hints.length) {
          feedback('hint', '💡', (extra ? esc(extra) + '<br>' : '') + esc(hints[st.hints]), (extra ? extra + '¦' : '') + hints[st.hints]);
          st.hints++; if (st.hints >= hints.length) hintB.disabled = true;
        } else {
          const tm = extra || pickR(TRY);
          feedback('try', '🤔', esc(tm), tm);
          if (st.hints < hints.length) hintB.classList.add('glow');
        }
      },
      info(t) { feedback('hint', '💡', esc(t), t); },
      reveal: null,
      setMat(fn) { onMat = fn; }
    };
    ENGINES[act.t](act, body, api, right);
  }

  // ---------------- engines ----------------
  const ENGINES = {
    pick(act, body, api) {
      const opts = shuffle(act.opts);
      const cols = act.cols ? `c${act.cols}` : opts.length === 3 ? 'c3' : '';
      body.innerHTML = `<div class="opts ${cols}">${opts.map((o, i) => `<button class="opt" data-i="${i}">${visSlot(o.v)}${o.lbl ? `<span class="lbl">${esc(o.lbl)}</span>` : ''}</button>`).join('')}</div>`;
      const btns = [...body.querySelectorAll('.opt')];
      api.reveal = () => btns.forEach((b, i) => { if (opts[i].ok) b.classList.add('showme'); });
      btns.forEach((b, i) => b.onclick = () => {
        if (b.disabled || body.dataset.done) return;
        if (opts[i].ok) { b.classList.add('right', 'pop'); body.dataset.done = 1; api.correct(); }
        else { b.classList.add('wrong', 'shake'); b.disabled = true; api.wrong(); }
      });
    },
    scene(act, body, api) {
      body.innerHTML = `<div class="scene ${act.bg === 'room' ? 'room' : ''}">${act.items.map((it, i) => it.deco
        ? `<span class="it deco" style="left:${it.x}%;top:${it.y}%;font-size:${it.sz}px">${it.e}</span>${it.tag ? `<span class="tag" style="left:${it.x}%;top:${Math.min(it.y, 92)}%">${esc(it.tag)}</span>` : ''}`
        : `<button class="it pick" data-i="${i}" style="left:${it.x}%;top:${it.y}%;font-size:${it.sz}px" aria-label="ছবি ${bn(i)}">${it.e}</button>`).join('')}</div>`;
      const btns = [...body.querySelectorAll('button.it')];
      api.reveal = () => btns.forEach(b => { if (act.items[+b.dataset.i].ok) b.classList.add('showme'); });
      btns.forEach(b => b.onclick = () => {
        if (b.disabled || body.dataset.done) return;
        const it = act.items[+b.dataset.i];
        if (it.ok) { b.classList.add('right'); body.dataset.done = 1; api.correct(); }
        else { b.classList.add('wrong', 'shake'); b.disabled = true; api.wrong(); }
      });
    },
    fill(act, body, api, right) { fillUI(act, body, api, right); },
    build(act, body, api, right) {
      let t = 0, o = 0; const n = act.n;
      const draw = () => {
        const m = MATS[D.mat] || MATS.sticks;
        body.innerHTML = `<div class="card" style="background:#fbf7f1">${pv(t, o, D.mat)}</div>
          <table class="pvtable"><tr><th>দশক</th><th>একক</th><th>সংখ্যা</th></tr><tr><td>${bn(t)}</td><td>${bn(o)}</td><td>${o < 10 ? bn(t * 10 + o) : '?'}</td></tr></table>
          ${o >= 10 ? `<div class="msg info row">১০টি ${m.oneName} হয়েছে! ১০টি একসাথে করে ১টি দশ বানাও। <button class="btn small" id="tie">১০টি এক → ১টি দশ</button></div>` : ''}
          <div class="ctrls">
            <div class="col"><span>${m.tenName} (দশ)</span><div class="row"><button class="iconbtn" id="t-">−</button><button class="btn small" id="t+">+ দশ</button></div></div>
            <div class="col"><span>${m.oneName} (এক)</span><div class="row"><button class="iconbtn" id="o-">−</button><button class="btn small" id="o+">+ এক</button></div></div>
          </div>`;
        const on = (id, f) => { const el = body.querySelector(`[id="${id}"]`); if (el) el.onclick = () => { if (body.dataset.done) return; f(); draw(); }; };
        on('t+', () => { if (t < 9) t++; }); on('t-', () => { if (t > 0) t--; });
        on('o+', () => { if (o < 19) o++; }); on('o-', () => { if (o > 0) o--; });
        on('tie', () => { if (o >= 10) { o -= 10; t++; } });
      };
      draw(); api.setMat(draw);
      right.innerHTML = `<button class="btn" id="chk">দেখি ✔</button>`;
      api.reveal = () => { t = Math.floor(n / 10); o = n % 10; draw(); right.innerHTML = ''; };
      right.querySelector('#chk').onclick = () => {
        if (body.dataset.done) return;
        const tot = t * 10 + o;
        if (tot === n && o < 10) { body.dataset.done = 1; right.innerHTML = ''; api.correct(); }
        else if (tot === n) api.info('মোট ঠিক আছে! এখন ১০টি এক একসাথে করে ১টি দশ বানাও।');
        else api.wrong(`তুমি বানিয়েছ ${bn(tot)}। এটি ${bn(n)} এর চেয়ে ${tot > n ? 'বেশি' : 'কম'}।`);
      };
    },
    bundle(act, body, api, right) {
      const n = act.n; let loose = n, band = 0, bundled = 0;
      const draw = () => {
        body.innerHTML = `<div class="bundles" aria-label="আঁটি">${window.V.bundle(80).repeat(bundled) || '<span class="muted small">এখানে আঁটি জমা হবে</span>'}</div>
          <div class="row" style="justify-content:center"><div class="band" aria-label="লাল ফিতা">${band ? Array.from({ length: band }, (_, i) => `<button data-b="${i}" style="border:0;background:none;padding:0">${window.V.stick(70)}</button>`).join('') : '<span class="muted small">লাল ফিতা</span>'}</div><b>${bn(band)}/১০</b></div>
          <div class="tray">${Array.from({ length: loose }, (_, i) => `<button data-l="${i}" aria-label="কাঠি">${window.V.stick(70)}</button>`).join('')}</div>`;
        body.querySelectorAll('[data-l]').forEach(b => b.onclick = () => {
          loose--; band++;
          if (band === 10) { band = 0; bundled++; tone([520, 780], .08); }
          if (bundled === Math.floor(n / 10)) return stage2();
          draw();
        });
        body.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { band--; loose++; draw(); });
      };
      const stage2 = () => {
        api.info(`চমৎকার! ${bn(bundled)}টি আঁটি বাঁধা হয়েছে। এবার গুনে লেখো।`);
        const wrap = document.createElement('div');
        body.innerHTML = `<div class="card" style="background:#fbf7f1">${pv(Math.floor(n / 10), n % 10, 'sticks')}</div>`;
        body.appendChild(wrap);
        fillUI(act, wrap, api, right);
      };
      if (n < 10) return stage2();
      draw();
    },
    order(act, body, api) {
      const sorted = [...act.nums].sort((a, b) => act.dir === 'asc' ? a - b : b - a);
      const cards = shuffle(act.nums); let placed = 0;
      body.innerHTML = `<div class="slots">${sorted.map((_, i) => `<span class="slot" data-s="${i}"></span>`).join('')}</div>
        <p class="small muted" style="text-align:center">${act.dir === 'asc' ? 'ছোটো → বড়ো' : 'বড়ো → ছোটো'}</p>
        <div class="cards">${cards.map((n, i) => `<button class="ncard" data-c="${i}">${bn(n)}</button>`).join('')}</div>`;
      const place = (n) => { const s = body.querySelector(`[data-s="${placed}"]`); s.textContent = bn(n); s.classList.add('filled', 'pop'); placed++; };
      api.reveal = () => { while (placed < sorted.length) { const n = sorted[placed]; body.querySelectorAll('.ncard').forEach(b => { if (+cards[+b.dataset.c] === n) b.classList.add('used'); }); place(n); } };
      body.querySelectorAll('.ncard').forEach(b => b.onclick = () => {
        if (body.dataset.done || b.classList.contains('used')) return;
        const n = cards[+b.dataset.c];
        if (n === sorted[placed]) {
          b.classList.add('used'); place(n);
          if (placed === sorted.length) { body.dataset.done = 1; api.correct(); }
        } else { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); api.wrong(`${bn(n)} এখন বসবে না। বাকি সংখ্যাগুলোর মধ্যে ${act.dir === 'asc' ? 'সবচেয়ে ছোটো' : 'সবচেয়ে বড়ো'}টি খোঁজো।`); }
      });
    }
  };

  function fillUI(act, body, api, right) {
    const blanks = []; let active = 0;
    body.innerHTML = `<div class="fill">${act.parts.map(p => typeof p === 'object' ? `<button class="blank" data-k="${blanks.push({ a: p.a, v: '' }) - 1}" aria-label="খালি ঘর"></button>` : `<span>${esc(p)}</span>`).join('')}</div>
      <div class="numpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => `<button data-n="${n}">${bn(n)}</button>`).join('')}<button class="del" data-n="del" style="grid-column:span 5">⌫ মুছি</button></div>`;
    const els = [...body.querySelectorAll('.blank')];
    const paint = () => els.forEach((e, i) => { e.textContent = bn(blanks[i].v); e.classList.toggle('active', i === active && !body.dataset.done); });
    els.forEach((e, i) => e.onclick = () => { active = i; paint(); });
    body.querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
      if (body.dataset.done) return;
      const bl = blanks[active], el = els[active];
      el.classList.remove('wrong');
      if (b.dataset.n === 'del') bl.v = bl.v.slice(0, -1);
      else if (bl.v.length < 3) bl.v += b.dataset.n;
      paint();
    });
    paint();
    right.innerHTML = `<button class="btn" id="chk">দেখি ✔</button>`;
    api.reveal = () => { blanks.forEach((b, i) => { b.v = String(b.a); els[i].classList.add('right'); }); body.dataset.done = 1; paint(); right.innerHTML = ''; };
    right.querySelector('#chk').onclick = () => {
      if (body.dataset.done) return;
      const emptyI = blanks.findIndex(b => b.v === '');
      if (emptyI >= 0) { active = emptyI; paint(); api.info('সব খালি ঘর পূরণ করো, তারপর দেখি চাপো।'); return; }
      let allOk = true, firstBad = -1;
      blanks.forEach((b, i) => { const ok = +b.v === b.a; els[i].classList.toggle('right', ok); els[i].classList.toggle('wrong', !ok); if (!ok) { allOk = false; if (firstBad < 0) firstBad = i; } });
      if (allOk) { body.dataset.done = 1; paint(); right.innerHTML = ''; api.correct(); }
      else { active = firstBad; paint(); api.wrong('লাল ঘরটি আবার দেখো।'); }
    };
  }

  // ---------------- teacher ----------------
  let TV = { tab: 'students', data: null, cls: '', sel: null, confirm: null, msg: '' };
  async function loadTeacherData() {
    if (online()) {
      try { const r = await api('list', { key: D.teacherKey }); if (r && r.ok) { TV.data = { students: r.students, results: r.results }; return; } TV.msg = 'তথ্য আনা যায়নি। শিক্ষক কোড আবার দিন।'; }
      catch (e) { TV.msg = 'ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না।'; }
      TV.data = { students: [], results: [] };
    } else TV.data = { students: D.roster, results: D.results };
  }
  async function viewTeacher() {
    app.innerHTML = topbar() + '<p class="muted" style="margin-top:14px">তথ্য আনা হচ্ছে...</p>';
    await loadTeacherData();
    drawTeacher();
  }
  function drawTeacher() {
    const { students, results } = TV.data;
    const classes = [...new Set(students.map(s => s.cls))].sort();
    const inCls = s => !TV.cls || s.cls === TV.cls;
    let body = '';
    if (TV.tab === 'students') {
      const list = students.filter(inCls);
      body = `<div class="card stack"><h3>শিক্ষার্থী যোগ করুন</h3>
        <p class="small muted">যাদের নাম এই তালিকায় থাকবে, শুধু তারাই খেলায় ঢুকতে পারবে। শিক্ষার্থীকে ঠিক এই শ্রেণি কোড, নাম আর ফোন নম্বর দিন।</p>
        <div class="addform">
          <div class="field"><label for="a-cls">শ্রেণি কোড</label><input id="a-cls" value="${esc(TV.cls || classes[0] || '')}" placeholder="1A"></div>
          <div class="field"><label for="a-nm">নাম</label><input id="a-nm"></div>
          <div class="field"><label for="a-ph">ফোন নম্বর</label><input id="a-ph" inputmode="tel"></div>
          <button class="btn green" id="add">যোগ করুন</button>
        </div><div id="amsg" class="msg err" hidden></div></div>
        <div class="tablewrap"><table class="data"><tr><th>নাম</th><th>শ্রেণি</th><th>ফোন</th><th>অবস্থা</th><th></th></tr>
        ${list.length ? list.map(s => `<tr class="${s.status === 'removed' ? 'blocked' : ''}"><td>${esc(s.name)}${s.sample ? ' <span class="pill off">নমুনা</span>' : ''}</td><td>${esc(s.cls)}</td><td>${fmtPhone(s.phone)}</td>
          <td>${s.status === 'removed' ? '<span class="pill low">সরানো হয়েছে</span>' : '<span class="pill good">সক্রিয়</span>'}</td>
          <td>${TV.confirm === s.id ? `<span class="row"><button class="btn small red" data-rm="${esc(s.id)}">হ্যাঁ, সরান</button><button class="btn small ghost" data-cancel="1">না</button></span>`
            : s.status === 'removed' ? `<button class="btn small ghost" data-restore="${esc(s.id)}">ফিরিয়ে আনুন</button>` : `<button class="btn small ghost" data-ask="${esc(s.id)}">সরিয়ে দিন</button>`}</td></tr>`).join('')
          : `<tr><td colspan="5" class="muted">এখনো কোনো শিক্ষার্থী যোগ করা হয়নি। উপরের ঘরে প্রথম শিক্ষার্থীর তথ্য লিখে "যোগ করুন" চাপুন।</td></tr>`}
        </table></div>
        <p class="small muted">সরিয়ে দিলে সেই শিক্ষার্থী আর ঢুকতে পারবে না, আর ফলাফলের তালিকায় দেখাবে না। চাইলে পরে ফিরিয়ে আনা যায়।</p>`;
    } else if (TV.tab === 'results') {
      const active = students.filter(s => s.status !== 'removed' && inCls(s));
      const by = {};
      results.forEach(r => { (by[r.id] = by[r.id] || []).push(r); });
      const best = rs => { const m = {}; (rs || []).forEach(r => { const k = `${r.ch}-${r.day}`; m[k] = m[k] || { best: 0, plays: 0, last: null }; m[k].best = Math.max(m[k].best, +r.stars); m[k].plays++; m[k].last = r; }); return m; };
      const need = [];
      const rows = active.map(s => {
        const m = best(by[s.id]);
        Object.entries(m).forEach(([k, v]) => { if (v.last && +v.last.stars <= 1) need.push({ s, k, v }); });
        const last = (by[s.id] || []).map(r => r.ts).sort().pop();
        return `<tr data-sel="${esc(s.id)}" style="cursor:pointer"><td>${esc(s.name)}</td><td>${esc(s.cls)}</td>${BUILT.map(c => {
          const ds = c.days.map((_, i) => m[`${c.id}-${i + 1}`]).filter(Boolean);
          const avg = ds.length ? ds.reduce((a, v) => a + v.best, 0) / ds.length : 0;
          return `<td>${ds.length ? `<span class="pill ${avg >= 2.5 ? 'good' : avg >= 1.6 ? 'mid' : 'low'}">${bn(ds.length)}/${bn(c.days.length)} দিন · ${bn(avg.toFixed(1))}★</span>` : '<span class="pill off">শুরু করেনি</span>'}</td>`;
        }).join('')}<td>${last ? bn(new Date(last).toLocaleDateString('en-GB')) : '-'}</td></tr>`;
      }).join('');
      let detail = '';
      if (TV.sel) {
        const s = students.find(x => x.id === TV.sel);
        const rs = (by[TV.sel] || []).slice().sort((a, b) => a.ts < b.ts ? 1 : -1);
        if (s) detail = `<div class="card stack"><div class="row"><h3>${esc(s.name)} (${esc(s.cls)})</h3><span class="spacer"></span><button class="btn small ghost" data-close="1">বন্ধ করুন</button></div>
          <div class="tablewrap"><table class="data"><tr><th>তারিখ</th><th>অধ্যায়</th><th>দিন</th><th>তারা</th><th>প্রথম চেষ্টায় সঠিক</th><th>সাহায্য</th><th>সময়</th></tr>
          ${rs.length ? rs.map(r => `<tr><td>${bn(new Date(r.ts).toLocaleDateString('en-GB'))}</td><td>${bn(r.ch)}</td><td>${bn(r.day)}</td><td class="stars">${starStr(+r.stars)}</td><td>${bn(r.first)}/${bn(r.total)}</td><td>${bn(r.hints)}</td><td>${bn(Math.max(1, Math.round(r.secs / 60)))} মি.</td></tr>`).join('') : '<tr><td colspan="7" class="muted">এখনো খেলেনি।</td></tr>'}
          </table></div></div>`;
      }
      body = `${detail}
        <div class="card stack"><h3>কাদের সাহায্য দরকার</h3>
        ${need.length ? `<p class="small muted">শেষবার খেলায় ১ তারা পেয়েছে। এই দিনের পাতাটি পাশে বসে আবার খেলতে বলুন।</p><ul>${need.map(x => { const [c, d] = x.k.split('-'); const ch = chById(+c); return `<li>${esc(x.s.name)}: অধ্যায় ${bn(c)} (${esc(ch ? ch.title : '')}), দিন ${bn(d)}</li>`; }).join('')}</ul>` : '<p class="muted">এখন কারও জন্য আলাদা সাহায্যের তালিকা নেই।</p>'}</div>
        <div class="tablewrap"><table class="data"><tr><th>নাম</th><th>শ্রেণি</th>${BUILT.map(c => `<th>অধ্যায় ${bn(c.id)}</th>`).join('')}<th>শেষ খেলা</th></tr>
        ${rows || `<tr><td colspan="${3 + BUILT.length}" class="muted">এখনো কোনো ফলাফল নেই।</td></tr>`}</table></div>
        <p class="small muted">কোনো নামের উপর চাপ দিলে প্রতিদিনের বিস্তারিত দেখা যাবে।</p>`;
    } else {
      body = `<div class="card stack"><h3>ফলাফল কোথায় জমা হয়</h3>
        ${online() ? '<div class="msg ok">গুগল শিটের সাথে যুক্ত আছে। সব শিক্ষার্থীর ফলাফল আপনার শিটে জমা হচ্ছে, আর শুধু আপনি তা দেখতে পারবেন।</div>'
          : '<div class="msg info">এটি পরীক্ষামূলক সংস্করণ। এখন তালিকা আর ফলাফল শুধু এই ফোন বা কম্পিউটারেই থাকছে। গুগল শিট যুক্ত করলে সব শিক্ষার্থীর ফলাফল আপনার নিজের ফোনে দেখতে পাবেন।</div>'}
        </div>
        <div class="card stack"><h3>🔊 পড়ে শোনানো</h3>
        <p>যারা এখনো পড়তে পারে না, তাদের জন্য প্রতিটি প্রশ্ন, সাহায্য আর ব্যাখ্যার পাশে 🔊 আছে। প্রশ্ন এলে নিজে থেকেও পড়ে শোনায় (উপরের 🔊 চালু/বন্ধ বোতাম)।</p>
        <p><b>১. আপনার নিজের কণ্ঠ (সবচেয়ে ভালো):</b> শিক্ষক মোডে প্রতিটি 🔊 এর পাশে 🎙️ আছে। চাপুন, পড়ুন, ⏹️ চাপুন। গুগল শিট যুক্ত থাকলে সব শিক্ষার্থী আপনার কণ্ঠ শুনবে। এই ফোনে রেকর্ড আছে: ${bn(Object.keys(REC).length)}টি।
        ${Object.keys(REC).length ? '<button class="btn small ghost" id="clearrec">এই ফোনের রেকর্ড মুছুন</button>' : ''}</p>
        <p><b>২. ফোনের বাংলা কণ্ঠ:</b> রেকর্ড না থাকলে ফোন নিজে পড়ে শোনায়। এই ফোনে বাংলা কণ্ঠ: ${bnVoice ? '<span class="pill good">আছে</span>' : '<span class="pill mid">খুঁজে পাওয়া যায়নি</span>'} <button class="btn small ghost" id="testvoice">শুনে দেখি</button></p>
        <p class="small muted">অ্যান্ড্রয়েড ফোনে বাংলা কণ্ঠ চালু করতে: Settings (সেটিংস) → "Text-to-speech" খুঁজুন → Preferred engine: Speech Services by Google → ⚙️ → Install voice data → বাংলা (বাংলাদেশ) নামিয়ে নিন। তারপর ব্রাউজার বন্ধ করে আবার খুলুন।</p>
        </div><div class="card stack"><h3>পরীক্ষা করে দেখুন</h3>
        <p>গেমটি পরীক্ষা করতে "গ্রামের পথ" থেকে যেকোনো অধ্যায় খুলে খেলুন। শিক্ষক মোডে সব অধ্যায় আর সব দিন খোলা থাকে।</p>
        ${online() ? '' : `<div class="row"><button class="btn small ghost" id="sample">নমুনা তথ্য দেখান</button><button class="btn small ghost" id="clearsample">নমুনা মুছুন</button></div>
        <p class="small muted">নমুনা তথ্য দিয়ে দেখতে পারবেন ফলাফলের পাতা কেমন দেখায়। নমুনা নামের পাশে "নমুনা" লেখা থাকে।</p>`}</div>`;
    }
    app.innerHTML = topbar() + `<div class="stack" style="margin-top:14px">
      <h2>📋 শিক্ষকের পাতা</h2>
      ${TV.msg ? `<div class="msg err">${esc(TV.msg)}</div>` : ''}
      <div class="row"><div class="tabs">
        <button data-tab="students" class="${TV.tab === 'students' ? 'on' : ''}">শিক্ষার্থী তালিকা</button>
        <button data-tab="results" class="${TV.tab === 'results' ? 'on' : ''}">ফলাফল</button>
        <button data-tab="setup" class="${TV.tab === 'setup' ? 'on' : ''}">সেটআপ</button></div>
        <span class="spacer"></span>
        ${classes.length > 1 ? `<label class="small" for="clsf">শ্রেণি</label><select id="clsf" class="iconbtn"><option value="">সব</option>${classes.map(c => `<option ${c === TV.cls ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>` : ''}
      </div>${body}</div>`;
    TV.msg = '';
    app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { TV.tab = b.dataset.tab; TV.sel = null; drawTeacher(); });
    const cf = $('#clsf'); if (cf) cf.onchange = () => { TV.cls = cf.value; drawTeacher(); };
    app.querySelectorAll('[data-ask]').forEach(b => b.onclick = () => { TV.confirm = b.dataset.ask; drawTeacher(); });
    app.querySelectorAll('[data-cancel]').forEach(b => b.onclick = () => { TV.confirm = null; drawTeacher(); });
    app.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => setStatus(b.dataset.rm, 'removed'));
    app.querySelectorAll('[data-restore]').forEach(b => b.onclick = () => setStatus(b.dataset.restore, 'active'));
    app.querySelectorAll('[data-sel]').forEach(b => b.onclick = () => { TV.sel = b.dataset.sel; drawTeacher(); window.scrollTo(0, 0); });
    app.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { TV.sel = null; drawTeacher(); });
    const add = $('#add');
    if (add) add.onclick = async () => {
      const cls = $('#a-cls').value, name = $('#a-nm').value, phone = $('#a-ph').value, m = $('#amsg');
      if (!normCls(cls) || !normName(name) || normPhone(phone).length < 6) { m.textContent = 'শ্রেণি কোড, নাম আর ফোন নম্বর তিনটিই লিখুন।'; m.hidden = false; return; }
      const s = { id: sid(cls, name, phone), cls: normCls(cls), name: name.trim(), phone: normPhone(phone), status: 'active', added: new Date().toISOString() };
      if (online()) {
        try { const r = await api('add', { key: D.teacherKey, cls: s.cls, name: s.name, phone: s.phone }); if (!r || !r.ok) { m.textContent = (r && r.error) || 'যোগ করা যায়নি।'; m.hidden = false; return; } }
        catch (e) { m.textContent = 'ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না।'; m.hidden = false; return; }
        await loadTeacherData();
      } else {
        if (D.roster.some(x => x.id === s.id)) { m.textContent = 'এই শিক্ষার্থী আগেই তালিকায় আছে।'; m.hidden = false; return; }
        D.roster.push(s); save();
      }
      TV.cls = s.cls; drawTeacher(); toast(`${s.name} যোগ হয়েছে।`);
    };
    const tv = $('#testvoice'); if (tv) tv.onclick = () => speak('আমি বাংলায় পড়ে শোনাতে পারি। দশটি কাঠি একসাথে বাঁধলে এক দশক হয়।', tv);
    const cr = $('#clearrec'); if (cr) cr.onclick = () => { Object.keys(REC).forEach(k => delete REC[k]); saveRec(); drawTeacher(); toast('এই ফোনের রেকর্ড মুছে ফেলা হয়েছে।'); };
    const smp = $('#sample'); if (smp) smp.onclick = () => { addSample(); TV.tab = 'results'; drawTeacher(); };
    const csm = $('#clearsample'); if (csm) csm.onclick = () => { D.roster = D.roster.filter(s => !s.sample); D.results = D.results.filter(r => !r.sample); save(); TV.data = { students: D.roster, results: D.results }; drawTeacher(); toast('নমুনা তথ্য মুছে ফেলা হয়েছে।'); };
  }
  async function setStatus(id, status) {
    TV.confirm = null;
    if (online()) {
      try { const r = await api(status === 'removed' ? 'remove' : 'restore', { key: D.teacherKey, id }); if (!r || !r.ok) TV.msg = 'পরিবর্তন করা যায়নি।'; }
      catch (e) { TV.msg = 'ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না।'; }
      await loadTeacherData();
    } else { const s = D.roster.find(x => x.id === id); if (s) s.status = status; save(); }
    drawTeacher();
    toast(status === 'removed' ? 'শিক্ষার্থীকে সরিয়ে দেওয়া হয়েছে।' : 'শিক্ষার্থীকে ফিরিয়ে আনা হয়েছে।');
  }
  function addSample() {
    if (D.roster.some(s => s.sample)) return;
    const people = [['রাফি', '01711000001', [3, 3, 2, 3, 3, 2, 1]], ['মিনা', '01711000002', [2, 3, 3, 3, 2]], ['ইলা', '01711000003', [1, 2]]];
    const now = Date.now();
    people.forEach(([name, phone, stars], pi) => {
      const s = { id: sid('1A', name, phone), cls: '1A', name, phone, status: 'active', sample: true, added: new Date().toISOString() };
      D.roster.push(s);
      stars.forEach((st, i) => {
        const ch = i < 5 ? 1 : 10, day = i < 5 ? i + 1 : i - 4;
        D.results.push({ id: s.id, cls: '1A', name, phone, ch, day, stars: st, first: st * 2, total: 6, hints: 3 - st, secs: 300 + pi * 60, ts: new Date(now - (stars.length - i) * 864e5).toISOString(), sample: true });
      });
    });
    save(); TV.data = { students: D.roster, results: D.results };
  }

  // ---------------- start ----------------
  if (D.profile && D.profile.role === 'student' && online()) {
    api('join', { cls: D.profile.cls, name: D.profile.name, phone: D.profile.phone }).then(r => { if (r && (r.status === 'removed' || r.status === 'notfound')) kicked(); }).catch(() => { });
    flushPending();
  }
  // Boot. Inside the Claude viewer, let it restart the page cleanly when a new version is published.
  try { window.claude && window.claude.hot && window.claude.hot.snapshot && window.claude.hot.snapshot(() => ({ h: location.hash })); } catch (e) { }
  if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(() => route()); else route();
})();
