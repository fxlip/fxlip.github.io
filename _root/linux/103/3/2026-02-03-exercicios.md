---
layout: page
title: ".exercicios"
date: 2026-02-03T00:01:36-03:00
permalink: /linux/103/3/exercicios
categories: [linux]
tags: [103, 3]
muted: true
---

---

# 103.3

---

## [1]

No home de seu usuário, crie um diretório chamado LPI1, dentro dele crie Aulas, Exercicios e Exemplos.

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ mkdir -p lpi1/Aulas
fxlip@www:~$ mkdir lpi1/Exercicios
fxlip@www:~$ mkdir lpi1/Exemplos
fxlip@www:~$ mkdir --help
Uso: mkdir [OPÇÃO]... DIRETÓRIO...
Cria o(s) DIRETÓRIO(s), se eles já não existirem.

Argumentos obrigatórios para opções longas também o são para opções curtas.
  -m, --mode=MODO   definir o modo do ficheiro (como chmod), 
                    não a=rwx - umask
  -p, --parents     sem erro se existir, cria pastas-mãe se preciso
                    com os modos de ficheiro não afectados por qualquer
                    opção -m.
  -v, --verbose     imprimir uma mensagem para cada pasta criada
  -Z                define o contexto de segurança SELinux de todo
                    diretório criado com o tipo padrão
    --context[=CTX] o mesmo que -Z ou, se CTX for especificado, define
                    o contexto de segurança SELinux ou SMACK com CTX
      --help        display this help and exit
      --version     output version information and exit
  </div>
</div>

---

## [2]

Copie (não mova) todos os arquivos e diretórios existentes em `/etc/network/` para `/home/lpi/LPI1/Exercicios/Network/` . Mantenha as mesmas permissões incluindo as informações de proprietário dos arquivos.

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$  mkdir LPI1/Exercicios/Network
fxlip@www:/$ sudo cp -pr /etc/network/* /root/LPI1/Exercicios/Network/
fxlip@www:~$ cp --help
Uso: cp [OPÇÃO]... [-T] ORIGEM DESTINO
 ou: cp [OPÇÃO]... ORIGEM... DIRETÓRIO
 ou: cp [OPÇÃO]... -t DIRETÓRIO ORIGEM...
Copia ORIGEM para DESTINO, ou múltiplas ORIGENs para DIRETÓRIO.

Argumentos obrigatórios para opções longas também o são para opções curtas.
  -a, --archive                o mesmo que -dR --preserve=all
      --attributes-only        não copia os dados do arquivo, só seus
                               atributos
      --backup[=CONTROLE]      faz uma cópia de segurança de cada 
                               arquivo de destino já existente
  -b                           como --backup, mas não aceita argumentos
      --copy-contents          copia o conteúdo de arquivos especiais
                               quando recursivo
  -d                           o mesmo que --no-dereference 
                               --preserve=links
  -f, --force                  se um arquivo de destino já existente 
                               não puder ser aberto, remove-o e tenta 
                               novamente (essa opção é ignorada quando 
                               a opção -n também é usada)
  -i, --interactive            pergunta antes de sobrescrever (sobrepõe
                               uma opção -n usada anteriormente)
  -H                           segue os links simbólicos da linha de
                               comando em ORIGEM
  -l, --link                   faz um link físico dos arquivos em vez de
                               copiá-los
  -L, --dereference            sempre segue links simbólicos em ORIGEM
  -n, --no-clobber             não sobrescreve um arquivo existente
                               (sobrepõe uma opção -i anterior)
  -P, --no-dereference         nunca segue um link simbólico em ORIGEM
  -p                           idem --preserve=mode,ownership,timestamps
      --preserve[=LST_ATRIB]   preserva os atributos especificados
                               (padrão: modo,dono,horários), e, se 
                               possível, atributos adicionais: contexto, 
                               links, estendidos, tudo. Os nomes a serem 
                               usados na lista devem estar em inglês 
                               separados por vírgula e sem espaço.
                               Os atributos são: mode (modo),
                               ownership (dono), timestamps (horários),
                               context (contexto), links,
                               xattr (estendidos) e all (tudo)
      --no-preserve=LST_ATRIB  não preserva os atributos especificados
      --parents                usa o nome completo do arquivo fonte sob
                               DIRETÓRIO
  -R, -r, --recursive          copia os diretórios recursivamente
      --reflink[=QUANDO]       controla cópias clone/CoW. Veja abaixo
      --remove-destination     remove cada arquivo de destino existente 
                               antes de tentar abri-lo (contrasta com 
                               --force)
      --sparse=QUANDO          controla a criação de arquivos esparsos.
                               Veja abaixo
     --strip-trailing-slashes  remove as barras finais de cada argumento
                               ORIGEM
  -s, --symbolic-link          cria links simbólicos em vez de copiar
  -S, --suffix=SUFIXO          redefine o sufixo de cópia de segurança
  -t  --target-directory=DIR   copia todos os argumentos ORIGEM para o
                               diretório DIR
  -T, --no-target-directory    trata DESTINO como um arquivo normal
  -u, --update                 copia apenas se o arquivo ORIGEM for mais
                               recente que o arquivo destino ou se este 
                               não existir
  -v, --verbose                explica o que está sendo feito
  -x, --one-file-system        permanece neste sistema de arquivos
  -Z                           define o contexto de segurança SELinux do 
                               arquivo de destino para o tipo padrão
      --context[=CONTEXTO]     como -Z ou, se CONTEXTO for especificado, 
                               então define o contexto de segurança 
                               SELinux ou SMACK para CONTEXTO
      --help                   display this help and exit
      --version                output version information and exit

  </div>
</div>



---


## [3]

Copie (não mova) todos os arquivos do diretório `/etc`, cujo nome termine com ".conf" para `/home/lpi/LPI1/Exercicios/Config/`

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$  mkdir LPI1/Exercicios/Conf
fxlip@www:~$  cp /etc/*.conf ~/LPI1/Exercicios/Conf/ 
fxlip@www:~$ 
  </div>
</div>


---


## [4]

Em `/home/lpi/LPI1/Exercicios`, crie um arquivo chamado arquivos-cron.tgz, compactado com o gzip, contendo todos os arquivos e diretórios do `/etc` que contenham a palavra "cron" no nome.

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$  tar zcvpf ~/LPI1/Exercicios/arquivos-cron.tgz /etc/*cron*
tar: Removing leading `/' from member names
/etc/cron.d/
/etc/cron.d/.placeholder
tar: Removing leading `/' from hard link targets
/etc/cron.d/php
/etc/cron.d/sysstat
/etc/cron.d/e2scrub_all
/etc/cron.daily/
/etc/cron.daily/.placeholder
/etc/cron.daily/logrotate
/etc/cron.daily/sysstat
/etc/cron.daily/man-db
/etc/cron.daily/apt-compat
/etc/cron.daily/dpkg
/etc/cron.daily/apport
/etc/cron.hourly/
/etc/cron.hourly/.placeholder
/etc/cron.monthly/
/etc/cron.monthly/.placeholder
/etc/cron.weekly/
/etc/cron.weekly/.placeholder
/etc/cron.weekly/man-db
/etc/cron.yearly/
/etc/cron.yearly/.placeholder
/etc/crontab
fxlip@www:~$ tar --help
Uso: tar [OPÇÃO...] [ARQUIVO]...
GNU 'tar' saves many files together into a single tape or disk archive, and can
restore individual files from the archive.

Examplos:
tar -cf archive.tar foo bar  # Create archive.tar from files foo and bar
tar -tvf archive.tar         # List all files in archive.tar verbosely.
tar -xf archive.tar          # Extract all files from archive.tar.

 Modo de operação principal:
  -A, --catenate,            anexa arquivos do tar a um arquivo-tar
      --concatenate
  -c, --create               cria um novo arquivo-tar
      --delete               exclui do arquivo-tar (não em fitas
                             magnéticas!)
  -d, --diff, --compare      encontra diferenças entre um arquivo-tar e 
                             o sistema de arquivos
  -r, --append               anexa arquivos ao final de um arquivo-tar
      --test-label           testa o rótulo de volume do arquivo-tar
  -t, --list                 lista os conteúdos de um arquivo-tar
  -u, --update               anexa apenas arquivos mais novos do que a 
                             cópia no arquivo-tar
  -x, --extract, --get       extrai arquivos de um arquivo-tar
  </div>
</div>


---


## [5]

Descompacte conteúdo do arquivo arquivos-cron.tgz dentro do diretório:

`/home/lpi/LPI1/Exercicios/Descompactar/`

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$  mkdir ~/LPI1/Exercicios/Descompactar
fxlip@www:~$  tar zxvpf ~/LPI1/Exercicios/arquivos-cron.tgz ~/LPI1/Exercicios/Descompactar/
tar: /root/LPI1/Exercicios/Descompactar: Not found in archive
tar: Exiting with failure status due to previous errors
fxlip@www:~$  tar zxvpf ~/LPI1/Exercicios/arquivos-cron.tgz ~/LPI1/Exercicios/Descompactar/*
tar: Pattern matching characters used in file names
tar: Use --wildcards to enable pattern matching, or --no-wildcards to suppress this warning
tar: /root/LPI1/Exercicios/Descompactar/*: Not found in archive
tar: Exiting with failure status due to previous errors
fxlip@www:~$  cd ~/LPI1/Exercicios/Descompactar
fxlip@www:~/LPI1/Exercicios/Descompactar$ tar zxvpf ../arquivos-cron.tgz
etc/cron.d/
etc/cron.d/.placeholder
etc/cron.d/php
etc/cron.d/sysstat
etc/cron.d/e2scrub_all
etc/cron.daily/
etc/cron.daily/.placeholder
etc/cron.daily/logrotate
etc/cron.daily/sysstat
etc/cron.daily/man-db
etc/cron.daily/apt-compat
etc/cron.daily/dpkg
etc/cron.daily/apport
etc/cron.hourly/
etc/cron.hourly/.placeholder
etc/cron.monthly/
etc/cron.monthly/.placeholder
etc/cron.weekly/
etc/cron.weekly/.placeholder
etc/cron.weekly/man-db
etc/cron.yearly/
etc/cron.yearly/.placeholder
etc/crontab
fxlip@www:~/LPI1/Exercicios/Descompactar$ cd
fxlip@www:~$ 
  </div>
</div>


---


## [6]

Encontre todos os arquivos do diretório `/var/log/lpi` , cujo nome termine com ".log" e cujo conteúdo foi modificado nas últimas 48 horas.

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$ find /var/log/lpi -name "*.log" -mtime -2
/var/log/lpi/yum.log
/var/log/lpi/maillog.log
/var/log/lpi/boot.log
/var/log/lpi/cron.log
/var/log/lpi/messages.log
/var/log/lpi/spooler.log
fxlip@www:~$ find --help
Usage: find [-H] [-L] [-P] [-Olevel] [-D debugopts] [path...] [expression]

Default path is the current directory; default expression is -print.
Expression may consist of: operators, options, tests, and actions.

Operators (decreasing precedence; -and is implicit where no others are given):
      ( EXPR )   ! EXPR   -not EXPR   EXPR1 -a EXPR2   EXPR1 -and EXPR2
      EXPR1 -o EXPR2   EXPR1 -or EXPR2   EXPR1 , EXPR2

Positional options (always true):
      -daystart -follow -nowarn -regextype -warn

Normal options (always true, specified before other expressions):
      -depth -files0-from FILE -maxdepth LEVELS -mindepth LEVELS
       -mount -noleaf -xdev -ignore_readdir_race -noignore_readdir_race

Tests (N can be +N or -N or N):
      -amin N -anewer FILE -atime N -cmin N -cnewer FILE -context CONTEXT
      -ctime N -empty -false -fstype TYPE -gid N -group NAME -ilname PATTERN
      -iname PATTERN -inum N -iwholename PATTERN -iregex PATTERN
      -links N -lname PATTERN -mmin N -mtime N -name PATTERN -newer FILE
      -nouser -nogroup -path PATTERN -perm [-/]MODE -regex PATTERN
      -readable -writable -executable
      -wholename PATTERN -size N[bcwkMG] -true -type [bcdpflsD] -uid N
      -used N -user NAME -xtype [bcdpfls]

Actions:
      -delete -print0 -printf FORMAT -fprintf FILE FORMAT -print 
      -fprint0 FILE -fprint FILE -ls -fls FILE -prune -quit
      -exec COMMAND ; -exec COMMAND {} + -ok COMMAND ;
      -execdir COMMAND ; -execdir COMMAND {} + -okdir COMMAND ;

Other common options:
      --help                   exibe esta ajuda e sai
      --version                output version information and exit

Valid arguments for -D:
exec, opt, rates, search, stat, time, tree, all, help
Use '-D help' for a description of the options, or see find(1)

fxlip@www:~$ find -D help
Valid arguments for -D:
exec       Show diagnostic information relating to -exec, -execdir, 
           -ok and -okdir
opt        Show diagnostic information relating to optimisation
rates      Indicate how often each predicate succeeded
search     Navigate the directory tree verbosely
stat       Trace calls to stat(2) and lstat(2)
time       Show diagnostic information relating to time-of-day and 
           timestamp comparisons
tree       Display the expression tree
all        Set all of the debug flags (but help)
help       Explain the various -D options
fxlip@www:~$ 
  </div>
</div>


---


## [7]

Encontre os arquivos que estão como dono o usuário felip presentes em `/var/log` e subdiretórios sequentes e faça a cópia dos arquivos somente, para o diretório `logs_felip` que deverá ser criado no `HOME` do usuário lpi.

<div class="terminal-box answer-hidden">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~$  mkdir logs_felip
fxlip@www:/var/log$ find /var/log -user felip
/var/log/private
/var/log/private/log_errors.log
/var/log/private/felip.log
/var/log/interno.log
fxlip@www:/var/log$ cp -r /var/log/private/ ~/logs_felip/
fxlip@www:/var/log$ cp /var/log/private/log_errors.log ~/logs_felip/ 
fxlip@www:/var/log$ cp /var/log/private/felip.log ~/logs_felip/ 
fxlip@www:/var/log$ cp /var/log/interno.log ~/logs_felip/ 
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
>> @linux/103/4/pipes
<< @linux/103/3/files
    </div>
  </div>
</div>