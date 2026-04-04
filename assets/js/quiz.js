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

  function formatTime(s) {
    const m  = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${m}:${ss}`;
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

  function saveLevel2State(wrongQuestions, usedIds, examId) {
    try {
      localStorage.setItem(LEVEL2_KEY, JSON.stringify({
        ts:             Date.now(),
        examId:         examId,
        usedIds:        usedIds,
        wrongQuestions: wrongQuestions,
      }));
    } catch (_) {}
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

    if (delta !== undefined && delta !== null) {
      const display = deltaLabel !== undefined
        ? deltaLabel
        : (delta === 0 ? '(--)' : (delta > 0 ? `(+${delta})` : `(${delta})`));
      const dClass  = delta === 0 ? 'quiz-sc-label' : (delta > 0 ? 'quiz-pass' : 'quiz-fail');
      html += ` <span class="${dClass}">${display}</span>`;
    }

    if (showRevisar) {
      html += sep + `<a href="#" class="quiz-revisar-btn mention-link" data-topic-review="${escapeHtml(name)}">[revisar]</a>`;
    }

    return html;
  }

  function renderQuestion(q) {
    const questionHtml = escapeHtml(q.question).replace(/\n/g, '<br>');
    const commentHtml  = escapeHtml(q.comment || '').replace(/\n/g, '<br>');
    const codeHtml     = buildCodeBlock(q.code);

    if (q.type === 'discursive') {
      const answerHtml = Array.isArray(q.answer)
        ? q.answer.map(a => escapeHtml(String(a))).join(' / ')
        : escapeHtml(q.answer || '').replace(/\n/g, '<br>');
      const discAnswerAttr = escapeHtml(JSON.stringify(q.answer || ''));
      return (
        `<div class="quiz-q quiz-discursive" data-id="${escapeHtml(q.id || '')}" data-topic="${escapeHtml(q.topic)}" data-disc-answer="${discAnswerAttr}">` +
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
        `<p>${questionHtml}</p>` +
        codeHtml +
        `<ol>${optionsHtml}</ol>` +
        `<div class="quiz-explanation">${commentHtml}</div>` +
      `</div>` +
      `<hr>`
    );
  }

  // --------------------------------------------------------------------------
  // Inicialização principal
  // --------------------------------------------------------------------------

  function initQuizFromBank() {
    const bank      = window.__questionBank;
    const config    = window.__quizConfig;
    const container = document.getElementById('quiz-container');

    if (!bank || !config || !container) return;

    // Detecta nível atual (1 = base, 2+ = níveis de recuperação)
    const currentLevel  = parseInt(new URLSearchParams(window.location.search).get('level') || '1', 10);
    const isHigherLevel = currentLevel > 1;

    // Guarda: acesso direto a ?level=N sem progressão orgânica → redireciona para o simulado base
    if (isHigherLevel) {
      const state = loadLevel2State();
      if (!state || state.wrongQuestions.length === 0) {
        window.location.replace(window.location.pathname);
        return;
      }
    }

    const prevScores = isHigherLevel ? loadScores() : null;  // captura antes de saveExamScores sobrescrever
    const lvl2State  = isHigherLevel ? loadLevel2State() : null;

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

    // Renderiza questões sorteadas
    container.innerHTML = questions.map(renderQuestion).join('');

    // Processa hashtags nos comentários das questões (#bash, #find, etc.)
    if (window.applyHashMentions) window.applyHashMentions(container);

    // Estado do simulado
    const total    = questions.length;
    const mcTotal  = questions.filter(q => q.type !== 'discursive').length || 1;
    let answered   = 0;
    let correct    = 0;
    let timerSecs  = 0;
    let timerInterval = null;
    const topics   = {};
    const wrongIds = new Set();  // IDs das questões erradas (para Nível 2)
    const qById    = Object.fromEntries(questions.filter(q => q.id).map(q => [q.id, q]));

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
        `<span id="quiz-sc-answered" class="quiz-sc-num"> 0</span>` +
        `<span class="quiz-sc-label">/${String(total).padEnd(2, ' ')}</span>`;
      headerBody.appendChild(scoreEl);
    }

    // --------------------------------------------------------------------------
    // Atualização de placar
    // --------------------------------------------------------------------------

    const updateScore = () => {
      const ansEl = document.getElementById('quiz-sc-answered');
      if (ansEl) ansEl.textContent = String(answered).padStart(2, ' ');

      // Inicia o timer na primeira resposta
      if (answered === 1 && !timerInterval) {
        timerInterval = setInterval(() => {
          timerSecs++;
          const timerEl = document.getElementById('quiz-timer');
          if (timerEl) timerEl.textContent = formatTime(timerSecs);
        }, 1000);
      }

      // Resultado final quando todas as questões forem respondidas
      if (answered === total) {
        clearInterval(timerInterval);
        if (!scoreEl || !headerBody) return;

        const pct  = Math.round((correct / mcTotal) * 100);
        const pass = pct >= 70;

        // Delta geral (só em Nível 2+): pct atual vs pct do Nível 1
        let overallDeltaHtml = '';
        if (isHigherLevel && prevScores) {
          const l1Map = prevScores[Object.keys(topics)[0]?.split('.')[0]] || {};
          let prevC = 0, prevT = 0;
          for (const entry of Object.values(l1Map)) {
            if (entry && typeof entry === 'object') {
              prevC += entry.correct || 0;
              prevT += entry.total   || 0;
            }
          }
          if (prevT > 0) {
            const prevPct  = Math.round((prevC / prevT) * 100);
            const delta    = pct - prevPct;
            const dClass   = delta === 0 ? 'quiz-sc-label' : (delta > 0 ? 'quiz-pass' : 'quiz-fail');
            const dStr     = delta === 0 ? '(--)' : `(${delta > 0 ? '+' : '-'}${String(Math.abs(delta)).padStart(2, '0')}%)`;
            overallDeltaHtml = ` <span class="${dClass}">${dStr}</span>`;
          }
        }

        scoreEl.innerHTML +=
          `<span class="quiz-sc-label"> · </span>` +
          `<span class="${pass ? 'quiz-pass' : 'quiz-fail'}">${String(pct).padStart(3, ' ')}%</span>` +
          overallDeltaHtml +
          `<span class="quiz-sc-label"> · </span>` +
          `<span class="${pass ? 'quiz-pass' : 'quiz-fail'}">[${pass ? 'aprovado' : 'reprovado'}]</span>`;

        // Persiste os resultados para a página de revisão
        const examId = Object.keys(topics)[0]?.split('.')[0];
        if (examId) saveExamScores(examId, topics);

        // Registra resultado no perfil do usuário (se logado)
        try {
          const fp   = localStorage.getItem('fxlip_fp');
          const wUrl = document.body.dataset.workerUrl || '';
          const meta = window.__examMeta;
          if (fp && wUrl && meta && meta.label) {
            fetch(wUrl + '/api/exam-result', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ fingerprint: fp, type: meta.type, label: meta.label, pct: pct })
            }).catch(function() {});
          }
        } catch (_) {}

        // Desempenho por tópico — ordenado do pior para o melhor
        if (Object.keys(topics).length > 0) {
          const sorted = Object.entries(topics).sort(
            ([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total)
          );

          // Simulado completo (type=prova): agrega subtópicos por exame (101, 102, ...)
          const examMeta  = window.__examMeta;
          const isProva   = examMeta && examMeta.type === 'prova';
          const displayLines = isProva
            ? (() => {
                const agg = {};
                for (const [name, stats] of Object.entries(topics)) {
                  const key = name.split('.')[0];
                  if (!agg[key]) agg[key] = { correct: 0, total: 0 };
                  agg[key].correct += stats.correct;
                  agg[key].total   += stats.total;
                }
                return Object.entries(agg).sort(
                  ([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total)
                );
              })()
            : sorted;

          // Prova + Nível 2: agrega scores do Nível 1 por prefixo de exame
          let l1ProvaAgg = null;
          if (isHigherLevel && isProva) {
            const l1Scores = prevScores?.[examId] || {};
            l1ProvaAgg = {};
            for (const [subtopic, entry] of Object.entries(l1Scores)) {
              const key = subtopic.split('.')[0];
              if (!l1ProvaAgg[key]) l1ProvaAgg[key] = { correct: 0, total: 0 };
              if (entry && typeof entry === 'object') {
                l1ProvaAgg[key].correct += entry.correct || 0;
                l1ProvaAgg[key].total   += entry.total   || 0;
              }
            }
          }

          displayLines.forEach(([name, stats]) => {
            const line = document.createElement('div');
            line.className = 't-out';

            let delta      = null;
            let deltaLabel = undefined;

            if (isHigherLevel) {
              if (isProva && l1ProvaAgg && l1ProvaAgg[name]) {
                const l1 = l1ProvaAgg[name];
                if (l1.total > 0) {
                  const prevPct = Math.round((l1.correct / l1.total) * 100);
                  const currPct = Math.round((stats.correct / stats.total) * 100);
                  delta = currPct - prevPct;
                  if (delta === 0) {
                    deltaLabel = '(--)';
                  } else {
                    const sign   = delta > 0 ? '+' : '-';
                    const absStr = String(Math.abs(delta)).padStart(2, '0');
                    deltaLabel = `(${sign}${absStr}%)`;
                  }
                }
              } else if (!isProva) {
                const l1Entry   = prevScores?.[examId]?.[name];
                const l1Correct = (l1Entry && typeof l1Entry === 'object') ? l1Entry.correct : null;
                if (l1Correct != null) delta = stats.correct - l1Correct;
              }
            }

            line.innerHTML = buildTopicLine(name, stats, {
              delta,
              deltaLabel,
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

        // Botão Nível 2 — disponível quando houver mais de 1 erro
        if (wrongIds.size > 1 && !pass) {
          const wrongQs  = [...wrongIds].map(id => qById[id]).filter(Boolean);
          const usedIds  = questions.map(q => q.id).filter(Boolean);
          saveLevel2State(wrongQs, usedIds, examId);

          const nextLevel = currentLevel + 1;
          const lvl2Line  = document.createElement('div');
          lvl2Line.className = 't-out quiz-lvl2-line';
          lvl2Line.innerHTML =
            `<span class="quiz-sc-label">${wrongIds.size} questões erradas -&gt; </span>` +
            `<a href="?level=${nextLevel}" class="mention-link">[nível ${nextLevel}]</a>`;
          headerBody.appendChild(lvl2Line);
        }
      }
    };

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
          if (qEl.classList.contains('quiz-answered')) return;

          qEl.classList.add('quiz-answered');
          answered++;
          qEl.querySelector('.quiz-explanation')?.classList.add('visible');

          if (idx === correctIdx) {
            li.classList.add('quiz-correct');
            correct++;
            if (topic) topics[topic].correct++;
          } else {
            li.classList.add('quiz-wrong');
            items[correctIdx]?.classList.add('quiz-reveal');
            if (qEl.dataset.id) wrongIds.add(qEl.dataset.id);
          }

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
        if (qEl.classList.contains('quiz-answered')) return;
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
        if (allCorrect) { correct++; if (topic) topics[topic].correct++; }
        else if (qEl.dataset.id) wrongIds.add(qEl.dataset.id);
        updateScore();
      };

      items.forEach(li => {
        li.addEventListener('click', () => {
          if (qEl.classList.contains('quiz-answered')) return;
          li.classList.toggle('quiz-selected');
          if (qEl.querySelectorAll('li.quiz-selected').length === correctIdxs.length) submit();
        });
      });
    });

    // Questões discursivas (Enter envia, Esc tira foco)
    container.querySelectorAll('.quiz-discursive').forEach(qEl => {
      const textarea = qEl.querySelector('.quiz-textarea');
      const inputLi  = qEl.querySelector('.quiz-disc-input-li');
      const modelAns = qEl.querySelector('.quiz-model-answer');
      const explain  = qEl.querySelector('.quiz-explanation');
      let discAns;
      try { discAns = JSON.parse(qEl.dataset.discAnswer || '""'); }
      catch (_) { discAns = qEl.dataset.discAnswer || ''; }

      textarea.addEventListener('focus', () => inputLi.classList.add('quiz-disc-focused'));
      textarea.addEventListener('blur',  () => inputLi.classList.remove('quiz-disc-focused'));

      textarea.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.preventDefault(); textarea.blur(); return; }
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (qEl.classList.contains('quiz-answered')) return;

        qEl.classList.add('quiz-answered');
        textarea.disabled = true;

        const isCorrect = checkDiscursiveAnswer(textarea.value, discAns);
        modelAns.classList.add('visible', isCorrect ? 'quiz-disc-correct' : 'quiz-disc-wrong');
        if (explain && explain.textContent.trim()) explain.classList.add('visible');
        if (!isCorrect && qEl.dataset.id) wrongIds.add(qEl.dataset.id);
        answered++;
        updateScore();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initQuizFromBank();
    applyStoredScores();
  });
})();
