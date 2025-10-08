import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Buscar histórico de pedidos
export async function GET(request: NextRequest) {
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

    // Verificar se é recepcionista
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!user || user.role !== 'RECEPTIONIST') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar todos os pedidos (últimos 90 dias para performance)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: ninetyDaysAgo
        }
      },
      include: {
        table: {
          select: {
            id: true,
            number: true,
          }
        },
        waiter: {
          select: {
            id: true,
            name: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: orders
    })

  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return NextResponse.json({
      error: 'Erro ao buscar histórico',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
