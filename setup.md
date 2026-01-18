---
title: setup
layout: page
permalink: /setup
---

Após contato com a **Free Software Foundation** (2017) e um *mindblowing* com o **Dilema das Redes** (2020), migrei de "consumidor de tecnologia" para "operador de sistemas". Hoje minha arquitetura reflete uma filosofia de **Soberania Digital**.

---

### Estação de Trabalho (Padrão)
*Equilíbrio entre portabilidade e compatibilidade multi-kernel.*

* **Hardware:** Razer Blade Stealth Late 2019.
* **Engenharia Reversa & Mods:**
    * **Wi-Fi:** Substituição do módulo Intel AX201 por um Broadcom DW1560. Ativando o suporte do AirDrop/Continuity no UNIX.
    * **Storage:** Samsung 970 EVO Plus. High IOPS para virtualização.
* **Triple-Boot:**
    -  **Debian:** Estabilidade e gestão de pacotes via apt.
    -  **macOS:** Compilações via Xcode sem hardware da Apple.
    -  **Windows:** Sandbox isolado para testes de compatibilidade.

---

### Laboratório (Pesquisas de Segurança)
*Auditoria de kernel e purismo de software.*

* **Hardware:** Lenovo T400s. Technoethical Mod com Certificação RYF.
* **Firmware:** BIOS proprietária substituída pelo **Libreboot**.
* **Intel ME Delete:** Impossível acesso remoto em nível de hardware.
* **OS:** Trisquel GNU/Linux. Ambiente livre de *blobs* binários, usado para entender o Linux em sua essência ética.

---

### Servidor (AI & Data)
*Processamento pesado e privacidade de dados.*

* **Hardware:** Arquitetura Ryzen 7 + RTX 4060 + Custom Water Loop.
* **Função:** Execução local de LLMs, NAS e Self-Hosted Services.
* **OS:** Pop!_OS. Workflow focado em Data Science e Drivers Nvidia.

---