import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET - Listar todos os garçons
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

    // Buscar todos os garçons
    const waiters = await prisma.user.findMany({
      where: {
        role: 'WAITER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: waiters
    })

  } catch (error) {
    console.error('Erro ao buscar garçons:', error)
    return NextResponse.json({
      error: 'Erro ao buscar garçons',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// POST - Criar novo garçom
export async function POST(request: NextRequest) {
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

    // Ler dados do body
    const body = await request.json()
    const { name, email, password, active } = body

    // Validações
    if (!name || !email || !password) {
      return NextResponse.json({
        error: 'Campos obrigatórios: name, email, password'
      }, { status: 400 })
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({
        error: 'Este email já está cadastrado'
      }, { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar garçom
    const waiter = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'WAITER',
        active: active !== undefined ? active : true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: waiter,
      message: 'Garçom criado com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar garçom:', error)
    return NextResponse.json({
      error: 'Erro ao criar garçom',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
