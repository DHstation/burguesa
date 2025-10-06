import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Testa conexão com banco
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'ok',
      message: 'Sistema funcionando',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Erro no health check:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Erro ao conectar com banco de dados',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
