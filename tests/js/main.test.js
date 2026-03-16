/**
 * tests/js/main.test.js
 *
 * Testa a função pura formatExamLogEntry de assets/js/main.js.
 * Mantida em sincronismo com a implementação original.
 */

import { describe, it, expect } from 'vitest'

// =============================================================================
// Extração da função pura (assets/js/main.js)
// =============================================================================

function formatExamLogEntry(entry) {
  if (!entry || !entry.username || !entry.type || !entry.label) return null;
  const user = '@' + entry.username;
  if (entry.type === 'prova') {
    return user + ' acertou ' + entry.pct + '% da prova ' + entry.label;
  }
  if (entry.type === 'topico') {
    return user + ' acertou ' + entry.pct + '% do tópico ' + entry.label;
  }
  return null;
}

// =============================================================================
// Testes
// =============================================================================

describe('formatExamLogEntry', () => {
  it('formata entrada de prova corretamente', () => {
    const result = formatExamLogEntry({ username: 'fxlip', type: 'prova', label: '101-500', pct: 85 })
    expect(result).toBe('@fxlip acertou 85% da prova 101-500')
  })

  it('formata entrada de tópico corretamente', () => {
    const result = formatExamLogEntry({ username: 'alice', type: 'topico', label: '103', pct: 72 })
    expect(result).toBe('@alice acertou 72% do tópico 103')
  })

  it('retorna null para tipo desconhecido', () => {
    const result = formatExamLogEntry({ username: 'bob', type: 'outro', label: '104', pct: 60 })
    expect(result).toBeNull()
  })

  it('retorna null para entrada sem username', () => {
    const result = formatExamLogEntry({ type: 'prova', label: '101-500', pct: 80 })
    expect(result).toBeNull()
  })

  it('retorna null para entrada sem type', () => {
    const result = formatExamLogEntry({ username: 'bob', label: '101-500', pct: 80 })
    expect(result).toBeNull()
  })

  it('retorna null para entrada nula', () => {
    expect(formatExamLogEntry(null)).toBeNull()
  })

  it('exibe 0% corretamente', () => {
    const result = formatExamLogEntry({ username: 'x', type: 'topico', label: '101', pct: 0 })
    expect(result).toBe('@x acertou 0% do tópico 101')
  })

  it('exibe 100% corretamente', () => {
    const result = formatExamLogEntry({ username: 'x', type: 'prova', label: '102-500', pct: 100 })
    expect(result).toBe('@x acertou 100% da prova 102-500')
  })
})
