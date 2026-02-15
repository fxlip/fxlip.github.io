---
layout: page
title: ".exercicios"
date: 2026-02-03T00:01:36-03:00
permalink: /linux/103/5/exercicios
categories: [linux]
tags: [103, 5]
muted: true
---


> **103.5**

---


> [1]

Faça a identificação das informações abaixo com os dados da instância Linux atual.

- -> Total de Memória RAM utilizada (em MB)
- -> Load Average (Média dos Últimos 5 minutos)
- -> Quantidade de Processos em Execução
- -> PID dos 3 processos que estão utilizando mais Memória (separe por vírgula)
- -> PPID (Parent Process ID) dos 3 processos com maior tempo de Uso de CPU:

Após isso crie um arquivo chamado relatorio.txt no Home de seu usuário contendo as informações citadas na ordem como foi pedido, o mesmo deve seguir o modelo:

"Total de memória RAM 

Load Average 

Quantidade de processos (separados por vírgula) 

.."

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
  
  </div>
</div>

---

> [2]

Atualmente existem 3 processos no sistema que estão usando bastante CPU, identifique e use os comandos necessários para encerrá-los.
(Use o sudo quando necessitar de permissão)

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
  
  </div>
</div>

---

> [3]

Crie um comando, que gere um arquivo chamado /home/lpi/resultado-top.out , que contenha a saída do comando top , atualizado a cada 10 segundos, sendo executado indefinidamente até que o processo seja morto. O comando deve rodar em background.

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
  
  </div>
</div>

---

> [4]

Envie um sinal de SIGKILL para o processo iniciado no exercício anterior.

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
  
  </div>
</div>

---

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <div class="win-btn btn-min" title="Minimize">−</div>
      <div class="win-btn btn-close" title="Close">✕</div>
    </div>
  </div>
  <div class="terminal-body">
    <div>
      <span class="t-user">fxlip</span><span class="t-gray">@</span><span class="t-host">www</span><span class="t-gray">:</span><span class="t-path">~</span><span class="t-gray">$</span> <span class="t-cmd">./footer.sh</span>
    </div>
    <div class="t-out">
>> @linux/103/6/niceness
<< @linux/103/5/tasks
    </div>
  </div>
</div>