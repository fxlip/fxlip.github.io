/**
 * tests/html/tabs.test.js
 *
 * Valida a estrutura das abas de navegação no terminal.
 * Tabs ficam em .terminal-tabs-bar, ABAIXO do .terminal-header (estilo GNOME).
 * Lê os templates diretamente (sem precisar de build).
 */

import { readFileSync } from 'fs'
import { describe, it, expect } from 'vitest'

const home    = readFileSync('_layouts/home.html', 'utf-8')
const include = readFileSync('_includes/terminal-tabs.html', 'utf-8')
const linux   = readFileSync('linux.md', 'utf-8')
const infosec = readFileSync('infosec.md', 'utf-8')
const p404    = readFileSync('404.md', 'utf-8')
const search  = readFileSync('s.md', 'utf-8')

// =============================================================================
// Include terminal-tabs.html — estrutura e links
// =============================================================================

describe('terminal-tabs.html — estrutura', () => {
  it('contém .terminal-tabs-bar', () => {
    expect(include).toContain('terminal-tabs-bar')
  })

  it('contém .terminal-tabs (nav)', () => {
    expect(include).toContain('terminal-tabs')
  })

  it('contém exatamente 5 abas .terminal-tab', () => {
    const anchors = include.match(/<a [^>]*terminal-tab[^>]*>/g) || []
    expect(anchors.length).toBe(5)
  })

  it('aba de busca tem id="terminal-tab-search" e aponta para /s', () => {
    expect(include).toContain('id="terminal-tab-search"')
    expect(include).toContain('href="/s"')
    expect(include).toContain('>?</a>')
  })

  it('aba de perfil tem id="terminal-tab-profile", label @ e começa oculta', () => {
    expect(include).toContain('id="terminal-tab-profile"')
    expect(include).toContain('>@</a>')
    expect(include).toContain('display:none')
  })

  it('aba "/" aponta para /', () => {
    expect(include).toMatch(/href="\/"/)
    expect(include).toContain('>/</a>')
  })

  it('aba "linux" aponta para /linux/', () => {
    expect(include).toMatch(/href="\/linux\/"/)
    expect(include).toContain('>linux</a>')
  })

  it('aba "infosec" aponta para /infosec/', () => {
    expect(include).toMatch(/href="\/infosec\/"/)
    expect(include).toContain('>infosec</a>')
  })

  it('usa Liquid para detectar aba ativa via page.url', () => {
    expect(include).toContain('page.url')
    expect(include).toContain('terminal-tab--active')
  })

  it('aba ativa usa aria-current', () => {
    expect(include).toContain('aria-current')
  })
})

// =============================================================================
// home.html — inclui o partial e NÃO tem tabs dentro do terminal-header
// =============================================================================

describe('home.html — inclusão do partial', () => {
  it('inclui terminal-tabs.html via Liquid', () => {
    expect(home).toContain('terminal-tabs.html')
  })

  it('terminal-header não contém terminal-tabs (tabs ficam fora do header)', () => {
    const headerBlock = home.match(/<div class="terminal-header">([\s\S]*?)<\/div>/)?.[1] || ''
    expect(headerBlock).not.toContain('terminal-tabs')
  })
})

// =============================================================================
// Páginas — todas incluem o partial
// =============================================================================

describe('linux.md — inclusão do partial', () => {
  it('inclui terminal-tabs.html', () => {
    expect(linux).toContain('terminal-tabs.html')
  })
})

describe('infosec.md — inclusão do partial', () => {
  it('inclui terminal-tabs.html', () => {
    expect(infosec).toContain('terminal-tabs.html')
  })
})

describe('404.md — inclusão do partial', () => {
  it('inclui terminal-tabs.html', () => {
    expect(p404).toContain('terminal-tabs.html')
  })
})

describe('s.md — inclusão do partial', () => {
  it('inclui terminal-tabs.html', () => {
    expect(search).toContain('terminal-tabs.html')
  })
})

// =============================================================================
// _terminal.scss — link killer e estilos
// =============================================================================

describe('Terminal tabs — SCSS', () => {
  const terminal = readFileSync('_sass/_terminal.scss', 'utf-8')

  it('.terminal-tab está na whitelist do link killer (:not chain)', () => {
    expect(terminal).toContain(':not(.terminal-tab)')
  })

  it('define estilo para .terminal-tabs-bar', () => {
    expect(terminal).toContain('.terminal-tabs-bar')
  })

  it('define estilo para .terminal-tab--active', () => {
    expect(terminal).toContain('.terminal-tab--active')
  })

  it('define estilo para abas de ícone (.terminal-tab--icon)', () => {
    expect(terminal).toContain('.terminal-tab--icon')
  })
})
