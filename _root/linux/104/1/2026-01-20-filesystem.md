---
layout: page
title: "filesystem"
date: 2026-01-20T14:44:57-03:00
permalink: /linux/104/1/filesystem/
categories: [linux]
tags: [104, 1]
hide_footer: true
---

Página de exemplo para mostrar que sou capaz de configurar partições de disco e criar sistemas de arquivos em mídias tais como discos rígidos. Isso inclui trabalhar com partições swap.

*Principais Áreas de Conhecimento:*
- Gerenciar tabela de partição MBR e GPT
- Usar vários comandos mkfs para criar sistemas de arquivos tais como:
- - ext2/ext3/ext4
- - XFS
- - VFAT
- - exFAT
- Conhecimento básico dos recursos do Btrfs, incluindo sistema de arquivos em multidispositivos, compressão e subvolumes.

`fdisk`
`gdisk`
`parted`
`mkfs`
`mkswap`

Começando com fdisk [1/6]

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  
  <div class="auto-term">
fxlip@www:~/linux/104/1$
</div>