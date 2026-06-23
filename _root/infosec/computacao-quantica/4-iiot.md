---
layout: page
title: "3-iiot"
date: 2026-04-23T18:57:57-03:00
permalink: /infosec/computacao-quantica/iiot
categories: [infosec]
tags: [computacao-quantica]
hide_footer: true
math: true
---

# Arquitetura e Protocolos IIoT

## A Topologia de Três Camadas

-> Camada de Percepção (Sensoriamento/Identificação): Objetos físicos (sensores, atuadores, RFID) que identificam, coletam e processam dados localmente.

-> Camada de Rede (Comunicação/Computação): Gerenciamento, identificação e roteamento dos pacotes coletados.

-> Camada de Aplicação (Serviços/Semântica): Interface que consolida e entrega as métricas (ex: umidade e temperatura) para os sistemas clientes.

---

## Os Sistemas de Mensageria

-> MQTT (Message Queue Telemetry Transport): Padrão cliente/servidor focado em baixo consumo de banda e recursos. Opera em lógica de tópicos, onde a inscrição com a wildcard # escuta toda a ramificação do nó principal (ex: iiot_node/#).

-> AMQP (Advanced Message Queuing Protocol): Protocolo wire ponto a ponto aberto operando sobre TCP. É assíncrono, multicanal e voltado para cenários corporativos complexos que exigem alta interoperabilidade de middlewares (MOM).


## Industrial Analytics & Ferramentas Cognitivas

A infraestrutura cruza Big Data com algoritmos de Machine Learning para extrair padrões temporais e tendências históricas. Quando migra para a Tecnologia Cognitiva, ela mimetiza o cérebro humano em três pilares: Compreensão (modelagem de conceitos), Raciocínio (resolução de problemas não previstos em código) e Aprendizagem (autocorreção evolutiva por dados).

---

> @files/infosec/senac/computacao-quantica/iiot.pdf