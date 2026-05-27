---
layout: page
title: "8-infraestrutura"
date: 2026-04-09T18:57:57-03:00
permalink: /infosec/gestao-de-riscos/infraestrutura
categories: [infosec]
tags: [gestao-de-riscos]
hide_footer: true
math: true
---

# Infraestrutura de Data Centers


- O data center representa o coração e a espinha dorsal sobre a qual toda a economia digital se apoia. Trata-se de uma infraestrutura física complexa, altamente projetada para concentrar servidores, sistemas de redes, mecanismos de segurança e soluções de energia. O seu principal desafio operacional é garantir alta disponibilidade, eficiência energética e segurança robusta.

---

## Modelos de Arquitetura e Implantação

Dependendo da estratégia de negócios, do orçamento e da necessidade de autonomia da organização, o processamento e o armazenamento de dados podem ser estruturados em diferentes modelos:

-> On-premises (Local): Toda a infraestrutura física é construída, mantida e operada dentro das instalações da própria organização. Garante controle total sobre o perímetro, mas exige alto investimento de capital inicial (CapEx).

-> Colocation: A empresa aluga o espaço físico (racks, energia, climatização e segurança) dentro de um data center de um provedor especializado, mas mantém a propriedade e o controle estrito sobre seus próprios servidores e switches.

-> Cloud Computing (Nuvem): Os recursos de hardware e computação são totalmente virtualizados e contratados sob demanda junto a provedores em larga escala (AWS, Azure, Google Cloud).

-> Edge Computing (Computação de Borda): Descentralização de pequenos data centers posicionados fisicamente próximos à origem geradora dos dados (dispositivos IoT, sensores industriais). O objetivo central é processar as requisições localmente para minimizar a latência e o consumo de banda de rede antes de sincronizar com a nuvem central.


---

## Classificação de Resiliência

Para mensurar o nível de confiabilidade, redundância e o tempo máximo de inatividade (downtime) anual de uma infraestrutura física, o mercado internacional adota a classificação padronizada pelo Uptime Institute, dividida em quatro níveis de Tier:

1. Infraestrutura Básica: Não possui componentes redundantes. Caminho único de distribuição de energia e climatização. Qualquer manutenção ou falha desliga todo o sistema.  

2. Componentes Redundantes: Introduz redundância parcial em elementos críticos (como bombas de água, Nobreaks/UPS e geradores extras), mas mantém um caminho único de distribuição de energia.

3. Manutenção Simultânea e Concorrência Mantida: Possui múltiplos caminhos de distribuição física de energia e climatização, com componentes totalmente redundantes. Permite que qualquer manutenção técnica seja feita sem interromper a operação ou desligar os servidores.

4. Tolerante a Falhas: O nível de segurança máxima. Possui infraestrutura totalmente espelhada e segregada em sistemas independentes. Se um caminho falhar ou for destruído por um desastre, o outro assume de forma autônoma. O sistema é blindado contra falhas em qualquer ponto da cadeia física.

---

## Engenharia de Infraestrutura e Design Físico

O design de um data center eficiente exige o controle estrito do ambiente para mitigar riscos de degradação do hardware:

-> Cabeamento Estruturado: Organização cirúrgica e padronizada das redes de dados e energia para evitar gargalos físicos, facilitar manutenções rápidas e garantir o fluxo correto de ventilação nos racks.

-> Arquitetura de Corredores Frios e Corredores Quentes: Alinhamento estratégico das frentes e traseiras dos racks. O ar frio injetado pelo sistema de climatização passa pelo corredor frontal (corredor frio), refrigera os servidores e é expelido como ar exausto na parte traseira (corredor quente), sendo capturado e resfriado novamente. Essa dinâmica otimiza drasticamente a eficiência energética do ambiente.

---

> @files/infosec/senac/gestao-de-riscos/infraestrutura.pdf