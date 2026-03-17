/**
 * tests/js/greeting-id-prompt.test.js
 *
 * Testa a função pura maskName extraída de assets/js/greeting.js.
 * ATENÇÃO: manter sincronizado com assets/js/greeting.js.
 */

import { describe, it, expect } from 'vitest'

// =============================================================================
// Extração da função pura (mirror de assets/js/greeting.js)
// ATENÇÃO: qualquer alteração aqui deve ser replicada em greeting.js
// =============================================================================

function maskName(raw) {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9à-ú-]/g, '')
    .replace(/^-+/, '')
    .replace(/-{2,}/g, '-')
}

// =============================================================================
// TESTES: maskName
// =============================================================================

describe('maskName', function() {
  it('converte para minúsculas', function() {
    expect(maskName('Felipe')).toBe('felipe')
  })

  it('espaço → hífen', function() {
    expect(maskName('Felipe Souza')).toBe('felipe-souza')
  })

  it('múltiplos espaços → um hífen', function() {
    expect(maskName('a   b')).toBe('a-b')
  })

  it('remove hifens iniciais', function() {
    expect(maskName('---test')).toBe('test')
  })

  it('colapsa hifens duplos', function() {
    expect(maskName('a--b')).toBe('a-b')
  })

  it('mantém números', function() {
    expect(maskName('felipe123')).toBe('felipe123')
  })

  it('remove caracteres especiais', function() {
    expect(maskName('filipe!')).toBe('filipe')
  })

  it('mantém acentos (à-ú)', function() {
    expect(maskName('João')).toBe('joão')
  })

  it('string já válida → inalterada', function() {
    expect(maskName('fxlip')).toBe('fxlip')
  })

  it('tudo especial → string vazia', function() {
    expect(maskName('!!!')).toBe('')
  })

  it('hífen no final é removido pelo replace anterior (não por este)', function() {
    // Hífens duplos colapsam para um; hífen final não é removido por esta função
    expect(maskName('test--')).toBe('test-')
  })

  it('tab e newline → hífen', function() {
    expect(maskName('a\tb')).toBe('a-b')
    expect(maskName('a\nb')).toBe('a-b')
  })
})
