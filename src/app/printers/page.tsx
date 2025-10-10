'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

interface PrinterConfig {
  id: string
  name: string
  type: string
  vendorId: string
  productId: string
  connected: boolean
  lastUsed: string | null
  printCount: number
  settings: any
  createdAt: string
  updatedAt: string
}

const typeLabels: Record<string, string> = {
  kitchen: 'Cozinha',
  reception: 'Recepção',
}

const typeDescriptions: Record<string, string> = {
  kitchen: 'Imprime automaticamente pedidos de Petiscos e Sucos',
  reception: 'Imprime o resumo/total da mesa manualmente',
}

const typeIcons: Record<string, string> = {
  kitchen: '🍳',
  reception: '📄',
}

export default function PrintersPage() {
  const router = useRouter()
  const { token, user, isAuthenticated, isHydrated } = useAuthStore()
  const [printers, setPrinters] = useState<PrinterConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPrinter, setEditingPrinter] = useState<PrinterConfig | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState<'kitchen' | 'reception'>('kitchen')
  const [vendorId, setVendorId] = useState('')
  const [productId, setProductId] = useState('')
  const [paperWidth, setPaperWidth] = useState('58')
  const [baudRate, setBaudRate] = useState('9600')

  useEffect(() => {
    // Aguardar hidratação do store antes de verificar autenticação
    if (!isHydrated) {
      return
    }

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Apenas DRINKS não pode acessar
    if (user && user.role === 'DRINKS') {
      router.push('/drinks')
      return
    }

    fetchPrinters()
  }, [isAuthenticated, isHydrated])

  const fetchPrinters = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/printers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        const printersData = result.data || result
        setPrinters(Array.isArray(printersData) ? printersData : [])
      } else {
        // Erro ao carregar impressoras
      }
    } catch (error) {
      // Erro ao carregar impressoras
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (printer?: PrinterConfig) => {
    if (printer) {
      setEditingPrinter(printer)
      setName(printer.name)
      setType(printer.type as 'kitchen' | 'reception')
      setVendorId(printer.vendorId)
      setProductId(printer.productId)
      setPaperWidth(printer.settings?.paperWidth || '58')
      setBaudRate(printer.settings?.baudRate || '9600')
    } else {
      setEditingPrinter(null)
      setName('')
      setType('kitchen')
      setVendorId('0x6868')
      setProductId('0x0200')
      setPaperWidth('58')
      setBaudRate('9600')
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPrinter(null)
    setName('')
    setType('kitchen')
    setVendorId('0x6868')
    setProductId('0x0200')
    setPaperWidth('58')
    setBaudRate('9600')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !vendorId || !productId) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    setSubmitting(true)

    try {
      const url = editingPrinter
        ? `/api/printers/${editingPrinter.id}`
        : '/api/printers'
      const method = editingPrinter ? 'PATCH' : 'POST'

      const body = {
        name,
        type,
        vendorId,
        productId,
        settings: {
          paperWidth: parseInt(paperWidth),
          baudRate: parseInt(baudRate),
        },
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        await fetchPrinters()
        handleCloseModal()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao salvar impressora')
      }
    } catch (error) {
      // Erro ao salvar impressora
      alert('Erro ao salvar impressora')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (printerId: string, printerName: string) => {
    if (!confirm(`Tem certeza que deseja deletar a impressora "${printerName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/printers/${printerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await fetchPrinters()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao deletar impressora')
      }
    } catch (error) {
      // Erro ao deletar impressora
      alert('Erro ao deletar impressora')
    }
  }

  const handleTestConnection = async (printerId: string) => {
    setTesting(printerId)

    try {
      const response = await fetch(`/api/printers/${printerId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (response.ok) {
        await fetchPrinters()

        if (result.success && result.connected) {
          alert(`✅ ${result.message}`)
        } else {
          alert(`⚠️ ${result.message}`)
        }
      } else {
        alert(`❌ Erro: ${result.error || result.message || 'Erro ao testar conexão'}`)
      }
    } catch (error) {
      // Erro ao testar conexão
      alert('❌ Erro ao testar conexão. Verifique o console para mais detalhes.')
    } finally {
      setTesting(null)
    }
  }

  const handleToggleConnection = async (printerId: string, currentStatus: boolean) => {
    // Se está tentando conectar, usa o teste real
    if (!currentStatus) {
      const confirmed = confirm(
        'Deseja testar a conexão com a impressora?\n\n' +
        'Isso verificará se o dispositivo USB está conectado e acessível.'
      )

      if (confirmed) {
        await handleTestConnection(printerId)
      }
      return
    }

    // Se está desconectando, apenas atualiza o status
    try {
      const response = await fetch(`/api/printers/${printerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ connected: false }),
      })

      if (response.ok) {
        await fetchPrinters()
      }
    } catch (error) {
      // Erro ao desconectar impressora
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando impressoras...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Impressoras</h1>
            <p className="text-gray-600 mt-2">Configure as impressoras térmicas do sistema</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Voltar
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Nova Impressora
            </button>
          </div>
        </div>

        {/* Informações sobre o sistema de impressão */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Como funciona o sistema de impressão</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="text-3xl">🍳</div>
              <div>
                <h3 className="font-semibold text-blue-900">Impressora Cozinha</h3>
                <p className="text-sm text-blue-800">
                  Imprime <strong>automaticamente</strong> quando o garçom adiciona produtos do tipo <strong>Petiscos</strong> ou <strong>Sucos</strong>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-3xl">📄</div>
              <div>
                <h3 className="font-semibold text-blue-900">Impressora Recepção</h3>
                <p className="text-sm text-blue-800">
                  Imprime <strong>manualmente</strong> (botão "Imprimir") o resumo/total da mesa para pagamento
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <p className="text-gray-600 text-sm font-medium">Total de Impressoras</p>
            <p className="text-2xl font-bold text-gray-900">{printers.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-600 text-sm font-medium">Conectadas</p>
            <p className="text-2xl font-bold text-green-700">
              {printers.filter(p => p.connected).length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-600 text-sm font-medium">Desconectadas</p>
            <p className="text-2xl font-bold text-red-700">
              {printers.filter(p => !p.connected).length}
            </p>
          </div>
        </div>

        {/* Printers List */}
        <div className="bg-white rounded-lg shadow">
          {printers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhuma impressora configurada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impressões</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Uso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {printers.map((printer) => (
                    <tr key={printer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{printer.name}</span>
                          <span className="text-xs text-gray-500 mt-1">
                            {typeDescriptions[printer.type]}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${
                          printer.type === 'kitchen'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          <span>{typeIcons[printer.type]}</span>
                          <span>{typeLabels[printer.type]}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {printer.vendorId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {printer.productId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleConnection(printer.id, printer.connected)}
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            printer.connected
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {printer.connected ? 'Conectada' : 'Desconectada'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {printer.printCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {printer.lastUsed
                          ? new Date(printer.lastUsed).toLocaleString('pt-BR')
                          : 'Nunca'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTestConnection(printer.id)}
                            className="text-blue-600 hover:text-blue-800"
                            disabled={testing === printer.id}
                          >
                            {testing === printer.id ? 'Testando...' : 'Testar'}
                          </button>
                          <button
                            onClick={() => handleOpenModal(printer)}
                            className="text-green-600 hover:text-green-800"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(printer.id, printer.name)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Deletar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">
                  {editingPrinter ? 'Editar Impressora' : 'Nova Impressora'}
                </h2>

                <form onSubmit={handleSubmit}>
                  {/* Nome */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Impressora Cozinha 1"
                      required
                    />
                  </div>

                  {/* Tipo */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo *
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as 'kitchen' | 'reception')}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="kitchen">Cozinha</option>
                      <option value="reception">Recepção</option>
                    </select>
                  </div>

                  {/* Vendor ID */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor ID (Identificador do Fabricante) *
                    </label>
                    <div className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed">
                      {vendorId}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Valor padrão para Knup KP-IM607: <strong>0x6868</strong>
                    </p>
                  </div>

                  {/* Product ID */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product ID (Identificador do Modelo) *
                    </label>
                    <div className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed">
                      {productId}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Valor padrão para Knup KP-IM607: <strong>0x0200</strong>
                    </p>
                  </div>

                  {/* Configurações Adicionais */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Configurações Adicionais
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Largura do Papel */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Largura do Papel (mm)
                        </label>
                        <select
                          value={paperWidth}
                          onChange={(e) => setPaperWidth(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="58">58mm</option>
                          <option value="80">80mm</option>
                        </select>
                      </div>

                      {/* Baud Rate */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Baud Rate (Velocidade de Comunicação)
                        </label>
                        <select
                          value={baudRate}
                          onChange={(e) => setBaudRate(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="9600">9600 - Padrão (recomendado)</option>
                          <option value="19200">19200 - 2x mais rápido</option>
                          <option value="38400">38400 - 4x mais rápido</option>
                          <option value="115200">115200 - Mais rápido (nem todas suportam)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Velocidade de transmissão de dados entre o sistema e a impressora (bits por segundo)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                      disabled={submitting}
                    >
                      {submitting ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
