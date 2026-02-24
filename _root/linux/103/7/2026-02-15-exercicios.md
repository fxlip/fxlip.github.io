---
layout: page
title: ".exercicios"
date: 2026-02-15T00:01:36-03:00
permalink: /linux/103/7/exercicios
categories: [linux]
tags: [103, 7]
muted: true
---


# 103.7

---


## [1]

Gere um comando que exiba na tela todas as linhas do arquivo `/etc/passwd` que terminem com "nologin".

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ grep "nologin$" /etc/passwd
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/run/ircd:/usr/sbin/nologin
_apt:x:42:65534::/nonexistent:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
systemd-network:x:998:998:systemd Network Management:/:/usr/sbin/nologin
systemd-timesync:x:996:996:systemd Time Synchronization:/:/usr/sbin/nologin
messagebus:x:101:101::/nonexistent:/usr/sbin/nologin
syslog:x:102:102::/nonexistent:/usr/sbin/nologin
systemd-resolve:x:991:991:systemd Resolver:/:/usr/sbin/nologin
uuidd:x:103:103::/run/uuidd:/usr/sbin/nologin
sshd:x:105:65534::/run/sshd:/usr/sbin/nologin
tcpdump:x:107:108::/nonexistent:/usr/sbin/nologin
landscape:x:108:109::/var/lib/landscape:/usr/sbin/nologin
fwupd-refresh:x:990:990:Firmware update daemon:/var/lib/fwupd:/usr/sbin/nologin
polkitd:x:989:989:User for polkitd:/:/usr/sbin/nologin
dnsmasq:x:999:65534:dnsmasq:/var/lib/misc:/usr/sbin/nologin
fxlip@www:~$ grep "nologin$" /etc/passwd | wc -l
28
fxlip@www:~$ 
  </div>
</div>

---

## [2]

Escreva um comando que irá exibir as linhas referentes aos usuários www-data e lpi somente, no arquivo /etc/passwd e redirecione o resultado para ~/exercicio2.txt .

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ egrep '^(www-data|lpi):' /etc/passwd
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
lpi:x:1001:1001:,,,:/home/lpi:/bin/bash
fxlip@www:~$ egrep '^(www-data|lpi):' /etc/passwd > ~/exercicio2.txt
fxlip@www:~$ cat exercicio2.txt 
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
lpi:x:1001:1001:,,,:/home/lpi:/bin/bash
fxlip@www:~$ 
  </div>
</div>

---

## [3]

Crie um comando que liste todos os arquivos do diretório /etc/ que contenham a palavra eth0 em seu conteúdo, não no nome do arquivo. A pesquisa deve incluir também os subdiretórios. Apenas o nome e caminho do arquivo devem ser exibidos.

(Use o sudo para obter privilégios) 

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ sudo grep -lr eth0 /etc/*
/etc/cloud/templates/chrony.conf.freebsd.tmpl
/etc/default/ubuntu-fan
/etc/initramfs-tools/initramfs.conf
fxlip@www:~$ 
  </div>
</div>

---

## [4]

No arquivo /etc/passwd , o primeiro campo indica o nome do usuário, enquanto que o terceiro indica o ID do usuário. Crie um comando que exiba apenas os nomes de usuários que tenham o ID com 3 dígitos.

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ egrep "[a-zA-Z]:[0-9][0-9][0-9]:" /etc/passwd | cut -d":" -f1
systemd-network
systemd-timesync
dhcpcd
messagebus
syslog
systemd-resolve
uuidd
tss
sshd
pollinate
tcpdump
landscape
fwupd-refresh
polkitd
dnsmasq
fxlip@www:~$ egrep "[a-zA-Z]:[0-9]{3}:" /etc/passwd | cut -d":" -f1
systemd-network
systemd-timesync
dhcpcd
messagebus
syslog
systemd-resolve
uuidd
tss
sshd
pollinate
tcpdump
landscape
fwupd-refresh
polkitd
dnsmasq
fxlip@www:~$ 
  </div>
</div>

---

## [5]

Com base no arquivo ~/LPI1/Exercicios/alunos.txt , crie um novo arquivo ~/LPI1/Exercicios/alunos-exercicio.txt contendo o mesmo conteúdo do arquivo alunos.txt mas fazendo com que toda ocorrência a "Ana Maria" seja substituído por "Marieta".

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~/files/lpi1/Exercicios$ cat alunos.txt 
Andre Gonçalves
Paulo Freitas
Ana Maria Donato
Maria Antonieta Sousa

Carlos Augusto
Ana Maria
ANA MARIA VASCONCELOS ANA

RAFAEL DOS SANTOS
Claudia Antonieta
Antonio Silvia
Francisca Ana Claudia
Eliseu Padilha
Ricardo
fxlip@www:~/files/lpi1/Exercicios$ sed -e 's/Ana Maria/Marieta/g' ~/LPI1/Exercicios/alunos.txt > ~/LPI1/Exercicios/alunos-exercicio.txt
fxlip@www:~/files/lpi1/Exercicios$ cat alunos-exercicio.txt 
Andre Gonçalves
Paulo Freitas
Marieta Donato
Maria Antonieta Sousa

Carlos Augusto
Marieta
ANA MARIA VASCONCELOS ANA

RAFAEL DOS SANTOS
Claudia Antonieta
Antonio Silvia
Francisca Ana Claudia
Eliseu Padilha
Ricardo
fxlip@www:~/files/lpi1/Exercicios$ 
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
>> @linux/103/8/vi
<< @linux/103/7/regex
    </div>
  </div>
</div>