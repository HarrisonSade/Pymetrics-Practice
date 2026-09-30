/* Suited practice — views, test engine, scoring, dashboard. Mounts into a container. */
window.Suited = window.Suited || {};

(function (S) {
  const { esc, shuffle } = S.util;

  // ---------------------------------------------------------------------------
  // Persistence (per-browser only)
  // ---------------------------------------------------------------------------
  const KEY = 'suitedPractice.v1';
  const DEFAULT_SETTINGS = { pace: 'realistic', penalty: 1, includeIB: false };
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        return { settings: Object.assign({}, DEFAULT_SETTINGS, d.settings), history: d.history || [], blitz: d.blitz || [] };
      }
    } catch (e) { /* storage unavailable */ }
    return { settings: Object.assign({}, DEFAULT_SETTINGS), history: [], blitz: [] };
  }
  const store = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------------------
  // Section definitions
  // ---------------------------------------------------------------------------
  const PACE = {
    relaxed: { label: 'Relaxed', s1: 12, s2: 15, s3: 45 },
    realistic: { label: 'Realistic', s1: 8, s2: 10, s3: 30 },
    brutal: { label: 'Brutal', s1: 5, s2: 7, s3: 20 },
  };

  const SECTIONS = {
    s1: {
      name: 'Same or Different', tag: 'Checking', cognitive: true, count: 20,
      intro: 'Two short strings of characters are shown. Decide whether they are exactly the <b>same</b> or <b>different</b>. Differences are subtle: one letter, a change of case, a swapped symbol or two characters in the wrong order.',
      keys: '<kbd>S</kbd> Same · <kbd>D</kbd> Different · <kbd>→</kbd> Skip',
      example: () => '<div class="pair small"><span class="mono">kjl3@a^</span><span class="colon">:</span><span class="mono">k<mark>J</mark>l3@a^</span></div><p class="muted">Answer: <b>Different</b> (lower-case <code>j</code> vs upper-case <code>J</code>).</p>',
    },
    s2: {
      name: 'Match the String', tag: 'Checking', cognitive: true, count: 20,
      intro: 'A target string is shown with four options below it. Tick <b>every</b> option that matches the target <b>exactly</b>. Zero, one or two options may match. Submit with nothing ticked if none match.',
      keys: '<kbd>1</kbd>–<kbd>4</kbd> Tick / untick · <kbd>Enter</kbd> Submit · <kbd>→</kbd> Skip',
      example: () => '<p class="mono center big">aeFD#v^lp</p><ul class="ex-list mono"><li>aeFD#v^<mark>L</mark>p ✗</li><li>aeFD#<mark>V</mark>^lp ✗</li><li>aeFD#v^lp ✓</li><li>ae<mark>DF</mark>#v^lp ✗</li></ul>',
    },
    s3: {
      name: 'Logical Reasoning', tag: 'Logic & numbers', cognitive: true, count: 20,
      intro: 'A mix of number series, if-then logic, syllogisms, short numerical problems, letter codes and shape patterns. The questions get harder as you go.',
      keys: '<kbd>1</kbd>–<kbd>4</kbd> Choose · <kbd>→</kbd> Skip',
      example: () => '<blockquote>If Sam has been to the White House, then Sam has been to Washington DC.</blockquote><p>"If Sam has not been to Washington DC, then Sam has not been to the White House." → <b>True</b> (contrapositive).</p>',
    },
    s4a: {
      name: 'Personality', tag: 'Behavioural', cognitive: false,
      intro: 'Rate how well each statement describes you. There are no right or wrong answers, but your profile is compared with the traits banks look for, and <b>the same trait is asked more than once</b> to check that your answers are consistent.',
      keys: '<kbd>1</kbd> Very much like me … <kbd>5</kbd> Not like me at all',
      example: () => '<p>"During discussions, I usually lead most of the conversation."</p><p class="muted">Traits: assertiveness and dominance. For junior roles, aim for moderate. Employers want to know you can take direction.</p>',
    },
    s4b: {
      name: 'Situational Judgement', tag: 'Behavioural', cognitive: false, count: 12,
      intro: 'Workplace scenarios in a banking setting. Pick the <b>best</b> response. Scoring: best +2, acceptable +1, poor −1, worst −2.',
      keys: '<kbd>1</kbd>–<kbd>4</kbd> Choose',
      example: () => '<p>"A teammate disagrees with your approach and it is causing tension."</p><p class="muted">Best: talk to them directly and find a compromise. Worst: avoid them.</p>',
    },
    s5: {
      name: 'IB Judgement Add-on', tag: 'Supplementary', cognitive: false, count: 8,
      intro: 'Optional banking-specific scenarios: prioritisation, inside information, conflicts of interest and client handling. Some banks add questions like these, but they are not guaranteed to appear.',
      keys: '<kbd>1</kbd>–<kbd>4</kbd> Choose',
      example: () => '<p class="muted">Same format and scoring as Situational Judgement.</p>',
    },
  };

  const LIKERT = ['Very much like me', 'Like me', 'Somewhat like me', 'Not like me', 'Not like me at all']; // value = 5 - index

  function buildSection(id, opts) {
    const st = store.settings;
    const pace = opts.pace || st.pace;
    let items;
    const n = opts.count || SECTIONS[id].count;
    if (id === 's1') items = Array.from({ length: n }, () => S.genSameDiff(pace));
    else if (id === 's2') items = Array.from({ length: n }, () => S.genMatch(pace));
    else if (id === 's3') items = S.genLogicSet(n, opts.kind);
    else if (id === 's4a') items = shuffle(S.PERSONALITY).map((p) => Object.assign({ section: 's4a' }, p));
    else {
      const bank = id === 's4b' ? S.SJT : S.IB;
      items = shuffle(bank).slice(0, Math.min(n, bank.length)).map((q) => Object.assign({ section: id }, q, { options: shuffle(q.options) }));
    }
    const timed = SECTIONS[id].cognitive && !opts.learn;
    return {
      id, items, answers: new Array(items.length).fill(null),
      timeLimit: timed ? items.length * PACE[pace][id] : null,
      pace, started: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Mount / routing
  // ---------------------------------------------------------------------------
  let root = null;
  let session = null;
  let blitz = null;
  let deck = null;
  let timerId = null;
  let keyHandler = null;
  let acts = {};

  S.mount = function (el) {
    root = el;
    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-act]');
      if (!t || !root.contains(t)) return;
      const fn = acts[t.dataset.act];
      if (fn) { e.preventDefault(); fn(t); }
    });
    root.addEventListener('change', (e) => {
      const t = e.target.closest('[data-setting]');
      if (!t) return;
      const k = t.dataset.setting;
      store.settings[k] = t.type === 'checkbox' ? t.checked : k === 'penalty' ? Number(t.value) : t.value;
      save();
    });
    document.addEventListener('keydown', (e) => {
      if (!keyHandler || !root.isConnected || root.hidden) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (keyHandler(e) === true) e.preventDefault();
    });
  };

  const SUBNAV = [
    ['', 'Overview'], ['practice', 'Practice'], ['strategy', 'Strategy'], ['expect', 'What to expect'], ['dashboard', 'Dashboard'],
  ];

  S.route = function (sub) {
    stopTimer();
    keyHandler = null;
    acts = {};
    if (sub !== 'run') session = null;
    if (sub !== 'blitz') blitz = null;
    if (sub === '__idle') { root.innerHTML = ''; return; }
    const views = { '': viewOverview, practice: viewPractice, strategy: viewStrategy, expect: viewExpect, dashboard: viewDashboard, run: viewRun, blitz: viewBlitz, review: viewReview };
    (views[sub] || viewOverview)();
    window.scrollTo(0, 0);
  };

  function go(sub) { location.hash = '#/suited' + (sub ? '/' + sub : ''); }

  function frame(active, body, focus) {
    const nav = SUBNAV.map(([k, label]) => `<a href="#/suited${k ? '/' + k : ''}" class="${k === active ? 'active' : ''}">${label}</a>`).join('');
    root.innerHTML = (focus ? '' : `<nav class="subnav" aria-label="Suited sections">${nav}</nav>`) + `<div class="view">${body}</div>`;
  }

  const DISCLAIMER = '<p class="disclaimer">Not affiliated with Suited, William Blair or any bank. The format is reconstructed from public candidate reports, and banks customise their versions. For practice only.</p>';

  // ---------------------------------------------------------------------------
  // Overview
  // ---------------------------------------------------------------------------
  function viewOverview() {
    const mocks = store.history.filter((h) => h.mode === 'mock');
    const best = Math.max(0, ...store.blitz.map((b) => b.score));
    frame('', `
      <section class="hero">
        <p class="eyebrow">Suited assessment practice</p>
        <h1>Train for the Suited screen used by investment banks and law firms.</h1>
        <p class="lead">Timed checking drills, logic and number series, a personality profile with consistency checks, and banking situational judgement. Wrong answers cost points, just as candidates report on the real test.</p>
        <div class="cta-row">
          <button class="btn primary big" data-act="mock">Start full mock</button>
          <a class="btn" href="#/suited/practice">Choose a drill</a>
          <a class="btn ghost" href="#/suited/blitz">60-second blitz</a>
        </div>
      </section>
      <section class="facts">
        <div class="fact"><span class="fact-n">~15 min</span><span>for the cognitive part (candidate reports)</span></div>
        <div class="fact"><span class="fact-n">−1</span><span>wrong answers are penalised, so don't guess</span></div>
        <div class="fact"><span class="fact-n">48 hrs</span><span>typical window after the link arrives (William Blair)</span></div>
        <div class="fact"><span class="fact-n">Desktop</span><span>only. The real test does not work on phones</span></div>
      </section>
      <section class="cards-3">
        ${['s1', 's2', 's3', 's4a', 's4b', 's5'].map((id) => `
          <button class="card link" data-act="drill" data-sec="${id}">
            <span class="tag">${SECTIONS[id].tag}</span>
            <h3>${SECTIONS[id].name}</h3>
            <p>${SECTIONS[id].intro.replace(/<[^>]+>/g, '').split('. ')[0]}.</p>
          </button>`).join('')}
      </section>
      <section class="strip">
        <div><b>${mocks.length}</b> full mock${mocks.length === 1 ? '' : 's'} taken</div>
        <div><b>${best}</b> blitz best</div>
        <a href="#/suited/dashboard">View dashboard →</a>
      </section>
      ${DISCLAIMER}
    `);
    acts.mock = () => startMock();
    acts.drill = (t) => { drillSel = t.dataset.sec; go('practice'); };
  }

  // ---------------------------------------------------------------------------
  // Practice mode picker
  // ---------------------------------------------------------------------------
  let drillSel = 's1';
  function viewPractice() {
    const st = store.settings;
    const kindOpts = Object.entries(S.LOGIC_KINDS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');
    frame('practice', `
      <h1>Practice</h1>
      <section class="panel settings">
        <h2>Settings</h2>
        <div class="settings-grid">
          <label>Timer pace
            <select data-setting="pace">${Object.entries(PACE).map(([k, v]) => `<option value="${k}" ${st.pace === k ? 'selected' : ''}>${v.label} (${v.s1}s / ${v.s2}s / ${v.s3}s per item)</option>`).join('')}</select>
          </label>
          <label>Wrong-answer penalty
            <select data-setting="penalty">${[[0, 'None (0)'], [0.5, 'Half (−0.5)'], [1, 'Full (−1)']].map(([v, l]) => `<option value="${v}" ${st.penalty === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
          </label>
          <label class="check"><input type="checkbox" data-setting="includeIB" ${st.includeIB ? 'checked' : ''}> Include IB add-on in full mock</label>
        </div>
        <p class="muted small">The real per-section time limits and exact penalty are not published. "Realistic" follows candidate reports. Try "Brutal" to build headroom.</p>
      </section>

      <section class="modes">
        <article class="panel mode featured">
          <span class="tag">Flagship</span>
          <h2>Full mock exam</h2>
          <p>All sections back to back in one sitting: Same/Different (20), Match (20), Logic (20), Personality (42), Situational Judgement (12)${st.includeIB ? ', IB add-on (8)' : ''}.</p>
          <button class="btn primary" data-act="mock">Start full mock</button>
        </article>

        <article class="panel mode" id="drill-panel">
          <h2>Section drill</h2>
          <div class="seg" role="radiogroup" aria-label="Section">
            ${Object.entries(SECTIONS).map(([id, s]) => `<button class="seg-btn ${drillSel === id ? 'on' : ''}" data-act="pick" data-sec="${id}" role="radio" aria-checked="${drillSel === id}">${s.name}</button>`).join('')}
          </div>
          <div class="drill-opts">
            <label id="opt-count">Questions
              <select id="drill-count">${[10, 20, 30, 40].map((n) => `<option ${n === 20 ? 'selected' : ''}>${n}</option>`).join('')}</select>
            </label>
            <label id="opt-kind">Question type
              <select id="drill-kind"><option value="all">Mixed (all types)</option>${kindOpts}</select>
            </label>
          </div>
          <div class="cta-row">
            <button class="btn primary" data-act="start-drill">Timed drill</button>
            <button class="btn" data-act="start-learn">Learn mode <span class="muted">(untimed, with explanations)</span></button>
          </div>
        </article>

        <article class="panel mode">
          <h2>60-second blitz</h2>
          <p>Endless Same/Different pairs against the clock. +1 right, −1 wrong. This is the best way to train the checking sections.</p>
          <a class="btn primary" href="#/suited/blitz">Play blitz</a>
        </article>

        <article class="panel mode">
          <h2>Review deck</h2>
          <p>Flashcards for every judgement scenario and personality statement, with the ranked answers and the reasons behind them.</p>
          <a class="btn" href="#/suited/review">Open deck</a>
        </article>
      </section>
      ${DISCLAIMER}
    `);
    acts.mock = () => startMock();
    acts.pick = (t) => selectDrill(t.dataset.sec);
    const startDrill = (learn) => {
      const n = Number(document.getElementById('drill-count').value);
      const kind = document.getElementById('drill-kind').value;
      startSession(learn ? 'learn' : 'drill', [{ id: drillSel, count: n, kind, learn }]);
    };
    acts['start-drill'] = () => startDrill(false);
    acts['start-learn'] = () => startDrill(true);
    selectDrill(drillSel);
  }

  function selectDrill(id) {
    drillSel = id;
    const panel = document.getElementById('drill-panel');
    if (!panel) return;
    panel.querySelectorAll('.seg-btn').forEach((b) => {
      const on = b.dataset.sec === id;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', on);
    });
    document.getElementById('opt-kind').hidden = id !== 's3';
    document.getElementById('opt-count').hidden = id === 's4a';
    const cnt = document.getElementById('drill-count');
    const max = id === 's4b' ? S.SJT.length : id === 's5' ? S.IB.length : 40;
    [...cnt.options].forEach((o) => { o.disabled = Number(o.value) > max; });
    if (Number(cnt.value) > max) cnt.value = [...cnt.options].filter((o) => !o.disabled).pop().value;
    if (id === 's4b' || id === 's5') panel.scrollIntoView({ block: 'nearest' });
  }

  function startMock() {
    const specs = [{ id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4a' }, { id: 's4b' }];
    if (store.settings.includeIB) specs.push({ id: 's5' });
    startSession('mock', specs);
  }

  function startSession(mode, specs) {
    session = {
      mode, learn: mode === 'learn', penalty: store.settings.penalty, pace: store.settings.pace,
      sections: specs.map((sp) => buildSection(sp.id, sp)), si: 0, qi: 0, phase: 'intro', sel: new Set(),
    };
    if (location.hash === '#/suited/run') S.route('run'); else go('run');
  }

  // ---------------------------------------------------------------------------
  // Test runner
  // ---------------------------------------------------------------------------
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  const fmtTime = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  function curSec() { return session.sections[session.si]; }

  function viewRun() {
    if (!session) { go('practice'); return; }
    if (session.phase === 'intro') return renderIntro();
    if (session.phase === 'done') return renderResults();
    return renderQuestion();
  }

  function renderIntro() {
    const sec = curSec();
    const def = SECTIONS[sec.id];
    const total = session.sections.length;
    const timeTxt = sec.timeLimit ? `${sec.items.length} questions · ${fmtTime(sec.timeLimit)} total (${PACE[sec.pace][sec.id]}s each, ${PACE[sec.pace].label.toLowerCase()} pace)` : `${sec.items.length} ${sec.id === 's4a' ? 'statements' : 'questions'} · untimed`;
    const scoring = def.cognitive ? (session.penalty ? `+1 correct · −${session.penalty} wrong · 0 skipped. <b>Skipping beats guessing.</b>` : '+1 correct · no penalty (penalty is switched off in Settings).') : sec.id === 's4a' ? 'Profile alignment and consistency. No right or wrong answers.' : 'Best +2 · acceptable +1 · poor −1 · worst −2.';
    frame('run', `
      <div class="runner intro">
        <p class="eyebrow">${session.mode === 'mock' ? `Section ${session.si + 1} of ${total}` : session.learn ? 'Learn mode' : 'Drill'} · ${def.tag}</p>
        <h1>${def.name}</h1>
        <p class="lead">${def.intro}</p>
        <dl class="meta">
          <div><dt>Length</dt><dd>${timeTxt}</dd></div>
          <div><dt>Scoring</dt><dd>${scoring}</dd></div>
          <div><dt>Keys</dt><dd>${def.keys}</dd></div>
        </dl>
        <div class="example"><p class="eyebrow">Example</p>${def.example()}</div>
        <div class="cta-row">
          <button class="btn primary big" data-act="begin">Start section <kbd>Enter</kbd></button>
          <button class="btn ghost" data-act="quit">Quit</button>
        </div>
      </div>
    `, true);
    acts.begin = beginSection;
    acts.quit = quit;
    keyHandler = (e) => { if (e.key === 'Enter') { beginSection(); return true; } };
  }

  // Two-step confirm in place of confirm(), which embedded viewers may block.
  function armed(t, label) {
    if (!t || t.dataset.armed === '1') return true;
    t.dataset.armed = '1';
    t.dataset.label = t.innerHTML;
    t.innerHTML = label;
    setTimeout(() => { if (t.isConnected) { t.dataset.armed = ''; t.innerHTML = t.dataset.label; } }, 3000);
    return false;
  }

  function quit(t) {
    if (session && session.sections.some((s) => s.answers.some(Boolean)) && !armed(t, 'Click again to quit')) return;
    session = null;
    go('practice');
  }

  function beginSection() {
    const sec = curSec();
    session.phase = 'question';
    session.qi = 0;
    sec.started = Date.now();
    if (sec.timeLimit) {
      stopTimer();
      timerId = setInterval(tick, 200);
    }
    renderQuestion();
  }

  function remaining() {
    const sec = curSec();
    return sec.timeLimit - (Date.now() - sec.started) / 1000;
  }

  function tick() {
    if (!session || session.phase === 'intro' || session.phase === 'done') return stopTimer();
    const r = remaining();
    const sec = curSec();
    const t = document.getElementById('timer-text');
    const b = document.getElementById('timer-bar');
    if (t) t.textContent = fmtTime(r);
    if (b) {
      b.style.width = Math.max(0, (r / sec.timeLimit) * 100) + '%';
      b.classList.toggle('low', r < sec.timeLimit * 0.15);
    }
    if (r <= 0) endSection(true);
  }

  function runningScore(sec) {
    return sec.answers.reduce((a, x) => a + (x && typeof x.points === 'number' ? x.points : 0), 0);
  }

  function renderQuestion() {
    const sec = curSec();
    const def = SECTIONS[sec.id];
    const item = sec.items[session.qi];
    const ans = sec.answers[session.qi];
    const fb = session.phase === 'feedback';
    if (!fb) { session.qStart = Date.now(); session.sel = new Set(); }
    const n = sec.items.length;
    const score = runningScore(sec);
    const head = `
      <div class="run-head">
        <div class="run-title"><b>${def.name}</b><span class="muted">${session.qi + 1} / ${n}</span></div>
        ${def.cognitive || sec.id === 's4b' || sec.id === 's5' ? `<div class="run-score">Score <b>${Math.round(score * 10) / 10}</b></div>` : ''}
        ${sec.timeLimit ? `<div class="run-timer"><span id="timer-text">${fmtTime(remaining())}</span></div>` : ''}
        <button class="btn ghost small" data-act="quit">Quit</button>
      </div>
      ${sec.timeLimit ? `<div class="timer-track"><div id="timer-bar" style="width:${Math.max(0, (remaining() / sec.timeLimit) * 100)}%"></div></div>` : `<div class="timer-track"><div class="progress" style="width:${(session.qi / n) * 100}%"></div></div>`}`;
    let body = '';
    if (sec.id === 's1') body = qSameDiff(item, ans, fb);
    else if (sec.id === 's2') body = qMatch(item, ans, fb);
    else if (sec.id === 's3') body = qChoice(item.prompt, item.options, ans, fb, item.answer, item.explanation);
    else if (sec.id === 's4a') body = qLikert(item, ans, fb);
    else body = qSJT(item, ans, fb);

    const skip = def.cognitive && !fb ? `<button class="btn ghost" data-act="skip">Skip (0 pts) <kbd>→</kbd></button>` : '';
    const next = fb ? `<button class="btn primary" data-act="next">${session.qi + 1 >= n ? 'Finish section' : 'Next'} <kbd>Enter</kbd></button>` : '';
    frame('run', `<div class="runner">${head}<div class="q-body">${body}</div><div class="run-foot">${skip}${next}</div></div>`, true);

    acts.quit = quit;
    acts.skip = () => record(null, true);
    acts.next = next ? advance : null;
    acts.choose = (t) => respond(Number(t.dataset.i));
    acts['choose-s1'] = (t) => respond(t.dataset.v);
    acts.toggle = (t) => toggleSel(Number(t.dataset.i));
    acts.submit = () => respond([...session.sel].sort());

    keyHandler = (e) => {
      const k = e.key;
      if (fb) {
        if (k === 'Enter' || k === 'ArrowRight' || k === ' ') { advance(); return true; }
        return;
      }
      if (def.cognitive && k === 'ArrowRight') { record(null, true); return true; }
      if (sec.id === 's1') {
        if (k === 's' || k === 'S') { respond('same'); return true; }
        if (k === 'd' || k === 'D') { respond('diff'); return true; }
      } else if (sec.id === 's2') {
        if (/^[1-4]$/.test(k)) { toggleSel(Number(k) - 1); return true; }
        if (k === 'Enter') { respond([...session.sel].sort()); return true; }
      } else {
        const max = sec.id === 's4a' ? 5 : item.options.length;
        const d = Number(k);
        if (d >= 1 && d <= max) { respond(d - 1); return true; }
      }
    };
  }

  function toggleSel(i) {
    if (session.sel.has(i)) session.sel.delete(i); else session.sel.add(i);
    root.querySelectorAll('.opt-check').forEach((el) => {
      const on = session.sel.has(Number(el.dataset.i));
      el.classList.toggle('on', on);
      el.setAttribute('aria-pressed', on);
    });
    const sb = document.getElementById('submit-btn');
    if (sb) sb.innerHTML = session.sel.size ? 'Submit <kbd>Enter</kbd>' : 'None match: submit <kbd>Enter</kbd>';
  }

  // Score a response and move on (or show feedback in learn mode).
  function respond(resp) {
    const sec = curSec();
    const item = sec.items[session.qi];
    let correct = null, points = null;
    if (sec.id === 's1') correct = (resp === 'same') === item.same;
    else if (sec.id === 's2') correct = JSON.stringify(resp) === JSON.stringify(item.matches);
    else if (sec.id === 's3') correct = resp === item.answer;
    else if (sec.id === 's4a') points = null;
    else {
      const max = Math.max(...item.options.map((o) => o.score));
      points = item.options[resp].score;
      correct = points === max;
    }
    if (SECTIONS[sec.id].cognitive) points = correct ? 1 : -session.penalty;
    record({ resp, correct, points }, false);
  }

  function record(r, skipped) {
    const sec = curSec();
    const ms = Date.now() - session.qStart;
    sec.answers[session.qi] = skipped ? { skipped: true, points: 0, correct: null, ms } : Object.assign({ ms }, r);
    if (session.learn) { session.phase = 'feedback'; renderQuestion(); } else advance();
  }

  function advance() {
    const sec = curSec();
    session.phase = 'question';
    if (session.qi + 1 >= sec.items.length) return endSection(false);
    session.qi++;
    renderQuestion();
  }

  function endSection(timedOut) {
    stopTimer();
    const sec = curSec();
    sec.answers = sec.answers.map((a) => a || { skipped: true, timedOut, points: 0, correct: null, ms: 0 });
    sec.timedOut = timedOut;
    if (session.si + 1 >= session.sections.length) {
      session.phase = 'done';
      session.summary = summarise(session);
      saveHistory(session);
    } else {
      session.si++;
      session.phase = 'intro';
    }
    session.qi = 0;
    viewRun();
  }

  // ---------- question renderers ----------
  function qSameDiff(item, ans, fb) {
    let l = esc(item.left), r = esc(item.right);
    if (fb) [l, r] = S.diffHtml(item.left, item.right);
    const cls = (v) => (fb ? ((v === 'same') === item.same ? 'correct' : ans && ans.resp === v ? 'wrong' : '') : '');
    return `
      <p class="q-lead center">Are these two strings the same?</p>
      <div class="pair"><span class="mono">${l}</span><span class="colon">:</span><span class="mono">${r}</span></div>
      <div class="choices two">
        <button class="choice ${cls('same')}" data-act="choose-s1" data-v="same" ${fb ? 'disabled' : ''}>Same <kbd>S</kbd></button>
        <button class="choice ${cls('diff')}" data-act="choose-s1" data-v="diff" ${fb ? 'disabled' : ''}>Different <kbd>D</kbd></button>
      </div>
      ${fb ? feedbackBanner(ans, item.same ? 'The strings are identical.' : `Different: ${S.MUTATION_LABEL[item.kind] || 'one character differs'}.`) : ''}`;
  }

  function qMatch(item, ans, fb) {
    const opts = item.options.map((o, i) => {
      const isMatch = item.matches.includes(i);
      const picked = fb ? ans && ans.resp && ans.resp.includes(i) : false;
      const shown = fb && !isMatch ? S.diffHtml(item.target, o)[1] : esc(o);
      const state = fb ? (isMatch ? 'correct' : picked ? 'wrong' : '') : '';
      const note = fb ? `<span class="opt-note">${isMatch ? 'match' : S.MUTATION_LABEL[item.kinds[i]] || 'differs'}</span>` : '';
      return `<button class="opt-check ${state} ${picked ? 'on' : ''}" data-act="toggle" data-i="${i}" aria-pressed="${picked}" ${fb ? 'disabled' : ''}><span class="box"></span><span class="mono">${shown}</span><kbd>${i + 1}</kbd>${note}</button>`;
    }).join('');
    return `
      <p class="q-lead center">Tick every option that exactly matches:</p>
      <div class="target mono">${esc(item.target)}</div>
      <div class="opt-list">${opts}</div>
      ${fb ? feedbackBanner(ans, item.matches.length ? `${item.matches.length} option${item.matches.length > 1 ? 's' : ''} matched.` : 'None of the options matched.') : `<div class="center"><button class="btn primary" id="submit-btn" data-act="submit">None match: submit <kbd>Enter</kbd></button></div>`}`;
  }

  function qChoice(prompt, options, ans, fb, correctIdx, explanation) {
    const opts = options.map((o, i) => {
      const state = fb ? (i === correctIdx ? 'correct' : ans && ans.resp === i ? 'wrong' : '') : '';
      return `<button class="choice ${state}" data-act="choose" data-i="${i}" ${fb ? 'disabled' : ''}><kbd>${i + 1}</kbd><span>${o}</span></button>`;
    }).join('');
    return `<div class="prompt">${prompt}</div><div class="choices ${options.length === 3 ? 'three' : 'grid'}">${opts}</div>${fb ? feedbackBanner(ans, explanation) : ''}`;
  }

  function qLikert(item, ans, fb) {
    const opts = LIKERT.map((l, i) => `<button class="choice likert ${fb && ans && ans.resp === i ? 'picked' : ''}" data-act="choose" data-i="${i}" ${fb ? 'disabled' : ''}><kbd>${i + 1}</kbd><span>${l}</span></button>`).join('');
    const tr = S.TRAITS[item.trait];
    return `
      <p class="q-lead center">How well does this statement describe you?</p>
      <blockquote class="statement">${esc(item.text)}</blockquote>
      <div class="choices likert-list">${opts}</div>
      ${fb ? `<div class="feedback neutral"><p><b>Trait:</b> ${tr.label}${item.keyed < 0 ? ' (reverse-worded: agreeing signals <i>less</i> of this trait)' : ''}.</p><p>${S.TRAIT_NOTES[item.trait]}</p><p class="muted small">Strong-profile answer: <b>${idealLikert(item)}</b>.</p></div>` : ''}`;
  }

  function idealLikert(item) {
    const target = S.TRAITS[item.trait].target;
    if (target >= 80) return item.keyed > 0 ? 'Very much like me / Like me' : 'Not like me at all / Not like me';
    return item.keyed > 0 ? 'Like me / Somewhat like me' : 'Somewhat like me / Not like me';
  }

  function qSJT(item, ans, fb) {
    const labels = { 2: 'Best', 1: 'Acceptable', '-1': 'Poor', '-2': 'Worst' };
    const opts = item.options.map((o, i) => {
      const state = fb ? (o.score === 2 ? 'correct' : ans && ans.resp === i && o.score < 0 ? 'wrong' : ans && ans.resp === i ? 'picked' : '') : '';
      const extra = fb ? `<span class="why"><b class="score s${o.score}">${labels[o.score]} (${o.score > 0 ? '+' : ''}${o.score})</b> ${esc(o.why)}</span>` : '';
      return `<button class="choice sjt ${state}" data-act="choose" data-i="${i}" ${fb ? 'disabled' : ''}><kbd>${i + 1}</kbd><span>${esc(o.text)}${extra}</span></button>`;
    }).join('');
    return `<blockquote class="scenario">${esc(item.scenario)}</blockquote><p class="q-lead">What is the <b>best</b> response?</p><div class="choices list">${opts}</div>${fb ? feedbackBanner(ans, '') : ''}`;
  }

  function feedbackBanner(ans, text) {
    if (!ans) return '';
    let cls, head;
    if (ans.skipped) { cls = 'neutral'; head = 'Skipped (0 points).'; }
    else if (ans.correct) { cls = 'good'; head = typeof ans.points === 'number' && ans.points !== 1 ? `Correct (${ans.points > 0 ? '+' : ''}${ans.points}).` : 'Correct (+1).'; }
    else { cls = 'bad'; head = typeof ans.points === 'number' ? `Not quite (${ans.points > 0 ? '+' : ''}${ans.points}).` : 'Incorrect.'; }
    return `<div class="feedback ${cls}"><p><b>${head}</b></p>${text ? `<p>${text}</p>` : ''}</div>`;
  }

  // ---------------------------------------------------------------------------
  // Scoring summary
  // ---------------------------------------------------------------------------
  function summarise(sess) {
    const out = {};
    for (const sec of sess.sections) {
      const a = sec.answers;
      if (SECTIONS[sec.id].cognitive) {
        const correct = a.filter((x) => x.correct === true).length;
        const wrong = a.filter((x) => x.correct === false).length;
        const skipped = a.filter((x) => x.skipped).length;
        const answered = correct + wrong;
        const ms = a.filter((x) => !x.skipped).map((x) => x.ms);
        const s = {
          n: a.length, correct, wrong, skipped, score: Math.round(a.reduce((t, x) => t + x.points, 0) * 10) / 10,
          accuracy: answered ? correct / answered : 0, reached: a.filter((x) => !x.timedOut).length,
          avgSec: ms.length ? ms.reduce((t, x) => t + x, 0) / ms.length / 1000 : 0, timedOut: !!sec.timedOut,
        };
        if (sec.id === 's3') {
          s.byKind = {};
          sec.items.forEach((it, i) => {
            const k = (s.byKind[it.kind] = s.byKind[it.kind] || { c: 0, n: 0 });
            k.n++; if (a[i].correct) k.c++;
          });
        }
        if (sec.id === 's1' || sec.id === 's2') {
          s.missedKinds = {};
          sec.items.forEach((it, i) => {
            if (a[i].correct === false) {
              const kinds = sec.id === 's1' ? [it.same ? 'identical' : it.kind] : it.kinds.filter(Boolean);
              kinds.forEach((k) => { s.missedKinds[k] = (s.missedKinds[k] || 0) + 1; });
            }
          });
        }
        out[sec.id] = s;
      } else if (sec.id === 's4a') {
        out.s4a = personalityProfile(sec);
      } else {
        const pts = a.reduce((t, x) => t + (x.points || 0), 0);
        out[sec.id] = {
          n: a.length, score: pts, max: a.length * 2,
          best: a.filter((x) => x.correct).length,
          negatives: a.filter((x) => x.points < 0).length,
        };
      }
    }
    return out;
  }

  function personalityProfile(sec) {
    const sums = {}, counts = {}, byPair = {};
    sec.items.forEach((it, i) => {
      const a = sec.answers[i];
      if (a.skipped) return;
      const value = 5 - a.resp; // 5 = very much like me
      const norm = it.keyed > 0 ? value : 6 - value;
      sums[it.trait] = (sums[it.trait] || 0) + norm;
      counts[it.trait] = (counts[it.trait] || 0) + 1;
      if (it.pair) (byPair[it.pair] = byPair[it.pair] || []).push({ it, norm });
    });
    const traits = {};
    Object.keys(S.TRAITS).forEach((t) => { traits[t] = counts[t] ? Math.round(((sums[t] / counts[t] - 1) / 4) * 100) : 0; });
    const flags = [];
    Object.values(byPair).forEach((p) => {
      if (p.length === 2 && Math.abs(p[0].norm - p[1].norm) >= 2) flags.push({ trait: p[0].it.trait, a: p[0].it.text, b: p[1].it.text });
    });
    const pairs = Object.values(byPair).filter((p) => p.length === 2).length;
    const dev = Object.keys(S.TRAITS).map((t) => Math.abs(traits[t] - S.TRAITS[t].target));
    return {
      traits, flags,
      alignment: Math.round(100 - dev.reduce((x, y) => x + y, 0) / dev.length),
      consistency: pairs ? Math.round(((pairs - flags.length) / pairs) * 100) : 100,
    };
  }

  function saveHistory(sess) {
    store.history.push({ t: Date.now(), mode: sess.mode, pace: sess.pace, penalty: sess.penalty, sections: sess.summary });
    if (store.history.length > 200) store.history.shift();
    save();
  }

  // ---------------------------------------------------------------------------
  // Results
  // ---------------------------------------------------------------------------
  const KIND_LABEL = { identical: 'identical pairs (you said different)' };
  function renderResults() {
    const sm = session.summary;
    const cards = session.sections.map((sec) => {
      const s = sm[sec.id];
      const def = SECTIONS[sec.id];
      if (def.cognitive) {
        return `<div class="rcard"><p class="eyebrow">${def.name}</p><p class="big-n">${s.score}<span>/ ${s.n}</span></p>
          <ul class="kv"><li><span>Accuracy</span><b>${Math.round(s.accuracy * 100)}%</b></li><li><span>Right / wrong / skip</span><b>${s.correct} / ${s.wrong} / ${s.skipped}</b></li>
          <li><span>Avg pace</span><b>${s.avgSec.toFixed(1)}s</b></li>${s.timedOut ? `<li><span>Timed out after</span><b>${s.reached} / ${s.n}</b></li>` : ''}</ul></div>`;
      }
      if (sec.id === 's4a') {
        return `<div class="rcard wide"><p class="eyebrow">Personality profile</p><div class="radar-wrap">${radar(s.traits)}
          <ul class="kv"><li><span>Alignment with a strong analyst profile</span><b>${s.alignment}%</b></li><li><span>Consistency</span><b>${s.consistency}%</b></li>
          ${Object.keys(S.TRAITS).map((t) => `<li><span>${S.TRAITS[t].label}</span><b>${s.traits[t]} <small class="muted">/ target ${S.TRAITS[t].target}</small></b></li>`).join('')}</ul></div>
          ${s.flags.length ? `<div class="feedback bad"><p><b>Inconsistent answers flagged (${s.flags.length}):</b></p><ul>${s.flags.map((f) => `<li>"${esc(f.a)}" vs "${esc(f.b)}"</li>`).join('')}</ul></div>` : '<div class="feedback good"><p>No inconsistent pairs. Nicely done.</p></div>'}
          <p class="muted small">Radar: <span class="legend lg-you"></span> you · <span class="legend lg-target"></span> illustrative target profile for a junior banking role (not Suited's actual model).</p></div>`;
      }
      return `<div class="rcard"><p class="eyebrow">${def.name}</p><p class="big-n">${s.score}<span>/ ${s.max}</span></p>
        <ul class="kv"><li><span>Best response picked</span><b>${s.best} / ${s.n}</b></li><li><span>Poor or worst picks</span><b>${s.negatives}</b></li></ul></div>`;
    }).join('');

    frame('run', `
      <div class="results">
        <p class="eyebrow">${session.mode === 'mock' ? 'Full mock' : session.learn ? 'Learn mode' : 'Drill'} complete</p>
        <h1>Your results</h1>
        <div class="rgrid">${cards}</div>
        <section class="panel"><h2>What to work on</h2><ul class="todo">${advice(sm).map((x) => `<li>${x}</li>`).join('')}</ul></section>
        <section class="review"><h2>Question review</h2>${session.sections.map(reviewSection).join('')}</section>
        <div class="cta-row">
          <button class="btn primary" data-act="again">Try again</button>
          <a class="btn" href="#/suited/practice">Back to practice</a>
          <a class="btn ghost" href="#/suited/dashboard">Dashboard</a>
        </div>
      </div>`, true);
    const specs = session.sections.map((s) => ({ id: s.id, count: s.items.length, learn: session.learn }));
    const mode = session.mode;
    acts.again = () => (mode === 'mock' ? startMock() : startSession(mode, specs));
  }

  function advice(sm) {
    const out = [];
    const cog = ['s1', 's2', 's3'].filter((k) => sm[k]);
    cog.forEach((k) => {
      const s = sm[k], name = SECTIONS[k].name;
      if (s.wrong >= 3 && session.penalty > 0) out.push(`<b>${name}:</b> ${s.wrong} wrong answers cost you ${s.wrong * session.penalty} point${s.wrong * session.penalty === 1 ? '' : 's'}. When unsure, skip. A skip scores 0.`);
      if (s.accuracy < 0.8 && s.correct + s.wrong > 0) out.push(`<b>${name}:</b> accuracy is ${Math.round(s.accuracy * 100)}%. Slow down slightly. Accuracy beats volume under negative marking.`);
      if (s.timedOut && s.reached < s.n * 0.8) out.push(`<b>${name}:</b> you reached ${s.reached}/${s.n} before time ran out. Build speed with the <a href="#/suited/blitz">60-second blitz</a>.`);
      if (s.missedKinds) {
        const top = Object.entries(s.missedKinds).sort((a, b) => b[1] - a[1])[0];
        if (top && top[1] >= 2) out.push(`<b>${name}:</b> you missed <i>${KIND_LABEL[top[0]] || S.MUTATION_LABEL[top[0]] || top[0]}</i> ${top[1]}×. ${top[0] === 'case' ? 'Scan for capitals first.' : top[0] === 'swap' ? 'Read in chunks of 2–3 characters to catch transpositions.' : top[0] === 'identical' ? 'Trust yourself: if no difference shows up in ~5 seconds, it is probably "Same".' : 'Check the ends of the string as well as the middle.'}`);
      }
      if (s.byKind) {
        const weak = Object.entries(s.byKind).filter(([, v]) => v.n >= 2).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n)[0];
        if (weak && weak[1].c / weak[1].n < 0.7) out.push(`<b>Logic:</b> weakest type is <i>${S.LOGIC_KINDS[weak[0]].label}</i> (${weak[1].c}/${weak[1].n}). Drill it in learn mode and read the <a href="#/suited/strategy">strategy notes</a>.`);
      }
    });
    if (sm.s4a) {
      if (sm.s4a.flags.length) out.push(`<b>Personality:</b> ${sm.s4a.flags.length} inconsistent pair${sm.s4a.flags.length > 1 ? 's' : ''}. Answer as one consistent professional self rather than gaming each question.`);
      const low = Object.keys(S.TRAITS).filter((t) => S.TRAITS[t].target - sm.s4a.traits[t] > 25);
      if (low.length) out.push(`<b>Personality:</b> well below the target profile on ${low.map((t) => S.TRAITS[t].label.toLowerCase()).join(', ')}. Review these traits in the <a href="#/suited/review">review deck</a>.`);
      if (sm.s4a.traits.leadership - S.TRAITS.leadership.target > 25) out.push('<b>Personality:</b> very high assertiveness. For junior roles, show that you can take direction as well as lead.');
    }
    ['s4b', 's5'].forEach((k) => {
      if (sm[k] && sm[k].negatives) out.push(`<b>${SECTIONS[k].name}:</b> ${sm[k].negatives} poor/worst pick${sm[k].negatives > 1 ? 's' : ''}. Remember banker logic: client first, data-driven, escalate through proper channels, never compromise confidentiality.`);
    });
    if (!out.length) out.push('Strong session. Raise the timer to <b>Brutal</b> or switch on the full penalty to keep stretching yourself.');
    return out;
  }

  function reviewSection(sec) {
    const def = SECTIONS[sec.id];
    const rows = sec.items.map((it, i) => {
      const a = sec.answers[i];
      const st = a.skipped ? 'skip' : a.correct === true ? 'ok' : a.correct === false ? 'no' : 'neutral';
      const badge = { skip: a.timedOut ? 'Not reached' : 'Skipped', ok: 'Correct', no: 'Wrong', neutral: '' }[st];
      let body = '';
      if (sec.id === 's1') {
        const [l, r] = S.diffHtml(it.left, it.right);
        body = `<div class="pair small"><span class="mono">${l}</span><span class="colon">:</span><span class="mono">${r}</span></div><p>Answer: <b>${it.same ? 'Same' : 'Different'}</b>${it.same ? '' : ` (${S.MUTATION_LABEL[it.kind]})`}${a.resp ? ` · you said ${a.resp === 'same' ? 'Same' : 'Different'}` : ''}</p>`;
      } else if (sec.id === 's2') {
        body = `<p class="mono">${esc(it.target)}</p><ul class="ex-list mono">${it.options.map((o, j) => `<li>${it.matches.includes(j) ? esc(o) + ' ✓' : S.diffHtml(it.target, o)[1] + ' ✗'}${a.resp && a.resp.includes(j) ? ' <span class="muted">(ticked)</span>' : ''}</li>`).join('')}</ul>`;
      } else if (sec.id === 's3') {
        body = `<div class="prompt small">${it.prompt}</div><p>Answer: <b>${it.options[it.answer]}</b>${a.resp != null && !a.skipped ? ` · you chose ${it.options[a.resp]}` : ''}</p><p class="muted">${it.explanation}</p>`;
      } else if (sec.id === 's4a') {
        body = `<p>"${esc(it.text)}"</p><p>You: <b>${a.skipped ? 'no answer' : LIKERT[a.resp]}</b> · trait: ${S.TRAITS[it.trait].label}${it.keyed < 0 ? ' (reverse-worded)' : ''} · strong profile: ${idealLikert(it)}</p>`;
      } else {
        body = `<p>${esc(it.scenario)}</p><ol class="sjt-review">${it.options.slice().sort((x, y) => y.score - x.score).map((o) => `<li class="${a.resp != null && it.options[a.resp] === o ? 'you' : ''}"><b class="score s${o.score}">${o.score > 0 ? '+' : ''}${o.score}</b> ${esc(o.text)} <span class="muted">${esc(o.why)}</span></li>`).join('')}</ol>`;
      }
      return `<details class="rv ${st}"><summary><span>Q${i + 1}</span>${badge ? `<span class="badge ${st}">${badge}</span>` : ''}${a.points != null && sec.id !== 's4a' && !a.skipped ? `<span class="muted">${a.points > 0 ? '+' : ''}${a.points}</span>` : ''}</summary>${body}</details>`;
    }).join('');
    return `<details class="rv-sec" ${session.sections.length === 1 ? 'open' : ''}><summary><h3>${def.name}</h3></summary><div class="rv-list">${rows}</div></details>`;
  }

  // ---------------------------------------------------------------------------
  // Radar chart (SVG)
  // ---------------------------------------------------------------------------
  const RADAR_LABEL = { conscientiousness: 'Detail', resilience: 'Resilience', integrity: 'Integrity', teamwork: 'Teamwork', adaptability: 'Adaptability', drive: 'Drive', leadership: 'Assertiveness' };
  function radar(traits) {
    const keys = Object.keys(S.TRAITS);
    const R = 110, cx = 160, cy = 140;
    const pt = (i, v) => {
      const a = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
      return [cx + R * (v / 100) * Math.cos(a), cy + R * (v / 100) * Math.sin(a)];
    };
    const poly = (vals) => vals.map((v, i) => pt(i, v).map((n) => n.toFixed(1)).join(',')).join(' ');
    const rings = [25, 50, 75, 100].map((r) => `<polygon class="ring" points="${poly(keys.map(() => r))}"/>`).join('');
    const spokes = keys.map((k, i) => { const [x, y] = pt(i, 100); return `<line class="spoke" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join('');
    const labels = keys.map((k, i) => {
      const [x, y] = pt(i, 122);
      const anchor = Math.abs(x - cx) < 10 ? 'middle' : x > cx ? 'start' : 'end';
      return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}">${RADAR_LABEL[k]}</text>`;
    }).join('');
    return `<svg class="radar" viewBox="-50 0 420 290" role="img" aria-label="Trait radar chart">${rings}${spokes}
      <polygon class="target" points="${poly(keys.map((k) => S.TRAITS[k].target))}"/>
      <polygon class="you" points="${poly(keys.map((k) => traits[k] || 0))}"/>${labels}</svg>`;
  }

  // ---------------------------------------------------------------------------
  // Blitz
  // ---------------------------------------------------------------------------
  function viewBlitz() {
    const best = Math.max(0, ...store.blitz.map((b) => b.score));
    frame('practice', `
      <div class="runner intro">
        <p class="eyebrow">Rapid-fire drill</p>
        <h1>60-second blitz</h1>
        <p class="lead">As many Same/Different pairs as you can in 60 seconds. +1 correct, −1 wrong. Uses your timer pace to set the difficulty (currently <b>${PACE[store.settings.pace].label}</b>).</p>
        <dl class="meta"><div><dt>Keys</dt><dd><kbd>S</kbd> Same · <kbd>D</kbd> Different</dd></div><div><dt>Best</dt><dd><b>${best}</b></dd></div></dl>
        <div class="cta-row"><button class="btn primary big" data-act="go">Start <kbd>Enter</kbd></button></div>
        ${blitzBoard()}
      </div>`);
    acts.go = startBlitz;
    keyHandler = (e) => { if (e.key === 'Enter') { startBlitz(); return true; } };
  }

  function blitzBoard() {
    const top = store.blitz.slice().sort((a, b) => b.score - a.score).slice(0, 5);
    if (!top.length) return '';
    return `<section class="panel"><h2>High scores</h2><ol class="board">${top.map((b) => `<li><b>${b.score}</b> <span class="muted">${b.correct} right · ${b.wrong} wrong · ${PACE[b.pace] ? PACE[b.pace].label : ''} · ${new Date(b.t).toLocaleDateString()}</span></li>`).join('')}</ol></section>`;
  }

  function startBlitz() {
    blitz = { end: Date.now() + 60000, score: 0, correct: 0, wrong: 0, streak: 0, missed: [], item: S.genSameDiff(store.settings.pace), pace: store.settings.pace };
    frame('practice', `
      <div class="runner blitz">
        <div class="run-head"><div class="run-title"><b>Blitz</b></div><div class="run-score">Score <b id="bz-score">0</b></div><div class="run-score">Streak <b id="bz-streak">0</b></div><div class="run-timer"><span id="timer-text">1:00</span></div></div>
        <div class="timer-track"><div id="timer-bar" style="width:100%"></div></div>
        <div class="q-body"><div class="pair" id="bz-pair"></div>
        <div class="choices two"><button class="choice" data-act="bz" data-v="same">Same <kbd>S</kbd></button><button class="choice" data-act="bz" data-v="diff">Different <kbd>D</kbd></button></div></div>
      </div>`, true);
    drawBlitz();
    acts.bz = (t) => blitzAnswer(t.dataset.v);
    keyHandler = (e) => {
      if (e.key === 's' || e.key === 'S') { blitzAnswer('same'); return true; }
      if (e.key === 'd' || e.key === 'D') { blitzAnswer('diff'); return true; }
    };
    stopTimer();
    timerId = setInterval(() => {
      if (!blitz) return stopTimer();
      const r = (blitz.end - Date.now()) / 1000;
      const t = document.getElementById('timer-text'), b = document.getElementById('timer-bar');
      if (t) t.textContent = fmtTime(r);
      if (b) { b.style.width = Math.max(0, (r / 60) * 100) + '%'; b.classList.toggle('low', r < 10); }
      if (r <= 0) endBlitz();
    }, 100);
  }

  function drawBlitz() {
    const p = document.getElementById('bz-pair');
    if (p) p.innerHTML = `<span class="mono">${esc(blitz.item.left)}</span><span class="colon">:</span><span class="mono">${esc(blitz.item.right)}</span>`;
  }

  function blitzAnswer(v) {
    if (!blitz || Date.now() > blitz.end) return;
    const ok = (v === 'same') === blitz.item.same;
    if (ok) { blitz.score++; blitz.correct++; blitz.streak++; } else { blitz.score--; blitz.wrong++; blitz.streak = 0; blitz.missed.push(blitz.item); }
    const pair = document.getElementById('bz-pair');
    if (pair) { pair.classList.remove('flash-good', 'flash-bad'); void pair.offsetWidth; pair.classList.add(ok ? 'flash-good' : 'flash-bad'); }
    document.getElementById('bz-score').textContent = blitz.score;
    document.getElementById('bz-streak').textContent = blitz.streak;
    blitz.item = S.genSameDiff(blitz.pace);
    drawBlitz();
  }

  function endBlitz() {
    stopTimer();
    const b = blitz;
    const prevBest = Math.max(0, ...store.blitz.map((x) => x.score));
    store.blitz.push({ t: Date.now(), score: b.score, correct: b.correct, wrong: b.wrong, pace: b.pace });
    if (store.blitz.length > 100) store.blitz.shift();
    save();
    const answered = b.correct + b.wrong;
    frame('practice', `
      <div class="results">
        <p class="eyebrow">Blitz complete</p>
        <h1>${b.score} point${b.score === 1 ? '' : 's'}${b.score > prevBest ? ' <span class="badge ok">New best!</span>' : ''}</h1>
        <div class="rgrid"><div class="rcard"><ul class="kv"><li><span>Correct</span><b>${b.correct}</b></li><li><span>Wrong</span><b>${b.wrong}</b></li><li><span>Accuracy</span><b>${answered ? Math.round((b.correct / answered) * 100) : 0}%</b></li><li><span>Pace</span><b>${answered ? (60 / answered).toFixed(1) : '–'}s / pair</b></li></ul></div></div>
        ${b.missed.length ? `<section class="panel"><h2>Pairs you missed</h2><ul class="missed">${b.missed.map((it) => { const [l, r] = S.diffHtml(it.left, it.right); return `<li><span class="mono">${l}</span> : <span class="mono">${r}</span> <span class="muted">${it.same ? 'Same' : S.MUTATION_LABEL[it.kind]}</span></li>`; }).join('')}</ul></section>` : ''}
        <div class="cta-row"><button class="btn primary" data-act="go">Play again <kbd>Enter</kbd></button><a class="btn" href="#/suited/practice">Back to practice</a></div>
        ${blitzBoard()}
      </div>`, true);
    blitz = null;
    acts.go = startBlitz;
    keyHandler = (e) => { if (e.key === 'Enter') { startBlitz(); return true; } };
  }

  // ---------------------------------------------------------------------------
  // Review deck
  // ---------------------------------------------------------------------------
  function viewReview() {
    deck = deck || { filter: 'sjt', i: 0, open: false };
    const cards = deckCards(deck.filter);
    deck.i = Math.min(deck.i, cards.length - 1);
    const c = cards[deck.i];
    const labels = { 2: 'Best', 1: 'Acceptable', '-1': 'Poor', '-2': 'Worst' };
    let front, back;
    if (c.options) {
      front = `<p class="eyebrow">${c.section === 's5' ? 'IB add-on' : 'Situational judgement'}</p><blockquote class="scenario">${esc(c.scenario)}</blockquote><p class="muted">What is the best response? Think about it, then reveal.</p>`;
      back = `<ol class="sjt-review">${c.options.slice().sort((x, y) => y.score - x.score).map((o) => `<li><b class="score s${o.score}">${labels[o.score]}</b> ${esc(o.text)}<br><span class="muted">${esc(o.why)}</span></li>`).join('')}</ol>`;
    } else {
      front = `<p class="eyebrow">Personality statement</p><blockquote class="statement">${esc(c.text)}</blockquote><p class="muted">Which trait is this measuring, and how would a strong candidate answer?</p>`;
      back = `<p><b>Trait:</b> ${S.TRAITS[c.trait].label}${c.keyed < 0 ? ' (reverse-worded)' : ''}</p><p><b>Strong-profile answer:</b> ${idealLikert(c)}</p><p class="muted">${S.TRAIT_NOTES[c.trait]}</p>`;
    }
    frame('practice', `
      <h1>Review deck</h1>
      <div class="seg">${[['sjt', 'Situational judgement'], ['ib', 'IB add-on'], ['pers', 'Personality']].map(([k, l]) => `<button class="seg-btn ${deck.filter === k ? 'on' : ''}" data-act="filter" data-f="${k}">${l}</button>`).join('')}</div>
      <div class="flash panel">
        ${front}
        ${deck.open ? `<div class="flash-back">${back}</div>` : `<button class="btn primary" data-act="reveal">Reveal <kbd>Space</kbd></button>`}
      </div>
      <div class="deck-nav"><button class="btn" data-act="prev">← Prev</button><span class="muted">${deck.i + 1} / ${cards.length}</span><button class="btn" data-act="next">Next →</button></div>
    `);
    const rerender = () => viewReview();
    acts.filter = (t) => { deck = { filter: t.dataset.f, i: 0, open: false }; rerender(); };
    acts.reveal = () => { deck.open = true; rerender(); };
    acts.prev = () => { deck.i = (deck.i - 1 + cards.length) % cards.length; deck.open = false; rerender(); };
    acts.next = () => { deck.i = (deck.i + 1) % cards.length; deck.open = false; rerender(); };
    keyHandler = (e) => {
      if (e.key === ' ' || e.key === 'Enter') { if (!deck.open) acts.reveal(); else acts.next(); return true; }
      if (e.key === 'ArrowRight') { acts.next(); return true; }
      if (e.key === 'ArrowLeft') { acts.prev(); return true; }
    };
  }

  function deckCards(f) {
    if (f === 'ib') return S.IB.map((q) => Object.assign({ section: 's5' }, q));
    if (f === 'pers') return S.PERSONALITY;
    return S.SJT.map((q) => Object.assign({ section: 's4b' }, q));
  }

  // ---------------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------------
  function sparkBars(vals, fmt) {
    if (!vals.length) return '<p class="muted small">No attempts yet.</p>';
    const w = 14, gap = 4, h = 48;
    const bars = vals.map((v, i) => `<rect x="${i * (w + gap)}" y="${(h - v * h).toFixed(1)}" width="${w}" height="${Math.max(2, v * h).toFixed(1)}" rx="2"><title>${fmt(v)}</title></rect>`).join('');
    return `<svg class="spark" viewBox="0 0 ${vals.length * (w + gap)} ${h}" width="${vals.length * (w + gap)}" height="${h}" role="img" aria-label="Accuracy trend">${bars}</svg>`;
  }

  function viewDashboard() {
    const H = store.history;
    const blitzBest = Math.max(0, ...store.blitz.map((b) => b.score));
    const secTrend = (id) => H.filter((h) => h.sections[id]).slice(-12).map((h) => h.sections[id]);
    const trendCard = (id) => {
      const t = secTrend(id);
      const last = t[t.length - 1];
      const avgAcc = t.length ? t.reduce((a, s) => a + s.accuracy, 0) / t.length : 0;
      return `<div class="rcard"><p class="eyebrow">${SECTIONS[id].name}</p>${sparkBars(t.map((s) => s.accuracy), (v) => Math.round(v * 100) + '%')}
        <ul class="kv"><li><span>Attempts</span><b>${H.filter((h) => h.sections[id]).length}</b></li><li><span>Avg accuracy (last 12)</span><b>${t.length ? Math.round(avgAcc * 100) + '%' : '–'}</b></li><li><span>Last pace</span><b>${last ? last.avgSec.toFixed(1) + 's' : '–'}</b></li></ul></div>`;
    };
    const lastP = H.filter((h) => h.sections.s4a).slice(-1)[0];
    const rows = H.slice().reverse().slice(0, 30).map((h) => {
      const parts = Object.entries(h.sections).map(([id, s]) => id === 's4a' ? `Personality ${s.alignment}% / cons. ${s.consistency}%` : `${SECTIONS[id].name.split(' ')[0]} ${s.score}/${s.max || s.n}`).join(' · ');
      return `<tr><td>${new Date(h.t).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td><td>${h.mode}</td><td>${PACE[h.pace] ? PACE[h.pace].label : ''}</td><td>${parts}</td></tr>`;
    }).join('');
    frame('dashboard', `
      <h1>Dashboard</h1>
      <section class="facts">
        <div class="fact"><span class="fact-n">${H.length}</span><span>sessions completed</span></div>
        <div class="fact"><span class="fact-n">${H.filter((h) => h.mode === 'mock').length}</span><span>full mocks</span></div>
        <div class="fact"><span class="fact-n">${blitzBest}</span><span>blitz best</span></div>
        <div class="fact"><span class="fact-n">${lastP ? lastP.sections.s4a.alignment + '%' : '–'}</span><span>latest profile alignment</span></div>
      </section>
      <div class="rgrid">${['s1', 's2', 's3'].map(trendCard).join('')}</div>
      ${lastP ? `<section class="panel"><h2>Latest personality profile</h2><div class="radar-wrap">${radar(lastP.sections.s4a.traits)}<p class="muted small"><span class="legend lg-you"></span> you · <span class="legend lg-target"></span> illustrative target.<br>Consistency ${lastP.sections.s4a.consistency}%.</p></div></section>` : ''}
      <section class="panel"><h2>History</h2>${rows ? `<div class="table-wrap"><table><thead><tr><th>When</th><th>Mode</th><th>Pace</th><th>Scores</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">No sessions yet. <a href="#/suited/practice">Start practising →</a></p>'}</section>
      <p class="muted small">Progress is saved in this browser only. <button class="linkish" data-act="clear">Clear all data</button></p>
    `);
    acts.clear = (t) => {
      if (!armed(t, 'Click again to delete all history')) return;
      store.history = []; store.blitz = []; save(); viewDashboard();
    };
  }

  // ---------------------------------------------------------------------------
  // Strategy (static content)
  // ---------------------------------------------------------------------------
  function viewStrategy() {
    frame('strategy', `
      <h1>Strategy</h1>
      <p class="lead">Short, practical rules for each section. Read once, then drill until they are automatic.</p>
      <section class="panel"><h2>General</h2><ul>
        <li><b>Wrong answers cost points. Never guess blindly.</b> On the timed sections a skip (0) beats a wrong answer (−1).</li>
        <li>Keep a steady rhythm. Don't spend 30 seconds on one item: skip it and move on.</li>
        <li>You don't need to finish every section. Candidates report that most people don't. Accuracy on the questions you answer matters more.</li>
      </ul></section>

      <section class="panel"><h2>Same or Different</h2><ul>
        <li>Compare left to right in chunks of 2–3 characters, not one character at a time.</li>
        <li>For long strings, <b>check the ends first</b>: differences like to hide at the end.</li>
        <li>Watch for case flips (<code>k</code> vs <code>K</code>), look-alikes (<code>l</code>/<code>1</code>, <code>O</code>/<code>0</code>) and swapped neighbours (<code>ab</code> → <code>ba</code>).</li>
        <li>If you can't spot a difference in about 5 seconds, it is probably "Same".</li>
        <li>Keep your fingers on <kbd>S</kbd> and <kbd>D</kbd>. Moving the mouse costs you time.</li>
      </ul></section>

      <section class="panel"><h2>Match the String</h2><ul>
        <li>Find the <b>anchor characters</b> first: capitals and symbols stand out (<code>F</code>, <code>D</code>, <code>#</code>, <code>^</code>).</li>
        <li>Rule out obvious non-matches before you tick anything.</li>
        <li>Zero matches is a valid answer. Don't force a tick.</li>
        <li>Compare each option with the target, not with the other options.</li>
      </ul></section>

      <section class="panel"><h2>If-then logic: the six rules</h2>
        <p>Given the rule <b>If A, then B</b>, work out which form the statement takes and apply the matching verdict:</p>
        <div class="table-wrap"><table class="rules">
          <thead><tr><th>Statement</th><th>Name</th><th>Verdict</th></tr></thead>
          <tbody>
            <tr><td>If not B → not A</td><td>Contrapositive</td><td><span class="badge ok">True</span></td></tr>
            <tr><td>Either B or not A</td><td>Disjunction</td><td><span class="badge ok">True</span></td></tr>
            <tr><td>If B → A</td><td>Converse</td><td><span class="badge skip">Uncertain</span></td></tr>
            <tr><td>If not A → not B</td><td>Inverse</td><td><span class="badge skip">Uncertain</span></td></tr>
            <tr><td>If A → not B</td><td>Contradiction</td><td><span class="badge no">False</span></td></tr>
            <tr><td>If not B → A</td><td>Contradicts the contrapositive</td><td><span class="badge no">False</span></td></tr>
          </tbody>
        </table></div>
        <p class="muted">Example: "If you've been to the White House, you've been to Washington DC." Its contrapositive, "If you haven't been to DC, you haven't been to the White House", is certain. "If you've been to DC, you've been to the White House" is uncertain, because you can visit DC without going to the White House.</p>
        <p><b>Chains:</b> A → B and B → C together give A → C, and its contrapositive not C → not A. Reversing either direction is Uncertain.</p>
      </section>

      <section class="panel"><h2>Number series checklist</h2><ol>
        <li>Constant difference? (+n)</li>
        <li>Constant ratio? (×2, ×3, ÷2)</li>
        <li>Do the differences themselves follow a pattern? (+1, +3, +5…)</li>
        <li><b>Alternating or interleaved?</b> Look at odd and even positions separately. For example, <code>13 | 45 | 26 | −15 | 52 | 5 | 104 | ?</code> has odd terms doubling and even terms ÷(−3), so the answer is −1⅔.</li>
        <li>Squares, cubes, or sum of the previous two?</li>
      </ol></section>

      <section class="panel"><h2>Syllogisms: "must be true"</h2><ul>
        <li>Trust only what is <b>guaranteed</b>. Ignore what merely sounds right or is true in real life.</li>
        <li>"All A are B" does <b>not</b> mean "All B are A". "Some A are B" <b>does</b> mean "Some B are A".</li>
        <li>Picture nested circles: if A sits inside B, and B sits inside C, then A sits inside C.</li>
      </ul></section>

      <section class="panel"><h2>Personality</h2><ul>
        <li>Answer as the <b>consistent professional version of yourself</b>. Banks look for conscientiousness, resilience, integrity and teamwork.</li>
        <li>The same trait is asked several ways, sometimes with reversed wording. Inconsistent answers get flagged, so don't game individual items.</li>
        <li>For junior roles, show confidence but also a willingness to take direction. Maximum dominance is not the goal.</li>
      </ul></section>

      <section class="panel"><h2>Situational judgement: banker logic</h2><ul>
        <li><b>Client first, data-driven.</b> Back reassurance with evidence, never with pressure.</li>
        <li><b>Escalate through proper channels.</b> Confidentiality, inside information and conflicts of interest go to your manager or compliance promptly.</li>
        <li><b>Resolve conflict directly</b> before involving a manager.</li>
        <li><b>Own mistakes quickly</b>, and bring a fix.</li>
        <li><b>Accept stretch work with a plan</b>: research it, then confirm your approach early.</li>
        <li>Be open about capacity early. A surprise at the deadline is the worst outcome.</li>
      </ul></section>

      <section class="panel"><h2>On the day</h2><ul>
        <li>The link arrives by email after you apply. <b>Check your spam folder.</b> William Blair gives 48 hours.</li>
        <li>Use a real computer, not a phone, with a stable connection, somewhere quiet, and when you are rested.</li>
        <li>Take a full mock here at the same time of day you plan to sit the real one.</li>
      </ul></section>
      ${DISCLAIMER}
    `);
  }

  // ---------------------------------------------------------------------------
  // What to expect (static content)
  // ---------------------------------------------------------------------------
  function viewExpect() {
    frame('expect', `
      <h1>What to expect</h1>
      <section class="panel"><h2>What Suited is</h2>
        <p>Suited is an AI-driven hiring assessment platform used mainly by investment banks and law firms to screen early-career candidates (internships, Spring Weeks and graduate schemes) before first-round interviews.</p>
        <p>Firms reported to use it include William Blair, Houlihan Lokey, PJT Partners, Lazard, Morgan Stanley, RBS and Harris Williams in banking, and Skadden and Kirkland &amp; Ellis in law.</p>
        <p><b>Scoring is customised per employer.</b> Results are judged against that firm's criteria for the role. There is no published pass mark.</p>
      </section>

      <section class="panel"><h2>Format (from candidate reports)</h2>
        <div class="table-wrap"><table>
          <thead><tr><th>Part</th><th>What you do</th><th>Measures</th></tr></thead>
          <tbody>
            <tr><td>Same or Different</td><td>Decide whether two short character strings are identical</td><td>Attention to detail under time pressure</td></tr>
            <tr><td>Match the String</td><td>Tick every option that exactly matches a target (0–2 may match)</td><td>Visual scanning, selective attention</td></tr>
            <tr><td>Logical / numerical</td><td>If-then logic, syllogisms, number series and short numerical problems</td><td>Reasoning, numerical ability</td></tr>
            <tr><td>Psychometric</td><td>"How much is this like me?" ratings and forced choices, plus workplace scenarios</td><td>Traits, work style, stress response, culture fit</td></tr>
          </tbody>
        </table></div>
        <ul>
          <li>The cognitive part ("Essential Competencies") is roughly <b>15 minutes</b>, split into short timed sections of about 20 questions each, with an untimed example at the start of each section.</li>
          <li><b>Wrong answers reduce your score</b>, so guessing is not recommended.</li>
          <li>It must be taken on a <b>desktop or laptop</b>. It does not work on a phone.</li>
          <li>One candidate reported answering all 40 logic questions using the contrapositive rules. Most people do not finish.</li>
        </ul>
      </section>

      <section class="panel"><h2>Logistics</h2><ul>
        <li>The bank emails a Suited link after you apply. Check your spam folder.</li>
        <li>William Blair gives <b>48 hours</b> to complete it.</li>
        <li>Some candidates report that invitations to interview still asked them to finish the test, which suggests firms weigh it differently.</li>
      </ul></section>

      <section class="panel"><h2>Unknowns (stated honestly)</h2><ul>
        <li>Exact per-section time limits and question counts are not published. This site's "Realistic" pace is calibrated from candidate reports, and you can adjust it.</li>
        <li>Whether a wrong answer costs a full point or a fraction is unconfirmed. Set the penalty in <a href="#/suited/practice">Practice → Settings</a>.</li>
        <li>Banks customise the sections. The IB add-on is supplementary and may not appear.</li>
        <li>The personality "target profile" here is illustrative, based on commonly cited banking traits. It is not Suited's model.</li>
      </ul></section>

      <section class="panel"><h2>Sources</h2><ul class="small">
        <li><a href="https://www.wallstreetoasis.com/forum/investment-banking/how-important-is-the-suited-test" target="_blank" rel="noopener">WSO: How important is the Suited test?</a></li>
        <li><a href="https://www.wallstreetoasis.com/company/william-blair/interview/2024-william-blair-bridge-to-investment-banking-program" target="_blank" rel="noopener">WSO: William Blair interview insight</a></li>
        <li><a href="https://www.jobtestprep.co.uk/suited-assessments" target="_blank" rel="noopener">JobTestPrep: Suited assessment guide</a></li>
        <li><a href="https://www.howtoanalyzedata.net/how-to-pass-suited-hiring-assessment-test/" target="_blank" rel="noopener">howtoanalyzedata: Suited practice</a></li>
      </ul></section>
      ${DISCLAIMER}
    `);
  }
})(window.Suited);
