---
title: setup
layout: page
permalink: /setup
---

# // hardware architecture

Minha infraestrutura é reflexo de uma filosofia adotada em 2017, após contato direto com a *Free Software Foundation* e a doutrina do Stallman em um palestra na UnB.

Não busco o hardware mais caro ou rápido, mas aqueles que garantem alguma **Soberania Digital** e reparabilidade.

### 01. *The Freedom Lab* para Estudos Críticos
**Device:** Lenovo T400s
* **Certificação:** RYF (Respect Your Freedom).
* **Modificações:** Intel Management Engine (ME) neutralizado com uma BIOS proprietária substituída pelo Libreboot.
* **Uso:** Este é meu laboratório de Linux puro com o Trisquel. Aqui eu  estudo a base do sistema sem blobs binários e explorando o kernel como ele deve ser. :D

### 02. *The Daily Driver* para Produtividade
**Device:** Ultrabook x86_64
* **Base:** Razer Blade Stealth Late 2019 - Escolhido especificamente pelo chipset i7-1065G7 Ice Lake, a última arquitetura Intel viável para virtualização nativa do Darwin/XNU.
* **Hardware Mods:**
    * **Network:** Substituição do módulo *Intel AX201* pelo *Broadcom BCM94352Z (DW1560)* para suporte nativo a 802.11ac em ambiente UNIX/BSD.
    * **Storage:** Upgrade para um Samsung 970 EVO Plus NVMe para aprimorar o I/O e aguentar múltiplos sistemas de arquivos.
* **Boot Environment:**
    1.  **Debian/Main:** Onde vivo 90% do tempo. Estabilidade e apt.
    2.  **macOS/Hackintosh:** Prova de conceito de interoperabilidade. Mantido para compilação via Xcode sem dependência de hardwares proprietários da Apple.
    3.  **Windows/Legacy:** Isolado para testes de compatibilidade específicos sem suporte via Wine.

### 03. *Local Compute Unit* para AI & Pesquisas
**Device:** Custom Workstation
* **Foco:** Execução local de LLMs, NAS e privacidade de dados.
* **Specs:** Arquitetura Ryzen com aceleração gráfica dedicada e refrigeração líquida para longos ciclos de processamento.
* **OS:** Pop!_OS pela compatibilidade superior com drivers proprietários de GPU e workflow de Data Science.

---