/* quiz.js — banco de questões com seleção aleatória por tópico
 * Ativa-se apenas quando window.__questionBank estiver definido (layout: simulado).
 * Não depende de initQuiz() do autoterm.js — módulo completamente independente.
 */
(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // Utilitários
  // --------------------------------------------------------------------------

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Remove aspas ASCII (") e curly quotes (" " U+201C/U+201D) das extremidades do tópico
  function normalizeTopic(raw) {
    if (!raw) return null;
    const clean = raw.replace(/^["\u201c\u201d]+|["\u201c\u201d]+$/g, '').trim();
    return clean || null;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Id-base da questão: instâncias duplicadas (níveis altos) recebem sufixo
  // "#dup" para não colidirem no DOM, mas o histórico de erros é por id-base.
  function baseId(id) {
    return id ? String(id).split('#')[0] : '';
  }

  function formatTime(s) {
    const m  = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${m}:${ss}`;
  }

  // Contador "respondidas/total" no header — mesmo alinhamento das linhas de
  // resultado (buildTopicLine): correto à direita em 2, total à esquerda em 2.
  function formatCount(answered, total) {
    return `${String(answered).padStart(2, ' ')}/${String(total ?? 0).padEnd(2, ' ')}`;
  }

  // Percentagem de acerto ao vivo, alinhada em 3 colunas como no resultado
  // final. `null`/sem respostas → " --%".
  function formatLivePct(pct) {
    return (pct == null ? ' --' : String(pct).padStart(3, ' ')) + '%';
  }

  // Desce a tela até a explicação recém-exibida — alinha o topo dela logo
  // abaixo do header sticky (descontando sua altura) para incentivar a leitura.
  function scrollToExplanation(qEl) {
    const target = qEl.querySelector('.quiz-explanation.visible') ||
                   qEl.querySelector('.quiz-model-answer.visible');
    if (!target || typeof target.getBoundingClientRect !== 'function') return;
    if (typeof window.scrollTo !== 'function') return;
    const header = document.querySelector('header');
    const offset = (header ? header.getBoundingClientRect().height : 0) + 12;
    const reduce = window.matchMedia &&
                   window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = window.scrollY + target.getBoundingClientRect().top - offset;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }

  // --------------------------------------------------------------------------
  // Persistência de resultados (localStorage, por browser)
  // --------------------------------------------------------------------------

  const SCORES_KEY = 'fxlip_quiz_scores';

  function loadScores() {
    try { return JSON.parse(localStorage.getItem(SCORES_KEY)) || {}; }
    catch (_) { return {}; }
  }

  function saveExamScores(examId, topicStats) {
    try {
      const scores = loadScores();
      scores[examId] = {};
      for (const [topic, stats] of Object.entries(topicStats)) {
        scores[examId][topic] = {
          pct:     Math.round((stats.correct / stats.total) * 100),
          correct: stats.correct,
          total:   stats.total,
        };
      }
      localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
    } catch (_) {}
  }

  // --------------------------------------------------------------------------
  // Histórico de erros por questão (streak) — fixação de questões teimosas
  // --------------------------------------------------------------------------
  // Mapa por exame: { examId: { id: { streak, misses, hits, lastLevel } } }.
  // `streak` = erros seguidos sem acerto; zera ao acertar (a questão "graduou").
  // É o `streak` que define uma questão reincidente (nêmesis).

  const MISSES_KEY = 'fxlip_quiz_misses';

  function loadMisses() {
    try { return JSON.parse(localStorage.getItem(MISSES_KEY)) || {}; }
    catch (_) { return {}; }
  }

  // Atualiza o mapa de erros de UM exame a partir das questões respondidas.
  // Função pura: recebe o estado anterior, devolve um novo (não muta).
  // `wrongIds`/`answeredIds` são ids-base; ids repetidos contam uma única vez.
  function updateMissHistory(prev, wrongIds, answeredIds, level) {
    const out = {};
    for (const [id, e] of Object.entries(prev || {})) {
      out[id] = {
        streak:    e.streak    || 0,
        misses:    e.misses    || 0,
        hits:      e.hits      || 0,
        lastLevel: e.lastLevel || 0,
      };
    }
    const wrong = new Set((wrongIds || []).map(baseId));
    for (const rawId of new Set((answeredIds || []).map(baseId))) {
      if (!rawId) continue;
      if (!out[rawId]) out[rawId] = { streak: 0, misses: 0, hits: 0, lastLevel: 0 };
      const e = out[rawId];
      if (wrong.has(rawId)) { e.streak++; e.misses++; }
      else                  { e.streak = 0; e.hits++; }
      e.lastLevel = level;
    }
    return out;
  }

  // Frequência de erro agregada por hashtag (mapa de calor): soma os `misses`
  // de cada questão nas tags do seu comment. Requer o banco indexado por id.
  function buildMissTagFrequency(examMisses, qById) {
    const freq = {};
    for (const [id, e] of Object.entries(examMisses || {})) {
      if (!e || !e.misses) continue;
      const q = qById[id];
      if (!q) continue;
      for (const tag of extractTags(q.comment)) {
        freq[tag] = (freq[tag] || 0) + e.misses;
      }
    }
    return freq;
  }

  // Mapeia uma contagem para um nível de calor (0–3) relativo ao máximo.
  function heatLevel(count, max) {
    if (!count || count <= 0 || max <= 0) return 0;
    const r = count / max;
    if (r >= 0.66) return 3;
    if (r >= 0.33) return 2;
    return 1;
  }

  // Duplica no mesmo simulado (a partir do Nível 4) as questões mais teimosas
  // presentes na seleção — instâncias com id "#dup" (opções re-embaralhadas na
  // renderização), para quebrar a memorização de posição e reforçar a fixação.
  function withNemesisDuplicates(questions, examMisses, level, maxDups) {
    if (level < 4 || !examMisses) return questions;
    const cand = questions
      .map(q => ({ q, streak: (examMisses[baseId(q.id)] || {}).streak || 0 }))
      .filter(x => x.streak >= 2)
      .sort((a, b) => b.streak - a.streak);
    const dups = cand.slice(0, maxDups || 2)
      .map(x => Object.assign({}, x.q, { id: baseId(x.q.id) + '#dup' }));
    if (dups.length === 0) return questions;
    return shuffle(questions.concat(dups));
  }

  // --------------------------------------------------------------------------
  // Exibe resultados históricos na página de revisão
  // --------------------------------------------------------------------------

  function applyStoredScores() {
    const match = window.location.pathname.match(/\/linux\/(\d+)\/revisao/);
    if (!match) return;

    const examScores = loadScores()[match[1]];
    if (!examScores) return;

    document.querySelectorAll('h2').forEach(h2 => {
      if (h2.querySelector('.quiz-score-badge')) return;
      const entry = examScores[h2.textContent.trim()];
      if (entry == null) return;
      const pct = typeof entry === 'object' ? entry.pct : entry;

      const badge = document.createElement('span');
      badge.className = 'quiz-score-badge ' + (pct >= 70 ? 'quiz-pass' : 'quiz-fail');
      badge.textContent = ` [${pct}%]`;
      h2.appendChild(badge);
    });
  }

  // --------------------------------------------------------------------------
  // Seleção de questões
  // --------------------------------------------------------------------------

  function selectQuestions(bank, config) {
    const selected = [];
    for (const [topic, count] of Object.entries(config)) {
      const pool    = bank.filter(q => q.topic === topic);
      const picked  = shuffle(pool).slice(0, count);
      selected.push(...picked);
    }
    return selected;
  }

  // --------------------------------------------------------------------------
  // Nível 2 — seleção de questões baseada em erros anteriores
  // --------------------------------------------------------------------------

  const LEVEL2_KEY    = 'fxlip_quiz_level2';
  const LEVEL2_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

  function extractTags(comment) {
    if (!comment) return [];
    const matches = comment.match(/#([\w.-]+)/g) || [];
    return [...new Set(matches.map(t => t.slice(1).replace(/[.-]+$/, '')))];
  }

  function buildTagFrequency(wrongQuestions) {
    const freq = {};
    for (const q of wrongQuestions) {
      for (const tag of extractTags(q.comment)) {
        freq[tag] = (freq[tag] || 0) + 1;
      }
    }
    return freq;
  }

  function scoreQuestion(question, tagFreq, wrongTopics) {
    let score = 0;
    for (const tag of extractTags(question.comment)) {
      score += tagFreq[tag] || 0;
    }
    if (wrongTopics && wrongTopics.has(question.topic)) {
      score += 1;
    }
    return score;
  }

  function selectLevel2Questions(bank, wrongQuestions, usedIds, totalCount, config) {
    const used        = new Set(usedIds);
    const tagFreq     = buildTagFrequency(wrongQuestions);
    const wrongTopics = new Set(wrongQuestions.map(q => q.topic));

    // Pontua todas as questões do banco
    const allScored = bank.map(q => ({ q, score: scoreQuestion(q, tagFreq, wrongTopics) }));

    // Agrupa por subtópico; dentro de cada grupo: unused primeiro, depois score desc
    const byTopic = {};
    for (const entry of allScored) {
      const t = entry.q.topic || '__none__';
      if (!byTopic[t]) byTopic[t] = [];
      byTopic[t].push(entry);
    }
    for (const t of Object.keys(byTopic)) {
      byTopic[t].sort((a, b) => {
        const aUsed = used.has(a.q.id) ? 1 : 0;
        const bUsed = used.has(b.q.id) ? 1 : 0;
        return aUsed - bUsed || b.score - a.score;
      });
    }

    // Passo 1: garantia mínima — 1 questão por subtópico
    const subtopics = config ? Object.keys(config) : Object.keys(byTopic);
    const selected  = new Map(); // id → q

    for (const topic of subtopics) {
      if (selected.size >= totalCount) break;
      const pick = (byTopic[topic] || []).find(({ q }) => !selected.has(q.id));
      if (pick) selected.set(pick.q.id, pick.q);
    }

    // Passo 2: preenche vagas restantes — unused first, score desc
    const remaining = totalCount - selected.size;
    if (remaining > 0) {
      const extras = allScored
        .filter(({ q }) => !selected.has(q.id))
        .sort((a, b) => {
          const aUsed = used.has(a.q.id) ? 1 : 0;
          const bUsed = used.has(b.q.id) ? 1 : 0;
          return aUsed - bUsed || b.score - a.score;
        });
      for (let i = 0; i < remaining && i < extras.length; i++) {
        selected.set(extras[i].q.id, extras[i].q);
      }
    }

    return shuffle([...selected.values()]);
  }

  function saveLevel2State(wrongQuestions, usedIds, examId, prevTopics) {
    try {
      localStorage.setItem(LEVEL2_KEY, JSON.stringify({
        ts:             Date.now(),
        examId:         examId,
        usedIds:        usedIds,
        wrongQuestions: wrongQuestions,
        prevTopics:     prevTopics || null,  // breakdown do nível anterior, p/ deltas
      }));
    } catch (_) {}
  }

  // Agrega um mapa de tópicos (105.1, 105.2, ...) por exame (105, 106, ...).
  function aggregateByExam(topicsMap) {
    const agg = {};
    for (const [name, s] of Object.entries(topicsMap || {})) {
      const key = name.split('.')[0];
      if (!agg[key]) agg[key] = { correct: 0, total: 0 };
      agg[key].correct += s.correct || 0;
      agg[key].total   += s.total   || 0;
    }
    return agg;
  }

  function loadLevel2State() {
    try {
      const raw = JSON.parse(localStorage.getItem(LEVEL2_KEY));
      if (!raw || Date.now() - raw.ts > LEVEL2_TTL_MS) return null;
      return raw;
    } catch (_) { return null; }
  }

  function clearLevel2State() {
    try { localStorage.removeItem(LEVEL2_KEY); } catch (_) {}
  }

  // --------------------------------------------------------------------------
  // Embaralha alternativas mantendo o gabarito correto
  // --------------------------------------------------------------------------

  function shuffleOptions(options, answer) {
    const tagged   = options.map((text, i) => ({ text, correct: i === answer - 1 }));
    const shuffled = shuffle(tagged);
    const newAnswer = shuffled.findIndex(o => o.correct) + 1;
    return { options: shuffled.map(o => o.text), answer: newAnswer };
  }

  function shuffleMultiOptions(options, answers) {
    const tagged   = options.map((text, i) => ({ text, correct: answers.includes(i + 1) }));
    const shuffled = shuffle(tagged);
    const newAnswers = shuffled.reduce((acc, o, i) => { if (o.correct) acc.push(i + 1); return acc; }, []);
    return { options: shuffled.map(o => o.text), answers: newAnswers };
  }

  // --------------------------------------------------------------------------
  // Renderização de HTML
  // --------------------------------------------------------------------------

  function checkDiscursiveAnswer(input, accepted) {
    const norm = input.trim().toLowerCase();
    if (Array.isArray(accepted)) {
      return accepted.some(a => String(a).trim().toLowerCase() === norm);
    }
    return norm === String(accepted || '').trim().toLowerCase();
  }

  function buildCodeBlock(code) {
    if (!code) return '';
    return `<pre class="quiz-code"><code>${escapeHtml(code)}</code></pre>`;
  }

  // Calcula o delta acumulado entre níveis: compara prevPct com o combinado (L1+L2).
  // Retorna null se prevTotal <= 0.
  function calcTopicDelta(prevCorrect, prevTotal, currCorrect, currTotal) {
    if (prevTotal <= 0) return null;
    const prevPct     = Math.round((prevCorrect / prevTotal) * 100);
    const combinedPct = Math.round((prevCorrect + currCorrect) / (prevTotal + currTotal) * 100);
    return combinedPct - prevPct;
  }

  // Formata o delta de percentagem entre níveis para exibição.
  // Função pura — sem acesso ao DOM — para facilitar testes.
  function formatDeltaLabel(delta) {
    if (delta === 0)   return '(----)';
    if (delta === 100) return '(100%)';
    const sign   = delta > 0 ? '+' : '-';
    const absStr = String(Math.abs(delta)).padStart(2, '0');
    return `(${sign}${absStr}%)`;
  }

  // Gera o HTML de uma linha de resultado por tópico (separadores · entre colunas).
  // Função pura — sem acesso ao DOM — para facilitar testes.
  function buildTopicLine(name, stats, opts) {
    const { delta, deltaLabel, displayName, showRevisar } = opts || {};
    const tPct     = Math.round((stats.correct / stats.total) * 100);
    const bad      = tPct < 70;
    const countStr = `${String(stats.correct).padStart(2, ' ')}/${String(stats.total).padEnd(2, ' ')}`;
    const tPctStr  = String(tPct).padStart(3, ' ') + '%';
    const sep      = `<span class="quiz-sc-label"> · </span>`;

    let html =
      `<span class="quiz-sc-label">${escapeHtml(displayName !== undefined ? displayName : name)}</span>` +
      sep +
      `<span class="quiz-sc-label">${escapeHtml(countStr)}</span>` +
      sep +
      `<span class="${bad ? 'quiz-fail' : 'quiz-pass'}">${escapeHtml(tPctStr)}</span>`;

    // Coluna de delta vs nível anterior (presente do Nível 2 em diante).
    // `undefined` → sem coluna (Nível 1); `null` → sem base anterior → '(  --)'.
    if (delta !== undefined) {
      const display = deltaLabel !== undefined ? deltaLabel
                    : (delta === null ? '(  --)' : formatDeltaLabel(delta));
      const dClass  = (delta === null || delta === 0) ? 'quiz-sc-label'
                    : (delta > 0 ? 'quiz-pass' : 'quiz-fail');
      html += sep + `<span class="${dClass}">${escapeHtml(display)}</span>`;
    }

    if (showRevisar) {
      html += sep + `<a href="#" class="quiz-revisar-btn mention-link" data-topic-review="${escapeHtml(name)}">[revisar]</a>`;
    }

    return html;
  }

  // Canto de meta no topo-direito da questão: kebab (⋮) → menu de reportar,
  // e onde o selo de nêmesis é injetado. Overlay absoluto: não ocupa linha.
  function buildCorner() {
    return (
      `<div class="quiz-corner">` +
        `<button type="button" class="quiz-kebab" aria-label="opções da questão" title="opções">⋮</button>` +
        `<div class="quiz-menu" hidden>` +
          `<button type="button" class="quiz-report-btn">⚑ reportar p/ revisão</button>` +
        `</div>` +
      `</div>`
    );
  }

  function renderQuestion(q) {
    const questionHtml = escapeHtml(q.question).replace(/\n/g, '<br>');
    const commentHtml  = escapeHtml(q.comment || '').replace(/\n/g, '<br>');
    const codeHtml     = buildCodeBlock(q.code);
    const cornerHtml   = buildCorner();

    if (q.type === 'discursive') {
      const answerHtml = Array.isArray(q.answer)
        ? q.answer.map(a => escapeHtml(String(a))).join(' / ')
        : escapeHtml(q.answer || '').replace(/\n/g, '<br>');
      const discAnswerAttr = escapeHtml(JSON.stringify(q.answer || ''));
      return (
        `<div class="quiz-q quiz-discursive" data-id="${escapeHtml(q.id || '')}" data-topic="${escapeHtml(q.topic)}" data-disc-answer="${discAnswerAttr}">` +
          cornerHtml +
          `<p>${questionHtml}</p>` +
          codeHtml +
          `<ol>` +
            `<li class="quiz-disc-input-li"><textarea class="quiz-textarea" placeholder="digite apenas o comando" rows="1"></textarea></li>` +
          `</ol>` +
          `<div class="quiz-model-answer">${answerHtml}</div>` +
          `<div class="quiz-explanation">${commentHtml}</div>` +
        `</div>` +
        `<hr>`
      );
    }

    if (Array.isArray(q.answer)) {
      const { options, answers } = shuffleMultiOptions(q.options, q.answer);
      const optionsHtml = options.map(opt => `<li>${escapeHtml(opt)}</li>`).join('');
      return (
        `<div class="quiz-q quiz-multi" data-id="${escapeHtml(q.id || '')}" data-answers="${answers.join(',')}" data-topic="${escapeHtml(q.topic)}">` +
          cornerHtml +
          `<p>${questionHtml}</p>` +
          codeHtml +
          `<ol>${optionsHtml}</ol>` +
          `<div class="quiz-explanation">${commentHtml}</div>` +
        `</div>` +
        `<hr>`
      );
    }

    const { options, answer } = shuffleOptions(q.options, q.answer);
    const optionsHtml = options.map(opt => `<li>${escapeHtml(opt)}</li>`).join('');
    return (
      `<div class="quiz-q" data-id="${escapeHtml(q.id || '')}" data-answer="${answer}" data-topic="${escapeHtml(q.topic)}">` +
        cornerHtml +
        `<p>${questionHtml}</p>` +
        codeHtml +
        `<ol>${optionsHtml}</ol>` +
        `<div class="quiz-explanation">${commentHtml}</div>` +
      `</div>` +
      `<hr>`
    );
  }

  // --------------------------------------------------------------------------
  // Selo de nêmesis e mapa de calor das hashtags (a partir do histórico)
  // --------------------------------------------------------------------------

  // Selo sutil "errada N×" no canto de questões reincidentes (streak >= 2),
  // à esquerda do kebab (não empurra o texto da questão — canto é absoluto).
  function applyNemesisBadges(container, examMisses) {
    if (!examMisses) return;
    container.querySelectorAll('.quiz-q[data-id]').forEach(qEl => {
      const e = examMisses[baseId(qEl.dataset.id)];
      if (!e || e.streak < 2) return;
      const corner = qEl.querySelector('.quiz-corner');
      if (!corner || corner.querySelector('.quiz-nemesis-badge')) return;
      const badge = document.createElement('span');
      badge.className   = 'quiz-nemesis-badge';
      badge.title       = `você errou esta questão ${e.streak}× seguidas`;
      badge.textContent = `errada ${e.streak}×`;
      corner.insertBefore(badge, corner.firstChild);
    });
  }

  // --------------------------------------------------------------------------
  // Reporte de questão para revisão (kebab → menu → POST /api/question-report)
  // --------------------------------------------------------------------------

  // Monta o payload do reporte. Função pura — facilita teste.
  function reportPayloadFrom(id, topic, path, fp) {
    const t = normalizeTopic(topic);
    return {
      exam:        t ? t.split('.')[0] : '',
      qid:         baseId(id),
      path:        path || '',
      fingerprint: fp || '',
    };
  }

  // Envia o reporte da questão `qEl` e dá o feedback (alert). Idempotente por
  // render via `btn.dataset.sent` — a deduplicação real é feita no worker.
  function sendQuestionReport(qEl, btn) {
    if (!qEl || !btn || btn.dataset.sent) return;
    const menu = qEl.querySelector('.quiz-menu');
    if (menu) menu.setAttribute('hidden', '');

    let fp = '';
    try { fp = localStorage.getItem('fxlip_fp') || ''; } catch (_) {}
    const payload = reportPayloadFrom(qEl.dataset.id, qEl.dataset.topic, window.location.pathname, fp);
    const wUrl    = document.body.dataset.workerUrl || '';

    if (wUrl && payload.exam && payload.qid) {
      btn.dataset.sent = '1';
      qEl.classList.add('quiz-reported');
      fetch(wUrl + '/api/question-report', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      }).catch(function () {});
    }
    window.alert('Esta questão foi marcada para revisão. Obrigado pelo retorno!');
  }

  // Tinge as hashtags dos comentários conforme a frequência de erro do tópico:
  // quanto mais você erra questões daquela tag, mais "quente" ela aparece.
  function applyTagHeat(container, examMisses, qById) {
    const freq = buildMissTagFrequency(examMisses, qById);
    const vals = Object.values(freq);
    if (vals.length === 0) return;
    const max = Math.max.apply(null, vals);
    if (max <= 0) return;
    container.querySelectorAll('.quiz-q a.mention-link').forEach(a => {
      const txt = (a.textContent || '').trim();
      if (txt[0] !== '#') return;
      const tag = txt.slice(1).replace(/[.-]+$/, '');
      a.classList.remove('quiz-tag-heat-1', 'quiz-tag-heat-2', 'quiz-tag-heat-3');
      const lvl = heatLevel(freq[tag] || 0, max);
      if (lvl) a.classList.add('quiz-tag-heat-' + lvl);
    });
  }

  // --------------------------------------------------------------------------
  // Inicialização principal
  // --------------------------------------------------------------------------

  // Persistência da sessão em andamento (sobrevive a refresh) ------------------
  const SESSION_KEY = 'fxlip_quiz_session';
  function sessionKeyFor(level) {
    return window.location.pathname + '|' + level;
  }
  function loadAllSessions() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || {}; }
    catch (_) { return {}; }
  }
  function loadSession(key) {
    const s = loadAllSessions()[key];
    return (s && s.v === 1) ? s : null;
  }
  function saveSession(key, data) {
    try {
      const all = loadAllSessions();
      all[key] = data;
      localStorage.setItem(SESSION_KEY, JSON.stringify(all));
    } catch (_) {}
  }
  function clearSession(key) {
    try {
      const all = loadAllSessions();
      delete all[key];
      localStorage.setItem(SESSION_KEY, JSON.stringify(all));
    } catch (_) {}
  }

  function initQuizFromBank() {
    const bank      = window.__questionBank;
    const config    = window.__quizConfig;
    const container = document.getElementById('quiz-container');

    if (!bank || !config || !container) return;

    // Detecta nível atual (1 = base, 2+ = níveis de recuperação)
    const currentLevel  = parseInt(new URLSearchParams(window.location.search).get('level') || '1', 10);
    const isHigherLevel = currentLevel > 1;

    const sessionKey = sessionKeyFor(currentLevel);
    const restored   = loadSession(sessionKey);
    const isRestore  = !!(restored && !restored.finished && restored.html);

    // Breakdown por tópico do nível anterior (para os deltas). Vem pelo
    // level-state (geração) ou pela própria sessão (refresh no meio do nível).
    let prevTopics = null;

    if (isRestore) {
      // Restaura a sessão exata salva (mesmas questões, ordem e marcações já feitas)
      container.innerHTML = restored.html;
      prevTopics = restored.prevTopics || null;
    } else {
      // Guarda: acesso direto a ?level=N sem progressão orgânica → volta ao simulado base
      if (isHigherLevel) {
        const state = loadLevel2State();
        if (!state || state.wrongQuestions.length === 0) {
          window.location.replace(window.location.pathname);
          return;
        }
      }

      const lvl2State = isHigherLevel ? loadLevel2State() : null;
      prevTopics = lvl2State?.prevTopics || null;
      let questions;
      if (isHigherLevel && lvl2State && lvl2State.wrongQuestions.length > 0) {
        clearLevel2State();
        const totalCount = Object.values(config).reduce((a, b) => a + b, 0);
        const fromLevel2 = selectLevel2Questions(
          bank,
          lvl2State.wrongQuestions,
          lvl2State.usedIds || [],
          totalCount,
          config
        );
        questions = fromLevel2.length > 0 ? fromLevel2 : selectQuestions(bank, config);
      } else {
        questions = selectQuestions(bank, config);
      }

      // Duplica questões teimosas no mesmo simulado (Nível 4+) para fixação.
      const dupExamId  = (() => {
        const q = questions.find(q => q.topic);
        const t = q ? normalizeTopic(q.topic) : null;
        return t ? t.split('.')[0] : null;
      })();
      const dupMisses  = dupExamId ? (loadMisses()[dupExamId] || {}) : null;
      questions = withNemesisDuplicates(questions, dupMisses, currentLevel, 2);

      // Renderiza questões sorteadas
      container.innerHTML = questions.map(renderQuestion).join('');

      // Processa hashtags nos comentários das questões (#bash, #find, etc.)
      if (window.applyHashMentions) window.applyHashMentions(container);
    }

    // Estado do simulado (total derivado do DOM — serve geração e restauração)
    const total    = container.querySelectorAll('.quiz-q').length;
    let answered   = 0;
    let correctAll = 0;            // acertos totais (MC + discursivas) — base do placar
    let timerSecs  = 0;
    let timerInterval = null;
    let finished   = false;
    let startedAt  = null;         // epoch (ms) em que o cronômetro começou
    const EXAM_SECONDS = 90 * 60;  // duração oficial do simulado (90 min)
    const COUNTDOWN_AT = 30 * 60;  // passa a decrescer nos últimos 30 min
    const topics   = {};
    const wrongIds = new Set();  // IDs das questões erradas (para Nível 2)
    const qById    = Object.fromEntries(bank.filter(q => q.id).map(q => [q.id, q]));

    // Histórico de erros deste exame (selo de nêmesis + calor das hashtags).
    const examIdM    = (() => {
      const el = container.querySelector('.quiz-q[data-topic]');
      const t  = el ? normalizeTopic(el.dataset.topic) : null;
      return t ? t.split('.')[0] : null;
    })();
    const examMisses = examIdM ? (loadMisses()[examIdM] || {}) : {};
    applyNemesisBadges(container, examMisses);
    applyTagHeat(container, examMisses, qById);

    // Kebab (⋮) de cada questão: abre o menu de reportar / fecha os outros.
    container.addEventListener('click', e => {
      const kebab = e.target.closest('.quiz-kebab');
      if (kebab) {
        e.preventDefault();
        const menu   = kebab.parentElement.querySelector('.quiz-menu');
        const wasOpen = menu && !menu.hasAttribute('hidden');
        container.querySelectorAll('.quiz-menu').forEach(m => m.setAttribute('hidden', ''));
        if (menu && !wasOpen) menu.removeAttribute('hidden');
        return;
      }
      const reportBtn = e.target.closest('.quiz-report-btn');
      if (reportBtn) {
        e.preventDefault();
        sendQuestionReport(reportBtn.closest('.quiz-q'), reportBtn);
        return;
      }
      // Clique em qualquer outro lugar fecha menus abertos.
      container.querySelectorAll('.quiz-menu:not([hidden])').forEach(m => m.setAttribute('hidden', ''));
    });

    // Injeta placar no terminal-body do header
    const headerBody = document.querySelector('header .terminal-body');
    let scoreEl = null;

    if (headerBody) {
      scoreEl = document.createElement('div');
      scoreEl.className = 't-out';
      scoreEl.id        = 'quiz-scoreboard';
      scoreEl.innerHTML =
        `<span id="quiz-timer" class="quiz-sc-num">00:00</span>` +
        `<span class="quiz-sc-label"> · </span>` +
        `<span id="quiz-sc-count" class="quiz-sc-label" title="questões respondidas">${formatCount(0, total)}</span>` +
        `<span class="quiz-sc-label"> · </span>` +
        `<span id="quiz-sc-answered" class="quiz-sc-num" title="acerto nas questões já respondidas">${formatLivePct(null)}</span>`;
      headerBody.appendChild(scoreEl);
    }

    // --------------------------------------------------------------------------
    // Atualização de placar
    // --------------------------------------------------------------------------

    // Renderiza o timer: sempre crescente (MM:SS) e só passa a decrescer
    // (-MM:SS) nos últimos 30 min, contando o tempo restante até o fim.
    const renderTimer = () => {
      const timerEl = document.getElementById('quiz-timer');
      if (!timerEl) return;
      const remaining = EXAM_SECONDS - timerSecs;
      if (remaining <= COUNTDOWN_AT) {
        timerEl.textContent = formatTime(Math.max(0, remaining));
        timerEl.classList.add('quiz-timer-down');
      } else {
        timerEl.textContent = formatTime(timerSecs);
        timerEl.classList.remove('quiz-timer-down');
      }
    };

    const startTimer = () => {
      if (timerInterval) return;
      timerInterval = setInterval(() => {
        timerSecs++;
        renderTimer();
        if (!finished && timerSecs >= EXAM_SECONDS) finalizeExam();  // tempo esgotado
      }, 1000);
    };

    // Salva a sessão atual (DOM + placar) para sobreviver a um refresh
    const persist = () => {
      if (finished) return;
      saveSession(sessionKey, {
        v: 1, level: currentLevel, finished: false,
        html: container.innerHTML,
        answered, correctAll, startedAt,
        wrongIds: [...wrongIds], topics, prevTopics,
      });
    };

    const updateScore = () => {
      const countEl = document.getElementById('quiz-sc-count');
      if (countEl) countEl.textContent = formatCount(answered, total);

      const ansEl = document.getElementById('quiz-sc-answered');
      if (ansEl) {
        ansEl.textContent = formatLivePct(
          answered ? Math.round((correctAll / answered) * 100) : null
        );
      }

      // Inicia o cronômetro na primeira resposta
      if (answered === 1 && !timerInterval) {
        startedAt = Date.now();
        startTimer();
      }

      if (answered === total) { finalizeExam(); return; }  // respondeu tudo
      persist();
    };

    // Finaliza o simulado: ao responder todas as questões ou quando o tempo (90 min)
    // se esgota. Idempotente (guarda em `finished`).
    function finalizeExam() {
      if (finished) return;
      finished = true;
      clearInterval(timerInterval);
      clearSession(sessionKey);
      container.classList.add('quiz-finished');
      renderTimer();
      if (!scoreEl || !headerBody) return;

      {
        const pct  = Math.round((correctAll / (total || 1)) * 100);
        const pass = pct >= 70;

        // Delta geral (só em Nível 2+): pct atual vs pct do nível anterior.
        let overallDeltaHtml = '';
        if (isHigherLevel && prevTopics) {
          let prevC = 0, prevT = 0;
          for (const entry of Object.values(prevTopics)) {
            if (entry && typeof entry === 'object') {
              prevC += entry.correct || 0;
              prevT += entry.total   || 0;
            }
          }
          const overallDelta = calcTopicDelta(prevC, prevT, correctAll, total);
          if (overallDelta !== null) {
            const dClass = overallDelta === 0 ? 'quiz-sc-label' : (overallDelta > 0 ? 'quiz-pass' : 'quiz-fail');
            overallDeltaHtml = `<span class="quiz-sc-label"> · </span><span class="${dClass}">${formatDeltaLabel(overallDelta)}</span>`;
          }
        }

        // Linha final: contador vira acertos/total e a % ao vivo é
        // substituída pela % oficial (mesmos spans → sem duplicar).
        const countEl = document.getElementById('quiz-sc-count');
        if (countEl) countEl.textContent = formatCount(correctAll, total);
        const pctEl = document.getElementById('quiz-sc-answered');
        if (pctEl) {
          pctEl.className   = pass ? 'quiz-pass' : 'quiz-fail';
          pctEl.textContent = formatLivePct(pct);
        }

        scoreEl.innerHTML +=
          overallDeltaHtml +
          `<span class="quiz-sc-label"> · </span>` +
          `<span class="${pass ? 'quiz-pass' : 'quiz-fail'}">[${pass ? 'aprovado' : 'reprovado'}]</span>`;

        // Persiste os resultados para a página de revisão
        const examId = Object.keys(topics)[0]?.split('.')[0];
        if (examId) {
          saveExamScores(examId, topics);

          // Atualiza o histórico de erros por questão (streak) deste exame.
          try {
            const all = loadMisses();
            const answeredIds = [...container.querySelectorAll('.quiz-q.quiz-answered[data-id]')]
              .map(el => el.dataset.id);
            all[examId] = updateMissHistory(all[examId], [...wrongIds], answeredIds, currentLevel);
            localStorage.setItem(MISSES_KEY, JSON.stringify(all));
          } catch (_) {}
        }

        // Registra resultado no perfil do usuário (se logado)
        try {
          const fp   = localStorage.getItem('fxlip_fp');
          const wUrl = document.body.dataset.workerUrl || '';
          const meta = window.__examMeta;
          if (fp && wUrl && meta && meta.label) {
            fetch(wUrl + '/api/exam-result', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ fingerprint: fp, type: meta.type, label: meta.label, pct: pct, elapsed_mins: Math.floor(timerSecs / 60) })
            }).catch(function() {});
          }
        } catch (_) {}

        // Desempenho por tópico — ordenado do pior para o melhor
        if (Object.keys(topics).length > 0) {
          const sorted = Object.entries(topics).sort(
            ([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total)
          );

          // Simulado completo (type=prova): agrega subtópicos por exame (105, 106, ...)
          const examMeta  = window.__examMeta;
          const isProva   = examMeta && examMeta.type === 'prova';
          const displayLines = isProva
            ? Object.entries(aggregateByExam(topics)).sort(
                ([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total)
              )
            : sorted;

          // Breakdown do nível anterior na mesma granularidade das linhas:
          // agregado por exame (prova) ou por subtópico (tópico).
          const prevMap = isHigherLevel && prevTopics
            ? (isProva ? aggregateByExam(prevTopics) : prevTopics)
            : null;

          displayLines.forEach(([name, stats]) => {
            const line = document.createElement('div');
            line.className = 't-out';

            // A partir do Nível 2 a coluna de delta aparece em TODOS os tópicos.
            // `undefined` (Nível 1) → sem coluna; `null` → sem base anterior.
            let delta = isHigherLevel ? null : undefined;
            if (prevMap && prevMap[name]) {
              delta = calcTopicDelta(prevMap[name].correct, prevMap[name].total, stats.correct, stats.total);
            }

            line.innerHTML = buildTopicLine(name, stats, {
              delta,
              displayName:  isProva ? ` ${name} ` : undefined,
              showRevisar:  stats.correct < stats.total,
            });
            headerBody.appendChild(line);
          });

          // Listener delegado para os botões [revisar] injetados nas linhas de tópico
          let activeTopic = null;
          headerBody.addEventListener('click', e => {
            const btn = e.target.closest('.quiz-revisar-btn');
            if (!btn) return;
            e.preventDefault();

            const clicked = btn.dataset.topicReview;

            if (activeTopic === clicked) {
              // Desativa: mostra todas as questões
              container.querySelectorAll('.quiz-q').forEach(q => {
                q.classList.remove('quiz-q--hidden');
                const hr = q.nextElementSibling;
                if (hr && hr.tagName === 'HR') hr.classList.remove('quiz-q--hidden');
              });
              btn.textContent = '[revisar]';
              activeTopic = null;
            } else {
              // Troca de tópico ativo: reseta o anterior
              if (activeTopic) {
                const prev = headerBody.querySelector(`.quiz-revisar-btn[data-topic-review="${activeTopic}"]`);
                if (prev) prev.textContent = '[revisar]';
              }
              activeTopic = clicked;
              btn.textContent = '[mostrar todas]';

              // Filtra: exibe apenas questões erradas do tópico clicado
              container.querySelectorAll('.quiz-q').forEach(qEl => {
                const qTopic = normalizeTopic(qEl.dataset.topic);
                const match  = isProva
                  ? (qTopic === clicked || (qTopic && qTopic.startsWith(clicked + '.')))
                  : qTopic === clicked;
                const isWrong =
                  qEl.querySelectorAll('li.quiz-wrong, li.quiz-reveal').length > 0 ||
                  !!qEl.querySelector('.quiz-model-answer.quiz-disc-wrong');
                const visible = match && isWrong;
                qEl.classList.toggle('quiz-q--hidden', !visible);
                const hr = qEl.nextElementSibling;
                if (hr && hr.tagName === 'HR') hr.classList.toggle('quiz-q--hidden', !visible);
              });
            }
          });
        }

        // Botão de próximo nível — disponível enquanto não atingir 100%,
        // para continuar o desafio (mesmo já tendo passado dos 70%).
        if (wrongIds.size > 0 && pct < 100) {
          const wrongQs  = [...wrongIds].map(id => qById[id]).filter(Boolean);
          const usedIds  = [...container.querySelectorAll('.quiz-q')].map(el => el.dataset.id).filter(Boolean);
          saveLevel2State(wrongQs, usedIds, examId, topics);

          const nextLevel = currentLevel + 1;
          const errLabel  = wrongIds.size === 1 ? '1 questão errada' : `${wrongIds.size} questões erradas`;
          const lvl2Line  = document.createElement('div');
          lvl2Line.className = 't-out quiz-lvl2-line';
          lvl2Line.innerHTML =
            `<span class="quiz-sc-label">${errLabel} -&gt; </span>` +
            `<a href="?level=${nextLevel}" class="mention-link">[nível ${nextLevel}]</a>`;
          headerBody.appendChild(lvl2Line);
        }
      }
    }

    // --------------------------------------------------------------------------
    // Event listeners nas questões renderizadas
    // --------------------------------------------------------------------------

    const qEls = container.querySelectorAll('.quiz-q[data-answer]');

    qEls.forEach(qEl => {
      const topic      = normalizeTopic(qEl.dataset.topic);
      const correctIdx = parseInt(qEl.dataset.answer, 10) - 1;
      const items      = qEl.querySelectorAll('ol li');

      if (topic) {
        if (!topics[topic]) topics[topic] = { correct: 0, total: 0 };
        topics[topic].total++;
      }

      items.forEach((li, idx) => {
        li.addEventListener('click', () => {
          if (finished || qEl.classList.contains('quiz-answered')) return;

          qEl.classList.add('quiz-answered');
          answered++;
          qEl.querySelector('.quiz-explanation')?.classList.add('visible');

          if (idx === correctIdx) {
            li.classList.add('quiz-correct');
            correctAll++;
            if (topic) topics[topic].correct++;
          } else {
            li.classList.add('quiz-wrong');
            items[correctIdx]?.classList.add('quiz-reveal');
            if (qEl.dataset.id) wrongIds.add(baseId(qEl.dataset.id));
          }

          scrollToExplanation(qEl);
          updateScore();
        });
      });
    });

    // Questões multi-select
    container.querySelectorAll('.quiz-multi[data-answers]').forEach(qEl => {
      const topic       = normalizeTopic(qEl.dataset.topic);
      const correctIdxs = qEl.dataset.answers.split(',').map(n => parseInt(n, 10) - 1);
      const items       = Array.from(qEl.querySelectorAll('ol li'));

      if (topic) {
        if (!topics[topic]) topics[topic] = { correct: 0, total: 0 };
        topics[topic].total++;
      }

      const submit = () => {
        if (finished || qEl.classList.contains('quiz-answered')) return;
        qEl.classList.add('quiz-answered');

        let allCorrect = true;
        items.forEach((li, idx) => {
          const shouldSelect = correctIdxs.includes(idx);
          const didSelect    = li.classList.contains('quiz-selected');
          li.classList.remove('quiz-selected');
          if (shouldSelect && didSelect)       { li.classList.add('quiz-correct'); }
          else if (!shouldSelect && didSelect) { li.classList.add('quiz-wrong');   allCorrect = false; }
          else if (shouldSelect && !didSelect) { li.classList.add('quiz-reveal');  allCorrect = false; }
        });

        answered++;
        qEl.querySelector('.quiz-explanation')?.classList.add('visible');
        if (allCorrect) { correctAll++; if (topic) topics[topic].correct++; }
        else if (qEl.dataset.id) wrongIds.add(baseId(qEl.dataset.id));
        scrollToExplanation(qEl);
        updateScore();
      };

      items.forEach(li => {
        li.addEventListener('click', () => {
          if (finished || qEl.classList.contains('quiz-answered')) return;
          li.classList.toggle('quiz-selected');
          if (qEl.querySelectorAll('li.quiz-selected').length === correctIdxs.length) submit();
        });
      });
    });

    // Questões discursivas (Enter envia, Esc tira foco)
    container.querySelectorAll('.quiz-discursive').forEach(qEl => {
      const topic    = normalizeTopic(qEl.dataset.topic);
      const textarea = qEl.querySelector('.quiz-textarea');
      const inputLi  = qEl.querySelector('.quiz-disc-input-li');
      const modelAns = qEl.querySelector('.quiz-model-answer');
      const explain  = qEl.querySelector('.quiz-explanation');
      let discAns;

      // Discursiva tem gabarito exato (checkDiscursiveAnswer) → conta no tópico
      // como qualquer outra questão.
      if (topic) {
        if (!topics[topic]) topics[topic] = { correct: 0, total: 0 };
        topics[topic].total++;
      }
      try { discAns = JSON.parse(qEl.dataset.discAnswer || '""'); }
      catch (_) { discAns = qEl.dataset.discAnswer || ''; }

      textarea.addEventListener('focus', () => inputLi.classList.add('quiz-disc-focused'));
      textarea.addEventListener('blur',  () => inputLi.classList.remove('quiz-disc-focused'));

      textarea.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.preventDefault(); textarea.blur(); return; }
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (finished || qEl.classList.contains('quiz-answered')) return;

        qEl.classList.add('quiz-answered');
        textarea.disabled = true;

        const isCorrect = checkDiscursiveAnswer(textarea.value, discAns);
        if (isCorrect) { correctAll++; if (topic) topics[topic].correct++; }
        modelAns.classList.add('visible', isCorrect ? 'quiz-disc-correct' : 'quiz-disc-wrong');
        if (explain && explain.textContent.trim()) explain.classList.add('visible');
        if (!isCorrect && qEl.dataset.id) wrongIds.add(baseId(qEl.dataset.id));
        scrollToExplanation(qEl);
        answered++;
        updateScore();
      });
    });

    // --------------------------------------------------------------------------
    // Restauração da sessão (após refresh) ou gravação da sessão recém-gerada
    // --------------------------------------------------------------------------
    if (isRestore) {
      answered   = restored.answered   || 0;
      correctAll = restored.correctAll || 0;
      (restored.wrongIds || []).forEach(id => wrongIds.add(id));
      if (restored.topics) {
        for (const [t, s] of Object.entries(restored.topics)) {
          if (!topics[t]) topics[t] = { correct: 0, total: s.total || 0 };
          topics[t].correct = s.correct || 0;
        }
      }
      startedAt = restored.startedAt || null;

      const countEl = document.getElementById('quiz-sc-count');
      if (countEl) countEl.textContent = formatCount(answered, total);
      const ansEl = document.getElementById('quiz-sc-answered');
      if (ansEl) {
        ansEl.textContent = formatLivePct(answered ? Math.round((correctAll / answered) * 100) : null);
      }

      if (startedAt) {
        timerSecs = Math.floor((Date.now() - startedAt) / 1000);
        renderTimer();
        // Conclui se o tempo já se esgotou enquanto fora, ou se tudo já fora respondido
        if (answered >= total || timerSecs >= EXAM_SECONDS) finalizeExam();
        else startTimer();
      } else if (answered >= total) {
        finalizeExam();
      }
    } else {
      persist();  // grava a sessão inicial para sobreviver a um refresh imediato
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initQuizFromBank();
    applyStoredScores();
  });
})();
