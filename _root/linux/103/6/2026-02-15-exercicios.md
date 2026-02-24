---
layout: page
title: ".exercicios"
date: 2026-02-15T00:01:36-03:00
permalink: /linux/103/6/exercicios
categories: [linux]
tags: [103, 6]
muted: true
---

---

# 103.6

---


## [1]

Execute o comando top -b -d10 > /dev/null & com a menor prioridade possível.
(Use o comando top ou ps para validar o valor NICE do processo)

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
lpi@ubuntu:~$ nice -n19 top -b -d10 > /dev/null &
[2] 2240
lpi@ubuntu:~$ ps -la | grep top
0 S  1001   2240   1990  0  99  19 -  3082 do_sel pts/0   00:00:00 top
lpi@ubuntu:~$ 
  </div>
</div>

---

## [2]

Altere o NICE do processo rsyslogd para o valor -10.

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ ps -la | grep rsys*
fxlip@www:~$ pgrep rsyslogd
807
fxlip@www:~$ renice -10 807
807 (process ID) old priority 0, new priority -10
fxlip@www:~$ renice -10 $(pgrep rsyslogd)
807 (process ID) old priority -10, new priority -10
fxlip@www:~$ 
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
>> @linux/103/7/regex
<< @linux/103/6/necess
    </div>
  </div>
</div>