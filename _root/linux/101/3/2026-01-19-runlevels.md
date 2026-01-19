---
layout: page
title: "runlevels"
date: 2026-01-19T18:45:30-03:00
permalink: /linux/101/3/runlevels/
categories: [101]
tags: [3]
hide_footer: true
---

Página de exemplo para mostrar que sou capaz de gerenciar o runlevel do SysVinit ou o boot target do systemd.

*Principais Áreas de Conhecimento:*
- Definir o runlevel padrão e o alvo de boot padrão.
- Alternar entre os runlevels, incluindo o modo single user.
- Desligar e reiniciar por linha de comando
- Alertar os usuários antes de mudar o runlevel ou outro evento de sistema que acarrete uma mudança significativa.
- Terminar apropriadamente os processos.
- Noções de acpid.

/etc/inittab
/shutdown
init
systemd
systemctl
/etc/systemd/
/etc/init.d/
telinit
/usr/lib/systemd/
wall