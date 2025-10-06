// API de login
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Valida campos
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Verifica senha
    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Verifica se o usuário está ativo
    if (!user.active) {
      return NextResponse.json(
        { error: 'Usuário inativo' },
        { status: 403 }
      )
    }

    // Gera token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Remove senha da resposta
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      token,
    })
  } catch (error: any) {
    console.error('Erro no login:', error)

    // Mensagem de erro mais específica
    let errorMessage = 'Erro interno no servidor'

    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      errorMessage = 'Banco de dados não configurado. Execute: npm run prisma:migrate'
    } else if (error.message?.includes('connect')) {
      errorMessage = 'Não foi possível conectar ao banco de dados. Verifique se PostgreSQL está rodando.'
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
