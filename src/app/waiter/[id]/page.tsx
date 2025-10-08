'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

interface Product {
  id: string
  name: string
  price: number
  category: string
  description?: string
  active: boolean
}

interface OrderItem {
  id: string
  quantity: number
  price: number
  observations?: string
  product: Product
}

interface Order {
  id: string
  status: string
  total: number
  serviceCharge: number
  finalTotal: number
  printed: boolean
  createdAt: string
  items: OrderItem[]
}

interface Table {
  id: string
  number: number
  status: string
  currentTotal: number
  startTime?: string
  orders: Order[]
}

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  observations: string
}

export default function WaiterTableDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tableId = params.id as string
  const { token } = useAuthStore()

  const [table, setTable] = useState<Table | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTableDetails()
    fetchProducts()
  }, [tableId])

  const fetchTableDetails = async () => {
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTable(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da mesa:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data.data.filter((p: Product) => p.active))
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    }
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id)

    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        observations: ''
      }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const updateObservations = (productId: string, observations: string) => {
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, observations }
        : item
    ))
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      alert('Adicione itens ao pedido')
      return
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tableId: tableId,
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            observations: item.observations || null
          }))
        })
      })

      if (response.ok) {
        alert('Pedido enviado com sucesso!')
        setCart([])
        fetchTableDetails()
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao enviar pedido')
      }
    } catch (error) {
      console.error('Erro ao enviar pedido:', error)
      alert('Erro ao enviar pedido')
    }
  }

  const getCategoryText = (category: string) => {
    const categories: Record<string, string> = {
      'DRINKS': 'Bebidas',
      'SNACKS': 'Lanches',
      'DESSERTS': 'Sobremesas',
      'MEALS': 'Refeições',
      'APPETIZERS': 'Entradas',
      'OTHER': 'Outros'
    }
    return categories[category] || category
  }

  const filteredProducts = selectedCategory === 'ALL'
    ? products
    : products.filter(p => p.category === selectedCategory)

  if (loading || !table) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/waiter')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Voltar
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mesa {table.number}</h1>
                <p className="text-sm text-gray-600">
                  Total Atual: R$ {table.currentTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Produtos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cardápio</h2>

              {/* Categorias */}
              <div className="flex gap-2 mb-4 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    selectedCategory === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Todos
                </button>
                {['DRINKS', 'SNACKS', 'MEALS', 'APPETIZERS', 'DESSERTS', 'OTHER'].map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {getCategoryText(category)}
                  </button>
                ))}
              </div>

              {/* Lista de Produtos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="border rounded-lg p-4 hover:shadow-lg transition cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-gray-600">{product.description}</p>
                        )}
                      </div>
                      <span className="text-green-600 font-bold">
                        R$ {product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Carrinho */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Pedido Atual</h2>

              {cart.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Carrinho vazio
                </p>
              ) : (
                <>
                  <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.productId} className="border-b pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-600">
                              R$ {item.price.toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="flex gap-2 mb-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                          >
                            -
                          </button>
                          <span className="px-4 py-1 bg-gray-100 rounded">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                          >
                            +
                          </button>
                        </div>

                        <input
                          type="text"
                          placeholder="Observações..."
                          value={item.observations}
                          onChange={(e) => updateObservations(item.productId, e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold mb-4">
                      <span>Total:</span>
                      <span>R$ {calculateTotal().toFixed(2)}</span>
                    </div>

                    <button
                      onClick={handleSubmitOrder}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition font-bold"
                    >
                      ✓ Enviar Pedido
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pedidos Anteriores */}
        {table.orders && table.orders.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pedidos Anteriores</h2>
            <div className="space-y-4">
              {table.orders.map(order => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleString('pt-BR')}
                      </p>
                      <p className="font-bold">Total: R$ {order.finalTotal.toFixed(2)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'PREPARING' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'READY' ? 'bg-green-100 text-green-800' :
                      order.status === 'DELIVERED' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {order.items.map(item => (
                      <p key={item.id} className="text-sm text-gray-700">
                        {item.quantity}x {item.product.name}
                        {item.observations && ` - ${item.observations}`}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
