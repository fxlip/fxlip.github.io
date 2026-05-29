---
layout: page
title: "2-aplicacoes"
date: 2026-04-09T18:57:57-03:00
permalink: /infosec/computacao-quantica/aplicacoes
categories: [infosec]
tags: [computacao-quantica]
hide_footer: true
math: true
---

# A Era NISQ e o Gargalo da Decoerência


-> Fase NISQ: Operamos atualmente na era Noisy Intermediate-Scale Quantum (Computação Quântica de Escala Intermediária com Ruído). Os chips são barulhentos, a taxa de erro é alta e as aplicações práticas são severamente limitadas.

-> A Ilusão da Quebra de Criptografia: O material deixa claro que a quebra de criptografia tradicional não é possível no momento atual da tecnologia.

-> Decoerência: O maior inimigo do sistema. Quando os qubits interagem com o meio externo, a pureza da função de onda original é destruída, reduzindo a amplitude das superposições e arruinando o emaranhamento.

-> Barreiras Físicas: Custos de manutenção astronômicos, necessidade de espaços massivos para abrigar os equipamentos e exigência de temperaturas extremamente baixas.


---

## Os Algoritmos Analisados

-> Transformada de Fourier Quântica (TFQ): Ferramenta matemática para remover ruídos e extrair comportamentos periódicos ocultos em funções.  

-> Algoritmo de Grover: Entrega uma aceleração quadrática em buscas multidimensionais. Contudo, o texto assume uma limitação crucial: ele não pode ser usado para bancos de dados reais não estruturados, pois o oráculo exige complexidade ao menos linear.

-> Algoritmo de Deutsch-Jozsa: Utiliza a superposição coerente para determinar, com uma única medida, se uma função é constante ou balanceada.

---

## Mapeamento de Desempenho

O ganho de velocidade quântica versus computação clássica cresce de forma desproporcional conforme a complexidade do problema aumenta:


| Comprimento do Número    | | Algoritmo Clássico | | Algoritmo Quântico |
| :---:      | :-- | :---:         | --: | :---: |
| 512 bits  | | 4 dias           | | 34 segundos  |
| 1024 bits   | | 100 mil anos            | | 4,5 minutos |
| 2048 bits   | | 100 mil bilhões de anos            | | 36 minutos |


---

## A Infraestrutura de Software e o Mercado

A lógica de desenvolvimento quântico exige três etapas fundamentais: preparação dos estados iniciais (carga de dados), transformações unitárias (o processamento real via matrizes) e execução das medições. Para isso, o mercado está inundado de SDKs controlados por poucas entidades:

-> IBM (Qiskit): Estrutura em código aberto para rodar circuitos em simuladores locais ou na nuvem da IBM.

-> Google (Cirq): Biblioteca em Python focada em escrever e otimizar circuitos quânticos para hardwares específicos.

-> Outros players: Ocean (D-Wave), Braket SDK (Amazon), QDK (Microsoft, usando Q#) e Strawberry Fields (Xanadu).

---

> @files/infosec/senac/computacao-quantica/aplicacoes.pdf