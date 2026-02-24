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
  // Embaralha alternativas mantendo o gabarito correto
  // --------------------------------------------------------------------------

  function shuffleOptions(options, answer) {
    const tagged   = options.map((text, i) => ({ text, correct: i === answer - 1 }));
    const shuffled = shuffle(tagged);
    const newAnswer = shuffled.findIndex(o => o.correct) + 1; // volta para 1-based
    return { options: shuffled.map(o => o.text), answer: newAnswer };
  }

  // --------------------------------------------------------------------------
  // Renderização de HTML
  // --------------------------------------------------------------------------

  function renderQuestion(q) {
    const { options, answer } = shuffleOptions(q.options, q.answer);
    const questionHtml = escapeHtml(q.question).replace(/\n/g, '<br>');
    const optionsHtml  = options
      .map(opt => `<li>${escapeHtml(opt)}</li>`)
      .join('');
    const commentHtml  = escapeHtml(q.comment).replace(/\n/g, '<br>');

    return (
      `<div class="quiz-q" data-answer="${answer}" data-topic="${escapeHtml(q.topic)}">` +
        `<p>${questionHtml}</p>` +
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

    // Renderiza questões sorteadas
    const questions = selectQuestions(bank, config);
    container.innerHTML = questions.map(renderQuestion).join('');

    // Estado do simulado
    const total    = questions.length;
    let answered   = 0;
    let correct    = 0;
    let timerSecs  = 0;
    let timerInterval = null;
    const topics   = {};

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

    const topicToLink = name => {
      const parts = name.split('.');
      if (parts.length !== 2) return null;
      return `/linux/${parts[0]}/${parts[1]}/revisao`;
    };

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

        const pct  = Math.round((correct / total) * 100);
        const pass = pct >= 70;

        scoreEl.innerHTML +=
          `<span class="quiz-sc-label"> · </span>` +
          `<span class="${pass ? 'quiz-pass' : 'quiz-fail'}">${String(pct).padStart(3, ' ')}%</span>` +
          `<span class="quiz-sc-label"> · </span>` +
          `<span class="${pass ? 'quiz-pass' : 'quiz-fail'}">[${pass ? 'aprovado' : 'reprovado'}]</span>`;

        // Desempenho por tópico — ordenado do pior para o melhor
        if (Object.keys(topics).length > 0) {
          const sorted = Object.entries(topics).sort(
            ([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total)
          );

          sorted.forEach(([name, stats]) => {
            const tPct  = Math.round((stats.correct / stats.total) * 100);
            const bad   = tPct < 70;
            const href  = topicToLink(name);
            const line  = document.createElement('div');
            line.className = 't-out';

            const countStr = `${String(stats.correct).padStart(2, ' ')}/${String(stats.total).padEnd(2, ' ')}`;
            const tPctStr  = String(tPct).padStart(3, ' ') + '%';
            const sep      = `<span class="quiz-sc-label"> · </span>`;
            const topicTitle = (window.__topicTitles || {})[name];
            const label    = topicTitle ? `[${topicTitle}]` : '[revisao]';

            let html =
              `<span class="quiz-sc-label">${name}</span>` +
              sep +
              `<span class="quiz-sc-label">${countStr}</span>` +
              sep +
              `<span class="${bad ? 'quiz-fail' : 'quiz-pass'}">${tPctStr}</span>`;

            if (bad && href) {
              const lessonHref = topicTitle
                ? `/linux/${name.replace('.', '/')}/${topicTitle}/`
                : href;
              html += sep + `<a href="${lessonHref}" class="mention-link">${label}</a>`;
            }

            line.innerHTML = html;
            headerBody.appendChild(line);
          });
        }
      }
    };

    // --------------------------------------------------------------------------
    // Event listeners nas questões renderizadas
    // --------------------------------------------------------------------------

    const qEls = container.querySelectorAll('.quiz-q[data-answer]');

    qEls.forEach(qEl => {
      const topic      = qEl.dataset.topic || null;
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
          }

          updateScore();
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initQuizFromBank);
})();
