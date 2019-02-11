---
title:  "Hook de atualização"
date:   2018-12-18 02:04:20
categories: [script]
tags: [ocultar]
---
Durante o ano de 2018 recebi visibilidade de alguns profissionais de InfoSec ao interagir com eles pelo twitter, "coincidententemente" meu servidor começou a registrar históricos extensos que iam desde tentativas de login à exploração de XSS e SQL Injection. Mas tudo bem até aí.

<!--mais-->

O problema é que acabei perdendo o banco de dados relacional que usava conjugado com o wordpress, por mais que existiam rotinas de backups, elas se mostraram inconsistentes durante a restauranção. Possivelmente por conta de uma  exploração feita através da API nativa  [xml-rpc](https://medium.com/@the.bilal.rizwan/wordpress-xmlrpc-php-common-vulnerabilites-how-to-exploit-them-d8d3c8600b32).

Resolvi entrar em contato com o suporte da minha hospedagem e pedir auxílio para lidar com esse problema, onde prontamente se mostraram dispostos a ajudar. Um mês depois retornaram dizendo que conseguiram mitigar, pelo menos parcialmente, esses ataques DDoS que meu IP sofria.

Em nota disseram:
> In order to avoid a repeating such situation again we have increased the default time period used when black hole routing DDOS traffic against specific IPs.  We are also working together with our exchange providers to avoid such bans in future.
Our development team are also planning on releasing integrated DDOS protection within the webapp to allow our customers to have full upstream DDOS protection with a leading global provider at very affordable rates.

Como a estrutura do wordpress apresenta [vulnerabilidades frequentes e conhecidas](https://wpvulndb.com/wordpresses) por conta da sua estrutura, aproveitei esse incidente para mudar de paradigma e adotar uma solução mais sólida.

Esse hook é responsável pela atualização do site através de um sistema de gerenciamento de código fonte, que por sua vez possui um controle de versão distribuído e é replicado em um [repositório](https://github.com/fel1p/www).

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
