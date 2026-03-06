/**
 * tests/js/quiz.test.js
 *
 * Testa as funções puras de assets/js/quiz.js.
 * Funções extraídas aqui para teste isolado.
 *
 * ATENÇÃO: Manter sincronizado com assets/js/quiz.js.
 */

import { describe, it, expect } from 'vitest'

// =============================================================================
// Extração de funções puras (assets/js/quiz.js)
// =============================================================================

function escapeHtml(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
}

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatTime(s) {
  const m  = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${m}:${ss}`
}

function shuffleOptions(options, answer) {
  const tagged   = options.map((text, i) => ({ text, correct: i === answer - 1 }))
  const shuffled = shuffle(tagged)
  const newAnswer = shuffled.findIndex(o => o.correct) + 1
  return { options: shuffled.map(o => o.text), answer: newAnswer }
}

function shuffleMultiOptions(options, answers) {
  const tagged   = options.map((text, i) => ({ text, correct: answers.includes(i + 1) }))
  const shuffled = shuffle(tagged)
  const newAnswers = shuffled.reduce((acc, o, i) => { if (o.correct) acc.push(i + 1); return acc }, [])
  return { options: shuffled.map(o => o.text), answers: newAnswers }
}

function selectQuestions(bank, config) {
  const selected = []
  for (const [topic, count] of Object.entries(config)) {
    const pool   = bank.filter(q => q.topic === topic)
    const picked = shuffle(pool).slice(0, count)
    selected.push(...picked)
  }
  return selected
}

// =============================================================================
// Testes: escapeHtml (versão quiz — sem escape de aspas simples)
// =============================================================================

describe('quiz.escapeHtml', () => {
  it('retorna string vazia para null', () => {
    expect(escapeHtml(null)).toBe('')
  })

  it('retorna string vazia para undefined', () => {
    expect(escapeHtml(undefined)).toBe('')
  })

  it('converte & < > "', () => {
    expect(escapeHtml('<b class="x">a & b</b>')).toBe('&lt;b class=&quot;x&quot;&gt;a &amp; b&lt;/b&gt;')
  })

  it('converte número para string antes de escapar', () => {
    expect(escapeHtml(42)).toBe('42')
  })
})

// =============================================================================
// Testes: shuffle
// =============================================================================

describe('shuffle', () => {
  it('retorna array com os mesmos elementos', () => {
    const original = [1, 2, 3, 4, 5]
    const result   = shuffle(original)
    expect(result).toHaveLength(original.length)
    expect(result.sort()).toEqual([...original].sort())
  })

  it('não muta o array original', () => {
    const original = [1, 2, 3]
    const copy     = [...original]
    shuffle(original)
    expect(original).toEqual(copy)
  })

  it('array vazio retorna array vazio', () => {
    expect(shuffle([])).toEqual([])
  })

  it('array de um elemento retorna o mesmo elemento', () => {
    expect(shuffle([42])).toEqual([42])
  })

  it('produz ordens diferentes em múltiplas execuções (probabilístico)', () => {
    const arr     = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const results = new Set()
    for (let i = 0; i < 10; i++) {
      results.add(shuffle(arr).join(','))
    }
    // Com 10 elementos, é estatisticamente impossível ter sempre a mesma ordem
    expect(results.size).toBeGreaterThan(1)
  })
})

// =============================================================================
// Testes: formatTime
// =============================================================================

describe('formatTime', () => {
  it('00:00 para 0 segundos', () => {
    expect(formatTime(0)).toBe('00:00')
  })

  it('00:01 para 1 segundo', () => {
    expect(formatTime(1)).toBe('00:01')
  })

  it('00:59 para 59 segundos', () => {
    expect(formatTime(59)).toBe('00:59')
  })

  it('01:00 para 60 segundos', () => {
    expect(formatTime(60)).toBe('01:00')
  })

  it('01:05 para 65 segundos', () => {
    expect(formatTime(65)).toBe('01:05')
  })

  it('59:59 para 3599 segundos', () => {
    expect(formatTime(3599)).toBe('59:59')
  })

  it('60:00 para 3600 segundos', () => {
    expect(formatTime(3600)).toBe('60:00')
  })

  it('mantém zero à esquerda em minutos e segundos', () => {
    expect(formatTime(61)).toBe('01:01')
    expect(formatTime(9)).toBe('00:09')
  })
})

// =============================================================================
// Testes: shuffleOptions
// =============================================================================

describe('shuffleOptions', () => {
  const options = ['A', 'B', 'C', 'D']

  it('mantém todos os elementos após embaralhamento', () => {
    const { options: shuffled } = shuffleOptions(options, 1)
    expect(shuffled.sort()).toEqual([...options].sort())
  })

  it('o novo gabarito aponta para o mesmo texto da resposta original', () => {
    const answer = 2  // 'B' é a resposta correta (índice 1)
    const { options: shuffled, answer: newAnswer } = shuffleOptions(options, answer)
    expect(shuffled[newAnswer - 1]).toBe(options[answer - 1])
  })

  it('funciona para gabarito na última posição', () => {
    const { options: shuffled, answer: newAnswer } = shuffleOptions(options, 4)
    expect(shuffled[newAnswer - 1]).toBe('D')
  })
})

// =============================================================================
// Testes: shuffleMultiOptions
// =============================================================================

describe('shuffleMultiOptions', () => {
  const options = ['A', 'B', 'C', 'D']
  const answers = [1, 3]  // A e C são corretas

  it('mantém todos os elementos após embaralhamento', () => {
    const { options: shuffled } = shuffleMultiOptions(options, answers)
    expect(shuffled.sort()).toEqual([...options].sort())
  })

  it('os novos gabaritos apontam para os mesmos textos das respostas originais', () => {
    const { options: shuffled, answers: newAnswers } = shuffleMultiOptions(options, answers)
    const correctTexts = newAnswers.map(i => shuffled[i - 1]).sort()
    const expectedTexts = answers.map(i => options[i - 1]).sort()
    expect(correctTexts).toEqual(expectedTexts)
  })

  it('mantém a quantidade correta de gabaritos', () => {
    const { answers: newAnswers } = shuffleMultiOptions(options, answers)
    expect(newAnswers).toHaveLength(answers.length)
  })
})

// =============================================================================
// Testes: selectQuestions
// =============================================================================

describe('selectQuestions', () => {
  const bank = [
    { topic: '101.1', question: 'Q1' },
    { topic: '101.1', question: 'Q2' },
    { topic: '101.1', question: 'Q3' },
    { topic: '101.2', question: 'Q4' },
    { topic: '101.2', question: 'Q5' },
  ]

  it('seleciona o número correto de questões por tópico', () => {
    const result = selectQuestions(bank, { '101.1': 2, '101.2': 1 })
    expect(result).toHaveLength(3)
  })

  it('seleciona apenas questões do tópico correto', () => {
    const result = selectQuestions(bank, { '101.1': 2 })
    result.forEach(q => expect(q.topic).toBe('101.1'))
  })

  it('não seleciona mais questões que o disponível no banco', () => {
    const result = selectQuestions(bank, { '101.1': 999 })
    // Só existem 3 questões de 101.1
    expect(result).toHaveLength(3)
  })

  it('tópico inexistente retorna zero questões', () => {
    const result = selectQuestions(bank, { '999.9': 5 })
    expect(result).toHaveLength(0)
  })

  it('banco vazio retorna array vazio', () => {
    const result = selectQuestions([], { '101.1': 2 })
    expect(result).toHaveLength(0)
  })
})
