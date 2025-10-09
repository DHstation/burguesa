'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import TableCard from '@/components/TableCard'
import Calculator from '@/components/Calculator'
import { Table } from '@/types'

export default function TablesPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isHydrated } = useAuthStore()
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedTableHistory, setSelectedTableHistory] = useState<Table | null>(null)
  useEffect(() => {
    // Aguardar hidratação do store antes de verificar autenticação
    if (!isHydrated) {
      return
    }

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Apenas DRINKS não pode acessar (redireciona para sua estação)
    if (user && user.role === 'DRINKS') {
      router.push('/drinks')
      return
    }

    fetchTables()
  }, [isAuthenticated, isHydrated])

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
      // Erro ao buscar mesas
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
      // Erro ao criar mesa
      alert('Erro ao criar mesa')
    }
  }

  const handleOpenHistory = (table: Table) => {
    setSelectedTableHistory(table)
    setShowHistoryModal(true)
  }

  const handleCloseHistory = () => {
    setShowHistoryModal(false)
    setSelectedTableHistory(null)
  }

  const handlePrintTable = async (tableId: string) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/print`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (response.ok) {
        alert('Resumo da mesa impresso com sucesso!')
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao imprimir resumo')
      }
    } catch (error) {
      // Erro ao imprimir resumo
      alert('Erro ao imprimir resumo')
    }
  }

  const handleFinalizeTable = async (tableId: string, tableNumber: number) => {
    const confirmed = confirm(
      `Finalizar Mesa ${tableNumber}?\n\n` +
      'Esta ação irá:\n' +
      '✓ Marcar a mesa como FINALIZADA\n' +
      '✓ Imprimir o resumo completo da mesa\n\n' +
      'Deseja continuar?'
    )

    if (!confirmed) return

    try {
      // Primeiro finaliza a mesa
      const finalizeResponse = await fetch(`/api/tables/${tableId}/finalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!finalizeResponse.ok) {
        const data = await finalizeResponse.json()
        alert(data.error || 'Erro ao finalizar mesa')
        return
      }

      // Depois imprime o resumo
      const printResponse = await fetch(`/api/tables/${tableId}/print`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (printResponse.ok) {
        await fetchTables() // Recarrega as mesas
        alert(`Mesa ${tableNumber} finalizada e impressa com sucesso!`)
      } else {
        await fetchTables()
        alert(`Mesa ${tableNumber} finalizada, mas houve erro ao imprimir. Você pode imprimir manualmente.`)
      }
    } catch (error) {
      // Erro ao finalizar mesa
      alert('Erro ao finalizar mesa')
    }
  }

  const handleDeleteTable = async (tableId: string, tableNumber: number) => {
    const confirmed = confirm(
      `⚠️ ATENÇÃO: EXCLUSÃO PERMANENTE\n\n` +
      `Tem certeza que deseja excluir a Mesa ${tableNumber}?\n\n` +
      `Esta ação irá:\n` +
      `• Excluir PERMANENTEMENTE a mesa\n` +
      `• Excluir TODOS os pedidos associados\n` +
      `• Esta operação NÃO PODE SER DESFEITA!\n\n` +
      `Deseja continuar?`
    )

    if (!confirmed) {
      return
    }

    // Segunda confirmação
    const doubleConfirm = confirm(
      `⚠️ CONFIRME NOVAMENTE\n\n` +
      `Você está prestes a excluir permanentemente a Mesa ${tableNumber}.\n\n` +
      `Tem certeza absoluta?`
    )

    if (!doubleConfirm) {
      return
    }

    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (response.ok) {
        await fetchTables()
        alert(`Mesa ${tableNumber} excluída com sucesso!`)
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao excluir mesa')
      }
    } catch (error) {
      // Erro ao excluir mesa
      alert('Erro ao excluir mesa')
    }
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
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (response.ok) {
        await fetchTables()
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
              {tables.map((table) => {
                const shouldShowButtons = user?.role === 'RECEPTIONIST' &&
                  (table.status === 'ATTENDING' || table.status === 'FINISHED')

                return (
                  <div key={table.id} className="relative pb-12">
                    <TableCard
                      table={table}
                      onClick={() => {
                        // TODO: Abrir modal com detalhes da mesa
                        alert(`Mesa ${table.number} - Status: ${table.status}`)
                      }}
                      canMerge={false} // Drag & drop virá depois
                    />
                    {user?.role === 'RECEPTIONIST' && (
                      <>
                        {/* Botão de exclusão no canto superior esquerdo */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTable(table.id, table.number)
                          }}
                          className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg shadow-md transition z-10"
                          title="Excluir mesa permanentemente"
                        >
                          🗑️
                        </button>

                        {/* Botão de histórico no canto superior direito */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenHistory(table)
                          }}
                          className="absolute top-2 right-2 bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-lg shadow-md transition z-10"
                          title="Ver histórico de pedidos"
                        >
                          📋
                        </button>

                        {/* Botões de impressão e finalização - sempre no fundo do container */}
                        {shouldShowButtons && (
                          <div className="absolute bottom-0 left-2 right-2 flex gap-2 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePrintTable(table.id)
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded shadow-md transition"
                              title="Imprimir resumo"
                            >
                              🖨️
                            </button>

                            {table.status === 'ATTENDING' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleFinalizeTable(table.id, table.number)
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded shadow-md transition"
                                title="Finalizar mesa"
                              >
                                ✓ Finalizar
                              </button>
                            )}

                            {table.status === 'FINISHED' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEmptyTable(table.id, table.number)
                                }}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs py-1 px-2 rounded shadow-md transition"
                                title="Esvaziar mesa e salvar no histórico"
                              >
                                🧹 Esvaziar
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>

      {/* Modal de Histórico */}
      {showHistoryModal && selectedTableHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  📋 Histórico - Mesa {selectedTableHistory.number}
                </h2>
                <button
                  onClick={handleCloseHistory}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Total atual: R$ {selectedTableHistory.currentTotal.toFixed(2)}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {selectedTableHistory.orders && selectedTableHistory.orders.length > 0 ? (
                <div className="space-y-4">
                  {selectedTableHistory.orders.map((order: any) => (
                    <div key={order.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Pedido #{order.id.slice(-8)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-600">
                            Garçom: {order.waiter?.name || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'PREPARING' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'READY' ? 'bg-green-100 text-green-800' :
                            order.status === 'DELIVERED' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status === 'PENDING' ? 'Pendente' :
                             order.status === 'PREPARING' ? 'Preparando' :
                             order.status === 'READY' ? 'Pronto' :
                             order.status === 'DELIVERED' ? 'Entregue' :
                             'Cancelado'}
                          </span>
                          <p className="text-lg font-bold text-gray-900 mt-2">
                            R$ {order.finalTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-3 mt-3">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Itens:</p>
                        <div className="space-y-2">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className={item.cancelled ? 'line-through text-gray-400' : 'text-gray-900'}>
                                {item.quantity}x {item.product?.name || 'Produto'}
                                {item.observations && (
                                  <span className="text-gray-500 italic ml-2">
                                    ({item.observations})
                                  </span>
                                )}
                                {item.cancelled && (
                                  <span className="text-red-500 ml-2">
                                    [CANCELADO]
                                  </span>
                                )}
                              </span>
                              <span className={item.cancelled ? 'line-through text-gray-400' : 'text-gray-700'}>
                                R$ {(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                        {order.serviceCharge > 0 && (
                          <div className="flex justify-between text-sm text-gray-600 mt-2 pt-2 border-t">
                            <span>Taxa de Serviço:</span>
                            <span>R$ {order.serviceCharge.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-xl mb-2">📝</p>
                  <p>Nenhum pedido encontrado para esta mesa</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={handleCloseHistory}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculadora Flutuante */}
      <Calculator />
    </div>
  )
}
