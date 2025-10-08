import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET /api/orders - Lista todos os pedidos
export async function GET(request: NextRequest) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url)
      const status = searchParams.get('status')
      const tableId = searchParams.get('tableId')
      const waiterId = searchParams.get('waiterId')
      const date = searchParams.get('date')

      const where: any = {}

      if (status) {
        where.status = status
      }

      if (tableId) {
        where.tableId = tableId
      }

      // Filtro por garçom (se fornecido)
      if (waiterId) {
        where.waiterId = waiterId
      }

      // Filtro por data
      if (date) {
        const startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)

        where.createdAt = {
          gte: startDate,
          lte: endDate,
        }
      }

      // Garçons só veem seus próprios pedidos (sobrescreve filtro de waiterId)
      if (user.role === 'WAITER') {
        where.waiterId = user.userId
      }

      const orders = await prisma.order.findMany({
        where,
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
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json(orders)
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar pedidos' },
        { status: 500 }
      )
    }
  })(request)
}

// POST /api/orders - Cria um novo pedido
export async function POST(request: NextRequest) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      const body = await req.json()
      const { tableId, items, serviceCharge = 0 } = body

      if (!tableId || !items || items.length === 0) {
        return NextResponse.json(
          { error: 'Mesa e itens são obrigatórios' },
          { status: 400 }
        )
      }

      // Calcula o total
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

        if (!product.active) {
          return NextResponse.json(
            { error: `Produto ${product.name} não está ativo` },
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

      const finalTotal = total + serviceCharge

      // Cria o pedido
      const order = await prisma.order.create({
        data: {
          tableId,
          waiterId: user.userId,
          total,
          serviceCharge,
          finalTotal,
          items: {
            create: orderItems,
          },
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

      // Buscar mesa para verificar se já tem garçom principal
      const table = await prisma.table.findUnique({
        where: { id: tableId },
      })

      // Atualiza o total da mesa e atribui garçom automaticamente
      await prisma.table.update({
        where: { id: tableId },
        data: {
          currentTotal: {
            increment: finalTotal,
          },
          status: 'ATTENDING',
          waiterId: table?.waiterId || user.userId, // Atribui garçom principal se ainda não tiver
        },
      })

      // Adiciona garçom à lista de garçons da mesa (se ainda não estiver)
      await prisma.tableWaiter.upsert({
        where: {
          tableId_waiterId: {
            tableId,
            waiterId: user.userId,
          },
        },
        create: {
          tableId,
          waiterId: user.userId,
        },
        update: {}, // Não faz nada se já existir
      })

      // Registra log
      await prisma.activityLog.create({
        data: {
          userId: user.userId,
          action: 'create_order',
          description: `Criou pedido para mesa ${order.table.number}`,
          metadata: {
            orderId: order.id,
            tableId: order.tableId,
            total: finalTotal,
          },
        },
      })

      return NextResponse.json(order, { status: 201 })
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      return NextResponse.json(
        { error: 'Erro ao criar pedido' },
        { status: 500 }
      )
    }
  })(request)
}
