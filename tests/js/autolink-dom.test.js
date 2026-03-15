/**
 * tests/js/autolink-dom.test.js
 * @vitest-environment jsdom
 *
 * Testa o comportamento DOM de assets/js/autolink.js.
 *
 * Carrega o script real via eval para testar a implementação verdadeira.
 * Testes que FALHAM agora (innerHTML.replace) e PASSAM após E (TreeWalker):
 *   - Event listeners preservados após processamento
 *   - Atributos HTML não afetados por regex de texto
 *   - @mention dentro de <a> ou <code> não é reprocessado
 *
 * Testes que validam a correção das transformações (D):
 *   - @mention vira link
 *   - [N/M] vira barra de progresso
 *   - [0/0] não gera barra
 *   - @mention dentro de <code> não é convertido
 */

import { readFileSync } from 'fs'
import { beforeAll, beforeEach, afterEach, describe, it, expect, vi } from 'vitest'

// =============================================================================
// Setup: carrega autolink.js no jsdom real
// =============================================================================

beforeAll(() => {
  document.body.innerHTML = ''
  document.body.dataset.workerUrl = 'http://localhost'

  // Mocks de APIs que autolink.js usa
  global.fetch               = vi.fn().mockRejectedValue(new Error('offline'))
  global.requestAnimationFrame = vi.fn(cb => cb())
  global.requestIdleCallback   = vi.fn(cb => cb({ timeRemaining: () => 50 }))
  global.navigator = { clipboard: { writeText: vi.fn().mockResolvedValue() } }

  // Intercepta DOMContentLoaded para executar o handler imediatamente
  let domHandler = null
  const origAdd = document.addEventListener.bind(document)
  document.addEventListener = function (type, handler, ...rest) {
    if (type === 'DOMContentLoaded') { domHandler = handler }
    else origAdd(type, handler, ...rest)
  }

  // Avalia o script real — registra o handler
  // eslint-disable-next-line no-eval
  eval(readFileSync('assets/js/autolink.js', 'utf-8'))

  document.addEventListener = origAdd

  // Executa o handler com o documento vazio (sem posts reais para processar)
  if (domHandler) domHandler()
})

// =============================================================================
// Helpers
// =============================================================================

function makeArea(html = '') {
  const el = document.createElement('div')
  el.className = 'post-content'
  el.innerHTML = html
  document.body.appendChild(el)
  return el
}

function cleanup(el) {
  if (el && el.parentNode) el.parentNode.removeChild(el)
}

// =============================================================================
// applyMentions
// =============================================================================

describe('applyMentions', () => {
  let area

  beforeEach(() => { area = null })
  afterEach(() => cleanup(area))

  it('@mention em texto simples vira <a class="mention-link">', () => {
    area = makeArea('<span>olá @linux aqui</span>')
    window.applyMentions(area)
    const link = area.querySelector('a.mention-link')
    expect(link).not.toBeNull()
    expect(link.getAttribute('href')).toBe('/linux')
  })

  it('@mention dentro de <code> não é convertido', () => {
    area = makeArea('<code>@linux</code>')
    window.applyMentions(area)
    // O texto original deve permanecer dentro de code, sem <a>
    expect(area.querySelector('code').querySelector('a')).toBeNull()
    expect(area.querySelector('code').textContent).toBe('@linux')
  })

  it('@mention dentro de <a> existente não é reprocessado', () => {
    area = makeArea('<a href="/custom">@linux</a>')
    window.applyMentions(area)
    // Não deve criar <a> dentro de <a>
    const links = area.querySelectorAll('a')
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toBe('/custom')
  })

  it('atributo HTML com @ não é modificado', () => {
    area = makeArea('<div data-user="@admin">texto normal</div>')
    window.applyMentions(area)
    expect(area.querySelector('[data-user]').dataset.user).toBe('@admin')
  })

  // =========================================================================
  // TESTE CRÍTICO — falha com innerHTML.replace, passa com TreeWalker
  // innerHTML.replace deserializa e re-cria todos os nós, destruindo listeners
  // =========================================================================
  it('event listener em elemento vizinho é preservado após processamento', () => {
    area = makeArea('<button id="test-btn">click</button><span>texto com @linux aqui</span>')

    const btn = area.querySelector('#test-btn')
    let clicked = false
    btn.addEventListener('click', () => { clicked = true })

    window.applyMentions(area)

    // Com innerHTML.replace: btn foi substituído por novo nó — listener perdido
    // Com TreeWalker: btn é o mesmo nó — listener preservado
    btn.click()
    expect(clicked).toBe(true)
  })

  it('não processa a mesma área duas vezes', () => {
    area = makeArea('<span>@linux</span>')
    window.applyMentions(area)
    const linksAfterFirst = area.querySelectorAll('a.mention-link').length

    window.applyMentions(area)
    const linksAfterSecond = area.querySelectorAll('a.mention-link').length

    expect(linksAfterFirst).toBe(linksAfterSecond)
  })
})

// =============================================================================
// processProgressBars
// =============================================================================

describe('processProgressBars', () => {
  let area

  beforeEach(() => { area = null })
  afterEach(() => cleanup(area))

  it('[5/10] vira .sys-load-wrapper com 50%', () => {
    area = makeArea('<p>[5/10]</p>')
    window.processProgressBars(area)
    const wrapper = area.querySelector('.sys-load-wrapper')
    expect(wrapper).not.toBeNull()
    const bar = wrapper.querySelector('.sys-load-bar')
    expect(bar.dataset.width).toBe('50%')
  })

  it('[10/10] vira barra com 100%', () => {
    area = makeArea('<p>[10/10]</p>')
    window.processProgressBars(area)
    const bar = area.querySelector('.sys-load-bar')
    expect(bar.dataset.width).toBe('100%')
  })

  it('[0/0] não gera barra de progresso (guarda divisão por zero)', () => {
    area = makeArea('<p>[0/0]</p>')
    window.processProgressBars(area)
    expect(area.querySelector('.sys-load-wrapper')).toBeNull()
  })

  it('[3/10 label] com rótulo é processado', () => {
    area = makeArea('<p>[3/10 Tópicos]</p>')
    window.processProgressBars(area)
    expect(area.querySelector('.sys-load-wrapper')).not.toBeNull()
  })

  it('[5/10] dentro de <pre> não é processado', () => {
    area = makeArea('<pre>[5/10]</pre>')
    window.processProgressBars(area)
    expect(area.querySelector('.sys-load-wrapper')).toBeNull()
  })

  // =========================================================================
  // TESTE CRÍTICO — falha com innerHTML.replace, passa com TreeWalker
  // =========================================================================
  it('event listener em elemento vizinho é preservado após processamento', () => {
    area = makeArea('<button id="bar-btn">ok</button><p>[5/10]</p>')

    const btn = area.querySelector('#bar-btn')
    let clicked = false
    btn.addEventListener('click', () => { clicked = true })

    window.processProgressBars(area)

    btn.click()
    expect(clicked).toBe(true)
  })
})

// =============================================================================
// applyHashMentions — já usa TreeWalker, serve como baseline de referência
// =============================================================================

describe('applyHashMentions', () => {
  let area

  beforeEach(() => { area = null })
  afterEach(() => cleanup(area))

  it('#cmd vira link para /s?=cmd', () => {
    area = makeArea('<p>use #bash aqui</p>')
    window.applyHashMentions(area)
    const link = area.querySelector('a.mention-link')
    expect(link).not.toBeNull()
    expect(link.getAttribute('href')).toContain('/s?=')
    expect(link.getAttribute('href')).toContain('bash')
  })

  it('#cmd dentro de <code> não é convertido', () => {
    area = makeArea('<code>#bash</code>')
    window.applyHashMentions(area)
    expect(area.querySelector('code').querySelector('a')).toBeNull()
  })

  it('converte #hashtag em .quiz-explanation quando container é passado como contexto', () => {
    const container = document.createElement('div')
    container.id = 'quiz-container'
    container.innerHTML =
      '<div class="quiz-q">' +
        '<p>Qual comando?</p>' +
        '<div class="quiz-explanation">Use #bash e #scripting para isso. #find também funciona.</div>' +
      '</div>'
    document.body.appendChild(container)

    window.applyHashMentions(container)

    const links = container.querySelectorAll('a.mention-link')
    expect(links).toHaveLength(3)
    expect(links[0].getAttribute('href')).toContain('bash')
    expect(links[1].getAttribute('href')).toContain('scripting')
    expect(links[2].getAttribute('href')).toContain('find')

    container.remove()
  })

  it('múltiplas hashtags na mesma explicação são todas convertidas', () => {
    const container = document.createElement('div')
    container.innerHTML =
      '<div class="quiz-explanation">#cp #recursive #directories</div>'
    document.body.appendChild(container)

    window.applyHashMentions(container)

    expect(container.querySelectorAll('a.mention-link')).toHaveLength(3)
    container.remove()
  })
})
