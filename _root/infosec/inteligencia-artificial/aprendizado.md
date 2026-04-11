---
layout: page
title: "aprendizado"
date: 2026-04-10T18:57:57-03:00
permalink: /infosec/inteligencia-artificial/aprendizado
categories: [infosec]
tags: [inteligencia-artificial]
hide_footer: true
---

# Supervised Learning e<br> Unsupervised Learning

- O aprendizado de máquina é um pilar da IA moderna que permite aos sistemas aprenderem com dados, identificarem padrões e tomarem decisões autônomas. O objetivo central aqui é explorar como esses modelos são treinados e validados para aplicações reais em setores como finanças, saúde e segurança.

---

## Aprendizado Supervisionado

Nesta abordagem, o modelo é treinado utilizando dados rotulados, onde cada entrada está associada a uma saída desejada (a "resposta correta"). O objetivo é aprender uma função capaz de mapear entradas para saídas e generalizar esse conhecimento para dados inéditos.

### Classificação vs. Regressão

-> Classificação: O objetivo é prever uma categoria discreta. Pode ser binária (spam ou não), multiclasse ou multirrótulo.

- -- Algoritmos comuns: Árvores de Decisão, K-Nearest Neighbors (KNN), Máquinas de Vetores de Suporte (SVM) e Redes Neurais.

1. Precisão: Proporção de acertos entre as predições de uma classe.

2. Recall (Revocação): Capacidade de identificar todos os casos reais de uma classe.

3. F1-Score: Média harmônica entre precisão e recall, ideal para dados desbalanceados.

-> Regressão: Utilizada para prever valores contínuos (ex: temperatura ou preço de imóvel).

- -- Algoritmos comuns: Regressão Linear, Regressão Polinomial e Gradient Boosting.

1. RMSE: Raiz quadrada da média dos erros quadráticos; muito sensível a outliers.

2. MAE: Média dos erros absolutos; menos afetado por valores discrepantes.

3. R²: Indica a proporção da variância dos dados explicada pelo modelo (0 a 1).

---

## Aprendizado Não Supervisionado

Diferente do anterior, este paradigma trabalha com dados não rotulados. O foco é a exploração de estruturas ocultas para agrupar dados similares, reduzir a dimensionalidade ou detectar anomalias.

-> Técnicas de Clustering (Agrupamento)

1. K-means: Divide os dados em k grupos pré-definidos pelo usuário. Baseia-se em centroides (pontos centrais) e é eficiente para grandes conjuntos de dados, embora sensível a outliers.

2. DBSCAN: Agrupa pontos com base na densidade espacial. Ele determina automaticamente o número de clusters e lida muito bem com ruídos e formas irregulares, mas falha em dados com densidades variáveis.

-> Problemas e Soluções Comuns em Modelagem

O sucesso de um modelo depende do equilíbrio entre sua complexidade e a capacidade de capturar padrões reais.

1. Overfitting (Sobreajuste): O modelo memoriza os dados de treino e perde a capacidade de generalizar.

    -- Soluções: Regularização (L1/L2), Dropout, Validação Cruzada ou aumento de dados (Data Augmentation).

2. Underfitting (Subajuste): O modelo é simples demais para capturar os padrões dos dados.

    -- Soluções: Aumentar a complexidade do modelo ou ajustar hiperparâmetros.

-> Métodos de Validação Cruzada e Ajuste

Para mitigar o risco de overfitting e garantir robustez, utiliza-se a Validação Cruzada. O método mais comum é o K-Fold, onde os dados são divididos em k partes, treinando o modelo em k-1 e testando na restante sucessivamente.

A escolha de hiperparâmetros (configurações como taxa de aprendizado ou profundidade de árvore) é feita através de:

1. Grid Search: Testa exaustivamente todas as combinações possíveis.

2. Random Search: Testa combinações aleatórias, sendo mais eficiente em alta dimensão.

3. Otimização Bayesiana: Usa modelos probabilísticos para encontrar as combinações mais promissoras rapidamente.

---

> @files/infosec/senac/inteligencia-artificial/aprendizado.pdf