import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET - Buscar produto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async () => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: params.id }
      })

      if (!product) {
        return NextResponse.json(
          { error: 'Produto não encontrado' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data: product })
    } catch (error) {
      console.error('Erro ao buscar produto:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar produto' },
        { status: 500 }
      )
    }
  })(request)
}

// PATCH - Atualizar produto (apenas recepcionista)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem atualizar produtos' },
          { status: 403 }
        )
      }

      const data = await req.json()

      // Se price está presente, converte para float
      if (data.price !== undefined) {
        data.price = parseFloat(data.price)
      }

      const product = await prisma.product.update({
        where: { id: params.id },
        data
      })

      return NextResponse.json({ success: true, data: product })
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar produto' },
        { status: 500 }
      )
    }
  })(request)
}

// DELETE - Remover produto (apenas recepcionista)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem remover produtos' },
          { status: 403 }
        )
      }

      await prisma.product.delete({
        where: { id: params.id }
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Erro ao remover produto:', error)
      return NextResponse.json(
        { error: 'Erro ao remover produto' },
        { status: 500 }
      )
    }
  })(request)
}
