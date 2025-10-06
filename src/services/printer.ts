// Serviço de impressão térmica ESC/POS
import escpos from 'escpos'
import USB from 'usb'
import { Order, OrderItem, Table, User } from '@/types'
import { format } from 'date-fns'

// Tipo para configuração da impressora
interface PrinterDevice {
  type: 'kitchen' | 'reception'
  vendorId: number
  productId: number
}

/**
 * Classe para gerenciar impressoras térmicas
 */
export class ThermalPrinter {
  private device: USB.usb.Device | null = null
  private printer: any = null
  private config: PrinterDevice

  constructor(config: PrinterDevice) {
    this.config = config
  }

  /**
   * Conecta à impressora USB
   */
  async connect(): Promise<boolean> {
    try {
      // Encontra o dispositivo USB
      this.device = USB.findByIds(this.config.vendorId, this.config.productId)

      if (!this.device) {
        console.error(`Impressora ${this.config.type} não encontrada`)
        return false
      }

      // Configura o dispositivo ESC/POS
      this.device.open()
      const usbInterface = this.device.interface(0)

      // Detach kernel driver if active (Linux)
      if (usbInterface.isKernelDriverActive()) {
        usbInterface.detachKernelDriver()
      }

      usbInterface.claim()

      // Cria a impressora ESC/POS
      const usbAdapter = new escpos.USB(this.device)
      this.printer = new escpos.Printer(usbAdapter)

      console.log(`Impressora ${this.config.type} conectada com sucesso`)
      return true
    } catch (error) {
      console.error(`Erro ao conectar impressora ${this.config.type}:`, error)
      return false
    }
  }

  /**
   * Desconecta da impressora
   */
  disconnect(): void {
    if (this.device) {
      try {
        this.device.close()
        this.device = null
        this.printer = null
      } catch (error) {
        console.error('Erro ao desconectar impressora:', error)
      }
    }
  }

  /**
   * Imprime pedido para a cozinha
   */
  async printKitchenOrder(order: Order, table: Table, waiter: User, items: OrderItem[]): Promise<boolean> {
    if (!this.printer) {
      console.error('Impressora não conectada')
      return false
    }

    try {
      await new Promise<void>((resolve, reject) => {
        this.printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(1, 1)
          .text('====== PEDIDO COZINHA ======')
          .style('normal')
          .text('')
          .align('lt')
          .text(`Mesa: ${table.number}`)
          .text(`Garcom: ${waiter.name}`)
          .text(`Data/Hora: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`)
          .text('---------------------------')
          .text('')

        // Imprime cada item
        items.forEach(item => {
          const productName = item.product?.name || 'Produto'
          const price = item.price.toFixed(2)
          const line = `${productName}`.padEnd(20) + `R$ ${price}`

          this.printer.text(line)
          this.printer.text(`  Qtd: ${item.quantity}`)

          if (item.observations) {
            this.printer.text(`  Obs: ${item.observations}`)
          }

          this.printer.text('')
        })

        this.printer
          .text('---------------------------')
          .text(`TOTAL:            R$ ${order.total.toFixed(2)}`)
          .text('============================')
          .text('')
          .text('')
          .cut()
          .close(() => resolve(), (err: any) => reject(err))
      })

      return true
    } catch (error) {
      console.error('Erro ao imprimir pedido da cozinha:', error)
      return false
    }
  }

  /**
   * Imprime cancelamento de item
   */
  async printCancellation(
    item: OrderItem,
    table: Table,
    waiter: User,
    reason?: string
  ): Promise<boolean> {
    if (!this.printer) {
      console.error('Impressora não conectada')
      return false
    }

    try {
      await new Promise<void>((resolve, reject) => {
        this.printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(1, 1)
          .text('===== CANCELAMENTO =====')
          .style('normal')
          .text('')
          .align('lt')
          .text(`Mesa: ${table.number}`)
          .text(`Garcom: ${waiter.name}`)
          .text(`Data/Hora: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`)
          .text('-----------------------')
          .text('')
          .text('X ITEM CANCELADO:')

        const productName = item.product?.name || 'Produto'
        const price = item.price.toFixed(2)
        const line = `${productName}`.padEnd(20) + `R$ ${price}`

        this.printer.text(line)
        this.printer.text(`Qtd: ${item.quantity}`)

        if (reason) {
          this.printer.text(`Motivo: ${reason}`)
        }

        this.printer
          .text('=======================')
          .text('')
          .text('')
          .cut()
          .close(() => resolve(), (err: any) => reject(err))
      })

      return true
    } catch (error) {
      console.error('Erro ao imprimir cancelamento:', error)
      return false
    }
  }

  /**
   * Imprime nota fiscal
   */
  async printInvoice(order: Order, table: Table, waiter: User, items: OrderItem[]): Promise<boolean> {
    if (!this.printer) {
      console.error('Impressora não conectada')
      return false
    }

    try {
      await new Promise<void>((resolve, reject) => {
        this.printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(1, 1)
          .text('================================')
          .text('        NOTA FISCAL')
          .text('================================')
          .style('normal')
          .text('')
          .align('lt')
          .text(`Mesa: ${table.number}`)
          .text(`Data/Hora: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`)
          .text(`Garcom: ${waiter.name}`)
          .text('--------------------------------')
          .text('')

        // Imprime cada item
        items.forEach(item => {
          const productName = item.product?.name || 'Produto'
          const price = (item.price * item.quantity).toFixed(2)
          const line = `${productName.substring(0, 15).padEnd(15)} Qtd ${item.quantity}  R$ ${price}`

          this.printer.text(line)
        })

        const subtotal = order.total.toFixed(2)
        const serviceCharge = order.serviceCharge.toFixed(2)
        const finalTotal = order.finalTotal.toFixed(2)

        this.printer
          .text('')
          .text('--------------------------------')
          .text(`SUBTOTAL:              R$ ${subtotal}`)
          .text(`Taxa Servico (10%):     R$ ${serviceCharge}`)
          .text('--------------------------------')
          .style('bu')
          .text(`TOTAL:                 R$ ${finalTotal}`)
          .style('normal')
          .text('================================')
          .align('ct')
          .text('     Obrigado pela preferencia!')
          .text('================================')
          .text('')
          .text('')
          .cut()
          .close(() => resolve(), (err: any) => reject(err))
      })

      return true
    } catch (error) {
      console.error('Erro ao imprimir nota fiscal:', error)
      return false
    }
  }

  /**
   * Imprime teste
   */
  async printTest(): Promise<boolean> {
    if (!this.printer) {
      console.error('Impressora não conectada')
      return false
    }

    try {
      await new Promise<void>((resolve, reject) => {
        this.printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(1, 1)
          .text('TESTE DE IMPRESSAO')
          .style('normal')
          .text('')
          .text(`Impressora: ${this.config.type}`)
          .text(`Data/Hora: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`)
          .text('')
          .text('Impressora funcionando corretamente!')
          .text('')
          .text('')
          .cut()
          .close(() => resolve(), (err: any) => reject(err))
      })

      return true
    } catch (error) {
      console.error('Erro ao imprimir teste:', error)
      return false
    }
  }
}

// Instâncias das impressoras
let kitchenPrinter: ThermalPrinter | null = null
let receptionPrinter: ThermalPrinter | null = null

/**
 * Inicializa as impressoras
 */
export async function initPrinters(): Promise<void> {
  const kitchenVendorId = parseInt(process.env.KITCHEN_PRINTER_VENDOR_ID || '0x0483', 16)
  const kitchenProductId = parseInt(process.env.KITCHEN_PRINTER_PRODUCT_ID || '0x070b', 16)
  const receptionVendorId = parseInt(process.env.RECEPTION_PRINTER_VENDOR_ID || '0x0483', 16)
  const receptionProductId = parseInt(process.env.RECEPTION_PRINTER_PRODUCT_ID || '0x070c', 16)

  kitchenPrinter = new ThermalPrinter({
    type: 'kitchen',
    vendorId: kitchenVendorId,
    productId: kitchenProductId,
  })

  receptionPrinter = new ThermalPrinter({
    type: 'reception',
    vendorId: receptionVendorId,
    productId: receptionProductId,
  })

  await kitchenPrinter.connect()
  await receptionPrinter.connect()
}

/**
 * Obtém a impressora da cozinha
 */
export function getKitchenPrinter(): ThermalPrinter | null {
  return kitchenPrinter
}

/**
 * Obtém a impressora da recepção
 */
export function getReceptionPrinter(): ThermalPrinter | null {
  return receptionPrinter
}
