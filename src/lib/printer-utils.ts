/**
 * Utilitários para gerenciamento de impressoras USB
 */

import fs from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Descobre o devicePath (/dev/usb/lpX) para uma impressora USB
 * baseado em vendorId e productId
 */
export async function findDevicePath(vendorId: string, productId: string): Promise<string | null> {
  try {
    // Converte IDs hex para números
    const vendorIdNum = parseInt(vendorId, 16)
    const productIdNum = parseInt(productId, 16)

    // Tenta encontrar o dispositivo usando lsusb
    const { stdout } = await execAsync('lsusb')
    const lines = stdout.split('\n')

    // Procura pela linha que contém os IDs
    const vendorHex = vendorIdNum.toString(16).padStart(4, '0')
    const productHex = productIdNum.toString(16).padStart(4, '0')
    const searchPattern = `${vendorHex}:${productHex}`

    const deviceLine = lines.find(line => line.toLowerCase().includes(searchPattern.toLowerCase()))

    if (!deviceLine) {
      console.log(`Dispositivo ${vendorId}:${productId} não encontrado no lsusb`)
      return null
    }

    // Extrai o Bus e Device number
    const match = deviceLine.match(/Bus (\d+) Device (\d+):/)
    if (!match) {
      console.log('Não foi possível extrair Bus e Device number')
      return null
    }

    const [, bus, device] = match

    // Tenta diferentes caminhos comuns para impressoras USB
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

    // Verifica qual dispositivo existe e é acessível
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        try {
          // Tenta abrir para teste (só leitura)
          const fd = fs.openSync(path, 'r')
          fs.closeSync(fd)

          // Se conseguiu abrir, provavelmente é este dispositivo
          console.log(`Dispositivo USB encontrado em: ${path}`)
          return path
        } catch (err) {
          // Não conseguiu abrir, pode ser permissão ou dispositivo ocupado
          // Mas ainda pode ser o dispositivo correto
          console.log(`Dispositivo ${path} existe mas não foi possível abrir (pode estar em uso)`)
          return path
        }
      }
    }

    console.log('Nenhum device path válido encontrado')
    return null
  } catch (error) {
    console.error('Erro ao procurar device path:', error)
    return null
  }
}

/**
 * Verifica se um dispositivo USB está conectado
 */
export async function isUsbDeviceConnected(vendorId: string, productId: string): Promise<boolean> {
  try {
    const USB = require('usb')
    const vendorIdNum = parseInt(vendorId, 16)
    const productIdNum = parseInt(productId, 16)

    const device = USB.findByIds(vendorIdNum, productIdNum)
    return device !== undefined
  } catch (error) {
    console.error('Erro ao verificar dispositivo USB:', error)
    return false
  }
}

/**
 * Testa se é possível escrever em um device path
 */
export function canWriteToDevice(devicePath: string): boolean {
  try {
    if (!fs.existsSync(devicePath)) {
      return false
    }

    // Tenta abrir para escrita
    const fd = fs.openSync(devicePath, 'w')
    fs.closeSync(fd)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Lista todos os dispositivos USB conectados
 */
export async function listUsbDevices(): Promise<Array<{
  vendorId: string
  productId: string
  busNumber: number
  deviceAddress: number
}>> {
  try {
    const USB = require('usb')
    const devices = USB.getDeviceList()

    return devices.map((device: any) => {
      const descriptor = device.deviceDescriptor
      return {
        vendorId: `0x${descriptor.idVendor.toString(16).padStart(4, '0')}`,
        productId: `0x${descriptor.idProduct.toString(16).padStart(4, '0')}`,
        busNumber: device.busNumber,
        deviceAddress: device.deviceAddress,
      }
    })
  } catch (error) {
    console.error('Erro ao listar dispositivos USB:', error)
    return []
  }
}
