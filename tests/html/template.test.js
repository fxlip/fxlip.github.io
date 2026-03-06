/**
 * tests/html/template.test.js
 *
 * Valida restrições de segurança e performance no template _layouts/default.html.
 * Não requer build — lê o template diretamente.
 *
 * Cobre:
 *   A. CSP — sem domínios desnecessários (Google Fonts não é usado)
 *   B. Sem scripts inline (exceto JSON-LD, que é dado, não código)
 *   C. Scripts condicionais por layout
 */

import { readFileSync, existsSync } from 'fs'
import { describe, it, expect } from 'vitest'

const template = readFileSync('_layouts/default.html', 'utf-8')

// Remove blocos JSON-LD (são dados, não JS — não precisam de unsafe-inline)
const templateWithoutJsonLD = template.replace(
  /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/g,
  ''
)

// =============================================================================
// A. CSP — sem Google Fonts (fontes são auto-hospedadas em assets/fonts/)
// =============================================================================

describe('CSP — domínios desnecessários', () => {
  it('style-src não contém fonts.googleapis.com', () => {
    expect(template).not.toContain('fonts.googleapis.com')
  })

  it('font-src não contém fonts.gstatic.com', () => {
    expect(template).not.toContain('fonts.gstatic.com')
  })
})

// =============================================================================
// B. Sem scripts inline — elimina necessidade de unsafe-inline em script-src
// =============================================================================

describe('Scripts — sem inline', () => {
  it('não há <script> inline no template (todo script tem src= ou type=)', () => {
    // Encontra todas as tags <script>
    const scriptTags = [...templateWithoutJsonLD.matchAll(/<script([^>]*)>/g)]
      .map(m => m[1].trim())

    // Todo script deve ter src= (externo) ou type= (dado)
    const inlineScripts = scriptTags.filter(
      attrs => !attrs.includes('src=') && !attrs.includes('type=')
    )

    expect(inlineScripts).toHaveLength(0)
  })

  it('arquivo sw-register.js existe em assets/js/', () => {
    expect(existsSync('assets/js/sw-register.js')).toBe(true)
  })
})

// =============================================================================
// C. Scripts condicionais — quiz.js só em layout simulado
// =============================================================================

describe('Scripts — carregamento condicional', () => {
  it('quiz.js está dentro de um bloco condicional Liquid', () => {
    const quizIdx = template.indexOf('quiz.js')
    expect(quizIdx).toBeGreaterThan(-1)

    // Pega o trecho antes da linha do quiz.js para verificar o if mais próximo
    const before = template.substring(0, quizIdx)
    const lastIfIdx = before.lastIndexOf('{%')
    const conditionalBlock = template.substring(lastIfIdx, quizIdx)

    expect(conditionalBlock).toMatch(/if|unless/)
  })

  it('interactions.js está dentro de um bloco condicional Liquid', () => {
    const idx = template.indexOf('interactions.js')
    expect(idx).toBeGreaterThan(-1)

    const before = template.substring(0, idx)
    const lastIfIdx = before.lastIndexOf('{%')
    const conditionalBlock = template.substring(lastIfIdx, idx)

    expect(conditionalBlock).toMatch(/if|unless/)
  })

  it('auth-callback.js está dentro de um bloco condicional Liquid', () => {
    const idx = template.indexOf('auth-callback.js')
    expect(idx).toBeGreaterThan(-1)

    const before = template.substring(0, idx)
    const lastIfIdx = before.lastIndexOf('{%')
    const conditionalBlock = template.substring(lastIfIdx, idx)

    expect(conditionalBlock).toMatch(/if|unless/)
  })
})
