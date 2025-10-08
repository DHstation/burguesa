import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  return requireAuth(async () => {
    try {
      // Buscar todas as mesas
      const allTables = await prisma.table.findMany()

      // Contar por status
      const totalTables = allTables.length
      const emptyTables = allTables.filter(t => t.status === 'EMPTY').length
      const attendingTables = allTables.filter(t => t.status === 'ATTENDING').length
      const finishedTables = allTables.filter(t => t.status === 'FINISHED').length

      // Pedidos de hoje
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: today
          },
          status: {
            not: 'CANCELLED'
          }
        },
        include: {
          items: true
        }
      })

      // Calcular receita
      const todayRevenue = todayOrders.reduce((sum, order) => sum + order.finalTotal, 0)

      // Garçons ativos (cadastrados com status ativo)
      const activeWaitersCount = await prisma.user.count({
        where: {
          role: 'WAITER',
          active: true
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          totalTables,
          emptyTables,
          attendingTables,
          finishedTables,
          todayRevenue,
          todayOrders: todayOrders.length,
          activeWaiters: activeWaitersCount,
        }
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar estatísticas' },
        { status: 500 }
      )
    }
  })(request)
}
