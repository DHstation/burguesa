'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import TableCard from '@/components/TableCard'
import Calculator from '@/components/Calculator'
import { Table } from '@/types'

export default function TablesPage() {
  const router = useRouter()
  const { user, token, isAuthenticated } = useAuthStore()
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    fetchTables()
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
        setTables(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar mesas:', error)
    } finally {
      setLoading(false)
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
                <TableCard
                  key={table.id}
                  table={table}
                  onClick={() => {
                    // TODO: Abrir modal com detalhes da mesa
                    alert(`Mesa ${table.number} - Status: ${table.status}`)
                  }}
                  canMerge={false} // Drag & drop virá depois
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Calculadora Flutuante */}
      <Calculator />
    </div>
  )
}
