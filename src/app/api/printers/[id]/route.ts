import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET /api/printers/[id] - Busca uma impressora específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem acessar impressoras' },
          { status: 403 }
        )
      }

      const printer = await prisma.printerConfig.findUnique({
        where: { id: params.id },
      })

      if (!printer) {
        return NextResponse.json(
          { error: 'Impressora não encontrada' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data: printer })
    } catch (error) {
      console.error('Erro ao buscar impressora:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar impressora' },
        { status: 500 }
      )
    }
  })(request)
}

// PATCH /api/printers/[id] - Atualiza uma impressora
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem atualizar impressoras' },
          { status: 403 }
        )
      }

      const body = await req.json()
      const { name, type, vendorId, productId, connected, settings } = body

      const existingPrinter = await prisma.printerConfig.findUnique({
        where: { id: params.id },
      })

      if (!existingPrinter) {
        return NextResponse.json(
          { error: 'Impressora não encontrada' },
          { status: 404 }
        )
      }

      const updateData: any = {}

      if (name !== undefined) {
        // Verifica se o nome já existe em outra impressora
        const nameExists = await prisma.printerConfig.findFirst({
          where: {
            name,
            id: { not: params.id },
          },
        })

        if (nameExists) {
          return NextResponse.json(
            { error: 'Já existe uma impressora com esse nome' },
            { status: 400 }
          )
        }

        updateData.name = name
      }

      if (type !== undefined) {
        if (!['kitchen', 'reception'].includes(type)) {
          return NextResponse.json(
            { error: 'Tipo deve ser "kitchen" ou "reception"' },
            { status: 400 }
          )
        }
        updateData.type = type
      }

      if (vendorId !== undefined) {
        updateData.vendorId = vendorId
      }

      if (productId !== undefined) {
        updateData.productId = productId
      }

      if (connected !== undefined) {
        updateData.connected = connected
        if (connected) {
          updateData.lastUsed = new Date()
        }
      }

      if (settings !== undefined) {
        updateData.settings = settings
      }

      updateData.updatedAt = new Date()

      const printer = await prisma.printerConfig.update({
        where: { id: params.id },
        data: updateData,
      })

      // Registra log
      await prisma.activityLog.create({
        data: {
          userId: user.userId,
          action: 'update_printer',
          description: `Atualizou impressora ${printer.name}`,
          metadata: {
            printerId: printer.id,
            changes: body,
          },
        },
      })

      return NextResponse.json({ success: true, data: printer })
    } catch (error) {
      console.error('Erro ao atualizar impressora:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar impressora' },
        { status: 500 }
      )
    }
  })(request)
}

// DELETE /api/printers/[id] - Deleta uma impressora
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem deletar impressoras' },
          { status: 403 }
        )
      }

      const existingPrinter = await prisma.printerConfig.findUnique({
        where: { id: params.id },
      })

      if (!existingPrinter) {
        return NextResponse.json(
          { error: 'Impressora não encontrada' },
          { status: 404 }
        )
      }

      await prisma.printerConfig.delete({
        where: { id: params.id },
      })

      // Registra log
      await prisma.activityLog.create({
        data: {
          userId: user.userId,
          action: 'delete_printer',
          description: `Deletou impressora ${existingPrinter.name}`,
          metadata: {
            printerId: existingPrinter.id,
            printerName: existingPrinter.name,
          },
        },
      })

      return NextResponse.json({ success: true, message: 'Impressora deletada com sucesso' })
    } catch (error) {
      console.error('Erro ao deletar impressora:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar impressora' },
        { status: 500 }
      )
    }
  })(request)
}
