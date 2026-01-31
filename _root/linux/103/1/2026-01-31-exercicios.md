---
layout: page
title: ".exercicios"
date: 2026-01-31T00:01:36-03:00
permalink: /linux/103/1/exercicios/
categories: [linux]
tags: [103, 1]
hide_footer: true
---


> **103.1**

---

> [1]

Verifique qual o caminho completo do arquivo .bash_history para o seu usuário atual.

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ echo $HISTFILE
/home/fxlip/.bash_history
fxlip@www:~$ set | grep HISTFILE
HISTFILE=/home/fxlip/.bash_history
HISTFILESIZE=2000
fxlip@www:~$ 
  </div>
</div>



---

> [2]

Identifique o release do kernel instalado.

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ uname -r
6.8.0-90-generic
fxlip@www:~$ 
  </div>
</div>


---

> [3]

Identifique os diretórios incluídos em seu PATH.

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ echo $PATH
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
fxlip@www:~$ env | grep $PATH
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
fxlip@www:~$ 
  </div>
</div>


---

> [4]

Identifique o hostname da máquina.

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ uname -n
www
fxlip@www:~$ hostname
www
fxlip@www:~$ 
  </div>
</div>


---

> [5]

Busque a localização do binário do comando tar 

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ which tar
/usr/bin/tar
fxlip@www:~$ 
  </div>
</div>

---

> [6]

Identifique o PID do bash atual. 

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ echo $$
2065
fxlip@www:~$ ps | grep bash
   2065 pts/0    00:00:00 bash
fxlip@www:~$ 
  </div>
</div>

---

> [7]

Crie e exporte uma variável chamada "NOME" que contenha o seu nome completo.

Use o comando env para verificar se a variável foi criada corretamente.

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ export NOME="Felip Barbosa de Medeiros"
fxlip@www:~$ env
SHELL=/bin/bash
PWD=/home/fxlip
LOGNAME=fxlip
XDG_SESSION_TYPE=tty
HOME=/home/fxlip
LANG=C.UTF-8
SSH_CONNECTION=10.244.9.122 36214 172.30.1.2 22
NOME="Felip Barbosa de Medeiros"
LESSCLOSE=/usr/bin/lesspipe %s %s
XDG_SESSION_CLASS=user
TERM=xterm-256color
LESSOPEN=| /usr/bin/lesspipe %s
USER=fxlip
SHLVL=3
XDG_SESSION_ID=c1
XDG_RUNTIME_DIR=/run/user/1001
PS1=\[\e]0;\u@\h: \w\a\]${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ 
SSH_CLIENT=10.244.9.122 36214 22
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1001/bus
MAIL=/var/mail/fxlip
OLDPWD=/root
_=/usr/bin/env
fxlip@www:~$ 
  </div>
</div>

---

> [8]

Crie um comando que escreva na tela a seguinte frase e execute em seu ambiente: "O Conteúdo da Variável $NOME é: (Valor da Variável NOME)"

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ echo O Conteúdo da Variável '$NOME' é: $NOME
O Conteúdo da Variável $NOME é: "Felip Barbosa de Medeiros"
fxlip@www:~$ echo "O Conteúdo da Variável \$NOME é: $NOME"
O Conteúdo da Variável $NOME é: "Felip Barbosa de Medeiros"
fxlip@www:~$ echo O Conteúdo da Variável \$NOME é: $NOME
O Conteúdo da Variável $NOME é: "Felip Barbosa de Medeiros"
fxlip@www:~$ 
  </div>
</div>
