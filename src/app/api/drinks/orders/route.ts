import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET - Listar pedidos de bebidas (categorias: BEBIDAS_COM_ALCOOL, BEBIDAS_SEM_ALCOOL, DRINKS_ESPECIAIS)
export async function GET(request: NextRequest) {
  return requireAuth(async () => {
    try {
      const orders = await prisma.order.findMany({
        where: {
          status: {
            in: ['PENDING', 'PREPARING', 'READY']
          },
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
          table: true,
          waiter: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      // Filtrar apenas pedidos que tenham itens de bebidas
      const drinksOrders = orders.filter(order => order.items.length > 0)

      return NextResponse.json({ success: true, data: drinksOrders })
    } catch (error) {
      console.error('Erro ao buscar pedidos de bebidas:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar pedidos de bebidas' },
        { status: 500 }
      )
    }
  })(request)
}
