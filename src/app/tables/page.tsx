'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import TableCard from '@/components/TableCard'
import Calculator from '@/components/Calculator'
import { Table } from '@/types'

interface Waiter {
  id: string
  name: string
}

export default function TablesPage() {
  const router = useRouter()
  const { user, token, isAuthenticated } = useAuthStore()
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [waiters, setWaiters] = useState<Waiter[]>([])
  const [showWaiterModal, setShowWaiterModal] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [selectedWaiterIds, setSelectedWaiterIds] = useState<string[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    fetchTables()
    fetchWaiters()
  }, [isAuthenticated, router])

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📋 Mesas recebidas:', data.data)
        // Log da primeira mesa para debug
        if (data.data && data.data.length > 0) {
          console.log('🔍 Primeira mesa tableWaiters:', data.data[0].tableWaiters)
        }
        setTables(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar mesas:', error)
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

  const handleOpenWaiterModal = (table: Table) => {
    setSelectedTable(table)
    // Pegar IDs dos garçons já atribuídos
    const currentWaiterIds = (table as any).tableWaiters?.map((tw: any) => tw.waiterId) || []
    setSelectedWaiterIds(currentWaiterIds)
    setShowWaiterModal(true)
  }

  const handleCloseWaiterModal = () => {
    setShowWaiterModal(false)
    setSelectedTable(null)
    setSelectedWaiterIds([])
  }

  const toggleWaiter = (waiterId: string) => {
    setSelectedWaiterIds(prev => {
      if (prev.includes(waiterId)) {
        return prev.filter(id => id !== waiterId)
      } else {
        return [...prev, waiterId]
      }
    })
  }

  const handleAssignWaiters = async () => {
    if (!selectedTable) return

    console.log('🔍 Atribuindo garçons:', selectedWaiterIds)

    try {
      const response = await fetch(`/api/tables/${selectedTable.id}/waiters`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          waiterIds: selectedWaiterIds
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Resposta da API:', data)
        console.log('📊 TableWaiters retornados:', data.data?.tableWaiters)

        await fetchTables()
        handleCloseWaiterModal()
        alert(`${selectedWaiterIds.length} garçom(ns) atribuído(s) com sucesso!`)
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao atribuir garçons')
      }
    } catch (error) {
      console.error('Erro ao atribuir garçons:', error)
      alert('Erro ao atribuir garçons')
    }
  }

  const handleCreateTable = async () => {
    const tableNumber = prompt('Número da nova mesa:')
    if (!tableNumber) return

    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ number: parseInt(tableNumber) })
      })

      if (response.ok) {
        fetchTables() // Recarrega as mesas
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao criar mesa')
      }
    } catch (error) {
      console.error('Erro ao criar mesa:', error)
      alert('Erro ao criar mesa')
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
                <h1 className="text-3xl font-bold text-gray-900">🪑 Gerenciamento de Mesas</h1>
                <p className="text-sm text-gray-600">
                  {user.name} ({user.role === 'RECEPTIONIST' ? 'Recepcionista' : 'Garçom'})
                </p>
              </div>
            </div>

            {user.role === 'RECEPTIONIST' && (
              <button
                onClick={handleCreateTable}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                + Nova Mesa
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Carregando mesas...</div>
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🪑</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhuma mesa cadastrada</h2>
            <p className="text-gray-600 mb-6">
              {user.role === 'RECEPTIONIST'
                ? 'Clique no botão "Nova Mesa" para começar'
                : 'Aguarde o recepcionista criar as mesas'}
            </p>
          </div>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {tables.filter(t => t.status === 'EMPTY').length}
                </div>
                <div className="text-sm text-gray-600">Mesas Vazias</div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {tables.filter(t => t.status === 'ATTENDING').length}
                </div>
                <div className="text-sm text-gray-600">Atendendo</div>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {tables.filter(t => t.status === 'FINISHED').length}
                </div>
                <div className="text-sm text-gray-600">Finalizadas</div>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {tables.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>

            {/* Grid de Mesas */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {tables.map((table) => (
                <div key={table.id} className="relative">
                  <TableCard
                    table={table}
                    onClick={() => {
                      // TODO: Abrir modal com detalhes da mesa
                      alert(`Mesa ${table.number} - Status: ${table.status}`)
                    }}
                    canMerge={false} // Drag & drop virá depois
                  />
                  {user?.role === 'RECEPTIONIST' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenWaiterModal(table)
                      }}
                      className="absolute top-2 right-2 bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-lg shadow-md transition z-10"
                      title="Atribuir garçom"
                    >
                      👤
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Modal de Atribuir Garçons */}
      {showWaiterModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Atribuir Garçons - Mesa {selectedTable.number}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione os Garçons
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {waiters.map(waiter => (
                      <label
                        key={waiter.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedWaiterIds.includes(waiter.id)}
                          onChange={() => toggleWaiter(waiter.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-gray-900">{waiter.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedWaiterIds.length === 0
                      ? 'Nenhum garçom selecionado'
                      : `${selectedWaiterIds.length} garçom(ns) selecionado(s)`}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseWaiterModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAssignWaiters}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculadora Flutuante */}
      <Calculator />
    </div>
  )
}
