/**
 * tests/js/greeting-whoami.test.js
 *
 * Testa as funções puras do sistema whoami/tier de assets/js/greeting.js.
 *
 * ATENÇÃO: Manter sincronizado com assets/js/greeting.js.
 * Se a lógica mudar, atualizar os testes correspondentes.
 *
 * Funções testadas:
 *   selectTier(rep)              → 1|2|3|4|5
 *   resolveGender(gender)        → 'o'|'a'|'e'
 *   applyGender(text, gender)    → string com % substituído
 *   buildWhoamiOutput(tiers, rep, gender) → string final
 */

import { describe, it, expect } from 'vitest'

// =============================================================================
// Extração das funções puras (mirrors de assets/js/greeting.js)
// ATENÇÃO: qualquer alteração aqui deve ser replicada em greeting.js
// =============================================================================

var TIER_THRESHOLDS = [
  { tier: 5, min: 350 },
  { tier: 4, min: 150 },
  { tier: 3, min: 60  },
  { tier: 2, min: 15  },
  { tier: 1, min: 0   },
]

function selectTier(rep) {
  rep = rep || 0
  for (var i = 0; i < TIER_THRESHOLDS.length; i++) {
    if (rep >= TIER_THRESHOLDS[i].min) return TIER_THRESHOLDS[i].tier
  }
  return 1
}

function resolveGender(gender) {
  if (gender === 'f')  return 'a'
  if (gender === 'nb') return 'e'
  return 'o' // 'm' ou não definido
}

function applyGender(text, gender) {
  if (!text) return ''
  var suffix = resolveGender(gender)
  return text.replace(/%/g, suffix)
}

function applyVars(text, vars) {
  if (!text) return ''
  vars = vars || {}
  return text.replace(/\{\{(\w+)\}\}/g, function(match, key) {
    var val = vars[key]
    return (val !== undefined && val !== null && val !== '') ? String(val) : match
  })
}

function buildWhoamiOutput(tiers, rep, gender, vars) {
  var tier = selectTier(rep)
  var data = tiers['tier' + tier]
  if (!data || !data.dog_txt) return ''
  var text = applyVars(data.dog_txt, vars || {})
  return applyGender(text, gender)
}

// =============================================================================
// TESTES: selectTier
// =============================================================================

describe('selectTier', function() {
  describe('tier 1 (rep 0–14)', function() {
    it('rep = 0 → tier 1', function() {
      expect(selectTier(0)).toBe(1)
    })
    it('rep = 1 → tier 1', function() {
      expect(selectTier(1)).toBe(1)
    })
    it('rep = 14 → tier 1', function() {
      expect(selectTier(14)).toBe(1)
    })
    it('rep negativo → tier 1', function() {
      expect(selectTier(-5)).toBe(1)
    })
    it('rep undefined → tier 1', function() {
      expect(selectTier(undefined)).toBe(1)
    })
    it('rep null → tier 1', function() {
      expect(selectTier(null)).toBe(1)
    })
  })

  describe('tier 2 (rep 15–59)', function() {
    it('rep = 15 → tier 2', function() {
      expect(selectTier(15)).toBe(2)
    })
    it('rep = 30 → tier 2', function() {
      expect(selectTier(30)).toBe(2)
    })
    it('rep = 59 → tier 2', function() {
      expect(selectTier(59)).toBe(2)
    })
  })

  describe('tier 3 (rep 60–149)', function() {
    it('rep = 60 → tier 3', function() {
      expect(selectTier(60)).toBe(3)
    })
    it('rep = 100 → tier 3', function() {
      expect(selectTier(100)).toBe(3)
    })
    it('rep = 149 → tier 3', function() {
      expect(selectTier(149)).toBe(3)
    })
  })

  describe('tier 4 (rep 150–349)', function() {
    it('rep = 150 → tier 4', function() {
      expect(selectTier(150)).toBe(4)
    })
    it('rep = 250 → tier 4', function() {
      expect(selectTier(250)).toBe(4)
    })
    it('rep = 349 → tier 4', function() {
      expect(selectTier(349)).toBe(4)
    })
  })

  describe('tier 5 (rep 350+)', function() {
    it('rep = 350 → tier 5', function() {
      expect(selectTier(350)).toBe(5)
    })
    it('rep = 500 → tier 5', function() {
      expect(selectTier(500)).toBe(5)
    })
    it('rep = 9999 → tier 5', function() {
      expect(selectTier(9999)).toBe(5)
    })
  })

  describe('bordas exatas entre tiers', function() {
    it('rep = 14 → tier 1, rep = 15 → tier 2', function() {
      expect(selectTier(14)).toBe(1)
      expect(selectTier(15)).toBe(2)
    })
    it('rep = 59 → tier 2, rep = 60 → tier 3', function() {
      expect(selectTier(59)).toBe(2)
      expect(selectTier(60)).toBe(3)
    })
    it('rep = 149 → tier 3, rep = 150 → tier 4', function() {
      expect(selectTier(149)).toBe(3)
      expect(selectTier(150)).toBe(4)
    })
    it('rep = 349 → tier 4, rep = 350 → tier 5', function() {
      expect(selectTier(349)).toBe(4)
      expect(selectTier(350)).toBe(5)
    })
  })
})

// =============================================================================
// TESTES: resolveGender
// =============================================================================

describe('resolveGender', function() {
  it("gender 'm' → 'o'", function() {
    expect(resolveGender('m')).toBe('o')
  })
  it("gender 'f' → 'a'", function() {
    expect(resolveGender('f')).toBe('a')
  })
  it("gender 'nb' → 'e'", function() {
    expect(resolveGender('nb')).toBe('e')
  })
  it('gender null → padrão o', function() {
    expect(resolveGender(null)).toBe('o')
  })
  it('gender undefined → padrão o', function() {
    expect(resolveGender(undefined)).toBe('o')
  })
  it("gender '' (vazio) → padrão o", function() {
    expect(resolveGender('')).toBe('o')
  })
  it('gender desconhecido → padrão o', function() {
    expect(resolveGender('x')).toBe('o')
  })
})

// =============================================================================
// TESTES: applyGender
// =============================================================================

describe('applyGender', function() {
  describe('substituição simples', function() {
    it('substitui % por o (masculino)', function() {
      expect(applyGender('obrigad%', 'm')).toBe('obrigado')
    })
    it('substitui % por a (feminino)', function() {
      expect(applyGender('obrigad%', 'f')).toBe('obrigada')
    })
    it('substitui % por e (não-binário)', function() {
      expect(applyGender('obrigad%', 'nb')).toBe('obrigade')
    })
    it('substitui % com gender nulo → padrão o', function() {
      expect(applyGender('obrigad%', null)).toBe('obrigado')
    })
  })

  describe('múltiplas substituições', function() {
    it('substitui todos os % no texto', function() {
      expect(applyGender('bem-vind%, obrigad%', 'f')).toBe('bem-vinda, obrigada')
    })
    it('substitui 3 ocorrências de %', function() {
      expect(applyGender('el% é expert%, el% sabe.', 'nb')).toBe('ele é experte, ele sabe.')
    })
  })

  describe('casos extremos', function() {
    it('texto sem % → retorna intacto', function() {
      expect(applyGender('nenhuma ocorrência', 'm')).toBe('nenhuma ocorrência')
    })
    it('texto vazio → retorna vazio', function() {
      expect(applyGender('', 'm')).toBe('')
    })
    it('texto null → retorna vazio', function() {
      expect(applyGender(null, 'm')).toBe('')
    })
    it('texto undefined → retorna vazio', function() {
      expect(applyGender(undefined, 'f')).toBe('')
    })
    it('% no meio de palavra', function() {
      expect(applyGender('cansad% de vez em quando', 'f')).toBe('cansada de vez em quando')
    })
    it('% sozinho na string', function() {
      expect(applyGender('%', 'nb')).toBe('e')
    })
    it('texto só com %% (dois seguidos) → dois sufixos', function() {
      expect(applyGender('%%', 'f')).toBe('aa')
    })
  })

  describe('preserva o resto do texto', function() {
    it('não altera @mentions', function() {
      var txt = 'Escrevo sobre @linux e @infosec. Bem-vind%!'
      expect(applyGender(txt, 'm')).toBe('Escrevo sobre @linux e @infosec. Bem-vindo!')
    })
    it('não altera quebras de linha', function() {
      var txt = 'Linha 1\nLinha 2\nBem-vind%'
      expect(applyGender(txt, 'f')).toBe('Linha 1\nLinha 2\nBem-vinda')
    })
    it('não altera caracteres especiais', function() {
      expect(applyGender('Olá, tud% bem?', 'nb')).toBe('Olá, tude bem?')
    })
  })
})

// =============================================================================
// TESTES: applyVars
// =============================================================================

describe('applyVars', function() {
  describe('substituição simples', function() {
    it('substitui {{name}}', function() {
      expect(applyVars('olá, {{name}}!', { name: 'filippe' })).toBe('olá, filippe!')
    })
    it('substitui {{visits}}', function() {
      expect(applyVars('{{visits}} visitas', { visits: 42 })).toBe('42 visitas')
    })
    it('substitui número zero', function() {
      expect(applyVars('{{comments}} comentários', { comments: 0 })).toBe('0 comentários')
    })
    it('substitui múltiplas variáveis diferentes', function() {
      expect(applyVars('{{visits}} vis · {{time}} lendo', { visits: 10, time: '1h 30min' }))
        .toBe('10 vis · 1h 30min lendo')
    })
    it('substitui a mesma variável duas vezes', function() {
      expect(applyVars('{{rep}} · rep: {{rep}}', { rep: 99 })).toBe('99 · rep: 99')
    })
  })

  describe('variável ausente ou nula', function() {
    it('mantém {{variavel}} se não está em vars', function() {
      expect(applyVars('{{days}} dias', {})).toBe('{{days}} dias')
    })
    it('mantém {{variavel}} se valor é undefined', function() {
      expect(applyVars('{{city}}', { city: undefined })).toBe('{{city}}')
    })
    it('mantém {{variavel}} se valor é null', function() {
      expect(applyVars('{{city}}', { city: null })).toBe('{{city}}')
    })
    it('mantém {{variavel}} se valor é string vazia', function() {
      expect(applyVars('{{name}}', { name: '' })).toBe('{{name}}')
    })
    it('vars null → mantém todos os placeholders', function() {
      expect(applyVars('{{name}} visitou {{visits}} vezes', null)).toBe('{{name}} visitou {{visits}} vezes')
    })
  })

  describe('casos extremos', function() {
    it('texto sem variáveis → retorna intacto', function() {
      expect(applyVars('sem variáveis aqui', { name: 'x' })).toBe('sem variáveis aqui')
    })
    it('texto vazio → retorna vazio', function() {
      expect(applyVars('', { name: 'x' })).toBe('')
    })
    it('texto null → retorna vazio', function() {
      expect(applyVars(null, { name: 'x' })).toBe('')
    })
    it('converte número para string', function() {
      expect(applyVars('rep {{rep}}', { rep: 123 })).toBe('rep 123')
    })
    it('não altera % junto com variáveis', function() {
      expect(applyVars('bem-vind%, {{name}}!', { name: 'ana' })).toBe('bem-vind%, ana!')
    })
  })
})

// =============================================================================
// TESTES: buildWhoamiOutput
// =============================================================================

var MOCK_TIERS = {
  tier1: { label: 'novo',        dog_txt: 'Escrevo sobre @linux. Bem-vind%!' },
  tier2: { label: 'recorrente',  dog_txt: '{{visits}} visitas. Obrigad% por voltar.' },
  tier3: { label: 'ativo',       dog_txt: '{{visits}} vis · {{time}}. Você já é frequent%.' },
  tier4: { label: 'consolidado', dog_txt: '{{days}} dias · {{visits}} vis. Obrigad%.' },
  tier5: { label: 'veterano',    dog_txt: 'Veteran% de carteirinha. rep: {{rep}}.' },
}

var MOCK_VARS = { visits: 42, time: '3h', days: 90, rep: 400, name: 'ana', city: 'SP', comments: 5, upvotes: 10 }

describe('buildWhoamiOutput', function() {
  describe('seleção de tier por rep', function() {
    it('rep 0 → usa tier1 (sem variáveis)', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 0, 'm', {})).toBe('Escrevo sobre @linux. Bem-vindo!')
    })
    it('rep 15 → usa tier2 com variáveis', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 15, 'f', MOCK_VARS)).toBe('42 visitas. Obrigada por voltar.')
    })
    it('rep 60 → usa tier3 com variáveis', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 60, 'nb', MOCK_VARS)).toBe('42 vis · 3h. Você já é frequente.')
    })
    it('rep 150 → usa tier4 com variáveis', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 150, 'm', MOCK_VARS)).toBe('90 dias · 42 vis. Obrigado.')
    })
    it('rep 350 → usa tier5 com variáveis', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 350, 'f', MOCK_VARS)).toBe('Veterana de carteirinha. rep: 400.')
    })
  })

  describe('gender aplicado corretamente por tier', function() {
    it('tier1 feminino', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 0, 'f', {})).toBe('Escrevo sobre @linux. Bem-vinda!')
    })
    it('tier1 não-binário', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 0, 'nb', {})).toBe('Escrevo sobre @linux. Bem-vinde!')
    })
    it('tier5 masculino', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 400, 'm', MOCK_VARS)).toBe('Veterano de carteirinha. rep: 400.')
    })
    it('tier5 sem gender definido → padrão o', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 400, null, MOCK_VARS)).toBe('Veterano de carteirinha. rep: 400.')
    })
  })

  describe('variáveis e gender combinados', function() {
    it('variável {{name}} + % no mesmo texto', function() {
      var tiers = { tier1: { dog_txt: 'Olá, {{name}}! Bem-vind%.' } }
      expect(buildWhoamiOutput(tiers, 0, 'f', { name: 'ana' })).toBe('Olá, ana! Bem-vinda.')
    })
    it('variável ausente mantém placeholder, gender ainda é resolvido', function() {
      var tiers = { tier2: { dog_txt: '{{visits}} vis. Obrigad%.' } }
      expect(buildWhoamiOutput(tiers, 15, 'nb', {})).toBe('{{visits}} vis. Obrigade.')
    })
    it('vars null → mantém placeholders, gender resolvido', function() {
      var tiers = { tier1: { dog_txt: 'Bem-vind%, {{name}}!' } }
      expect(buildWhoamiOutput(tiers, 0, 'm', null)).toBe('Bem-vindo, {{name}}!')
    })
  })

  describe('casos extremos', function() {
    it('tiers vazio → retorna vazio', function() {
      expect(buildWhoamiOutput({}, 0, 'm', {})).toBe('')
    })
    it('tier sem dog_txt → retorna vazio', function() {
      expect(buildWhoamiOutput({ tier1: { label: 'vazio' } }, 0, 'm', {})).toBe('')
    })
    it('rep muito alto (>9999) → continua em tier5', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 99999, 'f', MOCK_VARS)).toBe('Veterana de carteirinha. rep: 400.')
    })
  })
})
