import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// PUT - Atualiza lista de garçons da mesa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    const { id } = await params
    try {
      // Apenas recepcionistas podem atribuir garçons
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem atribuir garçons' },
          { status: 403 }
        )
      }

      const data = await req.json()
      const { waiterIds } = data

      console.log('📥 Recebido waiterIds:', waiterIds)

      if (!Array.isArray(waiterIds)) {
        return NextResponse.json(
          { error: 'waiterIds deve ser um array' },
          { status: 400 }
        )
      }

      console.log('✅ Array válido com', waiterIds.length, 'garçons')

      // Verificar se a mesa existe
      const table = await prisma.table.findUnique({
        where: { id },
      })

      if (!table) {
        return NextResponse.json(
          { error: 'Mesa não encontrada' },
          { status: 404 }
        )
      }

      // Remover todos os garçons atuais da mesa
      const deleted = await prisma.tableWaiter.deleteMany({
        where: {
          tableId: id,
        },
      })
      console.log('🗑️ Removidos', deleted.count, 'garçons anteriores')

      // Adicionar novos garçons
      if (waiterIds.length > 0) {
        console.log('➕ Criando registros para:', waiterIds)
        const created = await prisma.tableWaiter.createMany({
          data: waiterIds.map((waiterId: string) => ({
            tableId: id,
            waiterId: waiterId,
          })),
          skipDuplicates: true,
        })
        console.log('✅ Criados', created.count, 'registros de garçons')

        // Atualizar garçom principal (primeiro da lista)
        await prisma.table.update({
          where: { id },
          data: {
            waiterId: waiterIds[0],
          },
        })
      } else {
        // Se não há garçons, remover garçom principal
        await prisma.table.update({
          where: { id },
          data: {
            waiterId: null,
          },
        })
      }

      // Buscar mesa atualizada com garçons
      const updatedTable = await prisma.table.findUnique({
        where: { id },
        include: {
          waiter: {
            select: {
              id: true,
              name: true,
              email: true,
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
        },
      })

      console.log('📋 Mesa atualizada com', updatedTable?.tableWaiters?.length, 'garçons')

      return NextResponse.json({
        success: true,
        data: updatedTable,
      })
    } catch (error) {
      console.error('Erro ao atualizar garçons da mesa:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar garçons' },
        { status: 500 }
      )
    }
  })(request)
}
