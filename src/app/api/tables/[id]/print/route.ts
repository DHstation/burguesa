import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { printTableSummary } from '@/lib/print-helpers'

// POST - Imprime resumo da mesa
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (_req: NextRequest, user: any) => {
    const { id } = await params

    try {
      // Buscar mesa para verificar se existe
      const table = await prisma.table.findUnique({
        where: { id },
      })

      if (!table) {
        return NextResponse.json(
          { error: 'Mesa não encontrada' },
          { status: 404 }
        )
      }

      // Imprimir resumo da mesa na impressora de recepção
      const result = await printTableSummary(id)

      if (!result.success) {
        return NextResponse.json(
          {
            error: result.message,
            success: false,
          },
          { status: 400 }
        )
      }

      // Registrar log
      await prisma.activityLog.create({
        data: {
          userId: user.userId,
          action: 'print_table_summary',
          description: `Imprimiu resumo da mesa ${table.number}`,
          metadata: {
            tableId: table.id,
            tableNumber: table.number,
            total: table.currentTotal,
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: result.message,
      })

    } catch (error) {
      console.error('Erro ao imprimir resumo da mesa:', error)
      return NextResponse.json({
        error: 'Erro ao imprimir resumo',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 })
    }
  })(request)
}
