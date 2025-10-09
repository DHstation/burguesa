'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Table } from '@/types'

export default function WaiterPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isHydrated } = useAuthStore()
  const [myTables, setMyTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [readyDrinksAlert, setReadyDrinksAlert] = useState<any[]>([])
  const previousReadyDrinksRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Aguardar hidratação do store antes de verificar autenticação
    if (!isHydrated) {
      return
    }

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Verificar se o usuário é garçom
    if (user && user.role !== 'WAITER') {
      router.push('/dashboard')
      return
    }

    // Solicitar permissão para notificações
    requestNotificationPermission()

    fetchMyTables()
    checkReadyDrinks()

    // Atualizar a cada 30 segundos
    const tablesInterval = setInterval(fetchMyTables, 30000)
    // Verificar pedidos prontos a cada 5 segundos
    const drinksInterval = setInterval(checkReadyDrinks, 5000)

    return () => {
      clearInterval(tablesInterval)
      clearInterval(drinksInterval)
    }
  }, [isAuthenticated, isHydrated])

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const checkReadyDrinks = async () => {
    try {
      const response = await fetch('/api/waiter/ready-drinks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const readyOrders = data.data || []

        // Criar set com IDs dos pedidos prontos atuais
        const currentReadyIds = new Set<string>(readyOrders.map((order: any) => order.id))

        // Se é a primeira verificação, apenas inicializar sem notificar
        if (previousReadyDrinksRef.current.size === 0 && readyOrders.length > 0) {
          previousReadyDrinksRef.current = currentReadyIds
          return
        }

        // Detectar novos pedidos prontos
        const newReadyOrders = readyOrders.filter((order: any) =>
          !previousReadyDrinksRef.current.has(order.id)
        )

        if (newReadyOrders.length > 0) {
          // Adicionar ao estado de alertas na tela
          setReadyDrinksAlert(newReadyOrders)

          // Notificar sobre cada pedido pronto
          newReadyOrders.forEach((order: any) => {
            showDrinkReadyNotification(order)
          })

          // Tocar som apenas uma vez
          playNotificationSound()

          // Vibrar dispositivo se suportado (mobile)
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200])
          }

          // Remover alerta após 5 segundos
          setTimeout(() => {
            setReadyDrinksAlert([])
          }, 5000)
        }

        previousReadyDrinksRef.current = currentReadyIds
      } else {
        // Erro ao buscar drinks
      }
    } catch (error) {
      // Erro ao verificar drinks prontos
    }
  }

  const showDrinkReadyNotification = (order: any) => {
    const itemsText = order.items.map((item: any) =>
      `${item.quantity}x ${item.product.name}`
    ).join(', ')

    if (!('Notification' in window)) {
      return
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification('🍹 Bebida Pronta!', {
        body: `Mesa ${order.table.number}\n${itemsText}`,
        icon: '/icon.png',
        badge: '/badge.png',
        requireInteraction: true,
        tag: `drink-${order.id}`
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      setTimeout(() => {
        notification.close()
      }, 3000)
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showDrinkReadyNotification(order)
        }
      })
    }
  }

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 3)
    } catch (error) {
      // Erro ao tocar notificação
    }
  }

  const fetchMyTables = async () => {
    try {
      const response = await fetch('/api/waiter/tables', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMyTables(data.data || [])
      }
    } catch (error) {
      // Erro ao buscar mesas
    } finally {
      setLoading(false)
    }
  }

  const handleStartTable = async (tableId: string) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        fetchMyTables()
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao iniciar atendimento')
      }
    } catch (error) {
      // Erro ao iniciar mesa
      alert('Erro ao iniciar atendimento')
    }
  }

  const handleViewTable = (tableId: string) => {
    router.push(`/waiter/${tableId}`)
  }

  const handleEmptyTable = async (tableId: string, tableNumber: number) => {
    const confirmed = confirm(
      `Esvaziar Mesa ${tableNumber}?\n\n` +
      `Esta ação irá:\n` +
      `✓ Salvar a sessão completa no histórico\n` +
      `✓ Resetar a mesa para VAZIA\n` +
      `✓ Remover todos os garçons atribuídos\n` +
      `✓ Zerar o total da mesa\n\n` +
      `A mesa ficará pronta para novos clientes.\n\n` +
      `Deseja continuar?`
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/tables/${tableId}/empty`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        await fetchMyTables()
        alert(`Mesa ${tableNumber} esvaziada! Sessão salva no histórico.`)
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao esvaziar mesa')
      }
    } catch (error) {
      // Erro ao esvaziar mesa
      alert('Erro ao esvaziar mesa')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EMPTY':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'ATTENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'FINISHED':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'EMPTY':
        return 'Vazia'
      case 'ATTENDING':
        return 'Atendendo'
      case 'FINISHED':
        return 'Finalizada'
      default:
        return status
    }
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
                <h1 className="text-3xl font-bold text-gray-900">👨‍🍳 Minhas Mesas</h1>
                <p className="text-sm text-gray-600">
                  {user.name} - Garçom
                </p>
              </div>
            </div>
            <button
              onClick={fetchMyTables}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>
      </header>

      {/* Alerta de Bebidas Prontas - Mobile Optimized */}
      {readyDrinksAlert.length > 0 && (
        <div className="fixed top-20 left-0 right-0 z-50 px-4 animate-bounce">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-6 mx-auto max-w-md border-4 border-white">
            <div className="flex items-center gap-4 mb-3">
              <div className="text-5xl animate-pulse">🍹</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">Bebida Pronta!</h3>
                <p className="text-green-100 text-sm">Retire na estação de drinks</p>
              </div>
              <button
                onClick={() => setReadyDrinksAlert([])}
                className="text-white hover:text-green-100 text-3xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {readyDrinksAlert.map((order: any) => (
                <div key={order.id} className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="font-bold text-lg">Mesa {order.table.number}</div>
                  <div className="text-sm">
                    {order.items.map((item: any) => (
                      <div key={item.id}>
                        {item.quantity}x {item.product.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Carregando...</div>
          </div>
        ) : myTables.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">🪑</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhuma mesa atribuída</h2>
            <p className="text-gray-600">
              Aguarde o recepcionista atribuir mesas para você
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTables.map((table) => (
              <div
                key={table.id}
                className={`bg-white rounded-lg shadow-lg p-6 border-2 ${getStatusColor(table.status)}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-3xl font-bold text-gray-900">
                    Mesa {table.number}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(table.status)}`}>
                    {getStatusText(table.status)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-gray-700">
                    <strong>Total Atual:</strong> R$ {table.currentTotal.toFixed(2)}
                  </p>
                  {table.startTime && (
                    <p className="text-gray-700">
                      <strong>Início:</strong> {new Date(table.startTime).toLocaleTimeString('pt-BR')}
                    </p>
                  )}
                  {table.status === 'ATTENDING' && table.startTime && (
                    <p className="text-gray-700">
                      <strong>Tempo:</strong> {Math.floor((Date.now() - new Date(table.startTime).getTime()) / 60000)} min
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {table.status === 'EMPTY' ? (
                    <button
                      onClick={() => handleStartTable(table.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition font-medium"
                    >
                      ▶️ Iniciar Atendimento
                    </button>
                  ) : table.status === 'FINISHED' ? (
                    <button
                      onClick={() => handleEmptyTable(table.id, table.number)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition font-medium"
                    >
                      🧹 Esvaziar Mesa
                    </button>
                  ) : (
                    <button
                      onClick={() => handleViewTable(table.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
                    >
                      📋 Ver Detalhes
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
