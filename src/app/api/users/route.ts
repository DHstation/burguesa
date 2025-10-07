import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET /api/users - Lista usuários
export async function GET(request: NextRequest) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      // Apenas recepcionistas podem listar usuários
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Sem permissão para listar usuários' },
          { status: 403 }
        )
      }

      const { searchParams } = new URL(req.url)
      const role = searchParams.get('role')

      const where: any = { active: true }

      if (role) {
        where.role = role
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
        },
        orderBy: {
          name: 'asc',
        },
      })

      return NextResponse.json({ success: true, data: users })
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar usuários' },
        { status: 500 }
      )
    }
  })(request)
}
