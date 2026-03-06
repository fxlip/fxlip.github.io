/**
 * tests/js/greeting-whoami.test.js
 *
 * Testa as funções puras do sistema whoami de assets/js/greeting.js.
 *
 * ATENÇÃO: Manter sincronizado com assets/js/greeting.js.
 * Se a lógica mudar, atualizar os testes correspondentes.
 *
 * Funções testadas:
 *   selectMessage(messages, rep)  → string do dog_txt ou null
 *   resolveGender(gender)         → 'o'|'a'|'e'
 *   applyGender(text, gender)     → string com % substituído
 *   applyVars(text, vars)         → string com {{var}} substituído
 */

import { describe, it, expect } from 'vitest'

// =============================================================================
// Extração das funções puras (mirrors de assets/js/greeting.js)
// ATENÇÃO: qualquer alteração aqui deve ser replicada em greeting.js
// =============================================================================

function selectMessage(messages, rep) {
  rep = rep || 0
  if (!messages || !messages.length) return null
  var sorted = messages.slice().sort(function(a, b) { return (b.min || 0) - (a.min || 0) })
  for (var i = 0; i < sorted.length; i++) {
    if (rep >= (sorted[i].min || 0) && sorted[i].dog_txt) return sorted[i].dog_txt
  }
  return null
}

function resolveGender(gender) {
  if (gender === 'f')  return 'a'
  if (gender === 'nb') return 'e'
  return 'o'
}

function applyGender(text, gender) {
  if (!text) return ''
  return text.replace(/%/g, resolveGender(gender))
}

function applyVars(text, vars) {
  if (!text) return ''
  vars = vars || {}
  return text.replace(/\{\{(\w+)\}\}/g, function(match, key) {
    var val = vars[key]
    return (val !== undefined && val !== null && val !== '') ? String(val) : match
  })
}

// =============================================================================
// TESTES: selectMessage
// =============================================================================

var MOCK_MESSAGES = [
  { min: 350, dog_txt: 'veteran%' },
  { min: 150, dog_txt: 'consolidado · {{days}} dias' },
  { min: 60,  dog_txt: 'ativ% · {{visits}} vis' },
  { min: 15,  dog_txt: 'voltou, {{visits}} visitas' },
  { min: 0,   dog_txt: 'novo por aqui. bem-vind%' },
]

describe('selectMessage', function() {
  describe('seleção pela reputação', function() {
    it('rep 0 → mensagem min 0', function() {
      expect(selectMessage(MOCK_MESSAGES, 0)).toBe('novo por aqui. bem-vind%')
    })
    it('rep 14 → mensagem min 0', function() {
      expect(selectMessage(MOCK_MESSAGES, 14)).toBe('novo por aqui. bem-vind%')
    })
    it('rep 15 → mensagem min 15', function() {
      expect(selectMessage(MOCK_MESSAGES, 15)).toBe('voltou, {{visits}} visitas')
    })
    it('rep 59 → mensagem min 15', function() {
      expect(selectMessage(MOCK_MESSAGES, 59)).toBe('voltou, {{visits}} visitas')
    })
    it('rep 60 → mensagem min 60', function() {
      expect(selectMessage(MOCK_MESSAGES, 60)).toBe('ativ% · {{visits}} vis')
    })
    it('rep 149 → mensagem min 60', function() {
      expect(selectMessage(MOCK_MESSAGES, 149)).toBe('ativ% · {{visits}} vis')
    })
    it('rep 150 → mensagem min 150', function() {
      expect(selectMessage(MOCK_MESSAGES, 150)).toBe('consolidado · {{days}} dias')
    })
    it('rep 349 → mensagem min 150', function() {
      expect(selectMessage(MOCK_MESSAGES, 349)).toBe('consolidado · {{days}} dias')
    })
    it('rep 350 → mensagem min 350', function() {
      expect(selectMessage(MOCK_MESSAGES, 350)).toBe('veteran%')
    })
    it('rep 9999 → mensagem min 350', function() {
      expect(selectMessage(MOCK_MESSAGES, 9999)).toBe('veteran%')
    })
  })

  describe('bordas exatas', function() {
    it('rep 14 → min 0 | rep 15 → min 15', function() {
      expect(selectMessage(MOCK_MESSAGES, 14)).toBe('novo por aqui. bem-vind%')
      expect(selectMessage(MOCK_MESSAGES, 15)).toBe('voltou, {{visits}} visitas')
    })
    it('rep 59 → min 15 | rep 60 → min 60', function() {
      expect(selectMessage(MOCK_MESSAGES, 59)).toBe('voltou, {{visits}} visitas')
      expect(selectMessage(MOCK_MESSAGES, 60)).toBe('ativ% · {{visits}} vis')
    })
    it('rep 149 → min 60 | rep 150 → min 150', function() {
      expect(selectMessage(MOCK_MESSAGES, 149)).toBe('ativ% · {{visits}} vis')
      expect(selectMessage(MOCK_MESSAGES, 150)).toBe('consolidado · {{days}} dias')
    })
    it('rep 349 → min 150 | rep 350 → min 350', function() {
      expect(selectMessage(MOCK_MESSAGES, 349)).toBe('consolidado · {{days}} dias')
      expect(selectMessage(MOCK_MESSAGES, 350)).toBe('veteran%')
    })
  })

  describe('ordenação independente da ordem no array', function() {
    it('funciona com array em ordem crescente', function() {
      var reversed = MOCK_MESSAGES.slice().reverse()
      expect(selectMessage(reversed, 60)).toBe('ativ% · {{visits}} vis')
    })
    it('funciona com array em ordem aleatória', function() {
      var shuffled = [MOCK_MESSAGES[2], MOCK_MESSAGES[0], MOCK_MESSAGES[4], MOCK_MESSAGES[1], MOCK_MESSAGES[3]]
      expect(selectMessage(shuffled, 200)).toBe('consolidado · {{days}} dias')
    })
  })

  describe('casos extremos', function() {
    it('messages vazio → null', function() {
      expect(selectMessage([], 0)).toBeNull()
    })
    it('messages null → null', function() {
      expect(selectMessage(null, 0)).toBeNull()
    })
    it('messages undefined → null', function() {
      expect(selectMessage(undefined, 50)).toBeNull()
    })
    it('rep null → usa min 0', function() {
      expect(selectMessage(MOCK_MESSAGES, null)).toBe('novo por aqui. bem-vind%')
    })
    it('rep undefined → usa min 0', function() {
      expect(selectMessage(MOCK_MESSAGES, undefined)).toBe('novo por aqui. bem-vind%')
    })
    it('entrada sem dog_txt → pula e usa próxima', function() {
      var msgs = [{ min: 50, dog_txt: null }, { min: 0, dog_txt: 'fallback' }]
      expect(selectMessage(msgs, 50)).toBe('fallback')
    })
  })
})

// =============================================================================
// TESTES: resolveGender
// =============================================================================

describe('resolveGender', function() {
  it("'m' → 'o'", function() { expect(resolveGender('m')).toBe('o') })
  it("'f' → 'a'", function() { expect(resolveGender('f')).toBe('a') })
  it("'nb' → 'e'", function() { expect(resolveGender('nb')).toBe('e') })
  it('null → o',        function() { expect(resolveGender(null)).toBe('o') })
  it('undefined → o',   function() { expect(resolveGender(undefined)).toBe('o') })
  it("'' → o",          function() { expect(resolveGender('')).toBe('o') })
  it('desconhecido → o',function() { expect(resolveGender('x')).toBe('o') })
})

// =============================================================================
// TESTES: applyGender
// =============================================================================

describe('applyGender', function() {
  it('masculino → o', function() { expect(applyGender('obrigad%', 'm')).toBe('obrigado') })
  it('feminino → a',  function() { expect(applyGender('obrigad%', 'f')).toBe('obrigada') })
  it('nb → e',        function() { expect(applyGender('obrigad%', 'nb')).toBe('obrigade') })
  it('múltiplos %',   function() { expect(applyGender('bem-vind%, obrigad%', 'f')).toBe('bem-vinda, obrigada') })
  it('sem % → intacto',function() { expect(applyGender('sem ocorrência', 'm')).toBe('sem ocorrência') })
  it('texto null → vazio', function() { expect(applyGender(null, 'm')).toBe('') })
  it('não altera @mentions', function() {
    expect(applyGender('escrevo sobre @linux. bem-vind%!', 'f')).toBe('escrevo sobre @linux. bem-vinda!')
  })
})

// =============================================================================
// TESTES: applyVars
// =============================================================================

describe('applyVars', function() {
  it('substitui {{name}}',    function() { expect(applyVars('olá, {{name}}!', { name: 'filippe' })).toBe('olá, filippe!') })
  it('substitui {{visits}}',  function() { expect(applyVars('{{visits}} visitas', { visits: 42 })).toBe('42 visitas') })
  it('substitui zero',        function() { expect(applyVars('{{comments}}', { comments: 0 })).toBe('0') })
  it('múltiplas variáveis',   function() {
    expect(applyVars('{{visits}} vis · {{time}}', { visits: 10, time: '1h' })).toBe('10 vis · 1h')
  })
  it('mesma variável 2x',     function() { expect(applyVars('{{rep}} · rep: {{rep}}', { rep: 99 })).toBe('99 · rep: 99') })
  it('ausente → mantém placeholder', function() { expect(applyVars('{{days}} dias', {})).toBe('{{days}} dias') })
  it('null → mantém placeholder',    function() { expect(applyVars('{{city}}', { city: null })).toBe('{{city}}') })
  it('vazio → mantém placeholder',   function() { expect(applyVars('{{name}}', { name: '' })).toBe('{{name}}') })
  it('vars null → sem substituição', function() { expect(applyVars('{{name}}', null)).toBe('{{name}}') })
  it('texto null → vazio',           function() { expect(applyVars(null, { name: 'x' })).toBe('') })
  it('não altera % junto com vars',  function() {
    expect(applyVars('bem-vind%, {{name}}!', { name: 'ana' })).toBe('bem-vind%, ana!')
  })
})
