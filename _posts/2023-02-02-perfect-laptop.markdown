---
title:  "Notebook perfeito"
date:   2023-02-02 11:39:00
categories: [building]
tags: [tech]
---

Neste artigo iremos mergulhar mais fundo nesse notebook que pretende ter o hardware definitivo para os próximos anos. Explorando suas especificações, recursos e desempenho vamos descobrir por que ele é a escolha perfeita para a construção de um robusto triple boot.

<!--mais-->

Você já se perguntou se é possível ter um notebook portátil que seja verdadeiramente potente nos dias de hoje? E será que ainda precisamos escolher apenas um dos sistemas operacionais disponíveis em pleno 2023?

Imagine poder ter em um único dispositivo o melhor dos três mundos: a facilidade e fluidez do macOS, a versatilidade e desempenho do Windows e a potência das distribuições Linux construídas por uma comunidade apaixonada de desenvolvedores. Parece apenas um sonho mas há um caminho. Um caminho árduo é verdade, mas que existe.

Mas não se engane, unir todos os sistemas operacionais em um único hardware não é algo trivial. Durante essa jornada, surgem centenas de erros e problemas que precisam ser resolvidos. Até mesmo para aqueles que são da área de tecnologia e estão acostumados a resolver problemas de computação, customizar um hardware para suportar três sistemas operacionais pode ser um verdadeiro pesadelo. Requer habilidade e maestria para garantir que tudo funcione perfeitamente, sem nenhum processo suspeito rodando em segundo plano.

Mas se você está disposto a encarar o desafio, esse notebook pode ser a resposta para todos os seus problemas. Então, prepare-se para descobrir como construir um triple boot em um hardware único e desfrutar do melhor dos três mundos. Vamos lá!

Esse guia será dividido em sete partes:

- Links úteis
- Aquisição dos hardwares
- Upgrade e Downgrade
- Todos os downloads
- Instalação dos sistemas
- Resolução dos problemas
- Conclusão

##### Links Úteis:

Talvez antes de começar a ler aqui você queira dar uma olhada nos principais conteúdos disponíveis na internet sobre o assunto, então já separei aqui os melhores links que me ajudaram nessa jornada:

  - [O melhor laptop hackintosh é o Razer Blade Stealth](https://www.inverse.com/input/guides/the-best-13-inch-hackintosh-laptop-is-the-razer-blade-stealth)

##### Aquisição dos hardwares

- [Razer Blade Stealth 13" 2019](https://mysupport.razer.com/app/answers/detail/a_id/3703/~/razer-blade-stealth-13%E2%80%9D-gtx1650-%282019%29-%7C-rz09-03101-support)
###### [[PCMag](https://www.pcmag.com/reviews/razer-blade-stealth-13-late-2019) // [TheVerge](https://www.theverge.com/2019/2/15/18226158/razer-blade-stealth-2019-review-specs-price-gaming-laptop) // [TechRadar](https://www.techradar.com/reviews/razer-blade-stealth-13)]

Esse notebook compacto e potente foi projetado para gamers e usuários que exigem alto desempenho em um pacote portátil. Seu processador i7-1065G7 é especialmente importante para criarmos um hackintosh com a última versão do macOS (10.15.7) que recebeu suporte completo para a arquiteura x86. Apartir de 2020 a empresa começaria a produzir seus próprios processadores com arquitetura ARM e o hackintosh como conhecemos já não seria possível ou pelo menos, ainda mais dificultado. Com esse hardware também será possível rodar a maioria dos jogos de forma satisfatória com a placa de vídeo nvidea dedicada (diferente dos macbooks) bem como também existir a possibilidade de usar a Thunderbolt 3 combinada com uma GPU externa e escalar os processamentos gráficos para o nível que desejar.

- [BCM94352Z DW1560](https://www.dell.com/support/home/en-us/drivers/driversdetails?driverid=99g87)
###### [[AliExpress](#) - [Shopee](#) - [MercadoLivre](#)]

Nada em uma criação de hackintosh é fácil, por isso se você quiser que sua internet funcione de forma nativa será necessário adquirir essa placa wifi ou matar uma das duas portas USB e depender de uma antena externa. A instalação desse hardware será um downgrade pois originalmente a placa de wi-fi original é o modelo AX201 da Intel (https://www.intel.com.br/content/www/br/pt/products/sku/130293/intel-wifi-6-ax201-gig/specifications.html) que chega em frequências de 6Ghz enquanto essa nova da Dell só alcança 5Ghz.

- [SSD NVme Samsung 1TB+ 970](https://semiconductor.samsung.com/consumer-storage/internal-ssd/970evo/)
###### [[AliExpress](#) - [Shopee](#) - [MercadoLivre](#)]

O NVme de fábrica nesse modelo é um PM981 com velocidade de leitura de 3000MB/s e de gravação de 1800MB/s com um espaço razoável de 512GB, porém como queremos no mínimo três sistemas operacionais independetes com todos seus respectivos softwares, drivers e jogos instalados iremos precisar de um pouco mais de espaço e porque não aumentar a velocidade de leitura (3500MB/s) e de gravação (3300MB/s). O que faz dessa placa a escolha ideal para o upgrade.

- Pendrive 16GB+
###### [[AliExpress](#) - [Shopee](#) - [MercadoLivre](#)]

Teóricamente um pendrive de 8GB já seria o suficiente mas em alguns casos pode haver um bug por questão de espaço, então para evitar problema 16GB resolve esse problema. Por alguma questão os pendrives da xxx podem apresentar erros também, então sugiro outras marcas.

- [Pasta térmica (Opcional)](https://www.thermal-grizzly.com/produkte/2-kryonaut)
###### [[AliExpress](#) - [Shopee](#) - [MercadoLivre](#)]

Como esse notebook será adquirido de segunda mão e já irá estar sendo aberto para o downgrade e upgrade, porque não já atualizar a pasta térmica? Recomendo fazer isso apenas se tiver experiência pois remover um processador de notebook exige perícia.

- HD Externo (Opcional)
###### [[AliExpress](#) - [Shopee](#) - [MercadoLivre](#)]

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