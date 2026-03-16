/**
 * tests/js/main.test.js
 *
 * Testa funções puras de assets/js/main.js.
 * Mantidas em sincronismo com a implementação original.
 */

import { describe, it, expect } from 'vitest'

// =============================================================================
// Extração de funções puras (assets/js/main.js)
// =============================================================================

function fmtLogTs(d) {
  if (!d || isNaN(d.getTime())) return '--';
  var D  = String(d.getDate()).padStart(2, '0');
  var M  = String(d.getMonth() + 1).padStart(2, '0');
  var Y  = d.getFullYear();
  var h  = String(d.getHours()).padStart(2, '0');
  var mi = String(d.getMinutes()).padStart(2, '0');
  return '[' + D + '-' + M + '-' + Y + '|' + h + ':' + mi + ']';
}

function formatExamLogEntry(entry) {
  if (!entry || !entry.username || !entry.type || !entry.label) return null;
  const user = '@' + entry.username;
  if (entry.type === 'prova')  return user + ' acertou ' + entry.pct + '% da prova '  + entry.label;
  if (entry.type === 'topico') return user + ' acertou ' + entry.pct + '% do tópico ' + entry.label;
  return null;
}

// =============================================================================
// fmtLogTs
// =============================================================================

describe('fmtLogTs', () => {
  it('formata data no padrão [DD-MM-YYYY|HH:MM]', () => {
    // Data fixa: 16 de março de 2026 às 01:05
    const d = new Date(2026, 2, 16, 1, 5) // mês é 0-indexed
    expect(fmtLogTs(d)).toBe('[16-03-2026|01:05]')
  })

  it('preenche zeros à esquerda em dia, mês, hora e minuto', () => {
    const d = new Date(2026, 0, 5, 9, 3) // 05-01-2026 09:03
    expect(fmtLogTs(d)).toBe('[05-01-2026|09:03]')
  })

  it('retorna "--" para data nula', () => {
    expect(fmtLogTs(null)).toBe('--')
  })

  it('retorna "--" para data inválida', () => {
    expect(fmtLogTs(new Date('invalida'))).toBe('--')
  })
})

// =============================================================================
// formatExamLogEntry
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
