/**
 * Funções auxiliares para impressão
 */

import fs from 'fs'
import { prisma } from '@/lib/prisma'

// Códigos ESC/POS
const ESC = '\x1B'
const GS = '\x1D'

// Comandos ESC/POS
const CMD = {
  INIT: ESC + '@',                    // Inicializar impressora
  ALIGN_CENTER: ESC + 'a' + '1',      // Alinhar centro
  ALIGN_LEFT: ESC + 'a' + '0',        // Alinhar esquerda
  BOLD_ON: ESC + 'E' + '\x01',        // Negrito on
  BOLD_OFF: ESC + 'E' + '\x00',       // Negrito off
  SIZE_NORMAL: GS + '!' + '\x00',     // Tamanho normal
  SIZE_DOUBLE: GS + '!' + '\x11',     // Tamanho duplo (altura e largura)
  SIZE_DOUBLE_HEIGHT: GS + '!' + '\x01', // Tamanho duplo altura
  CUT: GS + 'V' + '\x00',             // Cortar papel
  LINE: '--------------------------------\n',
}

interface OrderItem {
  id: string
  quantity: number
  price: number
  observations: string | null
  product: {
    id: string
    name: string
    category: string
  }
}

interface Order {
  id: string
  total: number
  createdAt: Date
  table: {
    number: number
  }
  waiter: {
    name: string
  }
  items: OrderItem[]
}

/**
 * Imprime automaticamente pedidos da cozinha (apenas PETISCOS e SUCOS)
 */
export async function autoPrintKitchenOrder(order: Order): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Busca impressora da cozinha conectada
    const printer = await prisma.printerConfig.findFirst({
      where: {
        type: 'kitchen',
        connected: true,
      },
    })

    if (!printer) {
      return {
        success: false,
        message: 'Impressora da cozinha não está conectada',
      }
    }

    if (!printer.devicePath) {
      return {
        success: false,
        message: 'Impressora da cozinha não tem devicePath configurado',
      }
    }

    // Filtra apenas itens de PETISCOS e SUCOS
    const kitchenItems = order.items.filter(item =>
      item.product.category === 'PETISCOS' || item.product.category === 'SUCOS'
    )

    if (kitchenItems.length === 0) {
      return {
        success: true,
        message: 'Nenhum item de cozinha para imprimir',
      }
    }

    // Verifica se o dispositivo existe
    if (!fs.existsSync(printer.devicePath)) {
      return {
        success: false,
        message: `Dispositivo ${printer.devicePath} não encontrado`,
      }
    }

    // Construir comando ESC/POS
    let escposData = ''

    // Inicializar
    escposData += CMD.INIT

    // Cabeçalho centralizado
    escposData += CMD.ALIGN_CENTER
    escposData += CMD.SIZE_DOUBLE
    escposData += CMD.BOLD_ON
    escposData += 'PEDIDO COZINHA\n'
    escposData += CMD.BOLD_OFF
    escposData += CMD.SIZE_NORMAL
    escposData += '\n'

    escposData += CMD.LINE

    // Informações do pedido (alinhado à esquerda)
    escposData += CMD.ALIGN_LEFT
    escposData += CMD.BOLD_ON
    escposData += `Mesa: ${order.table.number}\n`
    escposData += CMD.BOLD_OFF
    escposData += `Garcom: ${order.waiter.name}\n`
    escposData += `Hora: ${new Date(order.createdAt).toLocaleTimeString('pt-BR')}\n`
    escposData += '\n'

    escposData += CMD.LINE
    escposData += CMD.BOLD_ON
    escposData += 'ITENS:\n'
    escposData += CMD.BOLD_OFF
    escposData += CMD.LINE

    // Itens do pedido
    kitchenItems.forEach((item) => {
      escposData += CMD.SIZE_DOUBLE_HEIGHT
      escposData += CMD.BOLD_ON
      escposData += `${item.quantity}x ${item.product.name}\n`
      escposData += CMD.BOLD_OFF
      escposData += CMD.SIZE_NORMAL

      if (item.observations) {
        escposData += `   ${CMD.BOLD_ON}OBS:${CMD.BOLD_OFF} ${item.observations}\n`
      }

      escposData += '\n'
    })

    escposData += CMD.LINE
    escposData += '\n\n\n'

    // Cortar papel
    escposData += CMD.CUT

    // Escrever no dispositivo de impressora
    try {
      fs.writeFileSync(printer.devicePath, escposData, { encoding: 'binary' })

      // Atualizar contador de impressões
      await prisma.printerConfig.update({
        where: { id: printer.id },
        data: {
          printCount: { increment: 1 },
          lastUsed: new Date(),
        },
      })

      return {
        success: true,
        message: `${kitchenItems.length} item(ns) impresso(s) na cozinha`,
      }
    } catch (writeError) {
      console.error('Erro ao escrever no dispositivo:', writeError)
      return {
        success: false,
        message: 'Erro ao enviar dados para impressora',
      }
    }
  } catch (error) {
    console.error('Erro ao imprimir pedido da cozinha:', error)
    return {
      success: false,
      message: 'Erro ao processar impressão',
    }
  }
}

/**
 * Imprime resumo da mesa na recepção
 */
export async function printTableSummary(tableId: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Busca impressora da recepção conectada
    const printer = await prisma.printerConfig.findFirst({
      where: {
        type: 'reception',
        connected: true,
      },
    })

    if (!printer) {
      return {
        success: false,
        message: 'Impressora da recepção não está conectada',
      }
    }

    if (!printer.devicePath) {
      return {
        success: false,
        message: 'Impressora da recepção não tem devicePath configurado',
      }
    }

    // Buscar mesa com todos os pedidos
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        orders: {
          where: {
            status: {
              not: 'CANCELLED',
            },
          },
          include: {
            items: {
              where: {
                cancelled: false,
              },
              include: {
                product: true,
              },
            },
            waiter: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        waiter: true,
        tableWaiters: {
          include: {
            waiter: true,
          },
          orderBy: {
            assignedAt: 'asc',
          },
        },
      },
    })

    if (!table) {
      return {
        success: false,
        message: 'Mesa não encontrada',
      }
    }

    // Verifica se o dispositivo existe
    if (!fs.existsSync(printer.devicePath)) {
      return {
        success: false,
        message: `Dispositivo ${printer.devicePath} não encontrado`,
      }
    }

    // Construir comando ESC/POS
    let escposData = ''

    // Inicializar
    escposData += CMD.INIT

    // Cabeçalho
    escposData += CMD.ALIGN_CENTER
    escposData += CMD.SIZE_DOUBLE
    escposData += CMD.BOLD_ON
    escposData += 'RESUMO DA MESA\n'
    escposData += CMD.BOLD_OFF
    escposData += CMD.SIZE_NORMAL
    escposData += '\n'

    escposData += CMD.LINE
    escposData += CMD.LINE

    // Informações da mesa
    escposData += CMD.ALIGN_LEFT
    escposData += CMD.SIZE_DOUBLE_HEIGHT
    escposData += CMD.BOLD_ON
    escposData += `Mesa: ${table.number}\n`
    escposData += CMD.BOLD_OFF
    escposData += CMD.SIZE_NORMAL

    // Garçons
    if (table.tableWaiters && table.tableWaiters.length > 0) {
      if (table.tableWaiters.length === 1) {
        escposData += `Garcom: ${table.tableWaiters[0].waiter.name}\n`
      } else {
        escposData += `Garcons:\n`
        table.tableWaiters.forEach(tw => {
          escposData += `  - ${tw.waiter.name}\n`
        })
      }
    }

    escposData += '\n'
    escposData += CMD.LINE

    // Agrupador de itens (consolidar todos os pedidos)
    const itemsMap = new Map<string, {
      name: string
      quantity: number
      price: number
      total: number
    }>()

    table.orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = `${item.productId}-${item.price}`
        if (itemsMap.has(key)) {
          const existing = itemsMap.get(key)!
          existing.quantity += item.quantity
          existing.total += item.price * item.quantity
        } else {
          itemsMap.set(key, {
            name: item.product.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
          })
        }
      })
    })

    // Imprimir itens consolidados
    escposData += CMD.BOLD_ON
    escposData += 'CONSUMO:\n'
    escposData += CMD.BOLD_OFF
    escposData += CMD.LINE

    let subtotal = 0
    itemsMap.forEach((item) => {
      escposData += `${item.quantity}x ${item.name}\n`
      escposData += `   R$ ${item.price.toFixed(2)} x ${item.quantity}\n`
      escposData += `   Subtotal: R$ ${item.total.toFixed(2)}\n`
      escposData += '\n'
      subtotal += item.total
    })

    // Calcular taxas de serviço total
    let totalServiceCharge = 0
    table.orders.forEach((order) => {
      totalServiceCharge += order.serviceCharge
    })

    // Totais
    escposData += CMD.LINE
    escposData += CMD.LINE
    escposData += `Subtotal: R$ ${subtotal.toFixed(2)}\n`

    if (totalServiceCharge > 0) {
      escposData += `Taxa Servico (10%): R$ ${totalServiceCharge.toFixed(2)}\n`
    }

    escposData += CMD.LINE
    escposData += '\n'

    escposData += CMD.ALIGN_CENTER
    escposData += CMD.BOLD_ON
    escposData += CMD.SIZE_DOUBLE
    escposData += `TOTAL: R$ ${table.currentTotal.toFixed(2)}\n`
    escposData += CMD.SIZE_NORMAL
    escposData += CMD.BOLD_OFF

    escposData += '\n'
    escposData += CMD.ALIGN_LEFT
    escposData += CMD.LINE
    escposData += CMD.LINE
    escposData += '\n'

    // Informações adicionais
    escposData += CMD.ALIGN_CENTER
    escposData += `Total de pedidos: ${table.orders.length}\n`
    escposData += `Total de itens: ${Array.from(itemsMap.values()).reduce((sum, item) => sum + item.quantity, 0)}\n`

    escposData += '\n'
    escposData += 'Obrigado pela preferencia!\n'
    escposData += 'Volte sempre!\n'
    escposData += '\n\n\n'

    // Cortar papel
    escposData += CMD.CUT

    // Escrever no dispositivo
    try {
      fs.writeFileSync(printer.devicePath, escposData, { encoding: 'binary' })

      // Atualizar contador de impressões
      await prisma.printerConfig.update({
        where: { id: printer.id },
        data: {
          printCount: { increment: 1 },
          lastUsed: new Date(),
        },
      })

      return {
        success: true,
        message: 'Resumo da mesa impresso com sucesso',
      }
    } catch (writeError) {
      console.error('Erro ao escrever no dispositivo:', writeError)
      return {
        success: false,
        message: 'Erro ao enviar dados para impressora',
      }
    }
  } catch (error) {
    console.error('Erro ao imprimir resumo da mesa:', error)
    return {
      success: false,
      message: 'Erro ao processar impressão',
    }
  }
}
