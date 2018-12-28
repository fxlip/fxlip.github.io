---
title:  "hooks/post-receive"
date:   2018-12-18 02:04:20
categories: [script]
tags: [ocultar]
---
Ok, como eu não sei mais quanto tempo meu servidor ainda pode durar sofrendo os ataques que vem sofrendo, vou começar a salvar alguns scripts mais elaborados que fiz por aqui como backup.

<!--mais-->

Esse hook é responsável pela atualização do site através de um sistema de gerenciamento de código fonte que possui um controle de versão distribuído replicado no [github](https://github.com/fel1p/www).

``` bash
#!/bin/sh
GIT_REPO=$HOME/lipsh.git
TMP_GIT_CLONE=/tmp/lipsh
PUBLIC_WWW=$HOME/public_html
GEMFILE=$PUBLIC_WWW/Gemfile

echo "Init deploy..."
git clone $GIT_REPO $TMP_GIT_CLONE

echo "Montando public_html..."
cp -r $TMP_GIT_CLONE/* $PUBLIC_WWW

echo "Rebuild Jekyll..."
kill -9 $(pgrep -f jekyll)

echo "Removendo arquivos deletados..."
cd $GIT_REPO && nohup git reset --hard &

echo "Instalando novas dependências..."
cd $PUBLIC_WWW && bundle install

echo "Iniciando Jekyll com delay..."
cd $PUBLIC_WWW && nohup bundle exec jekyll serve >/dev/null 2>&1 && sleep 5

echo "Limpando a zorra..."
rm -Rf $TMP_GIT_CLONE

echo "OK. Está feito."
exit
```
