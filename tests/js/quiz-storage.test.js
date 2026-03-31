/**
 * tests/js/quiz-storage.test.js
 * @vitest-environment jsdom
 *
 * Testa as funções de persistência de estado Nível 2 de assets/js/quiz.js.
 * Funções duplicadas aqui para teste isolado (sem depender do IIFE).
 *
 * ATENÇÃO: Manter sincronizado com assets/js/quiz.js.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// =============================================================================
// Duplicatas de assets/js/quiz.js para teste isolado
// =============================================================================

const SCORES_KEY    = 'fxlip_quiz_scores'
const LEVEL2_KEY    = 'fxlip_quiz_level2'
const LEVEL2_TTL_MS = 24 * 60 * 60 * 1000 // 24 h

function loadScores() {
  try { return JSON.parse(localStorage.getItem(SCORES_KEY)) || {} }
  catch (_) { return {} }
}

function saveExamScores(examId, topicStats) {
  try {
    const scores = loadScores()
    scores[examId] = {}
    for (const [topic, stats] of Object.entries(topicStats)) {
      scores[examId][topic] = {
        pct:     Math.round((stats.correct / stats.total) * 100),
        correct: stats.correct,
        total:   stats.total,
      }
    }
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores))
  } catch (_) {}
}

function saveLevel2State(wrongQuestions, usedIds, examId) {
  try {
    localStorage.setItem(LEVEL2_KEY, JSON.stringify({
      ts:             Date.now(),
      examId:         examId,
      usedIds:        usedIds,
      wrongQuestions: wrongQuestions,
    }))
  } catch (_) {}
}

function loadLevel2State() {
  try {
    const raw = JSON.parse(localStorage.getItem(LEVEL2_KEY))
    if (!raw || Date.now() - raw.ts > LEVEL2_TTL_MS) return null
    return raw
  } catch (_) { return null }
}

function clearLevel2State() {
  try { localStorage.removeItem(LEVEL2_KEY) } catch (_) {}
}

// =============================================================================
// Fixtures
// =============================================================================

const WRONG_QUESTIONS = [
  { id: 'w1', topic: '101.1', comment: '#grep #find' },
  { id: 'w2', topic: '101.2', comment: '#awk' },
]
const USED_IDS = ['w1', 'w2', 'q1', 'q2']
const EXAM_ID  = '101'

// =============================================================================
// Testes: saveLevel2State / loadLevel2State / clearLevel2State
// =============================================================================

describe('saveLevel2State / loadLevel2State', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  it('persiste wrongQuestions no localStorage', () => {
    saveLevel2State(WRONG_QUESTIONS, USED_IDS, EXAM_ID)
    const state = loadLevel2State()
    expect(state).not.toBeNull()
    expect(state.wrongQuestions).toEqual(WRONG_QUESTIONS)
  })

  it('persiste usedIds no localStorage', () => {
    saveLevel2State(WRONG_QUESTIONS, USED_IDS, EXAM_ID)
    const state = loadLevel2State()
    expect(state.usedIds).toEqual(USED_IDS)
  })

  it('persiste examId no localStorage', () => {
    saveLevel2State(WRONG_QUESTIONS, USED_IDS, EXAM_ID)
    const state = loadLevel2State()
    expect(state.examId).toBe(EXAM_ID)
  })

  it('estado tem campo ts próximo ao momento do save', () => {
    const before = Date.now()
    saveLevel2State(WRONG_QUESTIONS, USED_IDS, EXAM_ID)
    const after = Date.now()
    const state = loadLevel2State()
    expect(state.ts).toBeGreaterThanOrEqual(before)
    expect(state.ts).toBeLessThanOrEqual(after)
  })

  it('retorna null quando localStorage está vazio', () => {
    expect(loadLevel2State()).toBeNull()
  })

  it('retorna null após TTL de 24h expirar', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'))

    saveLevel2State(WRONG_QUESTIONS, USED_IDS, EXAM_ID)

    // Avança 24h + 1ms
    vi.setSystemTime(new Date('2026-01-02T10:00:01Z'))

    expect(loadLevel2State()).toBeNull()
    vi.useRealTimers()
  })

  it('retorna estado antes do TTL expirar (23h59m59s)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'))

    saveLevel2State(WRONG_QUESTIONS, USED_IDS, EXAM_ID)

    // Avança 23h59m59s (1ms antes de expirar)
    vi.setSystemTime(new Date('2026-01-02T09:59:59Z'))

    expect(loadLevel2State()).not.toBeNull()
    vi.useRealTimers()
  })

  it('sobrescreve estado anterior ao salvar novamente', () => {
    saveLevel2State(WRONG_QUESTIONS, USED_IDS, EXAM_ID)

    const newWrong = [{ id: 'w3', topic: '102.1', comment: '#chmod' }]
    const newUsed  = ['w3', 'q5']
    saveLevel2State(newWrong, newUsed, '102')

    const state = loadLevel2State()
    expect(state.wrongQuestions).toEqual(newWrong)
    expect(state.usedIds).toEqual(newUsed)
    expect(state.examId).toBe('102')
  })
})

describe('clearLevel2State', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('remove o estado do localStorage', () => {
    saveLevel2State(WRONG_QUESTIONS, USED_IDS, EXAM_ID)
    clearLevel2State()
    expect(loadLevel2State()).toBeNull()
  })

  it('não lança erro quando estado já está ausente', () => {
    expect(() => clearLevel2State()).not.toThrow()
  })
})

// =============================================================================
// Testes: saveExamScores / loadScores
// =============================================================================

describe('saveExamScores', () => {
  const topicStats = {
    '103.1': { correct: 3, total: 4 },
    '103.2': { correct: 1, total: 2 },
  }

  beforeEach(() => { localStorage.clear() })

  it('salva pct correto para cada tópico', () => {
    saveExamScores('103', topicStats)
    const scores = loadScores()
    expect(scores['103']['103.1'].pct).toBe(75)  // 3/4 = 75%
    expect(scores['103']['103.2'].pct).toBe(50)  // 1/2 = 50%
  })

  it('salva correct count para cada tópico', () => {
    saveExamScores('103', topicStats)
    const scores = loadScores()
    expect(scores['103']['103.1'].correct).toBe(3)
    expect(scores['103']['103.2'].correct).toBe(1)
  })

  it('salva total para cada tópico', () => {
    saveExamScores('103', topicStats)
    const scores = loadScores()
    expect(scores['103']['103.1'].total).toBe(4)
    expect(scores['103']['103.2'].total).toBe(2)
  })

  it('sobrescreve dados do mesmo examId', () => {
    saveExamScores('103', topicStats)
    saveExamScores('103', { '103.1': { correct: 4, total: 4 } })
    const scores = loadScores()
    expect(scores['103']['103.1'].pct).toBe(100)
    expect(scores['103']['103.2']).toBeUndefined()
  })

  it('preserva dados de exames diferentes', () => {
    saveExamScores('103', topicStats)
    saveExamScores('104', { '104.1': { correct: 2, total: 2 } })
    const scores = loadScores()
    expect(scores['103']['103.1']).toBeDefined()
    expect(scores['104']['104.1']).toBeDefined()
  })

  it('arredonda pct para inteiro', () => {
    saveExamScores('103', { '103.1': { correct: 1, total: 3 } })
    const scores = loadScores()
    expect(scores['103']['103.1'].pct).toBe(33) // round(33.33) = 33
  })
})
