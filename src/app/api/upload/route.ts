import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem fazer upload de imagens' },
          { status: 403 }
        )
      }

      const formData = await req.formData()
      const file = formData.get('image') as File

      if (!file) {
        return NextResponse.json(
          { error: 'Nenhuma imagem foi enviada' },
          { status: 400 }
        )
      }

      // Validar tipo de arquivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Tipo de arquivo inválido. Use JPG, PNG ou WEBP' },
          { status: 400 }
        )
      }

      // Validar tamanho (5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'Arquivo muito grande. Tamanho máximo: 5MB' },
          { status: 400 }
        )
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()
      const filename = `product-${timestamp}.${extension}`

      // Converter File para Buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Salvar arquivo
      const path = join(process.cwd(), 'public', 'uploads', filename)
      await writeFile(path, buffer)

      // Retornar URL
      const url = `/uploads/${filename}`

      return NextResponse.json({
        success: true,
        url,
        filename
      })
    } catch (error: any) {
      console.error('Erro no upload:', error)
      return NextResponse.json(
        { error: 'Erro ao fazer upload da imagem', details: error.message },
        { status: 500 }
      )
    }
  })(request)
}
