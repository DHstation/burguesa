import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// POST - Esvazia uma mesa e salva a sessão no histórico
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    const { id } = await params

    try {
      // Buscar mesa com todos os dados
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
              waiter: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          tableWaiters: {
            include: {
              waiter: {
                select: {
                  id: true,
                  name: true,
                },
              },
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

      if (table.status === 'EMPTY') {
        return NextResponse.json(
          { error: 'Mesa já está vazia' },
          { status: 400 }
        )
      }

      // Preparar dados dos garçons
      const waiters = table.tableWaiters.map(tw => ({
        id: tw.waiter.id,
        name: tw.waiter.name,
      }))

      // Calcular totais
      let totalServiceCharge = 0
      let totalItems = 0
      table.orders.forEach(order => {
        totalServiceCharge += order.serviceCharge
        totalItems += order.items.length
      })

      // Salvar sessão no histórico
      await prisma.tableSession.create({
        data: {
          tableId: table.id,
          tableNumber: table.number,
          waiters: waiters, // JSON array
          startTime: table.startTime || new Date(),
          endTime: new Date(),
          totalAmount: table.currentTotal,
          serviceCharge: totalServiceCharge,
          ordersData: table.orders, // JSON com todos os pedidos
          itemsCount: totalItems,
          ordersCount: table.orders.length,
        },
      })

      // Resetar mesa
      await prisma.table.update({
        where: { id },
        data: {
          status: 'EMPTY',
          currentTotal: 0,
          startTime: null,
          endTime: null,
          waiterId: null,
        },
      })

      // Remover garçons atribuídos
      await prisma.tableWaiter.deleteMany({
        where: { tableId: id },
      })

      // Registrar log
      await prisma.activityLog.create({
        data: {
          userId: user.userId,
          action: 'empty_table',
          description: `Esvaziou mesa ${table.number} e salvou sessão`,
          metadata: {
            tableId: table.id,
            tableNumber: table.number,
            sessionTotal: table.currentTotal,
            ordersCount: table.orders.length,
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Mesa esvaziada e sessão salva no histórico',
      })
    } catch (error) {
      console.error('Erro ao esvaziar mesa:', error)
      return NextResponse.json(
        { error: 'Erro ao esvaziar mesa' },
        { status: 500 }
      )
    }
  })(request)
}
