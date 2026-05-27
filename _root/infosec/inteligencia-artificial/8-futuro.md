---
layout: page
title: "8-futuro"
date: 2026-04-09T18:57:57-03:00
permalink: /infosec/inteligencia-artificial/futuro
categories: [infosec]
tags: [inteligencia-artificial]
hide_footer: true
math: true
---

# Futuro do Deep Learning e IA Avançada

- O conceito de IA Avançada traduz a convergência entre diferentes tecnologias disruptivas: Deep Learning, IA Generativa, Aprendizado Autossupervisionado, Modelos de Larga Escala e Computação Quântica. Essa integração está mudando a forma como sistemas processam contextos complexos e interagem com a sociedade.

---

## O Paradigma Quântico e a Segurança da Informação

A computação quântica representa uma quebra radical no processamento de dados. Em vez dos bits clássicos ($0$ ou $1$), ela opera com qubits. Veja as propriedades mecânico-quânticas:

-> Superposição: Permite que um qubit exista simultaneamente em múltiplos estados ($0$ e $1$). Um sistema com $n$ qubits consegue representar $2^n$ estados ao mesmo tempo, gerando um poder de processamento exponencial.

-> Emaranhamento ou Entrelaçamento: Correlação instantânea entre qubits distantes fisicamente. O estado de um determina o do outro, o que acelera drasticamente a comunicação distribuída.

-> Interferência: Amplifica as probabilidades das respostas corretas e cancela as incorretas nas execuções de algoritmos quânticos.

### O desenvolvimento da Computação Quântica Híbrida, unindo hardware clássico e quântico, e de algoritmos como Quantum Support Vector Machine (QSVM) acelerará o treino de modelos massivos. Contudo, para a Segurança da Informação, o avanço quântico gera uma corrida armamentista imediata rumo à criptografia pós-quântica, já que os métodos de encriptação assimétrica atuais baseados em fatoração matemática se tornarão obsoletos e facilmente quebráveis.

---

## Evolução Crítica da IA Generativa


Criadas por Ian Goodfellow em 2014, as Redes Adversárias Generativas (GANs) baseiam-se em um jogo de soma zero entre duas redes:

-> Geradora: Produz dados sintéticos (imagens, áudio, texto) a partir de ruído aleatório.

-> Discriminadora: Avalia os dados tentando diferenciar o que é real do que é sintético.
O treino competitivo dura até que a geradora engane a discriminadora de forma consistente. Na segurança digital, elas servem tanto para testar sistemas biométricos quanto para fraudá-los.

---

## Tendências Arquiteturais e Escalabilidade

A evolução do Deep Learning tem sido pautada pelo gigantismo e pela necessidade de otimização de infraestrutura.


-> Modelos de Base ou Foundation Models: Modelos gigantescos treinados em volumes massivos de dados não rotulados que servem como ponto de partida genérico para tarefas específicas através de ajustes finos.

-> Transformers e Modelos Autorregressivos: O mecanismo de Atenção consolidou os Transformers como o BERT e o GPT como padrão global. Redes autorregressivas usam o histórico do sinal passado para prever o próximo elemento da sequência, seja um preço de ativo, padrão climático ou o próximo token de um texto.

-> IA de Bordas ou Edge AI: Migração do poder de inferência diretamente para os dispositivos de ponta, como smartphones, IoT e veículos autônomos. Reduz a latência de comunicação com datacenters e melhora a privacidade local.  

---

## Inteligência Artificial Sustentável

A escalabilidade linear trouxe barreiras severas de restrição computacional, congestionamento de redes distribuídas e alto consumo energético. Para tornar os modelos viáveis, o futuro depende de técnicas de otimização matemática:

-> Poda ou Pruning: Remoção de neurônios e conexões que pouco contribuem para o resultado final.

-> Quantização: Redução da precisão numérica dos pesos do modelo, exemplo: de Float32 para Int8, diminuindo drasticamente o uso de memória e processamento com perda marginal de precisão.

-> Aprendizado Federado: Treinamento descentralizado onde os dados permanecem nos dispositivos locais dos usuários, e apenas os gradientes matemáticos calculados são enviados e agregados centralmente, preservando a privacidade na origem.

---

> @files/infosec/senac/inteligencia-artificial/futuro.pdf