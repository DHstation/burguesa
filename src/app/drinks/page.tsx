'use client'

import { useEffect, useState, useRef } from 'react'
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
  createdAt: string
  table: {
    number: number
  }
  waiter: {
    id: string
    name: string
  }
  items: OrderItem[]
}

export default function DrinksPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isHydrated } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previousPendingOrdersRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Aguardar hidratação do store antes de verificar autenticação
    if (!isHydrated) {
      return
    }

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Verificar se o usuário tem permissão (apenas DRINKS)
    if (user && user.role !== 'DRINKS') {
      router.push('/dashboard')
      return
    }

    // Criar elemento de áudio para notificação
    audioRef.current = new Audio('/notification.mp3')
    audioRef.current.volume = 0.8

    fetchOrders()

    // Atualizar a cada 5 segundos
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [isAuthenticated, isHydrated])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/drinks/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const newOrders = data.data || []

        // Verificar se há novos pedidos PENDENTES (recém-chegados)
        const currentPendingOrders = new Set<string>(
          newOrders
            .filter((order: Order) => order.status === 'PENDING')
            .map((order: Order) => order.id)
        )

        // Se é a primeira verificação, apenas inicializar sem notificar
        if (previousPendingOrdersRef.current.size === 0 && currentPendingOrders.size > 0) {
          previousPendingOrdersRef.current = currentPendingOrders
          setOrders(newOrders)
          return
        }

        // Detectar novos pedidos que acabaram de chegar
        const newPendingOrders = Array.from(currentPendingOrders).filter(
          (id: string) => !previousPendingOrdersRef.current.has(id)
        )

        if (newPendingOrders.length > 0) {
          // Tocar som de notificação
          playNotificationSound()

          // Mostrar notificação visual
          showNotification(`${newPendingOrders.length} novo(s) pedido(s) de bebida!`)
        }

        previousPendingOrdersRef.current = currentPendingOrders
        setOrders(newOrders)
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        // Fallback: usar Web Audio API para gerar beep
        playBeep()
      })
    } else {
      playBeep()
    }
  }

  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800 // Frequência do beep
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3) // 3 segundos

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 3) // 3 segundos
    } catch (error) {
    }
  }

  const showNotification = (message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🍹 Novo Pedido de Bebida!', {
        body: message,
        icon: '/icon.png',
        badge: '/badge.png',
        requireInteraction: true, // Mantém notificação até interação do usuário
        tag: 'drinks-new-order' // Agrupa notificações
      })

      // Auto-fechar após 3 segundos se não interagir
      setTimeout(() => {
        notification.close()
      }, 3000)
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/drinks/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await fetchOrders()
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao atualizar status')
      }
    } catch (error) {
      alert('Erro ao atualizar status')
    }
  }

  const getOrderDuration = (createdAt: string) => {
    const created = new Date(createdAt).getTime()
    const now = Date.now()
    const diffMinutes = Math.floor((now - created) / 60000)

    if (diffMinutes < 1) return 'Agora'
    if (diffMinutes === 1) return '1 min'
    return `${diffMinutes} min`
  }

  // Agrupar pedidos por status
  const ordersByStatus = {
    PENDING: orders.filter(o => o.status === 'PENDING'),
    PREPARING: orders.filter(o => o.status === 'PREPARING'),
    READY: orders.filter(o => o.status === 'READY')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <header className="bg-black bg-opacity-30 backdrop-blur-sm shadow-2xl border-b border-white border-opacity-20">
        <div className="max-w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-6xl">🍹</div>
              <div>
                <h1 className="text-5xl font-bold">Drinks Station</h1>
                <p className="text-xl text-blue-200 mt-1">
                  Central de Bebidas
                </p>
              </div>
            </div>
            <button
              onClick={fetchOrders}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl transition text-2xl font-semibold shadow-lg"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-3xl">Carregando...</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {/* Coluna Pendente */}
            <div className="space-y-4">
              <div className="bg-yellow-600 bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  ⏳ Pendentes
                  <span className="bg-yellow-800 text-yellow-100 px-4 py-2 rounded-full text-2xl">
                    {ordersByStatus.PENDING.length}
                  </span>
                </h2>
              </div>

              <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                {ordersByStatus.PENDING.map(order => (
                  <div
                    key={order.id}
                    className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 border-2 border-yellow-400 shadow-xl"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-4xl font-bold text-yellow-300">
                          Mesa {order.table.number}
                        </div>
                        <div className="text-lg text-gray-300 mt-1">
                          {order.waiter.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-yellow-200">
                          {getOrderDuration(order.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {order.items.map(item => (
                        <div key={item.id} className="bg-black bg-opacity-30 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-semibold">
                              {item.quantity}x {item.product.name}
                            </div>
                          </div>
                          {item.observations && (
                            <div className="text-lg text-gray-300 mt-2">
                              💬 {item.observations}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold py-4 rounded-xl transition shadow-lg"
                    >
                      ▶️ Iniciar Preparo
                    </button>
                  </div>
                ))}

                {ordersByStatus.PENDING.length === 0 && (
                  <div className="text-center py-12 text-2xl text-gray-400">
                    Nenhum pedido pendente
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Preparando */}
            <div className="space-y-4">
              <div className="bg-blue-600 bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  ��‍🍳 Preparando
                  <span className="bg-blue-800 text-blue-100 px-4 py-2 rounded-full text-2xl">
                    {ordersByStatus.PREPARING.length}
                  </span>
                </h2>
              </div>

              <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                {ordersByStatus.PREPARING.map(order => (
                  <div
                    key={order.id}
                    className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 border-2 border-blue-400 shadow-xl animate-pulse"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-4xl font-bold text-blue-300">
                          Mesa {order.table.number}
                        </div>
                        <div className="text-lg text-gray-300 mt-1">
                          {order.waiter.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-blue-200">
                          {getOrderDuration(order.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {order.items.map(item => (
                        <div key={item.id} className="bg-black bg-opacity-30 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-semibold">
                              {item.quantity}x {item.product.name}
                            </div>
                          </div>
                          {item.observations && (
                            <div className="text-lg text-gray-300 mt-2">
                              💬 {item.observations}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'READY')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-2xl font-bold py-4 rounded-xl transition shadow-lg"
                    >
                      ✓ Marcar como Pronto
                    </button>
                  </div>
                ))}

                {ordersByStatus.PREPARING.length === 0 && (
                  <div className="text-center py-12 text-2xl text-gray-400">
                    Nenhum pedido em preparo
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Pronto */}
            <div className="space-y-4">
              <div className="bg-green-600 bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  ✓ Prontos
                  <span className="bg-green-800 text-green-100 px-4 py-2 rounded-full text-2xl">
                    {ordersByStatus.READY.length}
                  </span>
                </h2>
              </div>

              <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                {ordersByStatus.READY.map(order => (
                  <div
                    key={order.id}
                    className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 border-2 border-green-400 shadow-xl ring-4 ring-green-400 ring-opacity-50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-4xl font-bold text-green-300">
                          Mesa {order.table.number}
                        </div>
                        <div className="text-lg text-gray-300 mt-1">
                          {order.waiter.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-green-200">
                          {getOrderDuration(order.createdAt)}
                        </div>
                        <div className="text-xl text-green-400 font-bold mt-1">
                          🔔 PRONTO!
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {order.items.map(item => (
                        <div key={item.id} className="bg-black bg-opacity-30 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-semibold">
                              {item.quantity}x {item.product.name}
                            </div>
                          </div>
                          {item.observations && (
                            <div className="text-lg text-gray-300 mt-2">
                              💬 {item.observations}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-2xl font-bold py-4 rounded-xl transition shadow-lg"
                    >
                      📦 Marcar como Entregue
                    </button>
                  </div>
                ))}

                {ordersByStatus.READY.length === 0 && (
                  <div className="text-center py-12 text-2xl text-gray-400">
                    Nenhum pedido pronto
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
