---
layout: page
title: ".exercicios"
date: 2026-02-03T00:01:36-03:00
permalink: /linux/103/4/exercicios
categories: [linux]
tags: [103, 4]
muted: true
---

# 103.4

---


## [1]

Crie um único comando que gere a lista de arquivos e diretórios contidos em `~/LPI1/Exercicios/Network`, exibindo-os na tela e em um novo arquivo chamado `exercicio1.txt` no diretório `~/LPI1/Exercicios`.

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ ls -l LPI1/Exercicios/Network/
total 20
-rw-r--r-- 1 lpi lpi 1463 Jan 31 20:50 fan
drwxr-xr-x 2 lpi lpi 4096 Jan 31 20:50 if-down.d
drwxr-xr-x 2 lpi lpi 4096 Jan 31 20:50 if-post-down.d
drwxr-xr-x 2 lpi lpi 4096 Jan 31 20:50 if-pre-up.d
drwxr-xr-x 2 lpi lpi 4096 Jan 31 20:50 if-up.d
fxlip@www:~$ ls -l LPI1/Exercicios/Network/ | tee LPI1/Exercicios/exercicio1.txt
total 20
-rw-r--r-- 1 lpi lpi 1463 Jan 31 20:50 fan
drwxr-xr-x 2 lpi lpi 4096 Jan 31 20:50 if-down.d
drwxr-xr-x 2 lpi lpi 4096 Jan 31 20:50 if-post-down.d
drwxr-xr-x 2 lpi lpi 4096 Jan 31 20:50 if-pre-up.d
drwxr-xr-x 2 lpi lpi 4096 Jan 31 20:50 if-up.d
fxlip@www:~$
  </div>
</div>

---

## [2]

Crie um comando que exiba somente os 5 primeiros bytes do arquivo `~/LPI1/Exercicios/alunos.txt` e redirecione a resposta para `~/LPI1/Exercicios/exercicio2.txt`

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~/LPI1/Exercicios $ cat ~/alunos.txt | head -c 5
Andre
fxlip@www:~/LPI1/Exercicios $ cat ~/alunos.txt | head -c 5 > exercicio2.txt
fxlip@www:~/LPI1/Exercicios $ cat exercicio2.txt
Andre
fxlip@www:~/LPI1/Exercicios $
  </div>
</div>

---

## [3]

Ainda no arquivo` ~/LPI1/Exercicios/alunos.txt` crie um comando que faça a substituição de todas as letras maiúsculas para minúsculas, redirecione a saída para o arquivo `~/LPI1/Exercicios/exercicio3.txt`

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~/LPI1/Exercicios$ cat alunos.txt | tr ´A-Z´ ´a-z´
andre gonçalves
paulo freitas
maria antonieto sousa

carlos augusto
ana claudia
ana claudia vasconcelos ana

rafael dos santos
silvia oliveira
antonio silvia
eliseu padilha
fxlip@www:~/LPI1/Exercicios$ cat alunos.txt | tr ´A-Z´ ´a-z´ > exercicio3.txt
fxlip@www:~/LPI1/Exercicios$ cat exercicio3.txt
andre gonçalves
paulo freitas
maria antonieto sousa

carlos augusto
ana claudia
ana claudia vasconcelos ana

rafael dos santos
silvia oliveira
antonio silvia
eliseu padilha
fxlip@www:~/LPI1/Exercicios$
  </div>
</div>

---


## [4]

Gere um comando que em somente uma linha exiba no terminal a seguinte mensagem: "A versão do kernel do sistema é (Versão do kernel) e arquitetura (Arquitetura do sistema)", por fim redirecione a mensagem para o arquivo `~/LPI1/Exercicios/exercicio4.txt`

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~/LPI1/Exercicios$ uname -r
6.8.0-94-generic
fxlip@www:~/LPI1/Exercicios$ uname -i
x86_64
fxlip@www:~/LPI1/Exercicios$ echo "A versão do kernel do sistema é $(uname -r) e arquitetura $(uname -i)" > ~/LPI1/Exercicios/exercicio4.txt
-bash: /root/LPI1/Exercicios/exercicio4.txt: No such file or directory
fxlip@www:~/LPI1/Exercicios$ echo "A versão do kernel do sistema é $(uname -r) e arquitetura $(uname -i)" > /home/lpi/LPI1/Exercicios/exercicio4.txt
fxlip@www:~/LPI1/Exercicios$ cat exercicio4.txt 
A versão do kernel do sistema é 6.8.0-94-generic e arquitetura x86_64
fxlip@www:~/LPI1/Exercicios$ 
  </div>
</div>

---


## [5]

Gere um comando que encontre todos os diretórios e subdiretorios do /var cujo nome contenha a palavra "config" (excluindo os que contenham a palavra "docker", e logo após executando o ls com os parâmetros necessários em cada item do resultado, redirecionando a saída final para /home/lpi/LPI1/Exercicios/exercicio5.txt .

Para evitar erros de permissão use o sudo -i para entrar no modo root, e após terminar a tarefa volte ao seu usuário padrão (lpi).

A saída do comando deve ser algo como o visto abaixo:


`drwx------ 2 root    root    4096 Abr  7 11:37 /var/cache/ldconfig ` 

`drwx------ 4 lightdm lightdm 4096 Mar 27 16:41 /var/lib/lightdm/.config `

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ find /var -name "*config*" -not -path "*docker*" -type d | xargs ls -ld > /home/fxlip/www/Exercicios/exercicio5.txt
fxlip@www:~$ cat /home/fxlip/www/Exercicios/exercicio5.txt 
drwx------ 2 root root 4096 Jan 31 20:51 /var/cache/ldconfig
drwxr-xr-x 2 root root 4096 Jan 22  2025 /var/lib/systemd/deb-systemd-helper-enabled/cloud-config.target.wants
drwxr-xr-x 2 root root 4096 Jan 31 20:50 /var/lib/ubuntu-fan/config
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
>> @linux/103/5/tasks
<< @linux/103/4/pipes
    </div>
  </div>
</div>