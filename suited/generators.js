/* Suited practice — procedural question generators. */
window.Suited = window.Suited || {};

(function (S) {
  // ---------- helpers ----------
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  S.util = { ri, pick, shuffle, cap, esc };

  // Build 4 multiple-choice options: correct + 3 unique distractors, shuffled.
  function mc(answer, candidates, fmt) {
    fmt = fmt || String;
    const seen = new Set([fmt(answer)]);
    const opts = [answer];
    for (const c of shuffle(candidates)) {
      const k = fmt(c);
      if (opts.length >= 4) break;
      if (!seen.has(k) && Number.isFinite(c) !== false) { seen.add(k); opts.push(c); }
    }
    let bump = 3;
    while (opts.length < 4) {
      const c = answer + bump * (bump % 2 ? 1 : -1);
      bump++;
      if (!seen.has(fmt(c))) { seen.add(fmt(c)); opts.push(c); }
    }
    const shuffled = shuffle(opts);
    return { options: shuffled.map(fmt), answer: shuffled.indexOf(answer) };
  }

  // =========================================================================
  // Perceptual strings (Sections 1 & 2)
  // =========================================================================
  const LOWER = 'abcdefghijkmnopqrstuvwxyz'; // no 'l'
  const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no 'I', 'O'
  const DIGITS = '23456789'; // no 0/1
  const SYMBOLS = ';$#@^%&*!?';
  const LOOKALIKE = { l: '1', '1': 'l', I: 'l', O: '0', '0': 'O', S: '5', '5': 'S', Z: '2', '2': 'Z', B: '8', '8': 'B', o: '0', g: '9', '9': 'g' };

  function charset(level) {
    let c = LOWER + UPPER + DIGITS + SYMBOLS + LOWER; // weight lowercase
    if (level === 'brutal') c += 'lIO01';
    return c;
  }

  function genString(len, level, opts) {
    opts = opts || {};
    const cs = charset(level);
    let s;
    do {
      s = '';
      for (let i = 0; i < len; i++) s += pick(cs);
    } while (opts.needAnchors && !(/[A-Z]/.test(s) && /[;$#@^%&*!?]/.test(s) && /[a-z]/.test(s)));
    return s;
  }

  function isLetter(ch) { return /[a-zA-Z]/.test(ch); }

  // Apply exactly one mutation so that the result differs from s.
  function mutate(s, level, kinds) {
    kinds = kinds || ['sub', 'case', 'swap', 'symbol'];
    if (level === 'brutal') kinds = kinds.concat(['lookalike', 'lookalike', 'insert', 'delete']);
    for (let tries = 0; tries < 50; tries++) {
      const kind = pick(kinds);
      const a = s.split('');
      if (kind === 'sub') {
        const i = ri(0, a.length - 1);
        const pool = /[;$#@^%&*!?]/.test(a[i]) ? SYMBOLS : /\d/.test(a[i]) ? DIGITS : /[A-Z]/.test(a[i]) ? UPPER : LOWER;
        const c = pick(pool);
        if (c === a[i]) continue;
        a[i] = c;
      } else if (kind === 'case') {
        const idx = a.map((c, i) => (isLetter(c) && c.toLowerCase() !== c.toUpperCase() ? i : -1)).filter((i) => i >= 0);
        if (!idx.length) continue;
        const i = pick(idx);
        const flipped = a[i] === a[i].toLowerCase() ? a[i].toUpperCase() : a[i].toLowerCase();
        if (flipped === a[i]) continue;
        a[i] = flipped;
      } else if (kind === 'swap') {
        const i = ri(0, a.length - 2);
        if (a[i] === a[i + 1]) continue;
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
      } else if (kind === 'symbol') {
        const idx = a.map((c, i) => (SYMBOLS.includes(c) ? i : -1)).filter((i) => i >= 0);
        if (!idx.length) continue;
        const i = pick(idx);
        const c = pick(SYMBOLS);
        if (c === a[i]) continue;
        a[i] = c;
      } else if (kind === 'lookalike') {
        const idx = a.map((c, i) => (LOOKALIKE[c] ? i : -1)).filter((i) => i >= 0);
        if (!idx.length) continue;
        const i = pick(idx);
        a[i] = LOOKALIKE[a[i]];
      } else if (kind === 'insert') {
        a.splice(ri(1, a.length - 1), 0, pick(charset(level)));
      } else if (kind === 'delete') {
        a.splice(ri(1, a.length - 2), 1);
      }
      const out = a.join('');
      if (out !== s) return { str: out, kind };
    }
    // Fallback: guaranteed substitution at the end.
    const last = s[s.length - 1] === 'x' ? 'y' : 'x';
    return { str: s.slice(0, -1) + last, kind: 'sub' };
  }

  const MUTATION_LABEL = {
    sub: 'one character substituted', case: 'upper/lower case changed', swap: 'two adjacent characters swapped',
    symbol: 'one symbol swapped', lookalike: 'look-alike character (e.g. l / 1, O / 0)', insert: 'extra character inserted', delete: 'one character missing',
  };
  S.MUTATION_LABEL = MUTATION_LABEL;

  // Return the differing region of two strings as [htmlA, htmlB].
  S.diffHtml = function (a, b) {
    if (a === b) return [esc(a), esc(b)];
    let p = 0;
    while (p < a.length && p < b.length && a[p] === b[p]) p++;
    let s = 0;
    while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
    const wrap = (str) => {
      const mid = str.slice(p, str.length - s);
      return esc(str.slice(0, p)) + '<mark>' + (mid ? esc(mid) : '&#8203;') + '</mark>' + esc(str.slice(str.length - s));
    };
    return [wrap(a), wrap(b)];
  };

  S.genSameDiff = function (level) {
    const len = level === 'relaxed' ? ri(6, 8) : level === 'brutal' ? ri(8, 11) : ri(7, 10);
    const left = genString(len, level);
    const same = Math.random() < 0.5;
    if (same) return { section: 's1', left, right: left, same: true };
    const m = mutate(left, level);
    return Math.random() < 0.5
      ? { section: 's1', left, right: m.str, same: false, kind: m.kind }
      : { section: 's1', left: m.str, right: left, same: false, kind: m.kind };
  };

  S.genMatch = function (level) {
    const len = level === 'relaxed' ? ri(7, 8) : level === 'brutal' ? ri(9, 11) : ri(8, 10);
    const target = genString(len, level, { needAnchors: true });
    const r = Math.random();
    const k = r < 0.2 ? 0 : r < 0.7 ? 1 : 2;
    const opts = [];
    const seen = new Set([target]);
    while (opts.length < 4 - k) {
      const m = mutate(target, level);
      if (!seen.has(m.str)) { seen.add(m.str); opts.push({ str: m.str, match: false, kind: m.kind }); }
    }
    for (let i = 0; i < k; i++) opts.push({ str: target, match: true });
    const shuffled = shuffle(opts);
    return {
      section: 's2', target, options: shuffled.map((o) => o.str), kinds: shuffled.map((o) => o.kind || null),
      matches: shuffled.map((o, i) => (o.match ? i : -1)).filter((i) => i >= 0),
    };
  };

  // =========================================================================
  // Section 3 — logical reasoning
  // =========================================================================

  // ---------- number series ----------
  function seriesRule(tier) {
    const easy = [
      () => { const a = ri(1, 30), d = pick([2, 3, 4, 5, 6, 7, 9, 11, 12, -3, -4, -6]); const t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] + d); return { t, why: `Add ${d} each time.`, d }; },
      () => { const a = ri(1, 5), r = pick([2, 3]); const t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] * r); return { t, why: `Multiply by ${r} each time.` }; },
      () => { const r = 2, a = r ** ri(6, 8) * pick([1, 3]); const t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] / r); return { t, why: 'Halve each time.' }; },
    ];
    const medium = [
      () => { const a = ri(1, 20), d0 = ri(1, 5), dd = ri(1, 3); const t = [a]; let d = d0; for (let i = 1; i < 6; i++) { t.push(t[i - 1] + d); d += dd; } return { t, why: `The differences grow by ${dd} each time (+${d0}, +${d0 + dd}, +${d0 + 2 * dd}, …).` }; },
      () => { const m = pick([2, 3]), p = ri(1, 9), a = ri(1, 6); const t = [a]; for (let i = 1; i < 7; i++) t.push(i % 2 ? t[i - 1] * m : t[i - 1] + p); return { t, why: `Alternate ×${m} and +${p}.` }; },
      () => { const k = ri(1, 6), c = pick([0, 0, 1, -1, 2, 3]); const t = []; for (let n = k; n < k + 6; n++) t.push(n * n + c); return { t, why: `Squares${c ? (c > 0 ? ' plus ' + c : ' minus ' + -c) : ''}: ${k}², ${k + 1}², ${k + 2}², …` }; },
      () => { const a = ri(1, 15), d1 = pick([2, 3, 4, 5]), b = ri(20, 60), d2 = pick([-2, -3, -4, -5, 6]); const t = []; for (let i = 0; i < 8; i++) t.push(i % 2 === 0 ? a + d1 * (i / 2) : b + d2 * ((i - 1) / 2)); return { t, why: `Two interleaved series: odd positions ${d1 > 0 ? '+' : ''}${d1}, even positions ${d2 > 0 ? '+' : ''}${d2}.` }; },
      () => { const m = pick([2, 3]), s = pick([1, 2, 3]), a = ri(2, 6); const t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] * m - s); return { t, why: `Each term is the previous ×${m} then −${s}.` }; },
    ];
    const hard = [
      () => { const a = ri(1, 6), b = ri(2, 8); const t = [a, b]; for (let i = 2; i < 7; i++) t.push(t[i - 1] + t[i - 2]); return { t, why: 'Each term is the sum of the previous two.' }; },
      () => { const k = ri(1, 4), c = pick([0, 1, -1, 2]); const t = []; for (let n = k; n < k + 5; n++) t.push(n ** 3 + c); return { t, why: `Cubes${c ? (c > 0 ? ' plus ' + c : ' minus ' + -c) : ''}: ${k}³, ${k + 1}³, …` }; },
      () => { const a = ri(2, 7) * 3, b = ri(1, 9) * 27 * pick([1, -1]); const t = []; let x = a, y = b; for (let i = 0; i < 8; i++) { if (i % 2 === 0) { t.push(x); x *= 2; } else { t.push(y); y = y / -3; } } if (t.some((v) => !Number.isInteger(v))) return null; return { t, why: 'Two alternating series: odd positions double; even positions are divided by −3.' }; },
      () => { const a = ri(1, 4); const t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] * (i + 1)); return { t, why: 'Multiply by 2, then 3, then 4, … (factorial-style growth).' }; },
      () => { const a = ri(2, 9), d = ri(2, 4); const t = [a], ops = []; let step = d; for (let i = 1; i < 7; i++) { const k = i % 2 ? step : -(step - 1); t.push(t[i - 1] + k); ops.push(k > 0 ? '+' + k : '−' + -k); if (i % 2 === 0) step += 1; } return { t, why: `Alternately add and subtract, both steps growing by 1: ${ops.join(', ')}.` }; },
      () => { const a = ri(10, 40), dd = ri(2, 4); const t = [a]; let d = 1; for (let i = 1; i < 6; i++) { t.push(t[i - 1] + d); d *= dd; } return { t, why: `The differences multiply by ${dd} each time (1, ${dd}, ${dd * dd}, …).` }; },
    ];
    const pool = tier === 'easy' ? easy : tier === 'medium' ? medium : hard;
    let r = null;
    while (!r) r = pick(pool)();
    return r;
  }

  function genSeries(tier) {
    const { t, why } = seriesRule(tier);
    const blank = tier === 'easy' || Math.random() < 0.6 ? t.length - 1 : ri(2, t.length - 2);
    const ans = t[blank];
    const diff = blank > 0 ? t[blank] - t[blank - 1] : 1;
    const cands = [ans + 1, ans - 1, ans + 2, ans - 2, ans + diff, ans - diff, ans * 2, t[blank - 1] + (t[blank - 1] - (t[blank - 2] ?? 0)), Math.round(ans * 1.5), ans + 10, -ans].filter((c) => c !== ans && Number.isFinite(c));
    const { options, answer } = mc(ans, cands);
    const shown = t.map((v, i) => (i === blank ? '<span class="blank">?</span>' : v)).join('<span class="sep">|</span>');
    return {
      section: 's3', kind: 'series', tier,
      prompt: '<p class="q-lead">Which number replaces the question mark?</p><div class="series">' + shown + '</div>',
      options, answer, explanation: why + ` The missing number is <b>${ans}</b>.`,
    };
  }

  // ---------- conditional (contrapositive) logic ----------
  const TFU = ['True', 'False', 'Uncertain'];

  function genConditional(tier) {
    const [A, B, C] = pick(S.CLAUSES);
    const chain = tier === 'hard' || (tier === 'medium' && Math.random() < 0.5);
    let premise, stmt, ans, why;
    if (!chain) {
      premise = `If ${A.p}, then ${B.p}.`;
      const forms = [
        [`If ${B.n}, then ${A.n}.`, 0, 'This is the <b>contrapositive</b> (not B → not A), the only conditional that is logically equivalent to A → B.'],
        [`Either ${B.p}, or ${A.n} (or both).`, 0, 'A → B is equivalent to "B or not A": either the result happens, or the condition did not.'],
        [`If ${B.p}, then ${A.p}.`, 2, 'This is the <b>converse</b> (B → A). B can happen for other reasons, so it is not guaranteed.'],
        [`If ${A.n}, then ${B.n}.`, 2, 'This is the <b>inverse</b> (not A → not B). The rule says nothing about what happens when A is false.'],
        [`If ${A.p}, then ${B.n}.`, 1, 'The rule says A always leads to B, so A → not B contradicts it.'],
        [`If ${B.n}, then ${A.p}.`, 1, 'By the contrapositive, not B → not A, so not B → A contradicts the rule.'],
      ];
      [stmt, ans, why] = pick(forms);
    } else {
      premise = `If ${A.p}, then ${B.p}. If ${B.p}, then ${C.p}.`;
      const forms = [
        [`If ${A.p}, then ${C.p}.`, 0, 'The rules chain together: A → B → C, so A → C.'],
        [`If ${C.n}, then ${A.n}.`, 0, 'The contrapositive of the chain A → C: not C → not A.'],
        [`If ${C.p}, then ${A.p}.`, 2, 'The converse of the chain. C could be true for other reasons.'],
        [`If ${A.n}, then ${C.n}.`, 2, 'The inverse of the chain. The rules do not say what happens when A is false.'],
        [`If ${A.p}, then ${C.n}.`, 1, 'A → B → C, so A guarantees C. A → not C contradicts the rules.'],
        [`If ${C.n}, then ${B.p}.`, 1, 'By the contrapositive of B → C, not C → not B. So not C → B contradicts the rules.'],
        [`If ${C.p}, then ${B.p}.`, 2, 'The converse of B → C, so not guaranteed.'],
        [`If ${B.n}, then ${A.n}.`, 0, 'The contrapositive of the first rule.'],
      ];
      [stmt, ans, why] = pick(forms);
    }
    return {
      section: 's3', kind: 'conditional', tier,
      prompt: `<p class="q-lead">Assume the statement below is true.</p><blockquote>${esc(cap(premise))}</blockquote><p>Is the following <b>True</b>, <b>False</b> or <b>Uncertain</b>?</p><blockquote class="stmt">${esc(cap(stmt))}</blockquote>`,
      options: TFU, answer: ans, explanation: why,
    };
  }

  // ---------- syllogisms ----------
  const SYLL = [
    { p: ['All A are B.', 'All B are C.'], valid: 'All A are C.', invalid: ['All C are A.', 'No A are C.', 'All C are B.', 'Some C are not B.'], why: 'A sits inside B and B sits inside C, so A sits inside C. The reverse direction is not guaranteed.' },
    { p: ['All A are B.', 'No B are C.'], valid: 'No A are C.', invalid: ['Some A are C.', 'All C are A.', 'Some C are B.', 'All B are A.'], why: 'Every A is a B, and nothing that is B is C, so no A can be C.' },
    { p: ['All A are B.', 'Some C are A.'], valid: 'Some C are B.', invalid: ['All C are B.', 'All B are C.', 'No C are B.', 'All B are A.'], why: 'The C that are A are also B (all A are B), so at least some C are B.' },
    { p: ['No A are B.', 'All C are A.'], valid: 'No C are B.', invalid: ['Some C are B.', 'All B are C.', 'All A are C.', 'Some B are C.'], why: 'Every C is an A, and no A is a B, so no C is a B.' },
    { p: ['All A are B.', 'Some B are C.'], valid: 'Some C are B.', invalid: ['Some A are C.', 'All A are C.', 'No A are C.', 'All C are B.'], why: '"Some B are C" can be reversed to "Some C are B". Nothing links A to C for certain, because the B that are C might not be A.' },
    { p: ['Some A are B.', 'All B are C.'], valid: 'Some A are C.', invalid: ['All A are C.', 'All C are B.', 'No A are C.', 'All C are A.'], why: 'The A that are B are also C, so some A are C. Not all A need to be B.' },
    { p: ['No A are B.', 'Some C are B.'], valid: 'Some C are not A.', invalid: ['No C are A.', 'Some A are C.', 'All B are C.', 'Some A are B.'], why: 'The C that are B cannot be A (no A are B), so some C are not A.' },
    { p: ['Some A are B.', 'No B are C.'], valid: 'Some A are not C.', invalid: ['No A are C.', 'Some C are A.', 'All A are B.', 'Some B are C.'], why: 'The A that are B cannot be C, so some A are not C. Other A might still be C.' },
  ];

  function genSyllogism() {
    const f = pick(SYLL);
    const [a, b, c] = shuffle(S.NOUNS).slice(0, 3);
    const sub = (s) => s.replace(/\bA\b/g, a).replace(/\bB\b/g, b).replace(/\bC\b/g, c);
    const wrong = shuffle(f.invalid).slice(0, 3);
    const opts = shuffle([f.valid].concat(wrong));
    return {
      section: 's3', kind: 'syllogism', tier: 'medium',
      prompt: `<p class="q-lead">Assume the statements are true.</p><blockquote>${esc(sub(f.p[0]))}<br>${esc(sub(f.p[1]))}</blockquote><p>Which of the following <b>must</b> be true?</p>`,
      options: opts.map(sub), answer: opts.indexOf(f.valid), explanation: sub(f.why),
    };
  }

  // ---------- numerical reasoning ----------
  const gbp = (n) => '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2, maximumFractionDigits: 2 });
  const pct = (n) => (Math.round(n * 10) / 10).toLocaleString('en-GB') + '%';
  const num = (n) => Math.round(n).toLocaleString('en-GB');

  const NUMERIC = [
    () => { const p = ri(8, 80) * 5, d = pick([10, 15, 20, 25, 30, 40]); const ans = p * (1 - d / 100); return { q: `A laptop costs ${gbp(p)}. It is discounted by ${d}%. What is the sale price?`, ans, c: [p - d, p * d / 100, ans * 0.9, p * (1 - d / 200), ans + 5], fmt: gbp, why: `${gbp(p)} × (1 − ${d / 100}) = ${gbp(ans)}.` }; },
    () => { const a = pick([10, 20, 25, 30, 40, 50]), b = pick([10, 20, 25, 30, 40]); const ans = ((1 + a / 100) * (1 - b / 100) - 1) * 100; return { q: `A company's revenue rises by ${a}% in Year 1 and falls by ${b}% in Year 2. What is the overall percentage change over the two years?`, ans, c: [a - b, a + b, -(a - b), ans + 5, ans - 5], fmt: (v) => (v > 0 ? '+' : '') + pct(v), why: `Multiply the factors: ${1 + a / 100} × ${1 - b / 100} = ${Math.round((1 + a / 100) * (1 - b / 100) * 1000) / 1000}, a change of ${(ans > 0 ? '+' : '') + pct(ans)}. You cannot simply add the percentages.` }; },
    () => { const m = ri(2, 5), n = ri(1, m - 1), f = (m + n) * ri(2, 12) * 100000; const ans = (f * m) / (m + n); return { q: `A £${num(f)} advisory fee is split between two banks in the ratio ${m}:${n}. How much does the bank with the larger share receive?`, ans, c: [f / 2, (f * n) / (m + n), f / m, (f * m) / (m + n + 1), ans + 100000], fmt: gbp, why: `${m} ÷ (${m} + ${n}) × £${num(f)} = ${gbp(ans)}.` }; },
    () => { const n = pick([20, 40, 50, 60, 80]), g = pick([10, 15, 20, 25, 50]), k = ri(2, 7); const ans = n * (1 + g / 100) - k; return { q: `A deal team of ${n} grows by ${g}%, and then ${k} people leave. How many people are now on the team?`, ans, c: [n + g - k, n * (1 + g / 100), ans + k, ans - 1, (n - k) * (1 + g / 100) + 1], fmt: num, why: `${n} × ${1 + g / 100} = ${n * (1 + g / 100)}, minus ${k} = ${ans}.` }; },
    () => { const r = ri(4, 20) * 50, m = pick([10, 15, 20, 25, 30, 35, 40]); const cst = r * (1 - m / 100); const ans = m; return { q: `A business has revenue of £${num(r)}m and total costs of £${num(cst)}m. What is its profit margin?`, ans, c: [100 - m, (cst / r) * 100 / 2, m + 5, m - 5, (r - cst) / cst * 100], fmt: pct, why: `Profit = £${num(r - cst)}m. £${num(r - cst)}m ÷ £${num(r)}m = ${pct(m)}.` }; },
    () => { const v = pick([100, 200, 400, 500, 800, 1000]), g = pick([10, 20, 5, 50]); const ans = v * (1 + g / 100) ** 2; return { q: `An investment of £${num(v)}k grows by ${g}% a year, compounded annually. What is it worth after 2 years?`, ans, c: [v * (1 + 2 * g / 100), v * (1 + g / 100), ans + v * 0.01, v * (1 + g / 100) ** 3], fmt: (x) => '£' + (Math.round(x * 10) / 10).toLocaleString('en-GB') + 'k', why: `£${num(v)}k × ${1 + g / 100}² = £${Math.round(ans * 10) / 10}k. Compounding beats simple interest (£${num(v * (1 + 2 * g / 100))}k).` }; },
    () => { const g = pick([20, 25, 50, 10]), orig = ri(4, 40) * 20; const now = orig * (1 + g / 100); return { q: `After a ${g}% price increase, a share costs ${gbp(now)}. What was the price before the increase?`, ans: orig, c: [now * (1 - g / 100), now - g, orig + 10, now / (1 + g / 50)], fmt: gbp, why: `Divide by ${1 + g / 100}, not subtract ${g}%: ${gbp(now)} ÷ ${1 + g / 100} = ${gbp(orig)}.` }; },
    () => { const e = ri(4, 30) * 10, mult = pick([6, 7, 8, 9, 10, 12]); const debt = ri(1, 10) * 50; const ans = e * mult - debt; return { q: `A company has EBITDA of £${e}m and trades at ${mult}× EV/EBITDA. Net debt is £${debt}m. What is its equity value?`, ans, c: [e * mult, e * mult + debt, e * (mult - 1) - debt, ans + e], fmt: (x) => '£' + num(x) + 'm', why: `EV = £${e}m × ${mult} = £${num(e * mult)}m. Equity value = EV − net debt = £${num(ans)}m.` }; },
    () => { const a = ri(2, 8) * 10, b = ri(2, 8) * 10, wa = pick([1, 2, 3]), wb = pick([1, 2, 3]); if (a === b) return null; const ans = (a * wa + b * wb) / (wa + wb); return { q: `Fund X returned ${a}% and Fund Y returned ${b}%. If ${wa} parts are invested in X for every ${wb} parts in Y, what is the blended return?`, ans, c: [(a + b) / 2, (a * wb + b * wa) / (wa + wb), ans + 2, ans - 2], fmt: pct, why: `(${a} × ${wa} + ${b} × ${wb}) ÷ ${wa + wb} = ${pct(ans)}.` }; },
    () => { const h = pick([12, 14, 15, 16]), d = pick([5, 6]), w = pick([4, 6, 8]); const ans = h * d * w; return { q: `An analyst works ${h} hours a day, ${d} days a week, for a ${w}-week live deal. How many hours in total?`, ans, c: [h * d, h * w * 5, ans + h * w, ans - h * d], fmt: num, why: `${h} × ${d} × ${w} = ${num(ans)} hours.` }; },
  ];

  function genNumeric(tier) {
    let r = null;
    while (!r) r = pick(NUMERIC)();
    const { options, answer } = mc(r.ans, r.c.filter((x) => Number.isFinite(x) && r.fmt(x) !== r.fmt(r.ans)), r.fmt);
    return { section: 's3', kind: 'numeric', tier, prompt: `<p class="q-lead">${esc(r.q)}</p>`, options, answer, explanation: r.why };
  }

  // ---------- letter series & codes ----------
  const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const shiftL = (ch, k) => AZ[(((AZ.indexOf(ch) + k) % 26) + 26) % 26];
  const WORDS = ['TEAM', 'DEAL', 'BANK', 'FUND', 'RISK', 'BOND', 'LOAN', 'CASH', 'DEBT', 'GAIN', 'LEAD', 'PLAN', 'DESK', 'FIRM', 'NOTE', 'RATE', 'SELL', 'MODEL', 'TRADE', 'PITCH', 'ASSET', 'VALUE', 'CLIENT', 'MERGER'];

  function letterDistractors(ans) {
    const c = new Set();
    const arr = ans.split('');
    while (c.size < 6) {
      const a = arr.slice();
      const i = ri(0, a.length - 1);
      a[i] = shiftL(a[i], pick([1, -1, 2, -2]));
      const s = a.join('');
      if (s !== ans) c.add(s);
    }
    if (ans.length > 1) c.add(ans.split('').reverse().join(''));
    return [...c].filter((s) => s !== ans);
  }

  function mcStr(ans, cands) {
    const opts = shuffle([ans].concat(shuffle(cands).slice(0, 3)));
    return { options: opts, answer: opts.indexOf(ans) };
  }

  function genLetters(tier) {
    const type = tier === 'easy' ? pick(['shift', 'code']) : tier === 'medium' ? pick(['shift2', 'code', 'grow']) : pick(['revcode', 'shift2', 'grow']);
    if (type === 'shift' || type === 'shift2' || type === 'grow') {
      const start = ri(0, 25);
      const a = type === 'shift' ? ri(2, 5) : ri(1, 4), b = ri(2, 6);
      const t = [AZ[start]];
      let step = a;
      for (let i = 1; i < 6; i++) {
        const k = type === 'shift' ? a : type === 'shift2' ? (i % 2 ? a : b) : step;
        t.push(shiftL(t[i - 1], k));
        if (type === 'grow') step++;
      }
      const ans = t.pop();
      const why = type === 'shift' ? `Each letter moves forward ${a} places in the alphabet.` : type === 'shift2' ? `Alternately move forward ${a} and ${b} places.` : `Move forward ${a}, then ${a + 1}, then ${a + 2}, … places.`;
      const cands = [shiftL(ans, 1), shiftL(ans, -1), shiftL(ans, 2), shiftL(ans, -2), shiftL(ans, 3)];
      const { options, answer } = mcStr(ans, [...new Set(cands)].filter((x) => x !== ans));
      return { section: 's3', kind: 'letters', tier, prompt: `<p class="q-lead">Which letter comes next?</p><div class="series">${t.join('<span class="sep">|</span>')}<span class="sep">|</span><span class="blank">?</span></div>`, options, answer, explanation: why + ` Answer: <b>${ans}</b>. (Wraps from Z back to A.)` };
    }
    const rev = type === 'revcode';
    const k = pick([1, 2, 3, -1]);
    const [w1, w2] = shuffle(WORDS.filter((w) => w.length <= (tier === 'hard' ? 6 : 5))).slice(0, 2);
    const enc = (w) => (rev ? w.split('').reverse() : w.split('')).map((c) => shiftL(c, k)).join('');
    const ans = enc(w2);
    const kTxt = k > 0 ? `+${k}` : `${k}`;
    const why = (rev ? `Reverse the word (${w1} → ${w1.split('').reverse().join('')}), then shift each letter ${kTxt}.` : `Shift each letter ${kTxt} place${Math.abs(k) > 1 ? 's' : ''} in the alphabet.`) + ` ${w2} → <b>${ans}</b>.`;
    const cands = letterDistractors(ans).concat([rev ? w2.split('').map((c) => shiftL(c, k)).join('') : w2.split('').reverse().map((c) => shiftL(c, k)).join('')]);
    const { options, answer } = mcStr(ans, [...new Set(cands)].filter((x) => x !== ans));
    return { section: 's3', kind: 'letters', tier, prompt: `<p class="q-lead">If <b class="mono">${w1}</b> is coded as <b class="mono">${enc(w1)}</b>, how is <b class="mono">${w2}</b> coded?</p>`, options: options.map((o) => `<span class="mono">${o}</span>`), answer, explanation: why };
  }

  // ---------- shapes (SVG) ----------
  function polySvg(sides, rot, size) {
    size = size || 64;
    const r = size * 0.4, cx = size / 2, cy = size / 2;
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = (Math.PI * 2 * i) / sides - Math.PI / 2 + ((rot || 0) * Math.PI) / 180;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return `<svg class="shape" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-label="${sides}-sided shape"><polygon points="${pts.join(' ')}" /></svg>`;
  }
  function arrowSvg(deg, size) {
    size = size || 64;
    return `<svg class="shape" viewBox="0 0 64 64" width="${size}" height="${size}" aria-label="arrow at ${deg} degrees"><g transform="rotate(${deg} 32 32)"><line x1="32" y1="52" x2="32" y2="14" /><polyline points="22,24 32,12 42,24" /><circle cx="32" cy="52" r="3" class="dot" /></g></svg>`;
  }

  function genShape(tier) {
    const type = tier === 'easy' ? pick(['names', 'poly']) : pick(['poly', 'arrow', 'names']);
    if (type === 'names') {
      const step = tier === 'easy' ? 1 : pick([1, 2]);
      const start = ri(0, S.SHAPES.length - 1 - 3 * step);
      const seq = [0, 1, 2].map((i) => S.SHAPES[start + i * step]);
      const ans = S.SHAPES[start + 3 * step];
      const cands = S.SHAPES.filter((s) => s !== ans && !seq.includes(s)).map((s) => s.name);
      const { options, answer } = mcStr(ans.name, cands);
      return { section: 's3', kind: 'shapes', tier, prompt: `<p class="q-lead">What comes next?</p><div class="series">${seq.map((s) => s.name).join(' <span class="sep">→</span> ')} <span class="sep">→</span> <span class="blank">?</span></div>`, options, answer, explanation: `Side counts go ${seq.map((s) => s.sides).join(', ')}, so the next shape has ${ans.sides} sides: <b>${ans.name}</b>.` };
    }
    if (type === 'poly') {
      const step = tier === 'easy' ? 1 : pick([1, 2, -1]);
      const start = step > 0 ? ri(3, 10 - 3 * step) : ri(7, 10);
      const rotStep = tier === 'hard' ? pick([15, 30]) : 0;
      const seq = [0, 1, 2].map((i) => polySvg(start + i * step, i * rotStep));
      const ansSides = start + 3 * step;
      const opts = [ansSides, ansSides + 1, ansSides - 1, ansSides + 2].filter((n) => n >= 3);
      while (opts.length < 4) opts.push(opts[opts.length - 1] + 1);
      const sh = shuffle(opts);
      return { section: 's3', kind: 'shapes', tier, prompt: `<p class="q-lead">Which shape comes next?</p><div class="shape-row">${seq.join('<span class="sep">→</span>')}<span class="sep">→</span><span class="blank">?</span></div>`, options: sh.map((n) => polySvg(n, 3 * rotStep)), answer: sh.indexOf(ansSides), explanation: `The number of sides changes by ${step > 0 ? '+' : ''}${step} each step (${start}, ${start + step}, ${start + 2 * step}), so the next shape has <b>${ansSides} sides</b>.${rotStep ? ` Each shape is also rotated a further ${rotStep}°.` : ''}` };
    }
    const step = pick([45, 90, 135, -45, -90]);
    const start = pick([0, 45, 90, 180, 270]);
    const seq = [0, 1, 2].map((i) => arrowSvg(start + i * step));
    const ans = start + 3 * step;
    const norm = (d) => ((d % 360) + 360) % 360;
    const cands = [ans + 45, ans - 45, ans + 90, ans + 180, ans - 90].map(norm).filter((d) => d !== norm(ans));
    const uniq = [...new Set(cands)].slice(0, 3);
    const sh = shuffle([norm(ans)].concat(uniq));
    return { section: 's3', kind: 'shapes', tier, prompt: `<p class="q-lead">Which arrow comes next?</p><div class="shape-row">${seq.join('<span class="sep">→</span>')}<span class="sep">→</span><span class="blank">?</span></div>`, options: sh.map((d) => arrowSvg(d)), answer: sh.indexOf(norm(ans)), explanation: `The arrow rotates ${Math.abs(step)}° ${step > 0 ? 'clockwise' : 'anticlockwise'} each step.` };
  }

  S.LOGIC_KINDS = {
    series: { label: 'Number series', gen: genSeries },
    conditional: { label: 'If-then logic (contrapositives)', gen: genConditional },
    syllogism: { label: 'Syllogisms', gen: genSyllogism },
    numeric: { label: 'Numerical reasoning', gen: genNumeric },
    letters: { label: 'Letter series & codes', gen: genLetters },
    shapes: { label: 'Shape progressions', gen: genShape },
  };

  // Mixed Section 3 set with an easy → medium → hard progression.
  S.genLogicSet = function (n, kindFilter) {
    const weights = { series: 4, conditional: 4, syllogism: 2, numeric: 3, letters: 2, shapes: 1 };
    const kinds = kindFilter && kindFilter !== 'all' ? [kindFilter] : Object.keys(weights).flatMap((k) => Array(weights[k]).fill(k));
    const out = [];
    const seen = new Set();
    let guard = 0;
    while (out.length < n && guard++ < n * 30) {
      const frac = out.length / Math.max(1, n - 1);
      const tier = frac < 0.34 ? 'easy' : frac < 0.7 ? 'medium' : 'hard';
      const q = S.LOGIC_KINDS[pick(kinds)].gen(tier);
      const key = q.prompt;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(q);
    }
    return out;
  };

  S.polySvg = polySvg;
})(window.Suited);
