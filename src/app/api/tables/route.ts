// API de mesas
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET - Lista todas as mesas
export async function GET(request: NextRequest) {
  return requireAuth(async () => {
    try {
      const tables = await prisma.table.findMany({
        include: {
          waiter: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          tableWaiters: {
            include: {
              waiter: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              assignedAt: 'asc',
            },
          },
          orders: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          mergedWith: true,
        },
        orderBy: {
          number: 'asc',
        },
      })

      return NextResponse.json({ success: true, data: tables })
    } catch (error) {
      console.error('Erro ao buscar mesas:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar mesas' },
        { status: 500 }
      )
    }
  })(request)
}

// POST - Cria uma nova mesa (apenas recepcionista)
export async function POST(request: NextRequest) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem criar mesas' },
          { status: 403 }
        )
      }

      const { number } = await req.json()

      if (!number) {
        return NextResponse.json(
          { error: 'Número da mesa é obrigatório' },
          { status: 400 }
        )
      }

      // Verifica se já existe mesa com esse número
      const existing = await prisma.table.findUnique({
        where: { number },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Já existe uma mesa com esse número' },
          { status: 400 }
        )
      }

      const table = await prisma.table.create({
        data: { number },
      })

      return NextResponse.json({ success: true, data: table })
    } catch (error) {
      console.error('Erro ao criar mesa:', error)
      return NextResponse.json(
        { error: 'Erro ao criar mesa' },
        { status: 500 }
      )
    }
  })(request)
}
