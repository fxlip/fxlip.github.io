---
layout: page
title: "3-backups"
date: 2026-04-09T18:57:57-03:00
permalink: /infosec/gestao-de-riscos/backups
categories: [infosec]
tags: [gestao-de-riscos]
hide_footer: true
math: true
---

# Políticas de Privacidade e Backup


- A informação consolidou-se como o ativo central das organizações modernas. Garantir sua resiliência contra falhas técnicas, desastres naturais ou ataques cibernéticos, ao mesmo tempo que se respeita a soberania jurídica dos titulares dos dados.

---

## Políticas de Privacidade e Conformidade Legal

Uma Política de Privacidade não é um mero termo de uso jurídico; é um documento estratégico que declara publicamente como a organização coleta, processa, armazena, compartilha e descarta dados pessoais.

-> Transparência Absoluta: O titular do dado deve saber exatamente o propósito da coleta (evitando o desvio de finalidade).

-> Minimização: Coletar estritamente o necessário para a operação. Se o dado não é vital para o serviço, ele não deve ser armazenado.

-> Segurança e Retenção: Definição clara de prazos de descarte para evitar que dados obsoletos fiquem expostos a vazamentos.

-> Legislações Norteadoras: No Brasil, a conformidade é ditada pela LGPD (Lei nº 13.709/2018). Ela empodera o cidadão com direitos como acesso, correção e exclusão de seus dados, impondo sanções severas às corporações em caso de descumprimento.

---

## Tipos e Estratégias de Backups

O backup é a cópia de salvaguarda de dados digitais para permitir a recuperação em caso de perda. O material classifica as rotinas de execução em três metodologias clássicas:

| Tipo    |     |  Funcionamento |     | Vantagens | | Desvantagens |
| :---:   | :-- | :---:          | :---: | :---:     | --: | :---: |
| Completo  | | Copia a totalidade dos dados do ativo para o repositório de segurança | | Restauração mais rápida e simples, depende de apenas um arquivo | | Lento para executar pois exige imenso espaço de armazenamento |
| Incremental   | | Copia apenas os dados modificados ou criados desde o último backup | | Execução ultra-rápida e consome espaço mínimo de storage. | | Restauração complexa e lenta que exige o último backup completo mais todos os incrementais em ordem cronológica. |
| Diferencial   | | Copia todos os dados modificados desde o último backup completo. | | Restauração mais simples que o incremental, mas exige o último backup completo mais o último backup diferencial. | | Cresce de tamanho a cada execução até que um novo backup completo seja feito. |

---

## Métricas Críticas de Continuidade (RPO e RTO)

O desenho de uma arquitetura de tolerância a falhas é governado por duas métricas financeiras e operacionais fundamentais estabelecidas pelo negócio:

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-title"></div>
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  <div class="auto-term">
Momento do Desastre -> Tempo de Recuperação (RTO) -> Sistemas Online
        │
        ▼ (Olhando para trás)
Quanto dado aceito perder? (RPO)
  </div>
</div>

-> RPO (Recovery Point Objective - Objetivo de Ponto de Recuperação): Define a tolerância máxima à perda de dados medida em tempo. Responde à pergunta: "Se o storage queimar agora, de quantas horas ou dias de dados perdidos o negócio sobrevive?". Se o RPO for de 4 horas, backups devem ocorrer pelo menos a cada 4 horas.

-> RTO (Recovery Time Objective - Objetivo de Tempo de Recuperação): Define o tempo máximo aceitável para restaurar o ambiente e colocar os sistemas de volta online após uma queda. Responde à pergunta: "Quanto tempo a empresa aguenta ficar com a operação parada?".

---

## A Regra de Ouro 3-2-1

Para blindar o ambiente contra falhas sistêmicas em cascata deve se adotar a estratégia clássica de redundância geográfica e de mídia:

1. Cópias dos Dados: Manter o arquivo de produção com pelo menos duas cópias de segurança.

2. Mídias Diferentes: Armazenar as cópias em tecnologias de armazenamento distintas para evitar falhas de hardware idênticas, exemplo: uma cópia em discos rígidos locais/NAS e outra em fitas LTO ou SSDs.

3. Cópia Fora da Empresa ou Offsite: Manter pelo menos uma das cópias fisicamente distante do data center principal, geralmente em Cloud Storage ou datacenter secundário, garantindo a recuperação mesmo em caso de incêndios, enchentes ou roubo do perímetro físico.

---

> @files/infosec/senac/gestao-de-riscos/backups.pdf