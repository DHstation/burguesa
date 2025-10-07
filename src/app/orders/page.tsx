'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  observations?: string
  cancelled: boolean
  product: {
    id: string
    name: string
    category: string
  }
}

interface Order {
  id: string
  tableId: string
  waiterId: string
  status: OrderStatus
  total: number
  serviceCharge: number
  finalTotal: number
  printed: boolean
  createdAt: string
  table: {
    id: string
    number: number
    status: string
  }
  waiter: {
    id: string
    name: string
    email: string
  }
  items: OrderItem[]
}

interface Product {
  id: string
  name: string
  price: number
  category: string
  active: boolean
}

interface Table {
  id: string
  number: number
  status: string
}

const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PREPARING: 'bg-blue-100 text-blue-800',
  READY: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  PREPARING: 'Preparando',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
}

export default function OrdersPage() {
  const router = useRouter()
  const { token, user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [waiters, setWaiters] = useState<{ id: string; name: string }[]>([])

  // Filter state
  const [filterTableId, setFilterTableId] = useState('')
  const [filterWaiterId, setFilterWaiterId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')

  // Form state
  const [selectedTableId, setSelectedTableId] = useState('')
  const [selectedItems, setSelectedItems] = useState<{
    productId: string
    quantity: number
    observations: string
  }[]>([])
  const [serviceCharge, setServiceCharge] = useState(0)
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('PENDING')

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }
    fetchOrders()
    fetchProducts()
    fetchTables()
    fetchWaiters()
  }, [token, router])

  useEffect(() => {
    fetchOrders()
  }, [filterTableId, filterWaiterId, filterStatus, filterDate])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filterTableId) params.append('tableId', filterTableId)
      if (filterWaiterId) params.append('waiterId', filterWaiterId)
      if (filterStatus) params.append('status', filterStatus)
      if (filterDate) params.append('date', filterDate)

      const url = `/api/orders${params.toString() ? `?${params.toString()}` : ''}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      } else {
        console.error('Erro ao carregar pedidos')
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        const productsData = result.data || result
        setProducts(Array.isArray(productsData) ? productsData.filter((p: Product) => p.active) : [])
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        const tablesData = result.data || result
        setTables(Array.isArray(tablesData) ? tablesData : [])
      }
    } catch (error) {
      console.error('Erro ao carregar mesas:', error)
    }
  }

  const fetchWaiters = async () => {
    try {
      const response = await fetch('/api/users?role=WAITER', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        const waitersData = result.data || result
        setWaiters(Array.isArray(waitersData) ? waitersData : [])
      }
    } catch (error) {
      console.error('Erro ao carregar garçons:', error)
    }
  }

  const handleClearFilters = () => {
    setFilterTableId('')
    setFilterWaiterId('')
    setFilterStatus('')
    setFilterDate('')
  }

  const handleOpenModal = (order?: Order) => {
    if (order) {
      setEditingOrder(order)
      setSelectedTableId(order.tableId)
      setSelectedItems(order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        observations: item.observations || '',
      })))
      setServiceCharge(order.serviceCharge)
      setOrderStatus(order.status)
    } else {
      setEditingOrder(null)
      setSelectedTableId('')
      setSelectedItems([])
      setServiceCharge(0)
      setOrderStatus('PENDING')
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingOrder(null)
    setSelectedTableId('')
    setSelectedItems([])
    setServiceCharge(0)
    setOrderStatus('PENDING')
  }

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { productId: '', quantity: 1, observations: '' }])
  }

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setSelectedItems(newItems)
  }

  const calculateTotal = () => {
    const itemsTotal = selectedItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)
      return sum + (product ? product.price * item.quantity : 0)
    }, 0)
    return itemsTotal + serviceCharge
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTableId || selectedItems.length === 0) {
      alert('Selecione uma mesa e adicione pelo menos um item')
      return
    }

    const validItems = selectedItems.filter(item => item.productId && item.quantity > 0)
    if (validItems.length === 0) {
      alert('Adicione pelo menos um item válido')
      return
    }

    setSubmitting(true)

    try {
      const url = editingOrder
        ? `/api/orders/${editingOrder.id}`
        : '/api/orders'
      const method = editingOrder ? 'PATCH' : 'POST'

      const body: any = {
        tableId: selectedTableId,
        items: validItems,
        serviceCharge,
      }

      if (editingOrder) {
        body.status = orderStatus
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
        await fetchOrders()
        handleCloseModal()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao salvar pedido')
      }
    } catch (error) {
      console.error('Erro ao salvar pedido:', error)
      alert('Erro ao salvar pedido')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) {
      return
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (response.ok) {
        await fetchOrders()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao cancelar pedido')
      }
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error)
      alert('Erro ao cancelar pedido')
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    const confirmed = confirm(
      '⚠️ ATENÇÃO: EXCLUSÃO PERMANENTE\n\n' +
      'Esta ação irá EXCLUIR PERMANENTEMENTE este pedido do banco de dados.\n\n' +
      'Esta operação NÃO PODE SER DESFEITA!\n\n' +
      'Deseja realmente continuar?'
    )

    if (!confirmed) {
      return
    }

    // Segunda confirmação
    const doubleConfirm = confirm(
      '⚠️ CONFIRME NOVAMENTE\n\n' +
      'Você está prestes a excluir permanentemente este pedido.\n\n' +
      'Tem certeza absoluta?'
    )

    if (!doubleConfirm) {
      return
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await fetchOrders()
        alert('Pedido excluído permanentemente com sucesso')
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao excluir pedido')
      }
    } catch (error) {
      console.error('Erro ao excluir pedido:', error)
      alert('Erro ao excluir pedido')
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchOrders()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando pedidos...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
            <p className="text-gray-600 mt-2">Gerencie os pedidos do restaurante</p>
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
              + Novo Pedido
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Limpar Filtros
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Mesa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mesa
              </label>
              <select
                value={filterTableId}
                onChange={(e) => setFilterTableId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as mesas</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    Mesa {table.number}
                  </option>
                ))}
              </select>
            </div>

            {/* Garçom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Garçom
              </label>
              <select
                value={filterWaiterId}
                onChange={(e) => setFilterWaiterId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os garçons</option>
                {waiters.map((waiter) => (
                  <option key={waiter.id} value={waiter.id}>
                    {waiter.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os status</option>
                <option value="PENDING">Pendente</option>
                <option value="PREPARING">Preparando</option>
                <option value="READY">Pronto</option>
                <option value="DELIVERED">Entregue</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-yellow-600 text-sm font-medium">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-700">
              {orders.filter(o => o.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-600 text-sm font-medium">Preparando</p>
            <p className="text-2xl font-bold text-blue-700">
              {orders.filter(o => o.status === 'PREPARING').length}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-600 text-sm font-medium">Prontos</p>
            <p className="text-2xl font-bold text-green-700">
              {orders.filter(o => o.status === 'READY').length}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Entregues</p>
            <p className="text-2xl font-bold text-gray-700">
              {orders.filter(o => o.status === 'DELIVERED').length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-600 text-sm font-medium">Cancelados</p>
            <p className="text-2xl font-bold text-red-700">
              {orders.filter(o => o.status === 'CANCELLED').length}
            </p>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum pedido encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mesa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Garçom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Itens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">Mesa {order.table.number}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.waiter.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.items.map((item, idx) => (
                            <div key={item.id}>
                              {item.quantity}x {item.product.name}
                              {idx < order.items.length - 1 && ', '}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">
                          R$ {order.finalTotal.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}
                        >
                          <option value="PENDING">Pendente</option>
                          <option value="PREPARING">Preparando</option>
                          <option value="READY">Pronto</option>
                          <option value="DELIVERED">Entregue</option>
                          <option value="CANCELLED">Cancelado</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-3 items-center">
                          <button
                            onClick={() => handleOpenModal(order)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Editar
                          </button>
                          {user?.role === 'RECEPTIONIST' && order.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-orange-600 hover:text-orange-800"
                            >
                              Cancelar
                            </button>
                          )}
                          {user?.role === 'RECEPTIONIST' && (
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Excluir permanentemente"
                            >
                              🗑️
                            </button>
                          )}
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
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">
                  {editingOrder ? 'Editar Pedido' : 'Novo Pedido'}
                </h2>

                <form onSubmit={handleSubmit}>
                  {/* Table Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mesa *
                    </label>
                    <select
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={!!editingOrder}
                    >
                      <option value="">Selecione uma mesa</option>
                      {tables.map((table) => (
                        <option key={table.id} value={table.id}>
                          Mesa {table.number} - {table.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Items */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Itens *
                      </label>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Adicionar Item
                      </button>
                    </div>

                    <div className="space-y-3">
                      {selectedItems.map((item, index) => (
                        <div key={index} className="flex gap-2 items-start border p-3 rounded-lg">
                          <div className="flex-1">
                            <select
                              value={item.productId}
                              onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg mb-2"
                              required
                            >
                              <option value="">Selecione um produto</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} - R$ {product.price.toFixed(2)}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                className="w-24 px-3 py-2 border rounded-lg"
                                placeholder="Qtd"
                                required
                              />
                              <input
                                type="text"
                                value={item.observations}
                                onChange={(e) => handleItemChange(index, 'observations', e.target.value)}
                                className="flex-1 px-3 py-2 border rounded-lg"
                                placeholder="Observações (opcional)"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-800 mt-2"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Service Charge */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taxa de Serviço (R$) <span className="text-gray-500 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={serviceCharge}
                      onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Status (only for editing) */}
                  {editingOrder && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="PENDING">Pendente</option>
                        <option value="PREPARING">Preparando</option>
                        <option value="READY">Pronto</option>
                        <option value="DELIVERED">Entregue</option>
                      </select>
                    </div>
                  )}

                  {/* Total */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
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
