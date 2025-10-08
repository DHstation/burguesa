import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import fs from 'fs'

// Códigos ESC/POS
const ESC = '\x1B'
const GS = '\x1D'

// Comandos ESC/POS
const CMD = {
  INIT: ESC + '@',                    // Inicializar impressora
  ALIGN_CENTER: ESC + 'a' + '1',      // Alinhar centro
  ALIGN_LEFT: ESC + 'a' + '0',        // Alinhar esquerda
  BOLD_ON: ESC + 'E' + '\x01',        // Negrito on
  BOLD_OFF: ESC + 'E' + '\x00',       // Negrito off
  SIZE_NORMAL: GS + '!' + '\x00',     // Tamanho normal
  SIZE_DOUBLE: GS + '!' + '\x11',     // Tamanho duplo (altura e largura)
  SIZE_DOUBLE_HEIGHT: GS + '!' + '\x01', // Tamanho duplo altura
  CUT: GS + 'V' + '\x00',             // Cortar papel
  LINE: '--------------------------------\n',
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const params = await context.params
    const orderId = params.id

    // Buscar o pedido completo
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        waiter: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
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

    // Verificar se o dispositivo /dev/usb/lp0 existe
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

    // Cabeçalho centralizado
    escposData += CMD.ALIGN_CENTER
    escposData += CMD.SIZE_DOUBLE
    escposData += CMD.BOLD_ON
    escposData += 'PEDIDO\n'
    escposData += CMD.BOLD_OFF
    escposData += CMD.SIZE_NORMAL
    escposData += '\n'

    escposData += CMD.LINE

    // Informações do pedido (alinhado à esquerda)
    escposData += CMD.ALIGN_LEFT
    escposData += `Mesa: ${order.table.number}\n`
    escposData += `Garcom: ${order.waiter.name}\n`
    escposData += `Data: ${new Date(order.createdAt).toLocaleString('pt-BR')}\n`
    escposData += '\n'

    escposData += CMD.LINE
    escposData += 'ITENS:\n'
    escposData += CMD.LINE

    // Itens do pedido
    order.items.forEach((item) => {
      escposData += `${item.quantity}x ${item.product.name}\n`
      escposData += `   R$ ${item.price.toFixed(2)}\n`

      if (item.observations) {
        escposData += `   Obs: ${item.observations}\n`
      }
      escposData += '\n'
    })

    // Totais
    escposData += CMD.LINE
    escposData += `Subtotal: R$ ${order.total.toFixed(2)}\n`
    escposData += `Taxa Servico: R$ ${order.serviceCharge.toFixed(2)}\n`
    escposData += CMD.LINE
    escposData += '\n'

    escposData += CMD.BOLD_ON
    escposData += CMD.SIZE_DOUBLE_HEIGHT
    escposData += `TOTAL: R$ ${order.finalTotal.toFixed(2)}\n`
    escposData += CMD.SIZE_NORMAL
    escposData += CMD.BOLD_OFF

    escposData += '\n'
    escposData += CMD.LINE
    escposData += '\n\n\n'

    // Cortar papel
    escposData += CMD.CUT

    // Escrever no dispositivo de impressora
    try {
      fs.writeFileSync(printerDevice, escposData, { encoding: 'binary' })
    } catch (writeError) {
      console.error('Erro ao escrever no dispositivo:', writeError)
      return NextResponse.json({
        error: 'Erro ao enviar dados para impressora',
        details: writeError instanceof Error ? writeError.message : 'Erro desconhecido'
      }, { status: 500 })
    }

    // Atualizar flag de impresso
    await prisma.order.update({
      where: { id: orderId },
      data: { printed: true },
    })

    // Atualizar contador de impressões
    await prisma.printerConfig.update({
      where: { id: printerConfig.id },
      data: {
        printCount: { increment: 1 },
        lastUsed: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Pedido impresso com sucesso'
    })

  } catch (error) {
    console.error('Erro ao imprimir pedido:', error)
    return NextResponse.json({
      error: 'Erro ao imprimir pedido',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
