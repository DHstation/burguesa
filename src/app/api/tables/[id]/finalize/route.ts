import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// POST - Finaliza uma mesa e imprime o resumo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    const { id } = await params

    try {
      // Apenas recepcionistas podem finalizar mesas
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem finalizar mesas' },
          { status: 403 }
        )
      }

      // Buscar mesa com todos os pedidos
      const table = await prisma.table.findUnique({
        where: { id },
        include: {
          orders: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          waiter: true,
          tableWaiters: {
            include: {
              waiter: true,
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

      // Atualizar status da mesa para FINISHED
      const updatedTable = await prisma.table.update({
        where: { id },
        data: {
          status: 'FINISHED',
          endTime: new Date(),
        },
        include: {
          orders: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          waiter: true,
          tableWaiters: {
            include: {
              waiter: true,
            },
          },
        },
      })

      // Registrar log
      await prisma.activityLog.create({
        data: {
          userId: user.userId,
          action: 'finalize_table',
          description: `Finalizou mesa ${table.number}`,
          metadata: {
            tableId: table.id,
            tableNumber: table.number,
            total: table.currentTotal,
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: updatedTable,
      })
    } catch (error) {
      console.error('Erro ao finalizar mesa:', error)
      return NextResponse.json(
        { error: 'Erro ao finalizar mesa' },
        { status: 500 }
      )
    }
  })(request)
}
