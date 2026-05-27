---
layout: page
title: "2-vulnerabilidades"
date: 2026-04-09T18:57:57-03:00
permalink: /infosec/gestao-de-riscos/vulnerabilidades
categories: [infosec]
tags: [gestao-de-riscos]
hide_footer: true
math: true
---

# Avaliação de Vulnerabilidades e Identificação de Riscos

- A proteção proativa de ativos de informação exige mapear sistematicamente as fragilidades estruturais antes que uma ameaça as explore. Uma vulnerabilidade atua como uma "porta aberta" procedimento, de software ou de hardware; ela não garante a ocorrência de uma invasão, mas a facilita drasticamente. 

---

## Diagnóstico e Varredura de Vulnerabilidades

O processo de identificação de brechas em sistemas operacionais, aplicações, redes e bancos de dados é automatizado por meio de scanners de vulnerabilidades.

- -- Categorias de Scanners


-> Baseados em Assinatura: Identificam falhas conhecidas comparando os dados coletados com um banco de dados de assinaturas atualizado.

-> Comportamentais: Detectam anomalias operacionais e desvios de funcionamento no ambiente.

### Soluções heterogêneas como Nessus, OpenVAS, Qualys e Nikto fornecem relatórios periódicos e simulam ataques. Contudo, ferramentas não substituem a atuação humana: cabe ao analista depurar os relatórios, filtrar falsos positivos e alinhar as descobertas à realidade do negócio.  

- -- Mapeamento de Fraquezas em Camadas:

-> Camada Física: Falhas de localização e proteção material, salas de servidores expostas sem controle biométrico, ausência de CFTV ou falta de climatização e nobreaks.

-> Camada Lógica: Servidores desatualizados, credenciais fracas, falta de segundo fator de autenticação (MFA), contas com privilégios excessivos e ausência de logs de auditoria.

-> Camada Humana: Erros operacionais, instalação de softwares não autorizados, condutas negligentes e suscetibilidade a engenharia social (phishing).


---

## Técnicas de Avaliação e Priorização de Riscos

Determinar o nível de criticidade de um risco exige cruzar duas variáveis principais: a Probabilidade (chance de o evento ocorrer) e o Impacto (extensão do dano financeiro, operacional ou reputacional).

> Nível de Risco = Probabilidade x Impacto

Abordagens Metodológicas:

-> Qualitativa: Baseia-se em julgamentos subjetivos e escalas descritivas (ex: Baixo, Médio, Alto). É ágil, simples e útil para triagens iniciais onde dados estatísticos são escassos.

-> Quantitativa: Atribui valores numéricos estritos baseados em dados históricos e impactos financeiros reais. Permite calcular objetivamente o custo estimado de uma quebra de segurança e justificar investimentos em controles defensivos.

-> Semiquantitativa (Híbrida): Combina ambas as vertentes, utilizando escalas numéricas fixas (ex: 1 a 3 ou 0 a 4) para balizar percepções qualitativas, unindo o melhor dos dois mundos.

---

## Frameworks Normativos e Matriz de Riscos

O ordenamento do apetite ao risco e as ações de resposta utilizam frameworks consolidados internacionais:

-> Matriz de Riscos (Probabilidade x Impacto): Ferramenta que gera uma visualização gráfica para ranquear ameaças em zonas de atenção imediata ou monitoramento tardio.

-> CVSS (Common Vulnerability Scoring System): Framework que atribui uma pontuação padronizada e matemática à severidade técnica de uma falha.

-> ISO/IEC 27005 (2022): Orienta o ciclo contínuo (alinhado ao PDCA) de estabelecimento de contexto, identificação, análise, tratamento (mitigar, aceitar, transferir ou evitar), comunicação e monitoramento de riscos de segurança. 

-> NIST SP 800-30 Rev. 1: Guia técnico estruturado em fases (preparação, condução, comunicação e monitoramento) focado em sistemas de informação corporativos.

-> COBIT 5 for Risk: Focado na governança de TI, alinhando as contramedidas técnicas diretamente aos objetivos de negócios da corporação.

---

## Estabelecimento de Políticas Organizacionais

A mitigação real de incidentes depende de transformar o diagnóstico em leis internas institucionais através de uma Política de Gestão de Riscos.

Essas políticas definem formalmente os critérios de aceitação de riscos da empresa, as regras de conformidade (ex: prazos de expiração e complexidade de senhas) e os papéis específicos da alta gestão, dos times técnicos e dos usuários. Políticas genéricas falham; elas precisam refletir o porte, a maturidade de cibersegurança e os marcos jurídicos locais (como a LGPD).

---

> @files/infosec/senac/gestao-de-riscos/vulnerabilidades.pdf