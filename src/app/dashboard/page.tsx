'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Calculator from '@/components/Calculator'

interface DashboardStats {
  totalTables: number
  emptyTables: number
  attendingTables: number
  finishedTables: number
  todayRevenue: number
  todayOrders: number
  activeWaiters: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isHydrated, logout } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Aguardar hidratação do store antes de verificar autenticação
    if (!isHydrated) {
      return
    }

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Redirecionar usuários DRINKS para sua estação
    if (user && user.role === 'DRINKS') {
      router.push('/drinks')
      return
    }

    // RECEPTIONIST e WAITER podem acessar o dashboard

    // Buscar stats reais da API
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data.data)
        } else {
          // Se API não existir ainda, mostra zeros
          setStats({
            totalTables: 0,
            emptyTables: 0,
            attendingTables: 0,
            finishedTables: 0,
            todayRevenue: 0,
            todayOrders: 0,
            activeWaiters: 0,
          })
        }
      } catch (error) {
        // Em caso de erro, mostra zeros
        setStats({
          totalTables: 0,
          emptyTables: 0,
          attendingTables: 0,
          finishedTables: 0,
          todayRevenue: 0,
          todayOrders: 0,
          activeWaiters: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [isAuthenticated, isHydrated])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🍔 Sistema Burguesa</h1>
              <p className="text-sm text-gray-600">
                Bem-vindo, <strong>{user.name}</strong> ({user.role === 'RECEPTIONIST' ? 'Recepcionista' : 'Garçom'})
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Carregando...</div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total de Mesas */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <span className="text-white text-2xl">🪑</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total de Mesas</dt>
                      <dd className="text-3xl font-bold text-gray-900">{stats?.totalTables}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Mesas Vazias */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-400 rounded-md p-3">
                    <span className="text-white text-2xl">🟦</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Mesas Vazias</dt>
                      <dd className="text-3xl font-bold text-gray-900">{stats?.emptyTables}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Mesas Atendendo */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <span className="text-white text-2xl">🟨</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Atendendo</dt>
                      <dd className="text-3xl font-bold text-gray-900">{stats?.attendingTables}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Mesas Finalizadas */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <span className="text-white text-2xl">🟩</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Finalizadas</dt>
                      <dd className="text-3xl font-bold text-gray-900">{stats?.finishedTables}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Receita Hoje */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-600 rounded-md p-3">
                    <span className="text-white text-2xl">💰</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Receita Hoje</dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        R$ {stats?.todayRevenue.toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Pedidos Hoje */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <span className="text-white text-2xl">📋</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pedidos Hoje</dt>
                      <dd className="text-3xl font-bold text-gray-900">{stats?.todayOrders}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Garçons Ativos */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                    <span className="text-white text-2xl">👥</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Garçons Ativos</dt>
                      <dd className="text-3xl font-bold text-gray-900">{stats?.activeWaiters}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Ticket Médio */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
                    <span className="text-white text-2xl">📊</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Ticket Médio</dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        R$ {stats ? (stats.todayRevenue / stats.todayOrders).toFixed(2) : '0.00'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu de Navegação */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.role === 'WAITER' ? (
                <>
                  <button
                    onClick={() => router.push('/waiter')}
                    className="bg-white hover:bg-gray-50 rounded-lg shadow-lg p-8 text-center transition transform hover:scale-105"
                  >
                    <div className="text-6xl mb-4">👨‍🍳</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Minhas Mesas</h3>
                    <p className="text-gray-600">Ver e atender minhas mesas</p>
                  </button>

                  <button
                    onClick={() => router.push('/products')}
                    className="bg-white hover:bg-gray-50 rounded-lg shadow-lg p-8 text-center transition transform hover:scale-105"
                  >
                    <div className="text-6xl mb-4">🍔</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Cardápio</h3>
                    <p className="text-gray-600">Visualizar cardápio</p>
                  </button>

                  <button
                    onClick={() => router.push('/orders')}
                    className="bg-white hover:bg-gray-50 rounded-lg shadow-lg p-8 text-center transition transform hover:scale-105"
                  >
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Meus Pedidos</h3>
                    <p className="text-gray-600">Ver meus pedidos</p>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/tables')}
                    className="bg-white hover:bg-gray-50 rounded-lg shadow-lg p-8 text-center transition transform hover:scale-105"
                  >
                    <div className="text-6xl mb-4">🪑</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Mesas</h3>
                    <p className="text-gray-600">Gerenciar mesas e atendimentos</p>
                  </button>

                  <button
                    onClick={() => router.push('/products')}
                    className="bg-white hover:bg-gray-50 rounded-lg shadow-lg p-8 text-center transition transform hover:scale-105"
                  >
                    <div className="text-6xl mb-4">🍔</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Produtos</h3>
                    <p className="text-gray-600">Cardápio e gerenciamento</p>
                  </button>

                  <button
                    onClick={() => router.push('/orders')}
                    className="bg-white hover:bg-gray-50 rounded-lg shadow-lg p-8 text-center transition transform hover:scale-105"
                  >
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Pedidos</h3>
                    <p className="text-gray-600">Visualizar todos os pedidos</p>
                  </button>

                  <button
                    onClick={() => router.push('/printers')}
                    className="bg-white hover:bg-gray-50 rounded-lg shadow-lg p-8 text-center transition transform hover:scale-105"
                  >
                    <div className="text-6xl mb-4">🖨️</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Impressoras</h3>
                    <p className="text-gray-600">Configurar impressoras</p>
                  </button>

                  <button
                    onClick={() => router.push('/waiters')}
                    className="bg-white hover:bg-gray-50 rounded-lg shadow-lg p-8 text-center transition transform hover:scale-105"
                  >
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Garçons</h3>
                    <p className="text-gray-600">Gerenciar garçons</p>
                  </button>

                  <button
                    onClick={() => router.push('/history')}
                    className="bg-white hover:bg-gray-50 rounded-lg shadow-lg p-8 text-center transition transform hover:scale-105"
                  >
                    <div className="text-6xl mb-4">📈</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Histórico</h3>
                    <p className="text-gray-600">Relatórios e estatísticas</p>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </main>

      {/* Calculadora Flutuante */}
      <Calculator />
    </div>
  )
}
