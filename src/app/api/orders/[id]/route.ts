import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET /api/orders/[id] - Busca um pedido específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      const { id } = await params
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          table: true,
          waiter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      if (!order) {
        return NextResponse.json(
          { error: 'Pedido não encontrado' },
          { status: 404 }
        )
      }

      // Garçons só veem seus próprios pedidos
      if (user.role === 'WAITER' && order.waiterId !== user.userId) {
        return NextResponse.json(
          { error: 'Sem permissão para acessar este pedido' },
          { status: 403 }
        )
      }

      return NextResponse.json(order)
    } catch (error) {
      console.error('Erro ao buscar pedido:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar pedido' },
        { status: 500 }
      )
    }
  })(request)
}

// PATCH /api/orders/[id] - Atualiza um pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      const { id } = await params
      const body = await req.json()
      const { status, items, serviceCharge } = body

      // Busca o pedido atual
      const existingOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
          table: true,
        },
      })

      if (!existingOrder) {
        return NextResponse.json(
          { error: 'Pedido não encontrado' },
          { status: 404 }
        )
      }

      // Garçons só podem atualizar seus próprios pedidos
      if (user.role === 'WAITER' && existingOrder.waiterId !== user.userId) {
        return NextResponse.json(
          { error: 'Sem permissão para atualizar este pedido' },
          { status: 403 }
        )
      }

      const updateData: any = {}

      if (status !== undefined) {
        updateData.status = status
      }

      if (serviceCharge !== undefined) {
        updateData.serviceCharge = serviceCharge
        updateData.finalTotal = existingOrder.total + serviceCharge
      }

      // Atualiza itens se fornecidos
      if (items) {
        // Remove itens antigos
        await prisma.orderItem.deleteMany({
          where: { orderId: id },
        })

        // Calcula novo total
        let total = 0
        const orderItems = []

        for (const item of items) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
          })

          if (!product) {
            return NextResponse.json(
              { error: `Produto ${item.productId} não encontrado` },
              { status: 400 }
            )
          }

          const itemTotal = product.price * item.quantity
          total += itemTotal

          orderItems.push({
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
            observations: item.observations || null,
          })
        }

        updateData.total = total
        updateData.finalTotal = total + (serviceCharge !== undefined ? serviceCharge : existingOrder.serviceCharge)
        updateData.items = {
          create: orderItems,
        }

        // Atualiza total da mesa
        const difference = updateData.finalTotal - existingOrder.finalTotal
        await prisma.table.update({
          where: { id: existingOrder.tableId },
          data: {
            currentTotal: {
              increment: difference,
            },
          },
        })
      }

      const order = await prisma.order.update({
        where: { id },
        data: updateData,
        include: {
          table: true,
          waiter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      // Registra log
      await prisma.activityLog.create({
        data: {
          userId: user.userId,
          action: 'update_order',
          description: `Atualizou pedido da mesa ${order.table.number}`,
          metadata: {
            orderId: order.id,
            tableId: order.tableId,
            changes: body,
          },
        },
      })

      return NextResponse.json(order)
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar pedido' },
        { status: 500 }
      )
    }
  })(request)
}

// DELETE /api/orders/[id] - Cancela um pedido
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      const { id } = await params
      const existingOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          table: true,
        },
      })

      if (!existingOrder) {
        return NextResponse.json(
          { error: 'Pedido não encontrado' },
          { status: 404 }
        )
      }

      // Apenas recepcionistas podem cancelar pedidos
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem cancelar pedidos' },
          { status: 403 }
        )
      }

      // Marca como cancelado ao invés de deletar
      const order = await prisma.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
        },
        include: {
          table: true,
          waiter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      // Atualiza total da mesa
      await prisma.table.update({
        where: { id: existingOrder.tableId },
        data: {
          currentTotal: {
            decrement: existingOrder.finalTotal,
          },
        },
      })

      // Registra log
      await prisma.activityLog.create({
        data: {
          userId: user.userId,
          action: 'cancel_order',
          description: `Cancelou pedido da mesa ${order.table.number}`,
          metadata: {
            orderId: order.id,
            tableId: order.tableId,
            total: existingOrder.finalTotal,
          },
        },
      })

      return NextResponse.json(order)
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error)
      return NextResponse.json(
        { error: 'Erro ao cancelar pedido' },
        { status: 500 }
      )
    }
  })(request)
}
