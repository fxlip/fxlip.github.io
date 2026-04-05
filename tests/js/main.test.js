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

function buildProfileTabState(name, pathname) {
  if (!name) return { href: null, label: null, active: false };
  var href   = '/' + name;
  var label  = '@' + name;
  var active = pathname === href || pathname === href + '/';
  return { href, label, active };
}

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

function examLogElapsedText(elapsed_mins) {
  if (elapsed_mins == null || typeof elapsed_mins !== 'number') return '';
  return ' em ' + elapsed_mins + 'min';
}

// =============================================================================
// buildProfileTabState
// =============================================================================

describe('buildProfileTabState', () => {
  it('retorna hidden quando name é null', () => {
    const s = buildProfileTabState(null, '/')
    expect(s.href).toBeNull()
    expect(s.label).toBeNull()
    expect(s.active).toBe(false)
  })

  it('retorna hidden quando name é string vazia', () => {
    const s = buildProfileTabState('', '/fxlip')
    expect(s.href).toBeNull()
  })

  it('monta href e label a partir do name', () => {
    const s = buildProfileTabState('fxlip', '/')
    expect(s.href).toBe('/fxlip')
    expect(s.label).toBe('@fxlip')
  })

  it('ativo quando pathname bate com /name', () => {
    expect(buildProfileTabState('fxlip', '/fxlip').active).toBe(true)
  })

  it('ativo quando pathname bate com /name/ (trailing slash)', () => {
    expect(buildProfileTabState('fxlip', '/fxlip/').active).toBe(true)
  })

  it('não ativo em outras rotas', () => {
    expect(buildProfileTabState('fxlip', '/').active).toBe(false)
    expect(buildProfileTabState('fxlip', '/linux').active).toBe(false)
    expect(buildProfileTabState('fxlip', '/infosec').active).toBe(false)
  })

  it('funciona com qualquer username', () => {
    const s = buildProfileTabState('alice42', '/alice42')
    expect(s.href).toBe('/alice42')
    expect(s.label).toBe('@alice42')
    expect(s.active).toBe(true)
  })

  it('state.active=true em /username com dois terminais na página (profile-card + 404)', () => {
    // Simula o cenário onde 404.md e profile-card.html ambos incluem o partial
    const s = buildProfileTabState('fxlip', '/fxlip')
    expect(s.active).toBe(true)
    // Garante que o estado é derivado apenas de name + pathname, sem depender de getElementById
  })
})

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

// =============================================================================
// examLogElapsedText
// =============================================================================

describe('examLogElapsedText', () => {
  it('retorna string vazia para null (entrada antiga sem tempo)', () => {
    expect(examLogElapsedText(null)).toBe('')
  })

  it('retorna string vazia para undefined', () => {
    expect(examLogElapsedText(undefined)).toBe('')
  })

  it('formata minutos corretamente', () => {
    expect(examLogElapsedText(32)).toBe(' em 32min')
  })

  it('formata 0 minutos', () => {
    expect(examLogElapsedText(0)).toBe(' em 0min')
  })

  it('formata mais de 60 minutos sem truncar', () => {
    expect(examLogElapsedText(61)).toBe(' em 61min')
  })

  it('retorna string vazia para string (tipo inválido)', () => {
    expect(examLogElapsedText('32')).toBe('')
  })
})
