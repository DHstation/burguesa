# 🔧 Correção do Problema de USB no Docker

## Problema Identificado

```
❌ Erro ao acessar dispositivos USB: No native build was found for platform=linux arch=x64 runtime=node abi=115 uv=1 libc=musl node=20.19.5
```

### Causa
O módulo `usb` (node-usb) requer **binários nativos compilados** para cada plataforma. O problema ocorreu porque:

1. ✅ **Alpine Linux** usa `musl libc` (mais leve)
2. ❌ `node-usb` não tem builds pré-compilados para `musl`
3. ❌ Alpine não tem ferramentas completas de compilação por padrão

## Solução Aplicada

### Mudança de Base Docker: `node:20-alpine` → `node:20-slim`

**Antes (Alpine):**
```dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl libusb-dev eudev-dev
```

**Depois (Debian Slim):**
```dockerfile
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y \
    openssl \
    libusb-1.0-0 \
    libusb-1.0-0-dev \
    libudev-dev \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*
```

### Pacotes Instalados

- **openssl** - Para Prisma
- **libusb-1.0-0** - Runtime USB
- **libusb-1.0-0-dev** - Headers para compilação
- **libudev-dev** - Device management
- **build-essential** - GCC, make, etc
- **python3** - Requerido pelo node-gyp

### Rebuild do Módulo USB

```dockerfile
RUN npm ci
RUN npm rebuild usb --build-from-source
```

Isso força a compilação do módulo nativo na arquitetura correta.

## Como Aplicar

### 1. Rebuild da Imagem Docker

```bash
# Build local
docker build -t marcussviniciusa/burguesa:latest .

# Push para Docker Hub
docker push marcussviniciusa/burguesa:latest
```

### 2. No Servidor

```bash
# Pull da nova imagem
docker pull marcussviniciusa/burguesa:latest

# Restart container
docker-compose down
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## Verificação

### Teste 1: Listar Dispositivos USB

```bash
# Dentro do container
docker-compose exec app sh

# Node REPL
node
> const usb = require('usb')
> usb.getDeviceList()
```

### Teste 2: Via API

```bash
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3000/api/printers/devices
```

### Teste 3: Interface Web

1. Acesse `/printers`
2. Cadastre uma impressora
3. Clique em "Testar"
4. Deve mostrar se encontrou ou não o dispositivo

## Comparação de Tamanho

| Imagem | Tamanho |
|--------|---------|
| node:20-alpine | ~120 MB |
| node:20-slim | ~180 MB |

**Custo-benefício:** +60MB para ter suporte USB nativo funcionando.

## Alternativas Consideradas

### ❌ Opção 1: Compilar no Alpine
- Muito complexo
- Requer musl-dev, linux-headers, etc
- Nem sempre funciona

### ✅ Opção 2: Usar Debian Slim (Escolhida)
- Compatibilidade garantida
- Binários nativos funcionam out-of-the-box
- +60MB é aceitável para produção

### ❌ Opção 3: Usar node:20-full
- Muito pesado (~900MB)
- Desnecessário

## Permissões USB

No host (servidor), pode ser necessário dar permissões:

```bash
# Adicionar usuário ao grupo dialout
sudo usermod -a -G dialout $USER

# Ou criar regra udev (mais seguro)
echo 'SUBSYSTEM=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="5743", MODE="0666"' | \
  sudo tee /etc/udev/rules.d/99-printer.rules

sudo udevadm control --reload-rules
sudo udevadm trigger
```

## Troubleshooting

### Erro: "LIBUSB_ERROR_ACCESS"
**Solução:** Container precisa rodar em modo privileged (já configurado)

### Erro: "Cannot find module 'usb'"
**Solução:** npm rebuild usb não foi executado

### Erro: "Device not found"
**Solução:**
1. Verificar se impressora está conectada: `lsusb`
2. Verificar IDs no banco: Vendor=0x0483, Product=0x5743
3. Reiniciar container com `--device /dev/bus/usb`

## Status Final

✅ **CORRIGIDO** - Dockerfile atualizado para `node:20-slim` com suporte USB nativo.

Build e push da nova imagem necessários!
