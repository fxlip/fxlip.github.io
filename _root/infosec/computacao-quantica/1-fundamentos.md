---
layout: page
title: "1-fundamentos"
date: 2026-04-09T18:57:57-03:00
permalink: /infosec/computacao-quantica/fundamentos
categories: [infosec]
tags: [computacao-quantica]
hide_footer: true
math: true
---

# Gestão de Riscos em Ambientes de TI


- Em um cenário onde os dados são os ativos mais valiosos do capitalismo tardio e as operações dependem inteiramente da disponibilidade das infraestruturas, gerenciar incertezas tornou-se uma prioridade estritamente estratégica. O objetivo não é a ilusão de eliminar 100% das ameaças, mas tomar decisões técnicas e comerciais embasadas sobre como mitigar, aceitar ou transferir os impactos.


---

## Mecanismo de Recorrência

A principal distinção de uma RNN é o seu laço de realimentação, onde a saída de uma iteração atua como entrada para o passo seguinte. Ela não analisa apenas o dado atual ($x_t$), mas o que aprendeu com o passado.


- -- O Estado Oculto ou Hidden State


-> A rede mantém uma memória interna chamada estado oculto ($h_t$), atualizado iterativamente a cada passo temporal $t$. Matematicamente, a operação interna segue a equação:  

> $h_t = f(W_h h_{t-1} + W_x x_t + b)$


- -- O Calcanhar de Aquiles das RNNs Tradicionais:

-> Ao processar sequências muito longas, o algoritmo de retropropagação através do tempo (Backpropagation Through Time) sofre com o fenômeno do gradiente evanescente (ou desaparecimento do gradiente). O sinal do erro dissipa-se ao voltar muitas camadas no tempo, fazendo com que a rede sofra de "memória de curto prazo" e esqueça o início da sequência. Para mitigar isso, aplica-se o gradient clipping (teto para o gradiente) ou migra-se para arquiteturas avançadas de portas.


---

## Guardiões da Memória

Para contornar a perda de contexto em longos prazos, surgiram variantes baseadas em mecanismos de filtragem por portas (vetores de valores entre 0 e 1 que determinam o que passa ou é zerado).


- -- LSTM (Long Short-Term Memory)

-> Introduz uma célula de memória ($C_t$) paralela ao estado oculto e três portas de controle que decidem o fluxo de informação: 

1. Porta de Esquecimento ou Forget Gate, avaliam o estado anterior e decidem o que descartar por não ser mais útil.

2. Porta de Entrada ou Input Gate, que determina quais novos dados da entrada atual devem ser incorporados à célula de memória, utilizando uma ativação Sigmoid para regular o fluxo.  

3. Porta de Saída ou Output Gate, extraem as informações úteis da célula para atualizar o estado oculto e despachar como saída.  

A dinâmica é ditada pela equação da célula de memória:

> $C_t = f_t \cdot C_{t-1} + i_t \cdot \tilde{C}_t$

- -- GRU (Gated Recurrent Unit)

-> Uma versão simplificada e matematicamente mais leve da LSTM. Ela possui menos parâmetros e combina as funções de entrada e esquecimento em uma única porta de atualização ($z_t$), além de usar uma porta de reset para dosar o impacto do histórico. É ideal para processamento em tempo real ou ambientes com restrição de hardware.

---

## Anatomia do Processamento de Linguagem Natural (NPL)

Para que algoritmos matemáticos processem textos humanos, o fluxo textual precisa passar por transformações estruturais de engenharia:

-> Tokenização: O estágio cirúrgico inicial. Divide o texto bruto em unidades menores (tokens), que podem ser palavras, subpalavras ou caracteres.

-> Embeddings (Word2Vec e GloVe): Vetorização semântica. Transforma tokens em vetores numéricos densos onde palavras com significados ou contextos próximos (como "rei" e "rainha") ficam geometricamente próximas no espaço vetorial. O Word2Vec faz isso via CBOW ou Skip-gram; o GloVe usa coocorrências globais.  

-> Semântica vs. Sintaxe: A sintaxe dita a estrutura gramatical e o desmembramento de frases (verbos, sujeitos); a semântica lida com o significado literal e contextual para responder perguntas com precisão.  

-> Redes Seq2Seq (Sequence-to-Sequence): Arquiteturas baseadas em um Codificador (transforma a sequência de entrada em um vetor de contexto) e um Decodificador (traduz o vetor na sequência final). Muito usadas em tradução automática (machine translation) e chatbots.  

---

## A Disrupção dos Transformadores

O mercado de NLP sofreu uma mudança de paradigma com a chegada dos Transformers (base de modelos como BERT, GPT e T5).

Ao contrário das RNNs, que processam as palavras de forma estritamente sequencial (uma após a outra) , os Transformers utilizam o mecanismo de Autoatenção (Self-Attention). Isso permite:  

1. Processamento em paralelo de toda a sequência de texto simultaneamente, reduzindo gargalos de treino.

2. Captura de contexto bidirecional completo, pesando a relevância de cada palavra em relação a todas as outras da frase ao mesmo tempo, independente da distância física entre elas.  

---

## Ferramentas e Ecossistema

O ecossistema divide-se nitidamente pelo ambiente de aplicação:  

-> NLTK (Natural Language Toolkit): Foco acadêmico, didático e de pesquisa. Excelente para experimentação de stemming, lematização e análise rudimentar de sentimentos.

-> spaCy: Robusto, de nível industrial e altamente otimizado para performance em produção. Excelente para tarefas rápidas de tokenização e Reconhecimento de Entidades Nomeadas (NER).  

-> Hugging Face Transformers: A ponte moderna para o estado da arte. Permite importar modelos massivos como BERT ou GPT pré-treinados e realizar o fine-tuning (ajuste fino) para tarefas específicas de segurança ou classificação com pouquíssimas linhas de código.

---

> @files/infosec/senac/inteligencia-artificial/redes-neurais-recorrentes.pdf