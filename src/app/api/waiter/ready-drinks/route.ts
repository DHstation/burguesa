import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET - Buscar pedidos de bebidas prontos do garçom
export async function GET(request: NextRequest) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      if (user.role !== 'WAITER') {
        return NextResponse.json(
          { error: 'Apenas garçons podem acessar esta rota' },
          { status: 403 }
        )
      }

      // Buscar pedidos de bebidas com status READY do garçom
      const orders = await prisma.order.findMany({
        where: {
          waiterId: user.userId,
          status: 'READY',
          items: {
            some: {
              cancelled: false,
              product: {
                category: {
                  in: ['BEBIDAS_COM_ALCOOL', 'BEBIDAS_SEM_ALCOOL', 'DRINKS_ESPECIAIS']
                }
              }
            }
          }
        },
        include: {
          items: {
            where: {
              cancelled: false,
              product: {
                category: {
                  in: ['BEBIDAS_COM_ALCOOL', 'BEBIDAS_SEM_ALCOOL', 'DRINKS_ESPECIAIS']
                }
              }
            },
            include: {
              product: true
            }
          },
          table: {
            select: {
              number: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })

      // Filtrar apenas pedidos que tenham itens de bebidas
      const drinksOrders = orders.filter(order => order.items.length > 0)

      return NextResponse.json({ success: true, data: drinksOrders })
    } catch (error) {
      console.error('Erro ao buscar drinks prontos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar drinks prontos' },
        { status: 500 }
      )
    }
  })(request)
}
