// API de mesa individual
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET - Busca mesa por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async () => {
      const { id } = await params
    try {
      const table = await prisma.table.findUnique({
        where: { id: id },
        include: {
          waiter: true,
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
          mergedTables: true,
        },
      })

      if (!table) {
        return NextResponse.json(
          { error: 'Mesa não encontrada' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data: table })
    } catch (error) {
      console.error('Erro ao buscar mesa:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar mesa' },
        { status: 500 }
      )
    }
  })(request)
}

// PUT - Atualiza mesa (incluindo atribuição de garçom)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    const { id } = await params
    try {
      const data = await req.json()

      // Apenas recepcionistas podem atribuir garçons
      if (data.waiterId !== undefined && user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem atribuir garçons' },
          { status: 403 }
        )
      }

      const table = await prisma.table.update({
        where: { id: id },
        data: {
          waiterId: data.waiterId === '' ? null : data.waiterId,
        },
        include: {
          waiter: true,
          orders: true,
        },
      })

      return NextResponse.json({ success: true, data: table })
    } catch (error) {
      console.error('Erro ao atualizar mesa:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar mesa' },
        { status: 500 }
      )
    }
  })(request)
}

// PATCH - Atualiza mesa
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req: NextRequest) => {
      const { id } = await params
    try {
      const data = await req.json()

      const table = await prisma.table.update({
        where: { id: id },
        data,
        include: {
          waiter: true,
          orders: true,
        },
      })

      return NextResponse.json({ success: true, data: table })
    } catch (error) {
      console.error('Erro ao atualizar mesa:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar mesa' },
        { status: 500 }
      )
    }
  })(request)
}

// DELETE - Remove mesa (apenas recepcionista)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req: NextRequest, user: any) => {
      const { id } = await params
    try {
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem remover mesas' },
          { status: 403 }
        )
      }

      // Verifica se a mesa está vazia
      const table = await prisma.table.findUnique({
        where: { id: id },
        include: { orders: true },
      })

      if (table?.status !== 'EMPTY') {
        return NextResponse.json(
          { error: 'Não é possível remover mesa em atendimento' },
          { status: 400 }
        )
      }

      await prisma.table.delete({
        where: { id: id },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Erro ao remover mesa:', error)
      return NextResponse.json(
        { error: 'Erro ao remover mesa' },
        { status: 500 }
      )
    }
  })(request)
}
