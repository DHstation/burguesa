'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

interface Waiter {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function WaitersPage() {
  const router = useRouter()
  const { user, token, isAuthenticated } = useAuthStore()
  const [waiters, setWaiters] = useState<Waiter[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user?.role !== 'RECEPTIONIST') {
      router.push('/dashboard')
      return
    }

    fetchWaiters()
  }, [isAuthenticated, user, router])

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
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (waiter?: Waiter) => {
    if (waiter) {
      setEditingWaiter(waiter)
      setName(waiter.name)
      setEmail(waiter.email)
      setPassword('')
      setActive(waiter.active)
    } else {
      setEditingWaiter(null)
      setName('')
      setEmail('')
      setPassword('')
      setActive(true)
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingWaiter(null)
    setName('')
    setEmail('')
    setPassword('')
    setActive(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingWaiter
        ? `/api/waiters/${editingWaiter.id}`
        : '/api/waiters'

      const method = editingWaiter ? 'PUT' : 'POST'

      const body: any = {
        name,
        email,
        active,
      }

      // Só enviar senha se for preenchida
      if (password) {
        body.password = password
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchWaiters()
        handleCloseModal()
        alert(editingWaiter ? 'Garçom atualizado com sucesso!' : 'Garçom criado com sucesso!')
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao salvar garçom')
      }
    } catch (error) {
      console.error('Erro ao salvar garçom:', error)
      alert('Erro ao salvar garçom')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (waiterId: string, waiterName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o garçom ${waiterName}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/waiters/${waiterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchWaiters()
        alert('Garçom excluído com sucesso!')
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao excluir garçom')
      }
    } catch (error) {
      console.error('Erro ao excluir garçom:', error)
      alert('Erro ao excluir garçom')
    }
  }

  const handleToggleActive = async (waiter: Waiter) => {
    try {
      const response = await fetch(`/api/waiters/${waiter.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: waiter.name,
          email: waiter.email,
          active: !waiter.active
        })
      })

      if (response.ok) {
        await fetchWaiters()
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
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
                <h1 className="text-3xl font-bold text-gray-900">👥 Gerenciamento de Garçons</h1>
                <p className="text-sm text-gray-600">
                  Cadastre e gerencie os garçons do restaurante
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              + Novo Garçom
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
        ) : waiters.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum garçom cadastrado</h2>
            <p className="text-gray-600 mb-4">
              Clique no botão "Novo Garçom" para cadastrar o primeiro garçom
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cadastrado em
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {waiters.map((waiter) => (
                  <tr key={waiter.id} className={!waiter.active ? 'bg-gray-50 opacity-60' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{waiter.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{waiter.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(waiter)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          waiter.active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {waiter.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(waiter.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(waiter)}
                        className="text-blue-600 hover:text-blue-800 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(waiter.id, waiter.name)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingWaiter ? 'Editar Garçom' : 'Novo Garçom'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do garçom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha {editingWaiter ? '(deixe em branco para manter)' : '*'}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!editingWaiter}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Senha"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                      Garçom ativo
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
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
  )
}
