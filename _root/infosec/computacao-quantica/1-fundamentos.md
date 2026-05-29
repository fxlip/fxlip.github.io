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

# Mecânica Quântica Aplicada


- A computação quântica não é uma evolução linear da clássica; é um paradigma alternativo baseado em física subatômica. Enquanto o bit clássico é binário (0 ou 1) , o qubit opera em um contínuo de estados.

-> Sobreposição Quântica: O qubit existe simultaneamente em múltiplos estados até ser medido. Matematicamente, é parametrizado por números complexos na forma

> $\alpha\|0\rangle + \beta\|1\rangle$

-> Emaranhamento: Conexão instantânea entre partículas independentemente da distância. Alterar o estado de um elétron ($spin\ up$) colapsa instantaneamente o seu par ($spin\ down$).  

-> O Colapso da Informação: O calcanhar de Aquiles do sistema. Leituras diretas destroem a sobreposição quântica. O estado sofre colapso e a informação original é perdida.  

---

## Portas e Circuitos Quânticos

Diferente das portas lógicas tradicionais, as portas quânticas são reversíveis (sem perda de dados) e operam como matrizes unitárias $2^n \times 2^n$ no espaço de Hilbert: 


-> Hadamard: Cria a sobreposição de estados.

-> Pauli-X: Equivalente ao operador NOT clássico.

-> Toffoli (CCNOT): Universal para qualquer função booleana.  

-> Circuitos: Leitura estrita da esquerda para a direita. Vigora o teorema da não-clonagem: é fisicamente impossível copiar qubits.  


---

## A Infraestrutura Extrema

O material tenta pintar um cenário futurista acessível, mas a física impõe barreiras brutais:


-> Hardware Proprietário: Composto por QPUs, supercondutores de nióbio e acopladores magnéticos.  

-> Zero Absoluto: A CPU clássica roda com um cooler comum. A QPU exige $-273^\circ\text{C}$ para evitar a decoerência quântica causada pelo ambiente.

-> Custo de Entrada: Estima-se o custo de um único computador quântico funcional em 10 bilhões de dólares.

---

> @files/infosec/senac/computacao-quantica/fundamentos.pdf