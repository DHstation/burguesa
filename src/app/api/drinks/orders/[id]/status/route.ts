import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// PATCH - Atualizar status do pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      const { id } = await params
      const { status } = await req.json()

      if (!['PENDING', 'PREPARING', 'READY', 'DELIVERED'].includes(status)) {
        return NextResponse.json(
          { error: 'Status inválido' },
          { status: 400 }
        )
      }

      const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          items: {
            where: { cancelled: false },
            include: { product: true }
          },
          table: true,
          waiter: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // Log da atividade
      await prisma.activityLog.create({
        data: {
          userId: user.userId,
          action: 'update_drink_order_status',
          description: `Atualizou status do pedido ${id} para ${status}`,
          metadata: {
            orderId: id,
            newStatus: status,
            tableNumber: order.table.number,
          }
        }
      })

      return NextResponse.json({ success: true, data: order })
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar status do pedido' },
        { status: 500 }
      )
    }
  })(request)
}
