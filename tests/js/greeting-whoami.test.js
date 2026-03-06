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

function buildWhoamiOutput(tiers, rep, gender) {
  var tier = selectTier(rep)
  var data = tiers['tier' + tier]
  if (!data || !data.dog_txt) return ''
  return applyGender(data.dog_txt, gender)
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
// TESTES: buildWhoamiOutput
// =============================================================================

var MOCK_TIERS = {
  tier1: { label: 'novo',       dog_txt: 'Escrevo sobre @linux. Bem-vind%!' },
  tier2: { label: 'recorrente', dog_txt: 'Olá de novo! Obrigad% por voltar.' },
  tier3: { label: 'ativo',      dog_txt: 'Você já é frequent%. Valeu!' },
  tier4: { label: 'consolidado',dog_txt: 'Membro consolidado%. Continue assim.' },
  tier5: { label: 'veterano',   dog_txt: 'Veteran% de carteirinha. Respeito.' },
}

describe('buildWhoamiOutput', function() {
  describe('seleção de tier por rep', function() {
    it('rep 0 → usa tier1', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 0, 'm')).toBe('Escrevo sobre @linux. Bem-vindo!')
    })
    it('rep 15 → usa tier2', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 15, 'f')).toBe('Olá de novo! Obrigada por voltar.')
    })
    it('rep 60 → usa tier3', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 60, 'nb')).toBe('Você já é frequente. Valeu!')
    })
    it('rep 150 → usa tier4', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 150, 'm')).toBe('Membro consolidadoo. Continue assim.')
    })
    it('rep 350 → usa tier5', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 350, 'f')).toBe('Veterana de carteirinha. Respeito.')
    })
  })

  describe('gender aplicado corretamente por tier', function() {
    it('tier1 feminino', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 0, 'f')).toBe('Escrevo sobre @linux. Bem-vinda!')
    })
    it('tier1 não-binário', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 0, 'nb')).toBe('Escrevo sobre @linux. Bem-vinde!')
    })
    it('tier5 masculino', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 400, 'm')).toBe('Veterano de carteirinha. Respeito.')
    })
    it('tier5 sem gender definido → padrão o', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 400, null)).toBe('Veterano de carteirinha. Respeito.')
    })
  })

  describe('casos extremos', function() {
    it('tiers vazio → retorna vazio', function() {
      expect(buildWhoamiOutput({}, 0, 'm')).toBe('')
    })
    it('tier sem dog_txt → retorna vazio', function() {
      expect(buildWhoamiOutput({ tier1: { label: 'vazio' } }, 0, 'm')).toBe('')
    })
    it('rep muito alto (>9999) → continua em tier5', function() {
      expect(buildWhoamiOutput(MOCK_TIERS, 99999, 'f')).toBe('Veterana de carteirinha. Respeito.')
    })
  })
})
