import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { findDevicePath } from '@/lib/printer-utils'

// POST /api/printers/[id]/test - Testa conexão real com impressora USB
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (_req: NextRequest, user: any) => {
    try {
      const { id } = await params

      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem testar impressoras' },
          { status: 403 }
        )
      }

      const printer = await prisma.printerConfig.findUnique({
        where: { id },
      })

      if (!printer) {
        return NextResponse.json(
          { error: 'Impressora não encontrada' },
          { status: 404 }
        )
      }

      // Verifica se estamos no servidor (Node.js) ou browser
      if (typeof window !== 'undefined') {
        return NextResponse.json(
          { error: 'Teste de conexão USB só pode ser feito no servidor' },
          { status: 400 }
        )
      }

      try {
        // Importa o módulo USB (apenas no servidor)
        const USB = require('usb')

        // Converte IDs hexadecimais para números
        const vendorIdNum = parseInt(printer.vendorId, 16)
        const productIdNum = parseInt(printer.productId, 16)

        // Tenta encontrar o dispositivo USB
        const device = USB.findByIds(vendorIdNum, productIdNum)

        if (!device) {
          // Impressora não encontrada
          await prisma.printerConfig.update({
            where: { id },
            data: { connected: false },
          })

          return NextResponse.json({
            success: false,
            connected: false,
            message: `Impressora não encontrada. Verifique se o dispositivo USB está conectado.\n\nVendor ID: ${printer.vendorId}\nProduct ID: ${printer.productId}`,
          })
        }

        // Tenta abrir o dispositivo
        try {
          device.open()
          device.close()

          // Lista TODOS os device paths disponíveis
          const fs = require('fs')
          const possiblePaths = [
            '/dev/usb/lp0',
            '/dev/usb/lp1',
            '/dev/usb/lp2',
            '/dev/usb/lp3',
          ]
          const availablePaths = possiblePaths.filter(path => fs.existsSync(path))

          // Se já tem devicePath configurado, mantém. Senão, tenta detectar
          let devicePath = printer.devicePath
          if (!devicePath && availablePaths.length > 0) {
            // Pega o devicePath baseado no tipo da impressora
            // Heurística: primeira impressora kitchen pega lp1, reception pega lp0
            if (printer.type === 'kitchen' && availablePaths.includes('/dev/usb/lp1')) {
              devicePath = '/dev/usb/lp1'
            } else if (printer.type === 'reception' && availablePaths.includes('/dev/usb/lp0')) {
              devicePath = '/dev/usb/lp0'
            } else {
              devicePath = availablePaths[0]
            }
          }

          // Impressora encontrada e acessível
          await prisma.printerConfig.update({
            where: { id },
            data: {
              connected: true,
              devicePath: devicePath,
              lastUsed: new Date(),
            },
          })

          // Registra log
          await prisma.activityLog.create({
            data: {
              userId: user.userId,
              action: 'test_printer',
              description: `Testou conexão com impressora ${printer.name}`,
              metadata: {
                printerId: printer.id,
                success: true,
                devicePath: devicePath,
              },
            },
          })

          return NextResponse.json({
            success: true,
            connected: true,
            message: `Impressora "${printer.name}" conectada com sucesso!${devicePath ? `\n\nDevice Path: ${devicePath}` : ''}\n\nDevice paths disponíveis: ${availablePaths.join(', ')}`,
            device: {
              vendorId: printer.vendorId,
              productId: printer.productId,
              name: printer.name,
              devicePath: devicePath || 'Não detectado',
            },
            availablePaths: availablePaths,
          })
        } catch (accessError: any) {
          // Dispositivo encontrado mas sem permissão de acesso
          await prisma.printerConfig.update({
            where: { id },
            data: { connected: false },
          })

          return NextResponse.json({
            success: false,
            connected: false,
            message: `Impressora encontrada mas sem permissão de acesso.\n\nErro: ${accessError.message}\n\nDica: Execute com privilégios elevados ou configure as permissões USB.`,
          })
        }
      } catch (usbError: any) {
        // Erro ao inicializar USB
        return NextResponse.json({
          success: false,
          connected: false,
          message: `Erro ao acessar dispositivos USB: ${usbError.message}`,
        }, { status: 500 })
      }
    } catch (error) {
      console.error('Erro ao testar impressora:', error)
      return NextResponse.json(
        { error: 'Erro ao testar conexão com impressora' },
        { status: 500 }
      )
    }
  })(request)
}
