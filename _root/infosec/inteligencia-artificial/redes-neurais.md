---
layout: page
title: "redes-neurais"
date: 2026-04-10T18:57:57-03:00
permalink: /infosec/inteligencia-artificial/redes-neurais
categories: [infosec]
tags: [inteligencia-artificial]
hide_footer: true
---

# Fundamentos de Redes Neurais

- As redes neurais são sistemas computacionais inspirados na biologia do cérebro humano, projetados para modelar padrões complexos através de unidades interconectadas. No contexto da segurança da informação, essa arquitetura é o que permite identificar assinaturas de malwares nunca antes vistos ou detectar anomalias sutis em tráfego de rede.

--- 

## Neurônio Artificial

O neurônio artificial simula o comportamento biológico ao receber sinais, processá-los e gerar uma saída.

-> Processo Matemático: Um neurônio opera seguindo esta lógica linear e não linear:

1. Entradas (xi​): Dados brutos vindos da camada anterior.

2. Pesos (wi​): Atuam como "botões de ajuste" que controlam a influência de cada entrada na decisão final.

3. Viés (bias - b): Um termo de ajuste que permite ao modelo ter flexibilidade mesmo quando as entradas são zero.

4. Soma Ponderada (z): A transformação linear representada pela equação: `z=i=1∑n​wi​xi​+b`

5. Função de Ativação (f(z)): Define a resposta final do neurônio, introduzindo a não linearidade necessária para aprender padrões complexos.

---

## Funções de Ativação

Sem elas, uma rede neural seria apenas um grande modelo de regressão linear.

| Função    | | Equação | | Uso Principal |
| :---:      | :-- | :---:         | --: | :---: |
| Sigmoid  | | σ(z)=1+e−z1​            | | Classificação binária  |
| ReLU   | | f(z)=max(0,z)            | | Padrão ouro em redes profundas por ser eficiente e evitar gradientes evanescentes |
| Tanh   | | (−1,1)            | | Similar à Sigmoid, mas centrada em zero, facilitando o treino em camadas ocultas |
| Softmax   | | Soma das probabilidades = 1	            | | Camada de saída para problemas multiclasse |

---

## Arquitetura em Camadas

A organização é hierárquica e a informação flui em uma direção nas redes feedforward:

1. Camada de Entrada: Recebe os dados brutos (pixels, valores numéricos).

2. Camadas Ocultas: Onde o "aprendizado" acontece através de transformações sucessivas. O número dessas camadas define a profundidade (Deep) da rede.

3. Camada de Saída: Produz a previsão final ou classificação.

---

## Treinamento

O treinamento consiste em ajustar pesos e vieses para minimizar o erro (função de perda) entre a previsão e a realidade.

-> Motor do Treino:

O aprendizado ocorre em quatro etapas cíclicas:

1. Forward Pass: Os dados fluem da entrada à saída gerando uma predição.

2. Cálculo do Erro: A função de perda mede a distância entre a predição e o rótulo real.

3. Backward Pass (Backpropagation): O erro é propagado de volta pela rede usando a regra da cadeia do cálculo para descobrir quanto cada peso contribuiu para o erro.

4. Atualização de Pesos: Os parâmetros são ajustados na direção que reduz o erro usando um Otimizador.

-> Algoritmos de Otimização:

1. SGD (Gradiente Descendente Estocástico): Simples, mas pode ser lento para convergir.

2. Adam: Combina velocidade e adaptação de taxa de aprendizado; é o mais robusto e utilizado atualmente.

3. RMSProp: Estabiliza o treino em superfícies de erro complexas.

---

## Desafios e Ferramentas Práticas

Treinar redes não é trivial e exige lidar com obstáculos como:

-> Gradiente Evanescente/Explosivo: Quando o sinal de erro se torna muito pequeno ou grande demais, impedindo o aprendizado.

-> Qualidade dos Dados: Dados ruidosos ou enviesados destroem a precisão do modelo.

-> Frameworks: Keras é ideal para prototipagem rápida e intuitiva. Já o TensorFlow (onde o Keras hoje vive) é voltado para produção em larga escala e personalização profunda.

---

> @files/infosec/senac/inteligencia-artificial/redes-neurais.pdf