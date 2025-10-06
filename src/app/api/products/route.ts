import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET - Listar produtos
export async function GET(request: NextRequest) {
  return requireAuth(async () => {
    try {
      const { searchParams } = new URL(request.url)
      const category = searchParams.get('category')
      const active = searchParams.get('active')
      const search = searchParams.get('search')

      const where: any = {}

      if (category) {
        where.category = category
      }

      if (active !== null) {
        where.active = active === 'true'
      }

      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive'
        }
      }

      const products = await prisma.product.findMany({
        where,
        orderBy: {
          name: 'asc'
        }
      })

      return NextResponse.json({ success: true, data: products })
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar produtos' },
        { status: 500 }
      )
    }
  })(request)
}

// POST - Criar produto (apenas recepcionista)
export async function POST(request: NextRequest) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem criar produtos' },
          { status: 403 }
        )
      }

      const { name, description, price, category, imageUrl } = await req.json()

      if (!name || !price || !category) {
        return NextResponse.json(
          { error: 'Nome, preço e categoria são obrigatórios' },
          { status: 400 }
        )
      }

      const product = await prisma.product.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          category,
          imageUrl,
          active: true
        }
      })

      return NextResponse.json({ success: true, data: product })
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      return NextResponse.json(
        { error: 'Erro ao criar produto' },
        { status: 500 }
      )
    }
  })(request)
}
