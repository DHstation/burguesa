import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import fs from 'fs'

// GET /api/printers/available-paths - Lista todos os device paths disponíveis
export async function GET(request: NextRequest) {
  return requireAuth(async (_req: NextRequest, user: any) => {
    try {
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem listar device paths' },
          { status: 403 }
        )
      }

      const possiblePaths = [
        '/dev/usb/lp0',
        '/dev/usb/lp1',
        '/dev/usb/lp2',
        '/dev/usb/lp3',
        '/dev/lp0',
        '/dev/lp1',
        '/dev/lp2',
        '/dev/lp3',
      ]

      const availablePaths = possiblePaths.filter(path => {
        try {
          return fs.existsSync(path)
        } catch {
          return false
        }
      })

      return NextResponse.json({
        success: true,
        paths: availablePaths,
        count: availablePaths.length,
      })
    } catch (error) {
      console.error('Erro ao listar device paths:', error)
      return NextResponse.json(
        { error: 'Erro ao listar device paths' },
        { status: 500 }
      )
    }
  })(request)
}
