# 🖨️ Guia de Configuração de Impressoras Térmicas KP-IM607

## 📋 Índice

1. [Especificações Técnicas](#especificações-técnicas)
2. [Instalação Física](#instalação-física)
3. [Configuração no Sistema Operacional](#configuração-no-sistema-operacional)
4. [Configuração no Sistema Burguesa](#configuração-no-sistema-burguesa)
5. [Testes e Troubleshooting](#testes-e-troubleshooting)
6. [Manutenção](#manutenção)

## 🔧 Especificações Técnicas

### KP-IM607 Knup

- **Tipo**: Impressora Térmica de Recibo
- **Largura do papel**: 58mm
- **Conexão**: USB 2.0
- **Protocolo**: ESC/POS (compatível Epson)
- **Resolução**: 203 DPI (8 dots/mm)
- **Velocidade**: Até 90mm/s
- **Buffer**: 4KB
- **Corte**: Automático (guilhotina)
- **Alimentação**: 5V via USB ou adaptador externo
- **Compatibilidade**: Windows, Linux, macOS
- **Emulação**: ESC/POS, EPSON TM-T20

### Protocolo ESC/POS

O protocolo ESC/POS (Epson Standard Code for Point of Sale) é um conjunto de comandos para controlar impressoras de ponto de venda. Principais comandos:

- `ESC @` (1B 40): Inicializa impressora
- `ESC a n` (1B 61 n): Alinhamento (0=esquerda, 1=centro, 2=direita)
- `ESC ! n` (1B 21 n): Seleção de fonte
- `ESC E n` (1B 45 n): Negrito (0=off, 1=on)
- `GS V m` (1D 56 m): Corte de papel
- `LF` (0A): Alimentação de linha

## 📦 Instalação Física

### 1. Desembalagem

1. Remova a impressora da embalagem cuidadosamente
2. Verifique se todos os acessórios estão incluídos:
   - Impressora KP-IM607
   - Cabo USB
   - Adaptador de energia (opcional)
   - Manual do usuário
   - Rolo de papel térmico (teste)

### 2. Instalação do Papel

1. **Abra a tampa**: Pressione o botão de liberação na parte superior
2. **Insira o rolo**: Coloque o rolo de papel térmico (58mm) no compartimento
3. **Puxe o papel**: Deixe cerca de 5-10cm de papel para fora
4. **Feche a tampa**: Pressione até ouvir um clique

**⚠️ IMPORTANTE**: O lado térmico do papel deve ficar voltado para cima. Para testar, risque com a unha - se aparecer uma marca preta, é o lado correto.

### 3. Conexão USB

1. Conecte o cabo USB na impressora
2. Conecte a outra ponta em uma porta USB 2.0 ou 3.0 do computador
3. A impressora deve acender o LED de status

### 4. Alimentação Externa (Opcional)

Se a alimentação USB não for suficiente:

1. Conecte o adaptador de energia na impressora
2. Conecte na tomada (110V/220V)
3. Mantenha o cabo USB conectado para comunicação

## 💻 Configuração no Sistema Operacional

### Linux (Ubuntu/Debian)

#### 1. Identifique a Impressora

```bash
# Liste dispositivos USB
lsusb

# Saída exemplo:
# Bus 001 Device 005: ID 0483:070b STMicroelectronics Thermal Printer
```

Os valores importantes são:
- **Vendor ID**: `0483` (primeiros 4 dígitos após "ID")
- **Product ID**: `070b` (últimos 4 dígitos)

#### 2. Instale Dependências

```bash
# Atualize o sistema
sudo apt update

# Instale libusb (necessário para node-usb)
sudo apt install -y libusb-1.0-0 libusb-1.0-0-dev

# Instale build-essential (para compilar módulos nativos)
sudo apt install -y build-essential

# Instale node-gyp globalmente
sudo npm install -g node-gyp
```

#### 3. Configure Permissões USB

Crie uma regra udev para permitir acesso sem privilégios root:

```bash
# Crie o arquivo de regras
sudo nano /etc/udev/rules.d/99-thermal-printer.rules
```

Adicione o seguinte conteúdo (substitua pelos seus IDs):

```
# Impressora da Cozinha
SUBSYSTEM=="usb", ATTR{idVendor}=="0483", ATTR{idProduct}=="070b", MODE="0666", GROUP="plugdev"

# Impressora da Recepção
SUBSYSTEM=="usb", ATTR{idVendor}=="0483", ATTR{idProduct}=="070c", MODE="0666", GROUP="plugdev"
```

Explicação:
- `MODE="0666"`: Permite leitura e escrita para todos
- `GROUP="plugdev"`: Atribui ao grupo plugdev

Salve e recarregue as regras:

```bash
# Recarregue as regras udev
sudo udevadm control --reload-rules
sudo udevadm trigger

# Adicione seu usuário ao grupo plugdev
sudo usermod -a -G plugdev $USER

# Faça logout e login novamente para aplicar
```

#### 4. Teste a Conexão

```bash
# Verifique se o dispositivo está acessível
ls -l /dev/bus/usb/001/005  # Ajuste o caminho conforme lsusb

# Deve mostrar permissões como: crw-rw-rw-
```

### Windows

#### 1. Driver USB

A KP-IM607 geralmente funciona com drivers genéricos USB ou drivers Epson TM-T20.

**Opção 1: Driver Genérico**
1. Conecte a impressora
2. Windows deve instalar driver automaticamente
3. Verifique no "Gerenciador de Dispositivos"

**Opção 2: Driver Epson**
1. Baixe driver Epson TM-T20 do site da Epson
2. Instale como "Impressora de Ponto de Venda"
3. Selecione porta USB correspondente

#### 2. Identificar IDs USB

Use o PowerShell:

```powershell
Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -match '^USB' } | Select-Object FriendlyName, InstanceId
```

Ou use ferramentas como [USB Device Tree Viewer](https://www.uwe-sieber.de/usbtreeview_e.html).

#### 3. Configurar Node.js

No Windows, o módulo `usb` pode precisar de bibliotecas adicionais:

```bash
# Instale windows-build-tools (como administrador)
npm install --global --production windows-build-tools

# Ou use o Visual Studio Build Tools
# https://visualstudio.microsoft.com/downloads/
```

### macOS

#### 1. Identifique a Impressora

```bash
system_profiler SPUSBDataType
```

#### 2. Instale Homebrew e Dependências

```bash
# Instale Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instale libusb
brew install libusb
```

## ⚙️ Configuração no Sistema Burguesa

### 1. Variáveis de Ambiente

Edite o arquivo `.env`:

```env
# Impressora da Cozinha
KITCHEN_PRINTER_VENDOR_ID="0x0483"
KITCHEN_PRINTER_PRODUCT_ID="0x070b"

# Impressora da Recepção
RECEPTION_PRINTER_VENDOR_ID="0x0483"
RECEPTION_PRINTER_PRODUCT_ID="0x070c"
```

**Importante**: Use o formato hexadecimal com prefixo `0x`.

### 2. Teste via Código

Crie um arquivo de teste `test-printer.js`:

```javascript
const escpos = require('escpos')
const USB = require('usb')

// Substitua pelos seus IDs
const vendorId = 0x0483
const productId = 0x070b

try {
  // Encontra o dispositivo
  const device = USB.findByIds(vendorId, productId)

  if (!device) {
    console.error('Impressora não encontrada!')
    process.exit(1)
  }

  device.open()

  // Configura interface
  const iface = device.interface(0)

  if (iface.isKernelDriverActive()) {
    iface.detachKernelDriver()
  }

  iface.claim()

  // Cria printer
  const usbAdapter = new escpos.USB(device)
  const printer = new escpos.Printer(usbAdapter)

  // Imprime teste
  printer
    .font('a')
    .align('ct')
    .style('bu')
    .size(1, 1)
    .text('TESTE DE IMPRESSAO')
    .style('normal')
    .text('')
    .text('Sistema Burguesa')
    .text(`Data: ${new Date().toLocaleString()}`)
    .text('')
    .text('Impressora OK!')
    .text('')
    .cut()
    .close(() => {
      console.log('Impressão concluída!')
      device.close()
    })

} catch (error) {
  console.error('Erro:', error.message)
}
```

Execute:

```bash
node test-printer.js
```

### 3. Interface Web

No sistema, acesse:

1. Login como Recepcionista
2. Menu lateral → "Configurações de Impressoras"
3. Verifique status de conexão
4. Clique em "Teste de Impressão"

## 🔍 Testes e Troubleshooting

### Teste de Hardware

Teste a impressora independentemente do sistema:

1. **Desligue a impressora**
2. **Segure o botão FEED** (botão na frente)
3. **Ligue a impressora** ainda segurando o botão
4. **Solte após 3 segundos**

A impressora deve imprimir uma página de teste com:
- Informações do firmware
- Configurações atuais
- Padrão de teste

### Problemas Comuns

#### Erro: "Device not found"

**Causas**:
- Impressora não conectada
- IDs USB incorretos
- Permissões insuficientes

**Soluções**:
1. Verifique conexão física
2. Confirme IDs com `lsusb`
3. Verifique regras udev
4. Reinicie o computador

#### Erro: "LIBUSB_ERROR_ACCESS"

**Causa**: Permissões insuficientes

**Solução Linux**:
```bash
# Verifique se está no grupo correto
groups

# Adicione ao grupo plugdev
sudo usermod -a -G plugdev $USER

# Configure regras udev (veja seção anterior)
```

**Solução Windows**: Execute Node.js como Administrador

#### Erro: "LIBUSB_ERROR_BUSY"

**Causa**: Dispositivo em uso por outro processo

**Solução**:
```bash
# Linux: Liste processos usando USB
lsof | grep usb

# Mate processos conflitantes
kill -9 <PID>

# Ou reinicie o serviço
sudo systemctl restart cups  # Se estiver usando CUPS
```

#### Impressão cortada ou ilegível

**Causas**:
- Papel térmico vencido ou de baixa qualidade
- Papel instalado ao contrário
- Cabeça de impressão suja

**Soluções**:
1. Verifique validade do papel (geralmente 2-3 anos)
2. Confirme lado térmico do papel
3. Limpe cabeça com álcool isopropílico e cotonete
4. Ajuste densidade de impressão no código

#### Corte de papel não funciona

**Causas**:
- Comando de corte não enviado
- Guilhotina com defeito

**Solução**:
```javascript
// Garanta que o comando cut() é chamado
printer
  .text('Conteudo')
  .cut()  // ← Importante!
  .close()
```

### Diagnóstico Avançado

#### Captura USB (Linux)

```bash
# Instale usbmon
sudo modprobe usbmon

# Capture tráfego USB
sudo cat /sys/kernel/debug/usb/usbmon/1u > usb_capture.txt

# Execute impressão e depois pare (Ctrl+C)

# Analise o arquivo usb_capture.txt
```

#### Log Detalhado

No código do serviço de impressão ([src/services/printer.ts:1](src/services/printer.ts)), adicione logs:

```typescript
this.printer
  .font('a')
  .align('ct')
  .text('Teste')
  .cut()
  .close((err: any) => {
    if (err) {
      console.error('Erro detalhado:', err)
      console.error('Stack:', err.stack)
    } else {
      console.log('Impressão OK')
    }
  })
```

## 🔧 Manutenção

### Limpeza da Cabeça de Impressão

**Frequência**: A cada 3 meses ou 10.000 impressões

**Procedimento**:
1. Desligue e desconecte a impressora
2. Abra a tampa e remova o papel
3. Localize a cabeça de impressão (barra preta brilhante)
4. Use cotonete levemente umedecido com álcool isopropílico 90%+
5. Limpe suavemente da esquerda para direita
6. Aguarde secar completamente (5-10 minutos)
7. Recoloque o papel e teste

**⚠️ ATENÇÃO**: Nunca use álcool comum (70%), apenas isopropílico 90%+

### Substituição do Papel

**Papel recomendado**:
- Largura: 58mm (±0.5mm)
- Diâmetro do rolo: máximo 50mm
- Comprimento: 15-30 metros
- Gramatura: 55-65 g/m²
- Tipo: Térmico (sem revestimento BPA se possível)

**Armazenamento do papel**:
- Ambiente seco (umidade < 65%)
- Temperatura: 15-25°C
- Longe de luz solar direta
- Embalado quando não em uso

### Verificação de Desgaste

**Indicadores de que a impressora precisa de manutenção**:
- Linhas brancas na impressão
- Impressão fraca ou desbotada
- Ruídos anormais
- Aumento de atolamentos
- Corte irregular do papel

### Vida Útil

- **Cabeça de impressão**: ~50km de papel (≈100.000 recibos)
- **Guilhotina**: ~1.000.000 cortes
- **Rolo de papel**: 2-3 anos (se armazenado corretamente)

## 📞 Suporte Técnico

### Fabricante

**Knup**
- Website: [www.knup.com.br](http://www.knup.com.br)
- Suporte: suporte@knup.com.br
- Telefone: +55 11 XXXX-XXXX

### Comunidade

- GitHub Issues: [repositório do projeto]
- Fórum ESC/POS: [escpos.org](http://escpos.org)
- Stack Overflow: tag `escpos`

## 📚 Referências

- [Especificação ESC/POS](https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/)
- [Documentação node-thermal-printer](https://github.com/Klemen1337/node-thermal-printer)
- [Documentação escpos](https://github.com/song940/node-escpos)
- [Manual KP-IM607](http://www.knup.com.br/downloads/KP-IM607_Manual.pdf)

---

**Sistema Burguesa** - Guia de Configuração de Impressoras v1.0
