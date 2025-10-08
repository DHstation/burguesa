import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import fs from 'fs'

// Códigos ESC/POS
const ESC = '\x1B'
const GS = '\x1D'

// Comandos ESC/POS
const CMD = {
  INIT: ESC + '@',                    // Inicializar impressora
  ALIGN_CENTER: ESC + 'a' + '1',      // Alinhar centro
  ALIGN_LEFT: ESC + 'a' + '0',        // Alinhar esquerda
  ALIGN_RIGHT: ESC + 'a' + '2',       // Alinhar direita
  BOLD_ON: ESC + 'E' + '\x01',        // Negrito on
  BOLD_OFF: ESC + 'E' + '\x00',       // Negrito off
  SIZE_NORMAL: GS + '!' + '\x00',     // Tamanho normal
  SIZE_DOUBLE: GS + '!' + '\x11',     // Tamanho duplo (altura e largura)
  SIZE_DOUBLE_HEIGHT: GS + '!' + '\x01', // Tamanho duplo altura
  SIZE_DOUBLE_WIDTH: GS + '!' + '\x10',  // Tamanho duplo largura
  CUT: GS + 'V' + '\x00',             // Cortar papel
  LINE: '--------------------------------\n',
  DOUBLE_LINE: '================================\n',
}

// POST - Imprime resumo da mesa
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    const { id } = await params

    try {
      // Buscar mesa com todos os pedidos
      const table = await prisma.table.findUnique({
        where: { id },
        include: {
          orders: {
            where: {
              status: {
                not: 'CANCELLED',
              },
            },
            include: {
              items: {
                where: {
                  cancelled: false,
                },
                include: {
                  product: true,
                },
              },
              waiter: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          waiter: true,
          tableWaiters: {
            include: {
              waiter: true,
            },
            orderBy: {
              assignedAt: 'asc',
            },
          },
        },
      })

      if (!table) {
        return NextResponse.json(
          { error: 'Mesa não encontrada' },
          { status: 404 }
        )
      }

      // Buscar impressora conectada
      const printerConfig = await prisma.printerConfig.findFirst({
        where: {
          connected: true,
        },
      })

      if (!printerConfig) {
        return NextResponse.json({ error: 'Nenhuma impressora conectada' }, { status: 400 })
      }

      // Verificar se o dispositivo existe
      const printerDevice = '/dev/usb/lp0'
      if (!fs.existsSync(printerDevice)) {
        return NextResponse.json({
          error: 'Dispositivo de impressora não encontrado',
          details: `${printerDevice} não existe`
        }, { status: 500 })
      }

      // Construir comando ESC/POS
      let escposData = ''

      // Inicializar
      escposData += CMD.INIT

      // Cabeçalho
      escposData += CMD.ALIGN_CENTER
      escposData += CMD.SIZE_DOUBLE
      escposData += CMD.BOLD_ON
      escposData += 'RESUMO DA MESA\n'
      escposData += CMD.BOLD_OFF
      escposData += CMD.SIZE_NORMAL
      escposData += '\n'

      escposData += CMD.DOUBLE_LINE

      // Informações da mesa
      escposData += CMD.ALIGN_LEFT
      escposData += CMD.BOLD_ON
      escposData += `Mesa: ${table.number}\n`
      escposData += CMD.BOLD_OFF

      // Garçons
      if (table.tableWaiters && table.tableWaiters.length > 0) {
        if (table.tableWaiters.length === 1) {
          escposData += `Garcom: ${table.tableWaiters[0].waiter.name}\n`
        } else {
          escposData += `Garcons: ${table.tableWaiters.map(tw => tw.waiter.name).join(', ')}\n`
        }
      }

      // Período
      if (table.startTime) {
        escposData += `Inicio: ${new Date(table.startTime).toLocaleString('pt-BR')}\n`
      }
      if (table.endTime) {
        escposData += `Fim: ${new Date(table.endTime).toLocaleString('pt-BR')}\n`
      }

      escposData += '\n'
      escposData += CMD.DOUBLE_LINE

      // Agrupador de itens (consolidar todos os pedidos)
      const itemsMap = new Map<string, {
        name: string
        quantity: number
        price: number
        total: number
      }>()

      table.orders.forEach((order) => {
        order.items.forEach((item) => {
          const key = `${item.productId}-${item.price}`
          if (itemsMap.has(key)) {
            const existing = itemsMap.get(key)!
            existing.quantity += item.quantity
            existing.total += item.price * item.quantity
          } else {
            itemsMap.set(key, {
              name: item.product.name,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
            })
          }
        })
      })

      // Imprimir itens consolidados
      escposData += CMD.BOLD_ON
      escposData += 'ITENS CONSUMIDOS:\n'
      escposData += CMD.BOLD_OFF
      escposData += CMD.LINE

      let subtotal = 0
      itemsMap.forEach((item) => {
        escposData += `${item.quantity}x ${item.name}\n`
        escposData += `   R$ ${item.price.toFixed(2)} x ${item.quantity} = R$ ${item.total.toFixed(2)}\n`
        subtotal += item.total
      })

      escposData += '\n'

      // Calcular taxas de serviço total
      let totalServiceCharge = 0
      table.orders.forEach((order) => {
        totalServiceCharge += order.serviceCharge
      })

      // Totais
      escposData += CMD.DOUBLE_LINE
      escposData += CMD.ALIGN_RIGHT
      escposData += `Subtotal: R$ ${subtotal.toFixed(2)}\n`

      if (totalServiceCharge > 0) {
        escposData += `Taxa Servico: R$ ${totalServiceCharge.toFixed(2)}\n`
      }

      escposData += CMD.DOUBLE_LINE
      escposData += '\n'

      escposData += CMD.ALIGN_CENTER
      escposData += CMD.BOLD_ON
      escposData += CMD.SIZE_DOUBLE
      escposData += `TOTAL: R$ ${table.currentTotal.toFixed(2)}\n`
      escposData += CMD.SIZE_NORMAL
      escposData += CMD.BOLD_OFF

      escposData += '\n'
      escposData += CMD.ALIGN_LEFT
      escposData += CMD.DOUBLE_LINE
      escposData += '\n'

      // Quantidade de pedidos
      escposData += CMD.ALIGN_CENTER
      escposData += `Total de pedidos: ${table.orders.length}\n`
      escposData += `Total de itens: ${Array.from(itemsMap.values()).reduce((sum, item) => sum + item.quantity, 0)}\n`

      escposData += '\n'
      escposData += 'Obrigado pela preferencia!\n'
      escposData += 'Volte sempre!\n'
      escposData += '\n\n\n'

      // Cortar papel
      escposData += CMD.CUT

      // Escrever no dispositivo
      try {
        fs.writeFileSync(printerDevice, escposData, { encoding: 'binary' })
      } catch (writeError) {
        console.error('Erro ao escrever no dispositivo:', writeError)
        return NextResponse.json({
          error: 'Erro ao enviar dados para impressora',
          details: writeError instanceof Error ? writeError.message : 'Erro desconhecido'
        }, { status: 500 })
      }

      // Atualizar contador de impressões
      await prisma.printerConfig.update({
        where: { id: printerConfig.id },
        data: {
          printCount: { increment: 1 },
          lastUsed: new Date(),
        },
      })

      // Registrar log
      await prisma.activityLog.create({
        data: {
          userId: user.userId,
          action: 'print_table_summary',
          description: `Imprimiu resumo da mesa ${table.number}`,
          metadata: {
            tableId: table.id,
            tableNumber: table.number,
            total: table.currentTotal,
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Resumo da mesa impresso com sucesso',
      })

    } catch (error) {
      console.error('Erro ao imprimir resumo da mesa:', error)
      return NextResponse.json({
        error: 'Erro ao imprimir resumo',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 })
    }
  })(request)
}
