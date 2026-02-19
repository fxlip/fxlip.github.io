---
layout: page
title: ".exercicios"
date: 2026-01-31T00:01:36-03:00
permalink: /linux/103/2/exercicios
categories: [linux]
tags: [103, 2]
muted: true
---


> **103.2**

---

> [1]

O arquivo `/etc/passwd` contém a lista de usuários do Linux, os campos são separados pelo caractere :, o primeiro campo indica o nome do usuário e o terceiro o ID do usuário.

Escreva um comando que mostre os últimos 15 registros do arquivo, exibindo apenas o nome do usuário e seu ID, e que esteja ordenado pelo ID numérico. 

No comando `sort`, o `-t` define o delimitador, o `-k` o campo referência para o ordenamento, e o `-g` ordena como números ao invés de como caracteres

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ tail -n 15 /etc/passwd | cut -d":" -f1,3|sort -t ":" -k2 -g
kc-internal:0
messagebus:101
syslog:102
uuidd:103
tss:104
sshd:105
pollinate:106
tcpdump:107
landscape:108
polkitd:989
fwupd-refresh:990
systemd-resolve:991
dnsmasq:999
www:1000
fxlip:1001
fxlip@www:~$ 
  </div>
</div>

---

> [2]

No comando `sort`, o `-t` define o delimitador, o `-k` o campo referência para o ordenamento, e o `-g` ordena como números ao invés de como caracteres

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ sed '/daemon/d' /etc/passwd
root:x:0:0:root:/root:/bin/bash
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
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
dhcpcd:x:100:65534:DHCP Client Daemon,,,:/usr/lib/dhcpcd:/bin/false
messagebus:x:101:101::/nonexistent:/usr/sbin/nologin
syslog:x:102:102::/nonexistent:/usr/sbin/nologin
systemd-resolve:x:991:991:systemd Resolver:/:/usr/sbin/nologin
uuidd:x:103:103::/run/uuidd:/usr/sbin/nologin
tss:x:104:104:TPM software stack,,,:/var/lib/tpm:/bin/false
sshd:x:105:65534::/run/sshd:/usr/sbin/nologin
pollinate:x:106:1::/var/cache/pollinate:/bin/false
tcpdump:x:107:108::/nonexistent:/usr/sbin/nologin
landscape:x:108:109::/var/lib/landscape:/usr/sbin/nologin
polkitd:x:989:989:User for polkitd:/:/usr/sbin/nologin
www:x:1000:1000:www:/home/www:/bin/bash
kc-internal:x:0:0::/root:/bin/bash
dnsmasq:x:999:65534:dnsmasq:/var/lib/misc:/usr/sbin/nologin
fxlip:x:1001:1001:,,,:/home/fxlip:/bin/bash
fxlip@www:~$ sed '/daemon/d' /etc/passwd | wc -l
33
fxlip@www:~$
fxlip@www:~$ grep -v daemon /etc/passwd
root:x:0:0:root:/root:/bin/bash
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
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
dhcpcd:x:100:65534:DHCP Client Daemon,,,:/usr/lib/dhcpcd:/bin/false
messagebus:x:101:101::/nonexistent:/usr/sbin/nologin
syslog:x:102:102::/nonexistent:/usr/sbin/nologin
systemd-resolve:x:991:991:systemd Resolver:/:/usr/sbin/nologin
uuidd:x:103:103::/run/uuidd:/usr/sbin/nologin
tss:x:104:104:TPM software stack,,,:/var/lib/tpm:/bin/false
sshd:x:105:65534::/run/sshd:/usr/sbin/nologin
pollinate:x:106:1::/var/cache/pollinate:/bin/false
tcpdump:x:107:108::/nonexistent:/usr/sbin/nologin
landscape:x:108:109::/var/lib/landscape:/usr/sbin/nologin
polkitd:x:989:989:User for polkitd:/:/usr/sbin/nologin
www:x:1000:1000:www:/home/www:/bin/bash
kc-internal:x:0:0::/root:/bin/bash
dnsmasq:x:999:65534:dnsmasq:/var/lib/misc:/usr/sbin/nologin
fxlip:x:1001:1001:,,,:/home/fxlip:/bin/bash
fxlip@www:~$ grep -v daemon /etc/passwd | wc -l
33
fxlip@www:~$ 
  </div>
</div>

---

> [3]

No diretório foi adicionado um arquivo chamado file.txt aonde contém um texto de exemplo. Com isso pegue as seguintes informações do arquivo:

->> Quantidade de caracteres `-m` `--chars`

->> Quantidade de palavras `-w` `--words`

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ wc -m file.txt
553 /home/fxlip/www/file.txt
fxlip@www:~$ wc -w file.txt
83 /home/fxlip/www/file.txt
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
>> @linux/103/3/files
<< @linux/103/2/grep
    </div>
  </div>
</div>