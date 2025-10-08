import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

const escpos = require('escpos')
escpos.USB = require('escpos-usb')

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

    // Buscar impressora padrão
    const printer = await prisma.printerConfig.findFirst({
      where: {
        connected: true,
      },
    })

    if (!printer) {
      return NextResponse.json({ error: 'Nenhuma impressora conectada' }, { status: 400 })
    }

    // Conectar à impressora USB usando os IDs do banco de dados
    const vendorId = parseInt(printer.vendorId || '0x6868', 16)
    const productId = parseInt(printer.productId || '0x0200', 16)
    const device = new escpos.USB(vendorId, productId)
    const printerDevice = new escpos.Printer(device)

    await new Promise<void>((resolve, reject) => {
      device.open((err: Error) => {
        if (err) {
          reject(err)
          return
        }

        printerDevice
          .font('a')
          .align('ct')
          .style('bu')
          .size(2, 2)
          .text('PEDIDO')
          .size(1, 1)
          .style('normal')
          .text('--------------------------------')
          .align('lt')
          .text(`Mesa: ${order.table.number}`)
          .text(`Garcom: ${order.waiter.name}`)
          .text(`Data: ${new Date(order.createdAt).toLocaleString('pt-BR')}`)
          .text('--------------------------------')
          .text('ITENS:')
          .text('--------------------------------')

        // Adicionar itens
        order.items.forEach((item) => {
          printerDevice
            .text(`${item.quantity}x ${item.product.name}`)
            .text(`   R$ ${item.price.toFixed(2)}`)

          if (item.observations) {
            printerDevice.text(`   Obs: ${item.observations}`)
          }
        })

        printerDevice
          .text('--------------------------------')
          .text(`Subtotal: R$ ${order.total.toFixed(2)}`)
          .text(`Taxa Servico: R$ ${order.serviceCharge.toFixed(2)}`)
          .style('bu')
          .size(1, 2)
          .text(`TOTAL: R$ ${order.finalTotal.toFixed(2)}`)
          .size(1, 1)
          .style('normal')
          .text('--------------------------------')
          .feed(3)
          .cut()
          .close(() => {
            resolve()
          })
      })
    })

    // Atualizar flag de impresso
    await prisma.order.update({
      where: { id: orderId },
      data: { printed: true },
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
