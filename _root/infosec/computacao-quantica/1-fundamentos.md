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

# Computação Clássica

- A computação clássica é o paradigma dominante desde meados do século XX. Sua unidade fundamental é o **bit** — um transistor em estado ligado (1) ou desligado (0). A execução é determinística: dado o mesmo input, o output é sempre idêntico.

-> Paralelismo clássico: múltiplos núcleos executam threads simultâneas, mas cada núcleo ainda processa bits de forma sequencial e determinística.

-> Limite fundamental: problemas de complexidade exponencial ($O(2^n)$) são intratáveis. Fatorar um número de 2048 bits levaria bilhões de anos no melhor hardware clássico atual.

---

# O Problema da Miniaturização

- Em 1965, Gordon Moore (co-fundador da Intel) observou que o número de transistores em um chip dobrava aproximadamente a cada dois anos, com custo caindo na mesma proporção. Essa observação virou previsão, previsão virou lei — e a lei está chegando ao fim.

-> Escala atômica: chips modernos operam em nós de 2nm. Um transistor nessa escala tem a espessura de aproximadamente 10 átomos. A partir daqui, a física quântica deixa de ser uma solução e passa a ser um problema: elétrons atravessam a barreira do gate por **tunelamento quântico**, causando vazamentos de corrente incontroláveis.

-> Tentativas de contorno: a indústria respondeu com empilhamento 3D (Intel FOVEROS), arquiteturas Gate-All-Around (GAA), chiplets e integração heterogênea — mas são adiamentos, não soluções. O problema é físico, não de engenharia.

-> A parede: Moore's Law não prevê física, ela descreve economia. Quando a economia da miniaturização colapsa contra a física subatômica, o paradigma clássico esgota seu caminho de evolução — e abre espaço para o paradigma quântico.

---

# Computação Quântica

- A computação quântica não é uma evolução da clássica — é um paradigma alternativo baseado em física subatômica. Não substitui o computador clássico; resolve categorias específicas de problemas para as quais a abordagem clássica é insuficiente.

-> Paralelismo quântico: $N$ qubits representam $2^N$ estados simultaneamente. 300 qubits superam o número de átomos no universo observável em espaço de estados.

-> Reversibilidade: diferente dos circuitos clássicos com portas irreversíveis (AND, OR), os circuitos quânticos são matematicamente reversíveis — nenhuma informação é descartada na operação.

-> Casos de uso reais: fatoração de inteiros, otimização combinatória, simulação molecular para descoberta de fármacos, criptografia pós-quântica.

---

# A Fronteira: Ciência da Computação e Física Quântica

- Entre as duas disciplinas existe um campo inteiro: a **teoria da informação quântica**. Ela traduz os princípios físicos da mecânica quântica em estruturas computacionais formais.

-> Informação quântica: Claude Shannon formalizou a informação clássica em bits (1948). John von Neumann fez o equivalente para o domínio quântico com a **entropia de von Neumann** — medida de incerteza de um estado quântico misto.

-> Complexidade quântica: a classe **BQP** (Bounded-error Quantum Polynomial time) agrupa os problemas que um computador quântico resolve eficientemente. A fatoração de inteiros está em BQP, mas provavelmente não em P — o que dá ao Algoritmo de Shor sua relevância. A classe **QMA** é o análogo quântico de NP.

-> Correção de erros quânticos: qubits físicos são ruidosos. Códigos de superfície (surface codes) protegem 1 qubit lógico usando ~1000 qubits físicos redundantes. Esse overhead é o principal obstáculo para computação quântica tolerante a falhas.

-> Criptografia quântica (QKD): o protocolo **BB84** (Bennett & Brassard, 1984) usa propriedades da medição quântica para distribuir chaves criptográficas com segurança incondicional — qualquer interceptação colapsa o estado e é detectada. Não depende de suposições computacionais, apenas das leis da física.

-> Teleportação quântica: transfere o estado quântico de uma partícula para outra a distância, sem mover matéria. Não viola a relatividade — a informação clássica ainda precisa ser transmitida pelo canal convencional para completar o protocolo.

---

# Por que usar Computação Quântica?

- A motivação não é velocidade bruta — é a **classe do problema**. Algoritmos quânticos transformam problemas exponencialmente complexos em polinomiais.

-> Criptografia: o RSA-2048, base da segurança na internet, depende da intratabilidade clássica da fatoração de inteiros. Um computador quântico maduro quebra essa premissa em horas.

-> Simulação molecular: modelar interações entre moléculas exige simular mecânica quântica. Computadores clássicos aproximam; computadores quânticos simulam nativamente — acelerando descoberta de fármacos e novos materiais.

-> Otimização: logística global, portfólios financeiros e treinamento de IA operam sobre espaços de busca exponencialmente grandes. Algoritmos como QAOA oferecem vantagem quântica nesse domínio.

---

# Qubit

- O qubit é a unidade fundamental da computação quântica. Ao contrário do bit clássico (0 ou 1), o qubit existe em sobreposição de ambos os estados até o momento da medição.

-> Representação matemática: $\|\psi\rangle = \alpha\|0\rangle + \beta\|1\rangle$, onde os coeficientes são números complexos e $\|\alpha\|^2 + \|\beta\|^2 = 1$.

-> Esfera de Bloch: representação geométrica do espaço de estados de um qubit — qualquer ponto na superfície da esfera é um estado quântico válido.

-> Implementações físicas: supercondutores de nióbio (IBM, Google), íons aprisionados em campo eletromagnético (IonQ), fótons polarizados (PsiQuantum), pontos quânticos de silício (Intel).

-> Decoerência: a principal barreira prática. Qualquer interação com o ambiente colapsa o estado quântico — exige isolamento a temperaturas próximas do zero absoluto e correção de erros quânticos ativa.

---

# Mecânica Quântica Aplicada

- Compreendido o qubit como unidade, três princípios da mecânica quântica governam seu comportamento nos circuitos:

-> Sobreposição Quântica: o qubit existe simultaneamente em múltiplos estados até ser medido. Matematicamente, é parametrizado por números complexos na forma

> $\alpha\|0\rangle + \beta\|1\rangle$

-> Emaranhamento: conexão instantânea entre partículas independentemente da distância. Alterar o estado de um elétron ($spin\ up$) colapsa instantaneamente o seu par ($spin\ down$).

-> O Colapso da Informação: o calcanhar de Aquiles do sistema. Leituras diretas destroem a sobreposição quântica — o estado sofre colapso e a informação original é perdida.

---

## Portas e Circuitos Quânticos

- Diferente das portas lógicas tradicionais, as portas quânticas são reversíveis (sem perda de dados) e operam como matrizes unitárias $2^n \times 2^n$ no espaço de Hilbert:

-> Hadamard: cria a sobreposição de estados.

-> Pauli-X: equivalente ao operador NOT clássico.

-> Toffoli (CCNOT): universal para qualquer função booleana.

-> Circuitos: leitura estrita da esquerda para a direita. Vigora o teorema da não-clonagem: é fisicamente impossível copiar qubits.

---

# Algoritmo de Shor

- Desenvolvido por Peter Shor em 1994, o algoritmo é o argumento central para a computação quântica em segurança da informação — e a razão pela qual governos e empresas investem bilhões no setor.

-> Fatoração clássica: o melhor algoritmo conhecido (GNFS) opera em tempo sub-exponencial $O\!\left(e^{(\log N)^{1/3}}\right)$ — intratável para números de 2048 bits.

-> Fatoração quântica: Shor reduz o problema a tempo polinomial $O((\log N)^3)$ via transformada de Fourier quântica (QFT). RSA-2048 seria quebrado em horas com ~4000 qubits livres de erros.

-> Impacto imediato: RSA, ECC e Diffie-Hellman assumem que fatoração é intratável. Com qubits tolerantes a erros, essa premissa cai.

---

# Segurança de Algoritmos

- A ameaça quântica à criptografia não começa quando o computador quântico estiver pronto — ela já começou.

-> Harvest Now, Decrypt Later (HNDL): adversários sofisticados (Estados-nação) já capturam e armazenam tráfego cifrado hoje com a intenção de decifrar no futuro, quando hardware quântico suficiente estiver disponível. Dados com vida útil longa — registros médicos, segredos industriais, comunicações diplomáticas — já estão em risco.

-> Criptografia simétrica sobrevive (por enquanto): o **Algoritmo de Grover** oferece speedup quântico para busca não estruturada — reduz efetivamente o tamanho de chave pela metade. AES-128 cai; AES-256 mantém segurança equivalente a 128 bits pós-quântico. Sistemas que já usam AES-256 exigem menos migração.

-> Resposta do NIST: em 2024 o NIST padronizou os primeiros algoritmos pós-quânticos:  
  — **CRYSTALS-Kyber** (ML-KEM): encapsulamento de chave, substitui RSA/ECDH  
  — **CRYSTALS-Dilithium** (ML-DSA): assinatura digital, substitui ECDSA  
  — **SPHINCS+** (SLH-DSA): assinatura baseada em hash, sem suposições algébricas

-> Linha do tempo: estimativas do NSA e CISA apontam para migração crítica até **2030** — a janela de exposição via HNDL já está aberta.

---

## A Infraestrutura Extrema

- O material tenta pintar um cenário futurista acessível, mas a física impõe barreiras brutais:

-> Hardware Proprietário: composto por QPUs, supercondutores de nióbio e acopladores magnéticos.

-> Zero Absoluto: a CPU clássica roda com um cooler comum. A QPU exige $-273^\circ\text{C}$ para evitar a decoerência quântica causada pelo ambiente.

-> Custo de Entrada: estima-se o custo de um único computador quântico funcional em 10 bilhões de dólares.

---

# Computação Quântica Hoje

- Apesar das barreiras de infraestrutura, a computação quântica já opera em contextos reais — majoritariamente via nuvem e em problemas específicos onde supera hardware clássico.

-> IBM Quantum Network: IBM oferece acesso a processadores quânticos via cloud (IBM Quantum Platform) com mais de 100 qubits disponíveis publicamente. O processador **Eagle** (127 qubits, 2021) foi o primeiro a superar 100 qubits com arquitetura supercondutora.

-> Google Sycamore (2019): o processador de 53 qubits executou uma tarefa específica em **200 segundos** — tarefa que o Google estimou levar 10.000 anos no Summit (o supercomputador mais poderoso da época). IBM contestou a estimativa clássica, reduzindo-a para 2,5 dias com otimizações. O debate evidencia que "supremacia quântica" é um alvo móvel e dependente da tarefa.

-> D-Wave em produção: a Volkswagen usou annealing quântico para otimização de rotas de ônibus em Lisboa (2019). A NASA e a Lockheed Martin usam D-Wave para verificação formal de software aeroespacial.

-> Micius — QKD intercontinental: satélite chinês lançado em 2016, estabeleceu em 2017 a primeira sessão de videoconferência protegida por distribuição de chave quântica (QKD) entre Pequim e Viena — 7.600 km. Qualquer interceptação destrói o estado quântico e é detectada.

-> Farmacêutica: Biogen e Boehringer Ingelheim iniciaram parcerias com IBM e Google para simulação de proteínas e descoberta de fármacos — problemas onde a simulação molecular quântica nativa tem vantagem intrínseca sobre aproximações clássicas.

---

# IA e Computação Quântica

- A interseção entre inteligência artificial e computação quântica é uma das apostas mais intensamente pesquisadas da década — e também uma das mais mal compreendidas.

-> Quantum Machine Learning (QML): algoritmos de ML reformulados para circuitos quânticos. O espaço de Hilbert de $N$ qubits tem dimensão $2^N$ — modelos quânticos operam implicitamente em espaços de features exponencialmente maiores que os clássicos.

-> Redes Neurais Quânticas (QNN): camadas de portas quânticas parametrizadas substituem camadas densas clássicas. O treinamento usa gradientes calculados via **parameter-shift rule** — análogo ao backpropagation, mas executado no hardware quântico.

-> VQE e QAOA: algoritmos híbridos quântico-clássicos dominam a era NISQ (Noisy Intermediate-Scale Quantum — dispositivos atuais com 50–1000 qubits ruidosos). O loop clássico otimiza parâmetros; o circuito quântico avalia a função de custo. Aplicações: otimização combinatória, química quântica, portfólios financeiros.

-> Speedup real em IA: o panorama é cauteloso. Em 2018, Ewin Tang (então estudante de graduação) demonstrou um **algoritmo clássico dequantizado** que replica a vantagem exponencial alegada pelo algoritmo de recomendação quântica de Kerenidis & Prakash — usando amostragem aleatória clássica. O episódio forçou revisão rigorosa de claims de speedup quântico em ML.

-> O que o qubit muda de fato: vantagem quântica em IA está mais estabelecida para **treinamento de modelos sobre dados quânticos** (resultado de sensores quânticos, simulações moleculares) do que para dados clássicos. O hardware quântico tolerante a erros — ainda não disponível — é o pré-requisito para vantagem geral em ML clássico.

---

# ORION — O Primeiro Computador Quântico

- Em fevereiro de 2007, a empresa canadense D-Wave Systems apresentou o **Orion** — o primeiro sistema comercial descrito publicamente como computador quântico.

-> Arquitetura: 16 qubits por annealing quântico. Não usa portas quânticas universais — resolve problemas de otimização minimizando uma função de energia hamiltoniana.

-> Controvérsia: a comunidade científica questionou se o Orion realizava computação genuinamente quântica ou simulava comportamento quântico classicamente. Estudos posteriores confirmaram tunelamento quântico em condições específicas, mas a máquina permanece em categoria própria — distinta do modelo gate-based.

-> Evolução D-Wave: dos 16 qubits do Orion em 2007, a empresa chegou ao D-Wave Advantage com mais de 5000 qubits em 2020.

-> Marco histórico: o Orion deslocou a computação quântica do laboratório para o mercado e forçou IBM, Google e Microsoft a acelerarem seus programas de desenvolvimento.

---

> @files/infosec/senac/computacao-quantica/fundamentos.pdf
