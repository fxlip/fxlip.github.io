/**
 * tests/js/autolink.test.js
 *
 * Testa as funções puras de assets/js/autolink.js.
 * As funções são extraídas aqui para teste isolado (sem DOM, sem DOMContentLoaded).
 *
 * ATENÇÃO: Manter sincronizado com assets/js/autolink.js.
 * Se a lógica da fonte mudar, atualizar os testes correspondentes.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// =============================================================================
// Extração de getRelativeTime (assets/js/autolink.js)
// =============================================================================

const months = {
  'jan': 0, 'fev': 1, 'feb': 1, 'mar': 2, 'abr': 3, 'apr': 3, 'mai': 4, 'may': 4, 'jun': 5,
  'jul': 6, 'ago': 7, 'aug': 7, 'set': 8, 'sep': 8, 'out': 9, 'oct': 9, 'nov': 10, 'dez': 11, 'dec': 11
}

function getRelativeTime(dateString) {
  if (!dateString) return null

  const cleanStr = dateString.replace(/\s+/g, ' ').trim()
  const match = cleanStr.match(/(\d{2}):(\d{2})\s*[·\-\|]\s*(\d{1,2})\s*de?\s*([a-zç]{3,})\s*de?\s*(\d{4})/i)
  if (!match) return null

  const hour     = parseInt(match[1])
  const min      = parseInt(match[2])
  const day      = parseInt(match[3])
  const monthStr = match[4].toLowerCase().substring(0, 3)
  const year     = parseInt(match[5])

  if (months[monthStr] === undefined) return null

  const postDate   = new Date(year, months[monthStr], day, hour, min)
  const now        = new Date()
  const diffMs     = now - postDate
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours  = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays   = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMs < 0)           return 'agora mesmo'
  if (diffMinutes < 60)     return diffMinutes <= 1 ? 'há 1 minuto' : `há ${diffMinutes} minutos`
  if (diffHours < 24)       return diffHours === 1 ? 'há 1 hora' : `há ${diffHours} horas`
  if (diffDays === 1 || (diffHours >= 24 && diffHours < 48)) return 'ontem'
  if (diffDays < 7)         return `há ${diffDays} dias`

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return weeks <= 1 ? 'semana passada' : `há ${weeks} semanas`
  }

  if (diffDays < 60) return 'mês passado'

  const monthFull = postDate.toLocaleString('pt-BR', { month: 'long' })
  return `em ${monthFull} de ${year}`
}

// =============================================================================
// Extração de escapeHtml (assets/js/autolink.js)
// =============================================================================

function escapeHtml(text) {
  return text
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;')
}

// =============================================================================
// Helper: gera string de data no formato esperado por getRelativeTime
// =============================================================================

function dateStringAgo(ms) {
  const date   = new Date(Date.now() - ms)
  const hh     = String(date.getHours()).padStart(2, '0')
  const mm     = String(date.getMinutes()).padStart(2, '0')
  const day    = date.getDate()
  const mNames = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  const month  = mNames[date.getMonth()]
  const year   = date.getFullYear()
  return `${hh}:${mm} · ${day} de ${month} de ${year}`
}

// =============================================================================
// Testes: getRelativeTime
// =============================================================================

describe('getRelativeTime', () => {
  it('retorna null para string vazia', () => {
    expect(getRelativeTime('')).toBeNull()
    expect(getRelativeTime(null)).toBeNull()
  })

  it('retorna null para formato inválido', () => {
    expect(getRelativeTime('2026-03-06')).toBeNull()
    expect(getRelativeTime('texto aleatório')).toBeNull()
    expect(getRelativeTime('10:30')).toBeNull()
  })

  it('retorna null para mês desconhecido', () => {
    expect(getRelativeTime('10:30 · 5 de xyz de 2026')).toBeNull()
  })

  it('retorna "agora mesmo" para datas futuras', () => {
    const future = new Date(Date.now() + 60 * 1000)
    const hh     = String(future.getHours()).padStart(2, '0')
    const mm     = String(future.getMinutes()).padStart(2, '0')
    const day    = future.getDate()
    const mNames = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
    const str    = `${hh}:${mm} · ${day} de ${mNames[future.getMonth()]} de ${future.getFullYear()}`
    expect(getRelativeTime(str)).toBe('agora mesmo')
  })

  it('retorna "há 1 minuto" para exatamente 1 minuto atrás', () => {
    // Nota: o formato HH:MM perde precisão de segundos.
    // 60s atrás pode aparecer como 1 ou 2 minutos dependendo do segundo atual.
    const result = getRelativeTime(dateStringAgo(60 * 1000))
    expect(result).toMatch(/^há [12] minutos?$/)
  })

  it('retorna "há N minutos" para menos de 1 hora atrás', () => {
    const result = getRelativeTime(dateStringAgo(5 * 60 * 1000))
    expect(result).toMatch(/^há \d+ minutos$/)
  })

  it('retorna "há 1 hora" para exatamente 1 hora atrás', () => {
    expect(getRelativeTime(dateStringAgo(60 * 60 * 1000))).toBe('há 1 hora')
  })

  it('retorna "há N horas" para menos de 24 horas atrás', () => {
    const result = getRelativeTime(dateStringAgo(3 * 60 * 60 * 1000))
    expect(result).toMatch(/^há \d+ horas$/)
  })

  it('retorna "ontem" para 25-47 horas atrás', () => {
    expect(getRelativeTime(dateStringAgo(25 * 60 * 60 * 1000))).toBe('ontem')
  })

  it('retorna "há N dias" para 2-6 dias atrás', () => {
    const result = getRelativeTime(dateStringAgo(3 * 24 * 60 * 60 * 1000))
    expect(result).toMatch(/^há \d+ dias$/)
  })

  it('retorna "semana passada" para 7-13 dias atrás', () => {
    expect(getRelativeTime(dateStringAgo(8 * 24 * 60 * 60 * 1000))).toBe('semana passada')
  })

  it('retorna "há N semanas" para 14-29 dias atrás', () => {
    const result = getRelativeTime(dateStringAgo(14 * 24 * 60 * 60 * 1000))
    expect(result).toMatch(/^há \d+ semanas$/)
  })

  it('retorna "mês passado" para 30-59 dias atrás', () => {
    expect(getRelativeTime(dateStringAgo(35 * 24 * 60 * 60 * 1000))).toBe('mês passado')
  })

  it('retorna "em [mês] de [ano]" para 60+ dias atrás', () => {
    const result = getRelativeTime(dateStringAgo(90 * 24 * 60 * 60 * 1000))
    expect(result).toMatch(/^em \w+ de \d{4}$/)
  })

  it('aceita separadores variados (·, -, |)', () => {
    const base = new Date(Date.now() - 5 * 60 * 1000)
    const hh   = String(base.getHours()).padStart(2, '0')
    const mm   = String(base.getMinutes()).padStart(2, '0')
    const day  = base.getDate()
    const mNames = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
    const month  = mNames[base.getMonth()]
    const year   = base.getFullYear()

    const withDot  = `${hh}:${mm} · ${day} de ${month} de ${year}`
    const withDash = `${hh}:${mm} - ${day} de ${month} de ${year}`
    const withPipe = `${hh}:${mm} | ${day} de ${month} de ${year}`

    expect(getRelativeTime(withDot)).toMatch(/há \d+ minutos/)
    expect(getRelativeTime(withDash)).toMatch(/há \d+ minutos/)
    expect(getRelativeTime(withPipe)).toMatch(/há \d+ minutos/)
  })

  it('aceita meses em PT e EN', () => {
    const str_pt = '10:00 · 1 de jan de 2020'
    const str_en = '10:00 · 1 de dec de 2020'
    expect(getRelativeTime(str_pt)).toMatch(/^em janeiro de 2020$/)
    expect(getRelativeTime(str_en)).toMatch(/^em dezembro de 2020$/)
  })
})

// =============================================================================
// Testes: escapeHtml
// =============================================================================

describe('escapeHtml', () => {
  it('converte & em &amp;', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('converte < em &lt;', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })

  it('converte > em &gt;', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b')
  })

  it('converte " em &quot;', () => {
    expect(escapeHtml('"texto"')).toBe('&quot;texto&quot;')
  })

  it("converte ' em &#039;", () => {
    expect(escapeHtml("it's")).toBe("it&#039;s")
  })

  it('não altera texto sem caracteres especiais', () => {
    expect(escapeHtml('texto normal 123')).toBe('texto normal 123')
  })

  it('escapa múltiplos caracteres especiais na mesma string', () => {
    const input    = '<a href="url" onclick=\'xss\'>click & go</a>'
    const expected = '&lt;a href=&quot;url&quot; onclick=&#039;xss&#039;&gt;click &amp; go&lt;/a&gt;'
    expect(escapeHtml(input)).toBe(expected)
  })

  it('string vazia retorna string vazia', () => {
    expect(escapeHtml('')).toBe('')
  })
})
