import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET /api/printers - Lista todas as impressoras
export async function GET(request: NextRequest) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      // Apenas recepcionistas podem acessar impressoras
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem acessar impressoras' },
          { status: 403 }
        )
      }

      const printers = await prisma.printerConfig.findMany({
        orderBy: {
          name: 'asc',
        },
      })

      return NextResponse.json({ success: true, data: printers })
    } catch (error) {
      console.error('Erro ao buscar impressoras:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar impressoras' },
        { status: 500 }
      )
    }
  })(request)
}

// POST /api/printers - Cria uma nova impressora
export async function POST(request: NextRequest) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem criar impressoras' },
          { status: 403 }
        )
      }

      const { name, type, vendorId, productId, settings } = await req.json()

      if (!name || !type || !vendorId || !productId) {
        return NextResponse.json(
          { error: 'Nome, tipo, vendorId e productId são obrigatórios' },
          { status: 400 }
        )
      }

      if (!['kitchen', 'reception'].includes(type)) {
        return NextResponse.json(
          { error: 'Tipo deve ser "kitchen" ou "reception"' },
          { status: 400 }
        )
      }

      // Verifica se já existe impressora com esse nome
      const existing = await prisma.printerConfig.findUnique({
        where: { name },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Já existe uma impressora com esse nome' },
          { status: 400 }
        )
      }

      const printer = await prisma.printerConfig.create({
        data: {
          name,
          type,
          vendorId,
          productId,
          settings: settings || {},
        },
      })

      // Registra log
      await prisma.activityLog.create({
        data: {
          userId: user.userId,
          action: 'create_printer',
          description: `Cadastrou impressora ${name}`,
          metadata: {
            printerId: printer.id,
            type: printer.type,
          },
        },
      })

      return NextResponse.json({ success: true, data: printer }, { status: 201 })
    } catch (error) {
      console.error('Erro ao criar impressora:', error)
      return NextResponse.json(
        { error: 'Erro ao criar impressora' },
        { status: 500 }
      )
    }
  })(request)
}
