import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

// GET /api/printers/devices - Lista dispositivos USB disponíveis
export async function GET(request: NextRequest) {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      if (user.role !== 'RECEPTIONIST') {
        return NextResponse.json(
          { error: 'Apenas recepcionistas podem listar dispositivos USB' },
          { status: 403 }
        )
      }

      // Verifica se estamos no servidor
      if (typeof window !== 'undefined') {
        return NextResponse.json(
          { error: 'Listagem de USB só pode ser feita no servidor' },
          { status: 400 }
        )
      }

      try {
        const USB = require('usb')

        // Lista todos os dispositivos USB conectados
        const devices = USB.getDeviceList()

        const deviceList = devices.map((device: any) => {
          const descriptor = device.deviceDescriptor

          return {
            vendorId: `0x${descriptor.idVendor.toString(16).padStart(4, '0')}`,
            productId: `0x${descriptor.idProduct.toString(16).padStart(4, '0')}`,
            manufacturer: device.manufacturer || 'Desconhecido',
            product: device.product || 'Desconhecido',
            serialNumber: device.serialNumber || 'N/A',
          }
        })

        return NextResponse.json({
          success: true,
          count: deviceList.length,
          devices: deviceList,
        })
      } catch (usbError: any) {
        return NextResponse.json({
          success: false,
          error: `Erro ao listar dispositivos USB: ${usbError.message}`,
        }, { status: 500 })
      }
    } catch (error) {
      console.error('Erro ao listar dispositivos USB:', error)
      return NextResponse.json(
        { error: 'Erro ao listar dispositivos USB' },
        { status: 500 }
      )
    }
  })(request)
}
