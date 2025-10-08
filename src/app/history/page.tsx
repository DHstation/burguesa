'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

interface OrderItem {
  id: string
  quantity: number
  price: number
  observations?: string
  product: {
    id: string
    name: string
    category: string
  }
}

interface Order {
  id: string
  status: string
  total: number
  serviceCharge: number
  finalTotal: number
  printed: boolean
  createdAt: string
  table: {
    id: string
    number: number
  }
  waiter: {
    id: string
    name: string
  }
  items: OrderItem[]
}

export default function HistoryPage() {
  const router = useRouter()
  const { user, token, isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedWaiter, setSelectedWaiter] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [waiters, setWaiters] = useState<Array<{id: string, name: string}>>([])

  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageTicket: 0,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user?.role !== 'RECEPTIONIST') {
      router.push('/dashboard')
      return
    }

    fetchOrders()
    fetchWaiters()
  }, [isAuthenticated, user, router])

  useEffect(() => {
    applyFilters()
  }, [orders, startDate, endDate, selectedWaiter, selectedStatus])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/history/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWaiters = async () => {
    try {
      const response = await fetch('/api/waiters', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWaiters(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar garçons:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...orders]

    // Filtro por data inicial
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      filtered = filtered.filter(order => new Date(order.createdAt) >= start)
    }

    // Filtro por data final
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter(order => new Date(order.createdAt) <= end)
    }

    // Filtro por garçom
    if (selectedWaiter) {
      filtered = filtered.filter(order => order.waiter.id === selectedWaiter)
    }

    // Filtro por status
    if (selectedStatus) {
      filtered = filtered.filter(order => order.status === selectedStatus)
    }

    setFilteredOrders(filtered)

    // Calcular estatísticas
    const totalRevenue = filtered.reduce((sum, order) => {
      return order.status !== 'CANCELLED' ? sum + order.finalTotal : sum
    }, 0)

    const validOrders = filtered.filter(order => order.status !== 'CANCELLED')

    setStats({
      totalOrders: filtered.length,
      totalRevenue,
      averageTicket: validOrders.length > 0 ? totalRevenue / validOrders.length : 0,
    })
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedWaiter('')
    setSelectedStatus('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800'
      case 'READY':
        return 'bg-green-100 text-green-800'
      case 'DELIVERED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDING': 'Pendente',
      'PREPARING': 'Preparando',
      'READY': 'Pronto',
      'DELIVERED': 'Entregue',
      'CANCELLED': 'Cancelado',
    }
    return statusMap[status] || status
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Voltar
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">📈 Histórico e Relatórios</h1>
                <p className="text-sm text-gray-600">
                  Visualize e analise o histórico de pedidos
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <span className="text-white text-2xl">📋</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total de Pedidos</dt>
                  <dd className="text-3xl font-bold text-gray-900">{stats.totalOrders}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <span className="text-white text-2xl">💰</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Receita Total</dt>
                  <dd className="text-3xl font-bold text-gray-900">R$ {stats.totalRevenue.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <span className="text-white text-2xl">📊</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ticket Médio</dt>
                  <dd className="text-3xl font-bold text-gray-900">R$ {stats.averageTicket.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Garçom
              </label>
              <select
                value={selectedWaiter}
                onChange={(e) => setSelectedWaiter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {waiters.map(waiter => (
                  <option key={waiter.id} value={waiter.id}>{waiter.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="PENDING">Pendente</option>
                <option value="PREPARING">Preparando</option>
                <option value="READY">Pronto</option>
                <option value="DELIVERED">Entregue</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Tabela de Pedidos */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Carregando...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum pedido encontrado</h2>
            <p className="text-gray-600">
              {orders.length === 0
                ? 'Não há pedidos no histórico'
                : 'Tente ajustar os filtros'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mesa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Garçom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Itens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Mesa {order.table.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.waiter.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="max-w-xs">
                        {order.items.map((item, idx) => (
                          <div key={item.id}>
                            {item.quantity}x {item.product.name}
                            {idx < order.items.length - 1 && ', '}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      R$ {order.finalTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
