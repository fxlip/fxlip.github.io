---
title:  "hooks/post-receive"
date:   2018-12-18 02:04:20
categories: [script]
tags: [ocultar]
---
Ok, como eu não sei mais quanto tempo meu servidor ainda pode durar sofrendo os ataques que vem sofrendo, vou começar a salvar alguns scripts mais elaborados que fiz por aqui como backup.

<!--mais-->

Depois eu impeço que eles apareçam no feed e crio um menu específico pra eles.

``` bash
#!/bin/sh
GIT_REPO=$HOME/lipsh.git
TMP_GIT_CLONE=/tmp/lipsh
PUBLIC_WWW=$HOME/public_html
GEMFILE=$PUBLIC_WWW/Gemfile

echo "Init do deploy..."
git clone $GIT_REPO $TMP_GIT_CLONE

echo "Montando public_html..."
cp -r $TMP_GIT_CLONE/* $PUBLIC_WWW

echo "Rebuild no Jekyll..."
kill -9 $(pgrep -f jekyll)
cd $GIT_REPO && nohup git reset --hard &
cd $PUBLIC_WWW && bundle install
cd $PUBLIC_WWW && nohup bundle exec jekyll serve >/dev/null 2>&1 &

echo "Limpando a zorra..."
rm -Rf $TMP_GIT_CLONE
echo "Tudo OK."

exit
```
