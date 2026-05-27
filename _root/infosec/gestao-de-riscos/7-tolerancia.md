---
layout: page
title: "7-tolerancia"
date: 2026-04-09T18:57:57-03:00
permalink: /infosec/gestao-de-riscos/tolerancia
categories: [infosec]
tags: [gestao-de-riscos]
hide_footer: true
math: true
---

# Planejamento e Execução de Políticas de Tolerância ao Risco


- A gestão de riscos não visa engessar a operação, mas sim estabelecer parâmetros claros para a tomada de decisões corporativas. Definir políticas de tolerância ao risco garante o alinhamento exato entre a busca por inovação técnica na TI e as metas de sobrevivência e segurança do negócio.

---

## Desmistificando Conceitos

Para desenhar uma política eficaz, a literatura de governança separa o risco em três dimensões estruturais:


-> Apetite ao Risco (Risk Appetite): É o nível macro. Define a quantidade e o tipo de risco que uma organização está disposta a perseguir ou aceitar em busca de seus objetivos estratégicos e valor comercial.


-> Tolerância ao Risco (Risk Tolerance): É o nível operacional e mensurável. Representa o desvio aceitável em relação ao apetite estabelecido. Define a variação máxima que a diretoria tolera na prática (ex: o apetite dita "alta disponibilidade", a tolerância especifica um RTO máximo de 2 horas para o sistema principal).

-> Capacidade de Risco (Risk Capacity): É o limite físico e financeiro da firma. O nível máximo de risco que a organização consegue suportar antes de entrar em colapso financeiro ou falência operacional.


---

## Alinhamento Estratégico com os Objetivos do Negócio

A TI não deve criar métricas de segurança isoladas da realidade comercial. As políticas de risco precisam traduzir as necessidades corporativas:


-> Equilíbrio Financeiro: Investir em segurança além do valor do próprio ativo gera ineficiência. A tolerância deve balancear o custo da contramedida com a perda potencial regulatória ou operacional.

-> Inovação vs. Conservadorismo: Uma startup de tecnologia pode adotar uma tolerância a falhas mais elástica na camada de aplicação para acelerar o deploy de novas funções. Já uma instituição financeira operará sob tolerância rigidamente baixa para proteger transações.  

-> Marcos Regulatórios: Setores altamente regulados (Bancos com o BACEN, Saúde com a HIPAA, e qualquer manipulação de dados sob a LGPD) possuem níveis de tolerância externos impostos por lei. O descumprimento legal desaba a tolerância para a zona de risco inaceitável devido a penalidades criminais e multas administrativas milionárias.  

---

## Integração aos Processos de Gestão de TI

A política de tolerância sai do papel quando acoplada de forma nativa aos frameworks operacionais já existentes na TI:

-> Gestão de Mudanças (ITIL): Toda alteração de código, migração de banco de dados ou deploy de infraestrutura distribuída na nuvem deve passar por um comitê que avalia se o risco residual da mudança fere a tolerância da firma.

-> Esteira de Desenvolvimento (DevSecOps): Critérios de tolerância são traduzidos em regras automatizadas nas ferramentas de CI/CD. Se um scanner de vulnerabilidades técnicas apontar uma brecha com score CVSS acima do limite tolerado pela política, o deploy é bloqueado de forma autônoma na esteira.

-> Operações de Segurança (SOC): A matriz de probabilidade e impacto serve para calibrar o SIEM. Riscos classificados fora da zona de tolerância geram alertas críticos com playbooks de contenção imediata, enquanto eventos dentro do limite aceitável são apenas logados para auditoria futura.

---

> @files/infosec/senac/gestao-de-riscos/tolerancia.pdf