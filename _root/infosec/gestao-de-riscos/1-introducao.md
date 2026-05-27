---
layout: page
title: "1-introducao"
date: 2026-04-09T18:57:57-03:00
permalink: /infosec/gestao-de-riscos/introducao
categories: [infosec]
tags: [gestao-de-riscos]
hide_footer: true
math: true
---

# Gestão de Riscos em Ambientes de TI


- Em um cenário onde os dados são os ativos mais valiosos do capitalismo tardio e as operações dependem inteiramente da disponibilidade das infraestruturas, gerenciar incertezas tornou-se uma prioridade estritamente estratégica. O objetivo não é a ilusão de eliminar 100% das ameaças, mas tomar decisões técnicas e comerciais embasadas sobre como mitigar, aceitar ou transferir os impactos.


---

## Ecossistema dos Ambientes de TI e Complexidade

Os ambientes de TI englobam todo o arsenal que processa, armazena, protege e transmite dados corporativos:

->  Estruturas Físicas (TI Tradicional): Servidores locais (on-premises), storages, redes cabeadas/sem fio e data centers cuja instalação, controle e manutenção integral recaem sobre a própria empresa.

-> Estruturas Virtuais (Cloud Computing): Recursos sob demanda (processamento, armazenamento em nuvem e plataformas web) gerenciados por provedores externos em um modelo de responsabilidade compartilhada.

### Paradoxo da Conectividade: A migração para ambientes híbridos e descentralizados aumentou drasticamente a superfície de ataque. Quanto mais heterogêneo, conectado e interdependente é o ecossistema, maior é o número de pontos cegos, vulnerabilidades e potenciais falhas sistêmicas que exigem governança rigorosa.
---

## Taxonomia dos Riscos em TI

Para mapear ameaças e estimar as consequências nos ativos críticos do negócio, os riscos são divididos em três vetores fundamentais:

1. Riscos Físicos: Danos materiais e tangíveis à infraestrutura. Exemplos: furto de servidores, vandalismo, incêndios em datacenters e panes elétricas por ausência de geradores/nobreaks.

2. Riscos Lógicos: Ameaças e ataques que operam estritamente na camada digital. Exemplos: infecções por malware, sequestro de dados (ransomware), exploração de vulnerabilidades de software e credenciais administrativas comprometidas via phishing.

3. Riscos Ambientais: Eventos decorrentes de forças naturais ou negligência climática nas instalações. Exemplos: enchentes (sem elevação adequada de racks), quedas de raios, umidade extrema e variações severas de temperatura que destroem o silício dos componentes.

---

## A Tríade CID e os Pilares da Segurança da Informação

A segurança da informação não se limita a implementar firewalls; ela é sustentada por três princípios que guiam qualquer política de conformidade (Tríade CID):

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-title"></div>
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  <div class="auto-term">
                       Confidencialidade
                             /   \
                            /     \
                           /       \
                  Integridade --- Disponibilidade
  </div>
</div>

-> Confidencialidade: Garantia de que o acesso ao dado seja estritamente restrito a quem possui autorização de direito. Mecanismo técnico: uso de criptografia robusta em repouso e em trânsito.

-> Integridade: Salvaguarda contra alterações não autorizadas, modificações indevidas ou corrupção do dado, mantendo sua precisão e consistência. Mecanismo técnico: controle rígido de versões, hashes e logs de auditoria.

-> Disponibilidade: Garantia de que os sistemas, redes e dados permaneçam totalmente acessíveis e funcionais sempre que requisitados pelo negócio. Mecanismo técnico: links redundantes, replicação de servidores e fontes de energia alternativas.

---

## Marcos Regulatórios e Governança

Ignorar a gestão de riscos acarreta paralisação de serviços, vazamentos massivos e destruição reputacional. No cenário atual, a governança é imposta por pressões legais e normativas internacionais:

-> ABNT NBR ISO 31000 (2018): Define as diretrizes e o processo sistemático global para a gestão de riscos corporativos.

-> ABNT NBR ISO/IEC 27001: Provê o framework padrão para a implementação de um Sistema de Gestão de Segurança da Informação (SGSI).

-> LGPD (Lei nº 13.709/2018): Impõe sanções administrativas e multas pesadas para empresas que falham em proteger dados pessoais ou coletam informações sem consentimento explícito, ferindo a soberania do usuário.

---

> @files/infosec/senac/gestao-de-riscos/introducao.pdf