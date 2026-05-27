---
layout: page
title: "5-seguranca"
date: 2026-04-09T18:57:57-03:00
permalink: /infosec/gestao-de-riscos/seguranca
categories: [infosec]
tags: [gestao-de-riscos]
hide_footer: true
math: true
---

# Segurança de Perímetro para Infraestruturas de TI


- A segurança de perímetro atua como um componente estratégico vital para salvaguardar dados e sistemas, estabelecendo limites e barreiras, físicas ou virtuais, projetadas para controlar rigorosamente o fluxo de entrada, saída e concessão de acessos a recursos críticos. O objetivo central é blindar as fronteiras de servidores, redes e dispositivos para impedir acessos não autorizados e garantir a disponibilidade dos serviços essenciais.

---

## Definição Expandida de Perímetro

O perímetro moderno não é uma linha única, mas sim um ecossistema de defesa em profundidade estruturado em duas grandes esferas interdependentes:

1. Perímetro Físico: Proteção material de salas de equipamentos, racks, cabeamento e estruturas prediais contra invasões, sabotagens ou desastres locais.  

2. Perímetro Lógico (Digital): Barreiras virtuais aplicadas para monitorar e policiar sistemas, aplicações, protocolos e fluxos de pacotes de dados que trafegam na rede.  

---

## Infraestrutura do Perímetro Lógico

Para conter ameaças antes que elas alcancem o coração dos bancos de dados, o perímetro lógico emprega um arsenal de ferramentas especializadas:


- -- Firewalls

-> Dispositivos (hardware ou software) que controlam o tráfego de rede com base em regras de segurança estritas. Eles inspecionam pacotes e determinam o que deve ser bloqueado ou permitido.

- -- Zona Desmilitarizada (DMZ)

-> Uma sub-rede isolada posicionada na fronteira entre a internet pública e a rede interna privada da empresa. Na DMZ, são hospedados os serviços que precisam ser acessados externamente, como servidores web ou de e-mail. Se um servidor na DMZ for comprometido por um invasor, o perímetro lógico impede o movimento lateral direto para a rede interna confidencial.

- -- Sistemas de Detecção e Prevenção (IDS/IPS)

-> IDS (Intrusion Detection System): Atua de forma passiva, monitorando o tráfego de rede em busca de assinaturas maliciosas ou anomalias comportamentais e disparando alertas para o time de SOC.

-> IPS (Intrusion Prevention System): Atua de forma ativa. Além de detectar o ataque em tempo real, ele toma contramedidas automáticas e imediatas para bloquear o tráfego agressor, exemplo: derrubar a conexão ou bloquear o IP na tabela do firewall.

---

## Blindagem de Perímetro Físico e Suporte Operacional

Vulnerabilidades lógicas importam pouco se um ator malicioso conseguir acesso físico direto ao hardware do servidor. A segurança material exige barreiras em camadas:

-> Controle de Acesso Biométrico e CFTV: Restrição rigorosa de entrada em datacenters por autenticação de múltiplos fatores, como biometria e crachá, combinada com monitoramento contínuo por câmeras e alarmes de intrusão.

-> Controle de Climatização (HVAC): Sistemas redundantes de ar-condicionado de precisão para evitar o superaquecimento dos processadores, mantendo a umidade sob controle absoluto para mitigar descargas eletrostáticas.

-> Sistemas de Prevenção contra Incêndios: Sensores de detecção precoce de fumaça integrados a sistemas de supressão de fogo por gases inertes, como FM-200 ou Novec, que extinguem as chamas por abafamento e resfriamento sem danificar os circuitos eletromecânicos.

-> Redundância Energética: Uso coordenado de nobreaks e UPS para sustentar a carga de forma imediata durante quedas de energia, até que os geradores a diesel automatizados entrem em rotação estável.

---

## Gestão de Identidade e Controle de Acesso (IAM)

A governança das fronteiras lógicas é ditada pelas políticas de controle de acesso, que definem quem pode interagir com os ativos e com qual nível de privilégio.

-> Princípio do Menor Privilégio (Least Privilege): Cada usuário, serviço ou processo deve possuir apenas os privilégios estritamente necessários para executar suas funções específicas, limitando o raio de destruição em caso de credenciais comprometidas.

-> Autenticação Multifator (MFA): Requisito mandatório no perímetro atual. Exige que o usuário comprove sua identidade através de algo que ele sabe (senha), algo que ele tem (token/smartphone) e algo que ele é (biometria).

-> Auditoria e Logs: Registro centralizado e imutável de todas as tentativas de acesso, comandos executados e alterações de privilégios, permitindo análises forenses precisão e garantia de conformidade com auditorias internacionais.

---

> @files/infosec/senac/gestao-de-riscos/seguranca.pdf