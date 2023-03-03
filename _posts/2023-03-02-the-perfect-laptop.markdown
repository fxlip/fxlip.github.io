---
title:  "O notebook perfeito"
date:   2023-03-02 11:39:00
categories: [building]
tags: [tech]
---

O texto a seguir é um guia baseado na minha própria experiência que pretende ser um fator motivador para você que assim como eu, está cansado de se ver forçado a atualizar constântemente sua máquina sempre que as coisas começam a travar ou ficam lentas, em um ciclo infinito de obsolescência programada. Além da necessidade peculiar de rodar diversos softwares em sistemas operacionais diferentes que por via de regra exigiriam máquinas distintas.

<!--mais-->

Seria utopia querer um notebook relativamente potente mas verdadeiramente portátil nos dias de hoje? 
E será mesmo que em pleno 2023 ainda precisamos escolher apenas um dos sistemas operacionais disponíveis?

Um macintosh com toda sua facilidade de cloud e devops, aplicativos de áudio, vídeo e design muito bem projetados que funcionam de maneira fluída além de um ambiente único e exclusivo para desenvolvimento iOS? 

Um windows com toda sua versatilidade e desempenho dando suporte aos drivers de GPU que permitem rodar praticamente todos os jogos disponíveis? 

Ou um Linux? Com distribuições contruídas por uma comunidade apaixonada de desenvolvedores que conseguem extrair toda a potência do processador sem nenhum processo suspeito rodando em segundo plano?

Pois bem, há um caminho. Ele é árduo mas existe. Definitivamente não é algo trivial e surgem centenas de erros durante essa jornada. Unir todos os sistemas operacionais em um único hardware é literalmente um pesadelo mesmo para quem é da área de tecnologia e está acostumado a resolver problemas de computação. Customizar um hardware então envolve uma maestria que pode ser perigosa para quem não está habituado.

Esse guia será dividido em sete partes:

- Links úteis
- Aquisição dos hardwares
- Upgrade e Downgrade
- Todos os downloads
- Instalação dos sistemas
- Resolução dos problemas
- Conclusão

##### Links Úteis:

Talvez antes de começar você queira dar uma olhada no conteúdo disponível na internet então separei os melhores links:
  - [O melhor laptop hackintosh é o Razer Blade Stealth](https://www.inverse.com/input/guides/the-best-13-inch-hackintosh-laptop-is-the-razer-blade-stealth)
  - 

##### Aquisição dos hardwares

- Razer Blade Stealth 13" 2019 
[PCMag](https://www.pcmag.com/reviews/razer-blade-stealth-13-late-2019) | [TheVerge]https://www.theverge.com/2019/2/15/18226158/razer-blade-stealth-2019-review-specs-price-gaming-laptop | [TechRadar]https://www.techradar.com/reviews/razer-blade-stealth-13

Sim eu sei: é um notebook caro e descontinuado que você precisará ser encontrado na internet em bom estado. Mas vai por mim, essa procura e o todo o preço pago valerão a pena. Esse é foi o último notebook de 13" produzido que você conseguirá rodar a versão mais recente do MacOS (10.15.7 Catalina 19A583). Apartir de 2020 quando foi lançado a versão Big Sur (10.16) a Apple começou a lançar seus próprios processadores focando assim todo o suporte para essa nova arquitetura, consequentemente prejudicando as máquinas que ainda possuiam processadores da intel, até que a migração seja totalmente finalizada e não exista mais suporte. Logo, o MacOS 10.15.7 foi a última versão que recebeu suporte completo dentro da arquitetura da intel até o fim do ciclo. Essa versão só pode ser instalada em processadores de décima geração, justamente a do blade stealth late 2019.

- DW1560 (bcm94352z)
Como nada no hackintosh pode ser fácil, se você quiser que sua internet funcione nativamente você precisará adquirir essa placa wifi (ou usar uma das duas portas USB com uma antena externa). Essa placa na verdade é um downgrade pois originalmente o bluetooth original () de fábrica é 5.0 enquanto nessa será o 4.0. Em relação a frequência do wifi nada muda, ambas se conectam a redes 5G.

- SSD NVme Samsung 1TB+ 970
O NVme que vem de fábrica já é bom com uma velocidade de xxx e tem um espaço razoável de xxx, mas como quero cinco sistemas operacionais independetes com todos seus softwares/drivers/jogos instalados precisamos de mais espaço e uma velocidade extra. 

- Pendrive 16gb+
Teóricamente um pendrive de 8GB já seria o suficiente mas em alguns casos pode haver um bug por questão de espaço, então para evitar problema 16GB resolve esse problema. Por alguma questão os pendrives da xxx podem apresentar erros também, então sugiro outras marcas.

- Pasta térmica (Opcional)
Como você terá adquirido seu notebook de segunda mão e já irá estar com a mão na massa atualizando o SSD e a placa WiFi, porque não já dar um upgrade na pasta térmica? Recomendo fazer isso apenas se tiver experiência pois remover o processador de um notebook exige perícia.

- HD Externo (Opcional)
Se você deseja fazer tudo em um só momento (durante um final de semana por exemplo), sugiro ter um HD Externo para armazenar todos os download que precisarão ser feitos. 

##### Upgrade e Downgrade:

- Upgrade: SSD/Pasta térmica
...

- Downgrade: Wifi/Bluetooth
...

##### Todos os downloads:

Para facilitar o trabalho e focar apenas nas instalações e posteriormente nas resoluções dos problemas, fiz o download de todas as imagens, softwares e drivers que iria usar nesse primeiro momento e armazenei tudo em um HD externo.

Imagens:
- Windows 10
- MacOS 10.15.7 19A583
- Ubuntu 22.04
- Debian 11.6
- Kali 2022.4

Softwares:
- UniBeast (MacOS)
- MultiBeast (MacOS)
- Clover (MacOS)

Drivers:
- GTX 1650 (Windows)
- Wifi/Bluetooth (Windows, MacOS e Linux)

##### Instalação dos sistemas

- Começando pelo Windows
Essa é a parte mais fácil, se você já estiver familiarizado com uma formatação isso não será problema nenhum. A parte mais importante desse passo está na divisão do seu 1TB de armazenamento.

...

- Agora é a vez dele, o hackintosh
Obviamente essa é a parte mais difícil onde será necessário burlar a autenticação de hardware autorizado que a apple faz e configurar o bootloader para tudo funcionar bem.

...

- Por fim minhas distribuições linux
Agora é sombra e agua fresca meu parceiro, distribuições linux são instaláveis em qualquer coisa que tenha energia e um microprocessador. Então vamos lá escolhi logo minhas três distribuições favoritas para não ter que me preocupar com sistema operacional nunca mais!

...

- Debian
Aquela distribuição estável e confiável digna de um linux puro, construído do zero. Um sistema praticamente blindado a falhas e erros embora tenha uma complexidade de configuração e personalização maior.

...

- Ubuntu
Baseado no debian, o ubuntu também é um querido por dar uma flexibilidade na instalação de softwares e drivers que o debian já complica, embora isso possa causar alguma instabilidades e erros ocasionalmente.

...

- Kali
Também baseado no debian, o kali é minha distribuição favorita! já é aquele linux funcional que vem com tudo que você pode precisar relacionado a segurança, seja para testar sistemas, s
oftwares ou hardwares, essa distribuição definitivamente entrega tudo.

...

##### Resolução de problemas:

Após ter o bootloader configurado com todos os seus respectivos sistemas operacionais instalados e sendo iniciados corretamente é hora de começar a sexta parte desse guia: a resolução dos problemas de hadrware dentro desses sistemas.

- Windows:

...

- MacOS:

...

- Ubuntu:

...

- Debian:

...

- Kali

...

##### Conclusão:

Após visitar os links úteis, adquirir todo o hardware necessário, realizar as devidas modificações, fazer o download e organizar os softwares que serão utilizados, configurar todos ambientes e resolver os problemas específicos de cada sistema operacional, você será capaz de ter um notebook extremamente flexível e adaptável a praticamente qualquer situação e necessidade.

Pode não ser o computador mais rápido com um processador de apenas 1.3GHz de frequência se comparado aos 3.49Ghz+ da atualidade, nem o mais potênte com sua GPU de 1485MHz de clock se comparado aos 2000MHz+ das gerações atuais e muito menos o mais livre com sua CPU da família I, quando comparado aos Core2Duo onde ainda era possível a remoção de todos os bloobs binários da intel. Então quando superada essas questões é possível atingir o equilíbrio perfeito com uma máquina que executa tudo que for necessário de maneira satisfatória.