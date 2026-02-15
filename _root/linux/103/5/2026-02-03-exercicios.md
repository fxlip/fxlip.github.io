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
lpi@ubuntu:~$ touch ~lpi/relatorio.txt
lpi@ubuntu:~$ echo "Valor do Total de memória RAM utilizada" >> ~lpi/relatorio.txt
lpi@ubuntu:~$ free -m | grep Mem | awk '{print $3}' >> ~lpi/relatorio.txt
lpi@ubuntu:~$ echo -e "\nLoad Average" >> ~lpi/relatorio.txt
lpi@ubuntu:~$ uptime | cut -d"," -f4 >> ~lpi/relatorio.txt
lpi@ubuntu:~$ cat relatorio.txt 
Valor do Total de memória RAM utilizada
385

Load Average
 1.93
lpi@ubuntu:~$ echo -e "\nQuantidade de processos (separados por vírgula)" >> ~lpi/relatorio.txt
lpi@ubuntu:~$ echo $(ps axu --no-headers | wc -l) >> ~lpi/relatorio.txt
lpi@ubuntu:~$ echo -e "\nPID dos 3 processos que estão utilizando mais Memória" >> ~lpi/relatorio.txt
lpi@ubuntu:~$ echo $(ps --sort=-%mem --no-headers -eo pid | head -n 3 | tr '\n' ',') >> ~lpi/relatorio.txt
lpi@ubuntu:~$ echo -e "\nPPID (Parent Process ID) dos 3 processos com maior tempo de Uso de CPU" >> ~lpi/r
elatorio.txt
lpi@ubuntu:~$ ps --sort=-%cpu --no-headers -eo ppid | head -n 3 | tr '\n' ',' >> ~lpi/relatorio.txt
lpi@ubuntu:~$ cat relatorio.txt 
Valor do Total de memória RAM utilizada
385

Load Average
1.93

Quantidade de processos (separados por vírgula)
129

PID dos 3 processos que estão utilizando mais Memória
858, 1222, 2258,

PPID (Parent Process ID) dos 3 processos com maior tempo de Uso de CPU
2168,   2168,   2168,
lpi@ubuntu:~$   
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
lpi@ubuntu:~$ ps aux | sort -nrk 3,3 | head -n 3
root        2179 32.9  0.0   2840  1536 pts/0    R    14:43   2:40 cat /dev/urandom
root        2178 32.9  0.1   7904  3200 pts/0    R    14:43   2:40 sha1sum /dev/zero
root        2177 32.9  0.0   2696  1408 pts/0    R    14:43   2:40 yes
lpi@ubuntu:~$ kill -9 2179
bash: kill: (2179) - Operation not permitted
lpi@ubuntu:~$ sudo kill -9 2179
lpi@ubuntu:~$ sudo kill -9 2178
lpi@ubuntu:~$ sudo kill -9 2177
lpi@ubuntu:~$ ps aux | sort -nrk 3,3 | head -n 3
root        2258  0.7  4.4 854192 86828 ?        SNl  14:43   0:03 /opt/theia/node 
root        1298  0.1  0.6 1231188 12432 ?       S<l  11:46   0:11 /bin/runtime-info-service
systemd+    1185  0.0  0.6  21460 12928 ?        Ss   11:46   0:00 /usr/lib/systemd/systemd-resolved
lpi@ubuntu:~$ 
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
lpi@ubuntu:~$ top -b -d10 > /home/lpi/resultado-top.out &
[1] 2431
lpi@ubuntu:~$ cat resultado-top.out 
top - 14:53:48 up  3:07,  1 user,  load average: 1.09, 2.95, 1.94
Tasks: 126 total,   1 running, 125 sleeping,   0 stopped,   0 zombie
%Cpu(s): 0.0 us, 0.0 sy, 0.0 ni,100.0 id, 0.0 wa, 0.0 hi, 0.0 si, 0.0 st 
MiB Mem : 1903.3 total,   504.4 free, 480.7 used,   1111.2 buff/cache     
MiB Swap: 1024.0 total,  1024.0 free,   0.0 used.   1422.6 avail Mem 

PID USER  PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
1 root    20   0   22248  13128   9416 S   0.0   0.7   0:02.53 systemd
2 root    20   0       0      0      0 S   0.0   0.0   0:00.00 kthreadd
3 root    20   0       0      0      0 S   0.0   0.0   0:00.00 pool_wo+
...
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
lpi@ubuntu:~$ ps axu | grep "top -b -d10"
lpi   2431  0.0  0.2  12328  5632 pts/0    S    14:53   0:00 top -b -d10
lpi   2907  0.0  0.1   7080  2176 pts/0    S+   14:58   0:00 grep top -b
lpi@ubuntu:~$ kill -9 2431
lpi@ubuntu:~$ ps axu | grep "top -b -d10"
lpi   2945  0.0  0.1   7080  2176 pts/0    S+   14:59   0:00 grep top -b
[1]+  Killed                  top -b -d10 > /home/lpi/resultado-top.out
lpi@ubuntu:~$   
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