---
layout: page
title: "headings lab"
permalink: /test-h
hide_header: true
hide_footer: true
---

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=VT323&family=Orbitron:wght@400;600&family=Rajdhani:wght@600;700&family=Bungee&family=Chakra+Petch:wght@400;600&display=swap" rel="stylesheet">

<style>

/* RESET — neutraliza h1/h2/h3 globais dentro do lab */
.heading-lab h1,
.heading-lab h2,
.heading-lab h3 {
  text-shadow: none !important;
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  color: var(--text-color);
  font-family: 'JetBrains Mono', monospace;
  margin: 0.35em 0;
  line-height: 1.2;
}

.lab-section {
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 6px;
  padding: 22px 26px;
  margin: 28px 0;
  background: rgba(255,255,255,0.015);
}

.lab-label {
  font-size: 0.72em;
  color: var(--muted-color);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px dashed rgba(255,255,255,0.07);
  display: block;
}

/* ============================================================
   REFERÊNCIA — blockquote atual
   ============================================================ */
.lab-ref blockquote {
  margin: 6px 0;
}

/* ============================================================
   A — // COMMENT
   Share Tech Mono • rosa itálico • prefixo comentário de código
   ============================================================ */
.h-comment h1,
.h-comment h2,
.h-comment h3 {
  font-family: 'Share Tech Mono', monospace;
  color: #ff79c6;
  font-weight: 400;
  font-style: italic;
  letter-spacing: 0.06em;
}
.h-comment h1::before,
.h-comment h2::before,
.h-comment h3::before { content: '// '; opacity: 0.4; font-style: normal; }
.h-comment h1 { font-size: 1.9em; }
.h-comment h2 { font-size: 1.35em; }
.h-comment h3 { font-size: 1.05em; }

/* ============================================================
   B — [ VT323 ]
   Retro CRT pixel terminal • ciano • brackets
   ============================================================ */
.h-vt h1,
.h-vt h2,
.h-vt h3 {
  font-family: 'VT323', monospace;
  color: #8be9fd;
  font-weight: 400;
  letter-spacing: 0.08em;
  line-height: 1;
}
.h-vt h1::before, .h-vt h2::before, .h-vt h3::before { content: '[ '; color: rgba(139,233,253,0.35); }
.h-vt h1::after,  .h-vt h2::after,  .h-vt h3::after  { content: ' ]'; color: rgba(139,233,253,0.35); }
.h-vt h1 { font-size: 3em; }
.h-vt h2 { font-size: 2.2em; }
.h-vt h3 { font-size: 1.6em; }

/* ============================================================
   C — GLITCH
   Rajdhani • branco • text-shadow RGB split rosa+ciano
   ============================================================ */
.h-glitch h1,
.h-glitch h2,
.h-glitch h3 {
  font-family: 'Rajdhani', sans-serif;
  color: #ffffff;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  text-shadow: 2px 0 #ff79c6, -2px 0 #8be9fd !important;
}
.h-glitch h1 { font-size: 1.95em; }
.h-glitch h2 { font-size: 1.4em; }
.h-glitch h3 { font-size: 1.1em; }

/* ============================================================
   D — >>> PROMPT
   JetBrains Mono • verde shell • prefixo roxo
   ============================================================ */
.h-prompt h1,
.h-prompt h2,
.h-prompt h3 {
  font-family: 'JetBrains Mono', monospace;
  color: #50fa7b;
  font-weight: 400;
  letter-spacing: 0.01em;
}
.h-prompt h1::before,
.h-prompt h2::before,
.h-prompt h3::before { content: '>>> '; color: #bd93f9; }
.h-prompt h1 { font-size: 1.5em; }
.h-prompt h2 { font-size: 1.2em; }
.h-prompt h3 { font-size: 1em; }

/* ============================================================
   E — ORBITRON
   Sci-fi geométrico • roxo glow suave
   ============================================================ */
.h-orbit h1,
.h-orbit h2,
.h-orbit h3 {
  font-family: 'Orbitron', sans-serif;
  color: #bd93f9;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  text-shadow: 0 0 20px rgba(189,147,249,0.35) !important;
}
.h-orbit h1 { font-size: 1.6em; }
.h-orbit h2 { font-size: 1.2em; }
.h-orbit h3 { font-size: 0.95em; }

/* ============================================================
   F — BUNGEE
   Cyberpunk signage billboard • amarelo
   ============================================================ */
.h-bungee h1,
.h-bungee h2,
.h-bungee h3 {
  font-family: 'Bungee', cursive;
  color: #f1fa8c;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1.15;
}
.h-bungee h1 { font-size: 1.85em; }
.h-bungee h2 { font-size: 1.35em; }
.h-bungee h3 { font-size: 1.05em; }

/* ============================================================
   G — CHAKRA PETCH
   Técnico moderno • border-bottom neon • cor muda por nível
   ============================================================ */
.h-chakra h1,
.h-chakra h2,
.h-chakra h3 {
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-bottom: 1px solid;
  padding-bottom: 5px;
  display: inline-block;
  margin-bottom: 0.5em;
}
.h-chakra h1 { font-size: 1.7em; color: #ff79c6; border-color: rgba(255,121,198,0.4); }
.h-chakra h2 { font-size: 1.25em; color: #8be9fd; border-color: rgba(139,233,253,0.4); }
.h-chakra h3 { font-size: 1em; color: #bd93f9; border-color: rgba(189,147,249,0.4); }

/* ============================================================
   H — 0x PREFIX
   Share Tech Mono • ciano • prefixo hex rosa
   ============================================================ */
.h-hex h1,
.h-hex h2,
.h-hex h3 {
  font-family: 'Share Tech Mono', monospace;
  color: #8be9fd;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.h-hex h1::before,
.h-hex h2::before,
.h-hex h3::before {
  content: '0x';
  color: #ff79c6;
  font-size: 0.6em;
  margin-right: 7px;
  vertical-align: middle;
  opacity: 0.75;
}
.h-hex h1 { font-size: 1.85em; }
.h-hex h2 { font-size: 1.3em; }
.h-hex h3 { font-size: 1.05em; }

/* ============================================================
   I — MIX D+E (PROPOSTA FINAL)
   Orbitron • glow • prefixo mono escalado por nível
   h1: >>> verde  |  h2: >> roxo  |  h3: > ciano
   ============================================================ */
.h-mix h1,
.h-mix h2,
.h-mix h3 {
  font-family: 'Share Tech Mono', monospace;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.h-mix h1::before,
.h-mix h2::before,
.h-mix h3::before {
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0;
  font-weight: 400;
}
.h-mix h1 {
  font-size: 1.65em;
  color: #8be9fd;
  text-shadow: 0 0 22px rgba(139,233,253,0.35) !important;
}
.h-mix h1::before { content: '>>> '; color: #8be9fd; }

.h-mix h2 {
  font-size: 1.2em;
  color: #bd93f9;
  text-shadow: 0 0 14px rgba(189,147,249,0.3) !important;
}
.h-mix h2::before { content: '>> '; color: #bd93f9; }

.h-mix h3 {
  font-size: 0.95em;
  color: #6272a4;
  text-shadow: none !important;
}
.h-mix h3::before { content: '> '; color: #6272a4; }

</style>

<div class="heading-lab">

<!-- REFERÊNCIA ATUAL -->
<div class="lab-section lab-ref">
<span class="lab-label">referência atual — blockquote (> markdown)</span>

> TEMA PRINCIPAL

> Subtópico intermediário

> nota menor

</div>

<!-- A -->
<div class="lab-section h-comment">
<span class="lab-label">A — // comment — share tech mono • rosa itálico • prefixo de comentário</span>

<h1>Tema Principal</h1>
<h2>Subtópico Intermediário</h2>
<h3>Nota Menor</h3>
</div>

<!-- B -->
<div class="lab-section h-vt">
<span class="lab-label">B — [ VT323 ] — pixel retro CRT • ciano • brackets laterais</span>

<h1>TEMA PRINCIPAL</h1>
<h2>SUBTÓPICO INTERMEDIÁRIO</h2>
<h3>NOTA MENOR</h3>
</div>

<!-- C -->
<div class="lab-section h-glitch">
<span class="lab-label">C — GLITCH — rajdhani • branco • sombra RGB rosa+ciano</span>

<h1>Tema Principal</h1>
<h2>Subtópico Intermediário</h2>
<h3>Nota Menor</h3>
</div>

<!-- D -->
<div class="lab-section h-prompt">
<span class="lab-label">D — >>> prompt — jetbrains mono • verde shell • prefixo roxo</span>

<h1>Tema Principal</h1>
<h2>Subtópico Intermediário</h2>
<h3>Nota Menor</h3>
</div>

<!-- E -->
<div class="lab-section h-orbit">
<span class="lab-label">E — ORBITRON — sci-fi geométrico • roxo • glow suave</span>

<h1>Tema Principal</h1>
<h2>Subtópico Intermediário</h2>
<h3>Nota Menor</h3>
</div>

<!-- F -->
<div class="lab-section h-bungee">
<span class="lab-label">F — BUNGEE — cyberpunk signage • amarelo • billboard</span>

<h1>Tema Principal</h1>
<h2>Subtópico Intermediário</h2>
<h3>Nota Menor</h3>
</div>

<!-- G -->
<div class="lab-section h-chakra">
<span class="lab-label">G — CHAKRA PETCH — técnico moderno • cor varia por nível • border-bottom neon</span>

<h1>Tema Principal</h1>
<h2>Subtópico Intermediário</h2>
<h3>Nota Menor</h3>
</div>

<!-- H -->
<div class="lab-section h-hex">
<span class="lab-label">H — 0x PREFIX — share tech mono • ciano • prefixo hex rosa</span>

<h1>Tema Principal</h1>
<h2>Subtópico Intermediário</h2>
<h3>Nota Menor</h3>
</div>

<!-- I — MIX D+E -->
<div class="lab-section h-mix" style="border-color: rgba(189,147,249,0.2); background: rgba(189,147,249,0.03);">
<span class="lab-label" style="color: #bd93f9;">I — MIX D+E — orbitron + glow + prefixo mono escalado por nível</span>

<h1>Tema Principal</h1>
<h2>Subtópico Intermediário</h2>
<h3>Nota Menor</h3>
</div>

</div>
