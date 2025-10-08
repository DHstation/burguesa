# Fix de Impressão USB - Knup KP-IM607

## Status Atual
- ✅ Impressora detectada: `Bus 001 Device 004: ID 6868:0200 gxmc`
- ✅ VirtualBox USB passthrough configurado
- ✅ Extension Pack instalado
- ❌ Erro: `usb.on is not a function`

## Problema
O módulo `escpos-usb` não está funcionando corretamente com Node.js no ambiente atual.

## Solução Temporária: Usar Serial/Network

### Opção 1: Impressora Serial (Recomendado)
```bash
# Verificar se a impressora aparece como serial
ls -la /dev/ttyUSB* /dev/ttyACM*

# Se aparecer, use escpos-serialport ao invés de escpos-usb
npm install escpos-serialport
```

### Opção 2: Impressora de Rede
Configure a impressora para usar IP estático na rede e use `escpos-network`.

## Próximos Passos

1. **Verificar dispositivo serial:**
   ```bash
   ls -la /dev/tty* | grep USB
   ```

2. **Se aparecer ttyUSB0 ou similar, editar o código:**
   ```typescript
   // src/app/api/orders/[id]/print/route.ts
   const SerialPort = require('escpos-serialport')
   const device = new SerialPort('/dev/ttyUSB0')
   ```

3. **Adicionar regras udev (permissões USB):**
   ```bash
   sudo nano /etc/udev/rules.d/99-escpos.rules
   ```

   Adicionar:
   ```
   SUBSYSTEM=="usb", ATTRS{idVendor}=="6868", ATTRS{idProduct}=="0200", MODE="0666", GROUP="plugdev"
   ```

   Recarregar:
   ```bash
   sudo udevadm control --reload-rules
   sudo udevadm trigger
   ```

4. **Reiniciar impressora USB no VirtualBox**

## IDs Corretos
- Vendor ID: `0x6868`
- Product ID: `0x0200`
