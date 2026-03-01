---
layout: page
title: "hardwares"
date: 2026-01-19T18:57:57-03:00
permalink: /linux/101/1/hardwares
categories: [linux]
tags: [101, 1]
hide_footer: true
---

# 101.1

## Áreas de Conhecimento
- -> Habilitar e desabilitar periféricos integrados.
- -> Diferenciar entre vários tipos de dispositivos de armazenamento.
- -> Determinar os recursos de hardware para os dispositivos.
- -> Ferramentas e utilitários para listar várias informações de hardware.
- -> Ferramentas e utilitários para manipular dispositivos USB.
- -> Compreensão conceitual de sysfs, udev e dbus.

`/sys/`
`/proc/`
`/dev/`
#lsmod #lspci #lsusb #modprobe

---

# BIOS
BASIC INPUT OUTPUT SYSTEM

(print da bios)

BIOS é o firmware da Placa Mãe

Esse firmware faz o gerênciamento de todos os dispositivos conectados a placa mãe.

Primeira ação ao ligar a máquina é o POST

Power-On Self-Test: inicializa cada dispositivo conectado na placa mãe e faz um pequeno teste para saber se foi tudo ok (BEP)

BIOS mais modernas: EFI e UEFI

Extensible Firmware Interface e Unified EFI

BIOS com mais funcionalidades


---

# IRQ
- 
-> É um sinal que um dispositivo envia para a CPU atender a uma solicitaçao

-> Principais
- IRQ1 - Teclado
- IRQ3 - Porta Serial 2 (RS232)
- IRQ4 - Porta Serial 1 (RS232)
- IRQ14 - IDE Primária
- IRQ15 - IDE Secundária

`/proc/interrupts`

`/proc` é um file system dinâmico que contem vários arquivos e diretórios com informações do dispositivo e do sistema em sí

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  <div class="auto-term">
fxlip@www:~$ cat /proc/interrupts 
            CPU0       CPU1       CPU2       CPU3       CPU4       CPU5       CPU6       CPU7       
   8:          0          0          0          0          0          0          0          0  IR-IO-APIC    8-edge      rtc0
   9:          0        235          0          0          0          0          0          0  IR-IO-APIC    9-fasteoi   acpi
  14:          0          0          0          0          0          0          0          0  IR-IO-APIC   14-fasteoi   INT3455:00
  16:          0          0          0          2          0          0          0          0  IR-IO-APIC   16-fasteoi   i801_smbus, idma64.0, i2c_designware.0
  17:          0          0          0          0          0          0          0        942  IR-IO-APIC   17-fasteoi   idma64.1, i2c_designware.1
  25:          2          0          0          0          0          0          0          0  IR-IO-APIC   25-fasteoi   CUST0001:00
 120:          0          0          0          0          0          0          0          0  DMAR-MSI    0-edge      dmar0
 121:          0          0          0          0          0          0          0          0  DMAR-MSI    1-edge      dmar1
 122:          0          0          0          0          0          0          0          0  IR-PCI-MSI 114688-edge      PCIe PME, pciehp
 123:          0          0          0          0          0          0          0          0  IR-PCI-MSI 116736-edge      PCIe PME, pciehp
 124:          0          0          0          0          0          0          0          0  IR-PCI-MSI 475136-edge      PCIe PME
 125:          0          0          0          0          0          0          0          0  IR-PCI-MSI 483328-edge      PCIe PME
 126:          0        431          0          0          0          0          0          0  IR-PCI-MSI 217088-edge      thunderbolt
 127:          0          0        448          0          0          0          0          0  IR-PCI-MSI 217089-edge      thunderbolt
 142:          0          0          0          0          0          0          0          0  IR-PCI-MSI 212992-edge      xhci_hcd
 143:          0          0          0          0          0          0         45          0  IR-PCI-MSI 46137344-edge      nvme0q0
 144:          0          0          0          0          0    1209600          0          0  IR-PCI-MSI 327680-edge      xhci_hcd
 145:      25891          0          0          0          0          0          0          0  IR-PCI-MSI 46137345-edge      nvme0q1
 146:          0      26928          0          0          0          0          0          0  IR-PCI-MSI 46137346-edge      nvme0q2
 147:          0          0      29664          0          0          0          0          0  IR-PCI-MSI 46137347-edge      nvme0q3
 148:          0          0          0      28372          0          0          0          0  IR-PCI-MSI 46137348-edge      nvme0q4
 149:          0          0          0          0      27665          0          0          0  IR-PCI-MSI 46137349-edge      nvme0q5
 150:          0          0          0          0          0      22747          0          0  IR-PCI-MSI 46137350-edge      nvme0q6
 151:          0          0          0          0          0          0      27233          0  IR-PCI-MSI 46137351-edge      nvme0q7
 152:          0          0          0          0          0          0          0      29535  IR-PCI-MSI 46137352-edge      nvme0q8
 153:          0   10029345          0          0          0          0          0          0  IR-PCI-MSI 32768-edge      i915
 154:          0          0        103          0          0          0          0          0  IR-PCI-MSI 360448-edge      mei_me
 155:          0          0          0       4916          0          0          0          0  IR-PCI-MSI 514048-edge      snd_hda_intel:card0
 156:          0          0          0          0     135437          0          0          0  IR-PCI-MSI 333824-edge      iwlwifi:default_queue
 157:       8603          0          0          0          0          0          0          0  IR-PCI-MSI 333825-edge      iwlwifi:queue_1
 158:          0      19586          0          0          0          0          0          0  IR-PCI-MSI 333826-edge      iwlwifi:queue_2
 159:          0          0      12443          0          0          0          0          0  IR-PCI-MSI 333827-edge      iwlwifi:queue_3
 160:          0          0          0      16369          0          0          0          0  IR-PCI-MSI 333828-edge      iwlwifi:queue_4
 161:          0          0          0          0      17931          0          0          0  IR-PCI-MSI 333829-edge      iwlwifi:queue_5
 162:          0          0          0          0          0       8476          0          0  IR-PCI-MSI 333830-edge      iwlwifi:queue_6
 163:          0          0          0          0          0          0       7614          0  IR-PCI-MSI 333831-edge      iwlwifi:queue_7
 164:          0          0          0          0          0          0          0      20340  IR-PCI-MSI 333832-edge      iwlwifi:queue_8
 165:          0          0          0          0          0          5          0          0  IR-PCI-MSI 333833-edge      iwlwifi:exception
 166:          0          0          0          0          0          0      45101          0  IR-PCI-MSI 45613056-edge      nvidia
 NMI:        397        402        391        391        383        396        386        388   Non-maskable interrupts
 LOC:    4453641    5036401    4370954    4340768    4341837    4764219    4284737    4290523   Local timer interrupts
 SPU:          0          0          0          0          0          0          0          0   Spurious interrupts
 PMI:        397        402        391        391        383        396        386        388   Performance monitoring interrupts
 IWI:      14059    5338002      15919      14997      14821      13072      15924      14791   IRQ work interrupts
 RTR:          4          0          0          0          0          0          0          0   APIC ICR read retries
 RES:     374041     339429     370437     366374     365710     376700     371776     371921   Rescheduling interrupts
 CAL:    1427124    1239198    1128217    1079729    1035036    1080510    1062830    1026489   Function call interrupts
 TLB:     472897     433674     447025     451410     430201     472012     477985     457537   TLB shootdowns
 TRM:          0          0          0          0          0          0          0          0   Thermal event interrupts
 THR:          0          0          0          0          0          0          0          0   Threshold APIC interrupts
 DFR:          0          0          0          0          0          0          0          0   Deferred Error APIC interrupts
 MCE:          0          0          0          0          0          0          0          0   Machine check exceptions
 MCP:         68         69         69         69         69         69         69         69   Machine check polls
 ERR:          0
 MIS:          0
 PIN:          0          0          0          0          0          0          0          0   Posted-interrupt notification event
 NPI:          0          0          0          0          0          0          0          0   Nested posted-interrupt event
 PIW:          0          0          0          0          0          0          0          0   Posted-interrupt wakeup event
  </div>
</div>


# endereços I/O (E/S)
- 
-> Lista de endereços na memória fixo que é utilizado para que a CPU se comunique com esses dispositivos `/proc/ioports`


<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  <div class="auto-term">
fxlip@www:~$ sudo cat /proc/ioports 
[sudo] senha para fxlip: 
0000-0cf7 : PCI Bus 0000:00
  0000-001f : dma1
  0020-0021 : pic1
  0040-0043 : timer0
  0050-0053 : timer1
  0060-0060 : keyboard
  0062-0062 : PNP0C09:01
    0062-0062 : EC data
  0064-0064 : keyboard
  0066-0066 : PNP0C09:01
    0066-0066 : EC cmd
  0070-0071 : rtc_cmos
    0070-0071 : rtc0
  0080-008f : dma page reg
  00a0-00a1 : pic2
  00c0-00df : dma2
  00f0-00ff : fpu
  0400-041f : iTCO_wdt
    0400-041f : iTCO_wdt
  0680-069f : pnp 00:00
0cf8-0cff : PCI conf1
0d00-ffff : PCI Bus 0000:00
  164e-164f : pnp 00:00
  1800-1803 : ACPI PM1a_EVT_BLK
  1804-1805 : ACPI PM1a_CNT_BLK
  1808-180b : ACPI PM_TMR
  1850-1850 : ACPI PM2_CNT_BLK
  1854-1857 : pnp 00:01
  1860-187f : ACPI GPE0_BLK
  2000-20fe : pnp 00:04
  3000-3fff : PCI Bus 0000:57
    3000-307f : 0000:57:00.0
  4000-403f : 0000:00:02.0
  5000-5fff : PCI Bus 0000:01
  6000-6fff : PCI Bus 0000:2c
  efa0-efbf : 0000:00:1f.4
    efa0-efbf : i801_smbus

  </div>
</div>

# Endereços DMA
Direct Memory Addressing

-> Um canal que permite que os dispositivos trasmitam os dados diretamente para a memória, sem utilizar a CPU.

-> não é utilizado por todos os dispositivos

`/proc/dma`

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <span class="win-btn btn-min">_</span>
      <span class="win-btn btn-close">x</span>
    </div>
  </div>
  <div class="auto-term">
fxlip@www:~$ cat /proc/dma 
 4: cascade
  </div>
</div>

---

> PROGRESSO ATÉ A 101-500

[48/105]

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <div class="win-btn btn-min" title="Minimize">−</div>
      <div class="win-btn btn-close" title="Close">✕</div>
    </div>
  </div>
  <div class="terminal-body">
    <div>
      <span class="t-user">fxlip</span><span class="t-gray">@</span><span class="t-host">www</span><span class="t-gray">:</span><span class="t-path">~</span><span class="t-gray">$</span> <span class="t-cmd">./footer.sh</span>
    </div>
    <div class="t-out">
>> @linux/101/2/boot
++ @linux/101/1/exercicios
++ @linux/101/1/revisao
<< @linux/103/8/vi
    </div>
  </div>
</div>