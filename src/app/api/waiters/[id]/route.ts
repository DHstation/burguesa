import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET - Buscar garçom específico
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params
    const waiterId = params.id

    // Buscar garçom
    const waiter = await prisma.user.findUnique({
      where: {
        id: waiterId,
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
      }
    })

    if (!waiter) {
      return NextResponse.json({ error: 'Garçom não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: waiter
    })

  } catch (error) {
    console.error('Erro ao buscar garçom:', error)
    return NextResponse.json({
      error: 'Erro ao buscar garçom',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// PUT - Atualizar garçom
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params
    const waiterId = params.id

    // Ler dados do body
    const body = await request.json()
    const { name, email, password, active } = body

    // Validações
    if (!name || !email) {
      return NextResponse.json({
        error: 'Campos obrigatórios: name, email'
      }, { status: 400 })
    }

    // Verificar se garçom existe
    const existingWaiter = await prisma.user.findUnique({
      where: { id: waiterId }
    })

    if (!existingWaiter || existingWaiter.role !== 'WAITER') {
      return NextResponse.json({ error: 'Garçom não encontrado' }, { status: 404 })
    }

    // Verificar se email já está em uso por outro usuário
    if (email !== existingWaiter.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email }
      })

      if (emailInUse) {
        return NextResponse.json({
          error: 'Este email já está cadastrado'
        }, { status: 400 })
      }
    }

    // Preparar dados para atualização
    const updateData: any = {
      name,
      email,
      active: active !== undefined ? active : existingWaiter.active,
    }

    // Se senha foi fornecida, fazer hash
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Atualizar garçom
    const waiter = await prisma.user.update({
      where: { id: waiterId },
      data: updateData,
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
      message: 'Garçom atualizado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar garçom:', error)
    return NextResponse.json({
      error: 'Erro ao atualizar garçom',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// DELETE - Excluir garçom
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params
    const waiterId = params.id

    // Verificar se garçom existe
    const existingWaiter = await prisma.user.findUnique({
      where: { id: waiterId }
    })

    if (!existingWaiter || existingWaiter.role !== 'WAITER') {
      return NextResponse.json({ error: 'Garçom não encontrado' }, { status: 404 })
    }

    // Verificar se garçom tem mesas atribuídas
    const tablesCount = await prisma.table.count({
      where: { waiterId: waiterId }
    })

    if (tablesCount > 0) {
      return NextResponse.json({
        error: 'Não é possível excluir garçom com mesas atribuídas',
        details: `Este garçom possui ${tablesCount} mesa(s) atribuída(s)`
      }, { status: 400 })
    }

    // Excluir garçom
    await prisma.user.delete({
      where: { id: waiterId }
    })

    return NextResponse.json({
      success: true,
      message: 'Garçom excluído com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir garçom:', error)
    return NextResponse.json({
      error: 'Erro ao excluir garçom',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
