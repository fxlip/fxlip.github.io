---
title:  "Hook de atualização"
date:   2018-12-18 02:04:20
categories: [script]
tags: [ocultar]
---
Em 2018 recebi alguma visibilidade de profissionais de InfoSec ao interagir com seus tweets, "coincidententemente" meu servidor começou a registrar históricos extensos de tentativas de login falhas e muita exploração de XSS e SQL Injection com algum outro servidor muito grande. Até aí tudo bem.

<!--mais-->

O problema é que acabei perdendo o banco de dados do wordpress em algum momento, por mais que existissem rotinas de backups, elas se mostraram inconsistentes durante uma restauranção. Possivelmente por conta da exploração feita através da API nativa  [xml-rpc](https://medium.com/@the.bilal.rizwan/wordpress-xmlrpc-php-common-vulnerabilites-how-to-exploit-them-d8d3c8600b32). Apesar da estrutura apresentar [vulnerabilidades conhecidas](https://wpvulndb.com/wordpresses) o tempo todo eu precisava dar um jeito de minimizar esses ataques.

Resolvi entrar em contato com o suporte da hospedagem e pedir algum auxílio para lidar com esse problema, onde prontamente se mostraram dispostos a ajudar. Um mês depois, retornaram dizendo que conseguiram mitigar pelo menos parcialmente, os ataques DDoS que meu IP sofria.

Por email disseram:
> In order to avoid a repeating such situation again we have increased the default time period used when black hole routing DDOS traffic against specific IPs.  We are also working together with our exchange providers to avoid such bans in future.
Our development team are also planning on releasing integrated DDOS protection within the webapp to allow our customers to have full upstream DDOS protection with a leading global provider at very affordable rates.

Aproveitei esse incidente para mudar definitivamente de paradigma e adotar um blog mais sólido do lado da infraestrutura.

Esse script é um hook responsável pela atualização do site, que utiliza um controle de versão distribuído para ser replicado em um [repositório online](https://github.com/fel1p/www).

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
