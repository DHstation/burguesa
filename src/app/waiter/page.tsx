'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Table } from '@/types'

export default function WaiterPage() {
  const router = useRouter()
  const { user, token, isAuthenticated } = useAuthStore()
  const [myTables, setMyTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    fetchMyTables()

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchMyTables, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated, router])

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
      console.error('Erro ao buscar mesas:', error)
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
      console.error('Erro ao iniciar mesa:', error)
      alert('Erro ao iniciar atendimento')
    }
  }

  const handleViewTable = (tableId: string) => {
    router.push(`/waiter/${tableId}`)
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
