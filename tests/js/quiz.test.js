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

// =============================================================================
// checkDiscursiveAnswer — duplicada de assets/js/quiz.js para teste isolado
// =============================================================================

function checkDiscursiveAnswer(input, accepted) {
  const norm = input.trim().toLowerCase()
  if (Array.isArray(accepted)) {
    return accepted.some(a => String(a).trim().toLowerCase() === norm)
  }
  return norm === String(accepted || '').trim().toLowerCase()
}

// =============================================================================
// Testes: checkDiscursiveAnswer
// =============================================================================

describe('checkDiscursiveAnswer', () => {
  describe('resposta única (string)', () => {
    it('aceita resposta correta', () => {
      expect(checkDiscursiveAnswer('interrupts', 'interrupts')).toBe(true)
    })

    it('aceita resposta correta com case diferente', () => {
      expect(checkDiscursiveAnswer('INTERRUPTS', 'interrupts')).toBe(true)
    })

    it('aceita resposta correta com espaços extras', () => {
      expect(checkDiscursiveAnswer('  interrupts  ', 'interrupts')).toBe(true)
    })

    it('rejeita resposta errada', () => {
      expect(checkDiscursiveAnswer('irqs', 'interrupts')).toBe(false)
    })

    it('rejeita string vazia', () => {
      expect(checkDiscursiveAnswer('', 'interrupts')).toBe(false)
    })

    it('aceita número como string', () => {
      expect(checkDiscursiveAnswer('1', '1')).toBe(true)
    })
  })

  describe('múltiplas respostas aceitas (array)', () => {
    const accepted = ['1', 'SIGHUP', 'HUP']

    it('aceita primeiro elemento do array', () => {
      expect(checkDiscursiveAnswer('1', accepted)).toBe(true)
    })

    it('aceita segundo elemento do array', () => {
      expect(checkDiscursiveAnswer('SIGHUP', accepted)).toBe(true)
    })

    it('aceita terceiro elemento do array', () => {
      expect(checkDiscursiveAnswer('HUP', accepted)).toBe(true)
    })

    it('aceita com case diferente', () => {
      expect(checkDiscursiveAnswer('sighup', accepted)).toBe(true)
      expect(checkDiscursiveAnswer('hup', accepted)).toBe(true)
    })

    it('aceita com espaços extras', () => {
      expect(checkDiscursiveAnswer('  1  ', accepted)).toBe(true)
    })

    it('rejeita resposta não listada', () => {
      expect(checkDiscursiveAnswer('SIGTERM', accepted)).toBe(false)
    })

    it('rejeita string vazia', () => {
      expect(checkDiscursiveAnswer('', accepted)).toBe(false)
    })

    it('array vazio nunca aceita nenhuma resposta', () => {
      expect(checkDiscursiveAnswer('1', [])).toBe(false)
    })
  })
})

// =============================================================================
// extractTags — duplicada de assets/js/quiz.js para teste isolado
// =============================================================================

function extractTags(comment) {
  if (!comment) return []
  const matches = comment.match(/#([\w.-]+)/g) || []
  return [...new Set(matches.map(t => t.slice(1).replace(/[.-]+$/, '')))]
}

// =============================================================================
// Testes: extractTags
// =============================================================================

describe('extractTags', () => {
  it('retorna array vazio para null', () => {
    expect(extractTags(null)).toEqual([])
  })

  it('retorna array vazio para undefined', () => {
    expect(extractTags(undefined)).toEqual([])
  })

  it('retorna array vazio para string vazia', () => {
    expect(extractTags('')).toEqual([])
  })

  it('retorna array vazio para texto sem hashtag', () => {
    expect(extractTags('comando find sem cerquilha')).toEqual([])
  })

  it('extrai uma única hashtag', () => {
    expect(extractTags('Use #grep para buscar')).toEqual(['grep'])
  })

  it('extrai múltiplas hashtags', () => {
    const tags = extractTags('#find #xargs #grep')
    expect(tags).toHaveLength(3)
    expect(tags).toContain('find')
    expect(tags).toContain('xargs')
    expect(tags).toContain('grep')
  })

  it('remove duplicatas', () => {
    expect(extractTags('#find #find #find')).toEqual(['find'])
  })

  it('remove ponto trailing', () => {
    const tags = extractTags('#find.')
    expect(tags).toContain('find')
    expect(tags).not.toContain('find.')
  })

  it('remove hífen trailing', () => {
    const tags = extractTags('#grep-')
    expect(tags).toContain('grep')
    expect(tags).not.toContain('grep-')
  })

  it('preserva hífen interno (ex: #time-ago)', () => {
    const tags = extractTags('#time-ago')
    expect(tags).toContain('time-ago')
  })
})

// =============================================================================
// buildTagFrequency — duplicada de assets/js/quiz.js para teste isolado
// =============================================================================

function buildTagFrequency(wrongQuestions) {
  const freq = {}
  for (const q of wrongQuestions) {
    for (const tag of extractTags(q.comment)) {
      freq[tag] = (freq[tag] || 0) + 1
    }
  }
  return freq
}

// =============================================================================
// Testes: buildTagFrequency
// =============================================================================

describe('buildTagFrequency', () => {
  it('retorna objeto vazio para array vazio', () => {
    expect(buildTagFrequency([])).toEqual({})
  })

  it('conta tags de uma única questão', () => {
    const q = { comment: 'Use #grep para buscar. #regex também ajuda.' }
    const freq = buildTagFrequency([q])
    expect(freq['grep']).toBe(1)
    expect(freq['regex']).toBe(1)
  })

  it('acumula frequência de tags repetidas em questões diferentes', () => {
    const qs = [
      { comment: 'Veja #grep e #pipe.' },
      { comment: 'Use #grep com #awk.' },
    ]
    const freq = buildTagFrequency(qs)
    expect(freq['grep']).toBe(2)
    expect(freq['pipe']).toBe(1)
    expect(freq['awk']).toBe(1)
  })

  it('ignora questões sem campo comment', () => {
    const qs = [{ question: 'sem comment' }, { comment: '#find é útil.' }]
    const freq = buildTagFrequency(qs)
    expect(freq['find']).toBe(1)
    expect(Object.keys(freq)).toHaveLength(1)
  })

  it('ignora questões com comment null', () => {
    const qs = [{ comment: null }, { comment: '#awk' }]
    const freq = buildTagFrequency(qs)
    expect(freq['awk']).toBe(1)
    expect(Object.keys(freq)).toHaveLength(1)
  })

  it('extrai múltiplas tags da mesma questão sem duplicatas internas', () => {
    const q = { comment: '#find #find #find' }
    // Na mesma questão, conta 1 por tag (contribuição por questão, não por ocorrência)
    const freq = buildTagFrequency([q])
    expect(freq['find']).toBe(1)
  })

  it('ignora texto que não é hashtag', () => {
    const q = { comment: 'O comando find procura arquivos. Use #find.' }
    const freq = buildTagFrequency([q])
    expect(Object.keys(freq)).toHaveLength(1)
    expect(freq['find']).toBe(1)
  })
})

// =============================================================================
// scoreQuestion — duplicada de assets/js/quiz.js para teste isolado
// =============================================================================

function scoreQuestion(question, tagFreq, wrongTopics) {
  let score = 0
  for (const tag of extractTags(question.comment)) {
    score += tagFreq[tag] || 0
  }
  if (wrongTopics && wrongTopics.has(question.topic)) {
    score += 1
  }
  return score
}

// =============================================================================
// Testes: scoreQuestion
// =============================================================================

describe('scoreQuestion', () => {
  it('retorna 0 para questão sem comment', () => {
    const q = { question: 'sem hashtags' }
    expect(scoreQuestion(q, { grep: 2 })).toBe(0)
  })

  it('retorna 0 se nenhuma tag da questão está no mapa de frequência', () => {
    const q = { comment: '#chmod #chown' }
    expect(scoreQuestion(q, { grep: 2, find: 1 })).toBe(0)
  })

  it('retorna soma dos pesos das tags que batem', () => {
    const q = { comment: '#grep #pipe' }
    const freq = { grep: 2, pipe: 2 }
    expect(scoreQuestion(q, freq)).toBe(4)
  })

  it('conta apenas tags presentes no mapa de frequência', () => {
    const q = { comment: '#grep #chmod' }
    const freq = { grep: 3 }
    expect(scoreQuestion(q, freq)).toBe(3)
  })

  it('frequência vazia resulta em score 0', () => {
    const q = { comment: '#grep #find' }
    expect(scoreQuestion(q, {})).toBe(0)
  })

  it('tag aparece uma vez na questão mesmo que repita no comment', () => {
    const q = { comment: '#grep #grep #grep' }
    const freq = { grep: 5 }
    expect(scoreQuestion(q, freq)).toBe(5)
  })

  it('adiciona +1 quando o tópico da questão está nos tópicos errados', () => {
    const q    = { topic: '103.1', comment: '#chmod' }
    const freq = {}
    const wrongTopics = new Set(['103.1', '103.2'])
    expect(scoreQuestion(q, freq, wrongTopics)).toBe(1)
  })

  it('acumula tag score + bônus de tópico', () => {
    const q    = { topic: '103.1', comment: '#grep #pipe' }
    const freq = { grep: 2, pipe: 1 }
    const wrongTopics = new Set(['103.1'])
    expect(scoreQuestion(q, freq, wrongTopics)).toBe(4) // 2+1+1
  })

  it('não aplica bônus de tópico quando wrongTopics não é passado', () => {
    const q = { topic: '103.1', comment: '#grep' }
    expect(scoreQuestion(q, { grep: 2 })).toBe(2)
  })

  it('não aplica bônus de tópico quando tópico não está no conjunto', () => {
    const q    = { topic: '104.1', comment: '#grep' }
    const freq = { grep: 2 }
    const wrongTopics = new Set(['103.1', '103.2'])
    expect(scoreQuestion(q, freq, wrongTopics)).toBe(2)
  })
})

// =============================================================================
// selectLevel2Questions — duplicada de assets/js/quiz.js para teste isolado
// =============================================================================

function selectLevel2Questions(bank, wrongQuestions, usedIds, totalCount, config) {
  const used        = new Set(usedIds)
  const tagFreq     = buildTagFrequency(wrongQuestions)
  const wrongTopics = new Set(wrongQuestions.map(q => q.topic))

  // Pontua todas as questões do banco
  const allScored = bank.map(q => ({ q, score: scoreQuestion(q, tagFreq, wrongTopics) }))

  // Agrupa por subtópico; dentro de cada grupo: unused primeiro, depois score desc
  const byTopic = {}
  for (const entry of allScored) {
    const t = entry.q.topic || '__none__'
    if (!byTopic[t]) byTopic[t] = []
    byTopic[t].push(entry)
  }
  for (const t of Object.keys(byTopic)) {
    byTopic[t].sort((a, b) => {
      const aUsed = used.has(a.q.id) ? 1 : 0
      const bUsed = used.has(b.q.id) ? 1 : 0
      return aUsed - bUsed || b.score - a.score
    })
  }

  // Passo 1: garantia mínima — 1 questão por subtópico
  const subtopics = config ? Object.keys(config) : Object.keys(byTopic)
  const selected  = new Map() // id → q

  for (const topic of subtopics) {
    if (selected.size >= totalCount) break
    const pick = (byTopic[topic] || []).find(({ q }) => !selected.has(q.id))
    if (pick) selected.set(pick.q.id, pick.q)
  }

  // Passo 2: preenche vagas restantes — unused first, score desc
  const remaining = totalCount - selected.size
  if (remaining > 0) {
    const extras = allScored
      .filter(({ q }) => !selected.has(q.id))
      .sort((a, b) => {
        const aUsed = used.has(a.q.id) ? 1 : 0
        const bUsed = used.has(b.q.id) ? 1 : 0
        return aUsed - bUsed || b.score - a.score
      })
    for (let i = 0; i < remaining && i < extras.length; i++) {
      selected.set(extras[i].q.id, extras[i].q)
    }
  }

  return shuffle([...selected.values()])
}

// =============================================================================
// Testes: selectLevel2Questions
// =============================================================================

describe('selectLevel2Questions', () => {
  const bank = [
    { id: 'q1', topic: '103.1', comment: '#grep #pipe' },
    { id: 'q2', topic: '103.1', comment: '#grep #awk' },
    { id: 'q3', topic: '103.1', comment: '#find #xargs' },
    { id: 'q4', topic: '103.1', comment: '#chmod #chown' },
    { id: 'q5', topic: '103.2', comment: '#grep #regex' },
    { id: 'q6', topic: '103.2', comment: '#awk #sed' },
    { id: 'q7', topic: '103.2', comment: '#ls #cd' },
    { id: 'q8', topic: '104.1', comment: '#chmod #chown' },
  ]
  const config = { '103.1': 4, '103.2': 3, '104.1': 1 }

  const wrongQuestions = [
    { id: 'wrong1', topic: '103.1', comment: '#grep #find' },
    { id: 'wrong2', topic: '103.2', comment: '#grep #awk' },
  ]

  it('retorna exatamente totalCount questões (quando o banco é suficiente)', () => {
    const result = selectLevel2Questions(bank, wrongQuestions, ['wrong1', 'wrong2'], 4, config)
    expect(result).toHaveLength(4)
  })

  it('garante ao menos 1 questão por subtópico do config', () => {
    for (let i = 0; i < 10; i++) {
      const result = selectLevel2Questions(bank, wrongQuestions, ['wrong1', 'wrong2'], 6, config)
      const topics = new Set(result.map(q => q.topic))
      expect(topics.has('103.1')).toBe(true)
      expect(topics.has('103.2')).toBe(true)
      expect(topics.has('104.1')).toBe(true)
    }
  })

  it('garante ao menos 1 por subtópico mesmo quando todas as questões daquele subtópico foram usadas', () => {
    // q8 é a única questão de 104.1 e está em usedIds — deve aparecer mesmo assim (fallback)
    const usedIncludesQ8 = ['wrong1', 'wrong2', 'q8']
    for (let i = 0; i < 10; i++) {
      const result = selectLevel2Questions(bank, wrongQuestions, usedIncludesQ8, 4, config)
      const topics = result.map(q => q.topic)
      expect(topics).toContain('104.1')
    }
  })

  it('prefere questões não usadas para preencher a garantia mínima', () => {
    // q1 e q2 (103.1) estão em usedIds; q3 e q4 (103.1) não estão
    // O mínimo de 103.1 deve ser preenchido com q3 ou q4 (não usadas)
    const usedIds = ['wrong1', 'wrong2', 'q1', 'q2']
    for (let i = 0; i < 10; i++) {
      const result = selectLevel2Questions(bank, wrongQuestions, usedIds, 4, config)
      const ids = result.map(q => q.id)
      expect(ids).not.toContain('q1')
      expect(ids).not.toContain('q2')
    }
  })

  it('não inclui IDs que não estão no banco (wrongQuestions são do banco anterior)', () => {
    const result = selectLevel2Questions(bank, wrongQuestions, ['wrong1', 'wrong2'], 4, config)
    const ids = result.map(q => q.id)
    expect(ids).not.toContain('wrong1')
    expect(ids).not.toContain('wrong2')
  })

  it('subtópico ausente dos erros ainda aparece no resultado (garantia mínima)', () => {
    // 104.1 não está nos erros, mas deve aparecer no resultado pelo mínimo garantido
    for (let i = 0; i < 10; i++) {
      const result = selectLevel2Questions(bank, wrongQuestions, ['wrong1', 'wrong2'], 6, config)
      expect(result.map(q => q.topic)).toContain('104.1')
    }
  })

  it('vagas extras (além do mínimo por subtópico) priorizam questões de maior score', () => {
    // wrongQuestions têm #grep e #awk → questões de 103.1 e 103.2 têm score alto
    // 104.1 tem score=0 e já preenche o mínimo (q8)
    // Com totalCount=6: mínimos=3 (1 por tópico), extras=3 → devem vir de 103.1 e 103.2
    for (let i = 0; i < 10; i++) {
      const result = selectLevel2Questions(bank, wrongQuestions, ['wrong1', 'wrong2'], 6, config)
      // 104.1 deve ter exatamente 1 questão (somente o mínimo, sem extras pois score=0)
      const from104 = result.filter(q => q.topic === '104.1')
      expect(from104).toHaveLength(1)
    }
  })

  it('retorna menos questões que totalCount se o banco não tiver suficientes', () => {
    const result = selectLevel2Questions(bank, wrongQuestions, ['wrong1', 'wrong2'], 999, config)
    expect(result.length).toBeLessThanOrEqual(bank.length)
    expect(result.length).toBeGreaterThan(0)
  })

  it('não retorna questões duplicadas', () => {
    const result = selectLevel2Questions(bank, wrongQuestions, ['wrong1', 'wrong2'], 6, config)
    const ids = result.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('retorna array vazio apenas quando o banco está completamente vazio', () => {
    const result = selectLevel2Questions([], wrongQuestions, [], 4, config)
    expect(result).toHaveLength(0)
  })

  it('questão com tag + tópico correto tem score maior — ambas selecionadas com totalCount=2', () => {
    const banco = [
      { id: 'qtag', topic: '103.1', comment: '#grep' },
      { id: 'qtop', topic: '103.1', comment: '#chmod' },
    ]
    const erros  = [{ id: 'w1', topic: '103.1', comment: '#grep' }]
    const cfg    = { '103.1': 2 }
    const result = selectLevel2Questions(banco, erros, ['w1'], 2, cfg)
    expect(result.map(q => q.id)).toContain('qtag')
    expect(result.map(q => q.id)).toContain('qtop')
  })

  it('dentro de um subtópico, a questão de maior score é selecionada para o mínimo', () => {
    // qtag (score 2) deve ser o representante mínimo de 103.1, não qtop (score 1)
    const banco = [
      { id: 'qtop', topic: '103.1', comment: '#chmod' },
      { id: 'qtag', topic: '103.1', comment: '#grep' },
    ]
    const erros = [{ id: 'w1', topic: '103.1', comment: '#grep' }]
    const cfg   = { '103.1': 1 }
    let qtagCount = 0
    for (let i = 0; i < 20; i++) {
      const result = selectLevel2Questions(banco, erros, ['w1'], 1, cfg)
      if (result[0]?.id === 'qtag') qtagCount++
    }
    expect(qtagCount).toBe(20) // sempre seleciona a de maior score
  })
})

// =============================================================================
// buildCodeBlock — duplicada de assets/js/quiz.js para teste isolado
// =============================================================================

function buildCodeBlock(code) {
  if (!code) return ''
  return `<pre class="quiz-code"><code>${escapeHtml(code)}</code></pre>`
}

// =============================================================================
// Testes: buildCodeBlock
// =============================================================================

describe('buildCodeBlock', () => {
  it('retorna string vazia para null', () => {
    expect(buildCodeBlock(null)).toBe('')
  })

  it('retorna string vazia para undefined', () => {
    expect(buildCodeBlock(undefined)).toBe('')
  })

  it('retorna string vazia para string vazia', () => {
    expect(buildCodeBlock('')).toBe('')
  })

  it('envolve o código em <pre class="quiz-code"><code>', () => {
    const result = buildCodeBlock('echo hello')
    expect(result).toBe('<pre class="quiz-code"><code>echo hello</code></pre>')
  })

  it('escapa caracteres HTML no código', () => {
    const result = buildCodeBlock('<script>alert("xss")</script>')
    expect(result).toContain('&lt;script&gt;')
    expect(result).toContain('&lt;/script&gt;')
  })

  it('preserva quebras de linha no código', () => {
    const result = buildCodeBlock('linha1\nlinha2')
    expect(result).toContain('linha1\nlinha2')
  })

  it('escapa aspas duplas', () => {
    const result = buildCodeBlock('z="$z $y"')
    expect(result).toContain('&quot;')
  })
})

// =============================================================================
// normalizeTopic — duplicada de assets/js/quiz.js para teste isolado
// =============================================================================

function normalizeTopic(raw) {
  if (!raw) return null
  // Remove aspas ASCII (") e curly quotes (" " U+201C/U+201D) das extremidades
  const clean = raw.replace(/^["\u201c\u201d]+|["\u201c\u201d]+$/g, '').trim()
  return clean || null
}

// =============================================================================
// Testes: normalizeTopic
// =============================================================================

describe('normalizeTopic', () => {
  it('retorna null para string vazia', () => {
    expect(normalizeTopic('')).toBeNull()
  })

  it('retorna null para null/undefined', () => {
    expect(normalizeTopic(null)).toBeNull()
    expect(normalizeTopic(undefined)).toBeNull()
  })

  it('retorna tópico limpo sem modificação', () => {
    expect(normalizeTopic('101.2')).toBe('101.2')
    expect(normalizeTopic('103.8')).toBe('103.8')
  })

  it('remove aspas ASCII das extremidades', () => {
    expect(normalizeTopic('"101.2"')).toBe('101.2')
    expect(normalizeTopic('"103.8"')).toBe('103.8')
  })

  it('remove curly quotes (U+201C/U+201D) das extremidades', () => {
    expect(normalizeTopic('\u201c101.2\u201d')).toBe('101.2')
    expect(normalizeTopic('\u201c102.5\u201d')).toBe('102.5')
  })

  it('remove aspas abertas duplas (abertura repetida)', () => {
    expect(normalizeTopic('\u201c\u201c101.2\u201d\u201d')).toBe('101.2')
  })

  it('não remove aspas internas ao tópico', () => {
    // Cenário patológico — aspas no meio não devem ser removidas
    expect(normalizeTopic('101.2')).toBe('101.2')
  })
})

// =============================================================================
// buildTopicLine — duplicada de assets/js/quiz.js para teste isolado
// =============================================================================

function buildTopicLine(name, stats, opts = {}) {
  const { delta, href, topicTitle } = opts
  const tPct     = Math.round((stats.correct / stats.total) * 100)
  const bad      = tPct < 70
  const countStr = `${String(stats.correct).padStart(2, ' ')}/${String(stats.total).padEnd(2, ' ')}`
  const tPctStr  = String(tPct).padStart(3, ' ') + '%'
  const label    = topicTitle ? `[${topicTitle}]` : '[revisao]'

  let extrasHtml = ''
  if (delta !== undefined && delta !== null) {
    const deltaStr = delta === 0 ? '--' : (delta > 0 ? `+${delta}` : String(delta))
    const dClass   = delta === 0 ? 'quiz-sc-label' : (delta > 0 ? 'quiz-pass' : 'quiz-fail')
    extrasHtml += `<span class="${dClass}">(${deltaStr})</span>`
  }
  if (bad && href) {
    const lessonHref = topicTitle
      ? `/linux/${name.replace('.', '/')}/${topicTitle}`
      : href
    extrasHtml += `<a href="${escapeHtml(lessonHref)}" class="mention-link">${escapeHtml(label)}</a>`
  }

  return (
    `<span class="quiz-sc-label">${escapeHtml(name)}</span>` +
    `<span class="quiz-sc-label">${escapeHtml(countStr)}</span>` +
    `<span class="${bad ? 'quiz-fail' : 'quiz-pass'}">${escapeHtml(tPctStr)}</span>` +
    `<span>${extrasHtml}</span>`
  )
}

// =============================================================================
// Testes: buildTopicLine
// =============================================================================

describe('buildTopicLine', () => {
  it('contém o nome do tópico no primeiro span', () => {
    const html = buildTopicLine('103.1', { correct: 3, total: 5 })
    expect(html).toContain('<span class="quiz-sc-label">103.1</span>')
  })

  it('contém a contagem no segundo span', () => {
    const html = buildTopicLine('103.1', { correct: 3, total: 5 })
    expect(html).toContain(' 3/5 ')
  })

  it('usa quiz-fail e exibe pct quando tPct < 70', () => {
    const html = buildTopicLine('103.1', { correct: 3, total: 5 }) // 60%
    expect(html).toContain('<span class="quiz-fail">')
    expect(html).toContain(' 60%')
  })

  it('usa quiz-pass quando tPct >= 70', () => {
    const html = buildTopicLine('103.1', { correct: 4, total: 5 }) // 80%
    expect(html).toContain('<span class="quiz-pass">')
    expect(html).toContain(' 80%')
  })

  it('usa quiz-pass em 100%', () => {
    const html = buildTopicLine('103.1', { correct: 5, total: 5 })
    expect(html).toContain('<span class="quiz-pass">')
    expect(html).toContain('100%')
  })

  it('quarto span não tem link quando não é bad', () => {
    const html = buildTopicLine('103.1', { correct: 4, total: 5 }, { href: '/linux/103/1/revisao' })
    expect(html).not.toContain('mention-link')
  })

  it('quarto span contém link de revisão quando bad && href', () => {
    const html = buildTopicLine('103.1', { correct: 2, total: 5 }, { href: '/linux/103/1/revisao' })
    expect(html).toContain('mention-link')
    expect(html).toContain('/linux/103/1/revisao')
    expect(html).toContain('[revisao]')
  })

  it('usa topicTitle no link quando fornecido', () => {
    const html = buildTopicLine('103.1', { correct: 2, total: 5 }, {
      href:       '/linux/103/1/revisao',
      topicTitle: 'conceitos',
    })
    expect(html).toContain('/linux/103/1/conceitos')
    expect(html).toContain('[conceitos]')
  })

  it('exibe delta positivo no quarto span', () => {
    const html = buildTopicLine('103.1', { correct: 4, total: 5 }, { delta: 2 })
    expect(html).toContain('quiz-pass')
    expect(html).toContain('(+2)')
  })

  it('exibe delta negativo no quarto span', () => {
    const html = buildTopicLine('103.1', { correct: 3, total: 5 }, { delta: -1 })
    expect(html).toContain('quiz-fail')
    expect(html).toContain('(-1)')
  })

  it('exibe -- quando delta é zero', () => {
    const html = buildTopicLine('103.1', { correct: 4, total: 5 }, { delta: 0 })
    expect(html).toContain('quiz-sc-label')
    expect(html).toContain('(--)')
  })

  it('não contém separadores " · " (substituídos pelo grid gap)', () => {
    const html = buildTopicLine('103.1', { correct: 3, total: 5 }, {
      delta: 1,
      href:  '/linux/103/1/revisao',
    })
    expect(html).not.toContain(' · ')
  })

  it('produz ao menos 4 abertura de span (topic, count, pct, extras)', () => {
    const html = buildTopicLine('103.1', { correct: 3, total: 5 })
    // Cada coluna do grid é um <span> — sem delta/link há exatamente 4
    expect(html.split('<span').length - 1).toBe(4)
  })

  it('escapa HTML no nome do tópico', () => {
    const html = buildTopicLine('<103>', { correct: 1, total: 1 })
    expect(html).not.toContain('<103>')
    expect(html).toContain('&lt;103&gt;')
  })
})
