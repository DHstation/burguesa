'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Calculator from '@/components/Calculator'
import { Product, ProductCategory } from '@/types'

const categoryLabels: Record<ProductCategory, string> = {
  DRINKS: 'Bebidas',
  SNACKS: 'Lanches',
  DESSERTS: 'Sobremesas',
  MEALS: 'Refeições',
  APPETIZERS: 'Entradas',
  OTHER: 'Outros'
}

export default function ProductsPage() {
  const router = useRouter()
  const { user, token, isAuthenticated } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    fetchProducts()
  }, [isAuthenticated, router])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = () => {
    // TODO: Abrir modal de criar produto
    alert('Funcionalidade de criar produto será implementada em breve!')
  }

  const handleEditProduct = (product: Product) => {
    // TODO: Abrir modal de editar produto
    alert(`Editar produto: ${product.name}`)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchProducts()
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao excluir produto')
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto')
    }
  }

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch && product.active
  })

  // Agrupar por categoria
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = []
    }
    acc[product.category].push(product)
    return acc
  }, {} as Record<ProductCategory, Product[]>)

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
                <h1 className="text-3xl font-bold text-gray-900">🍔 Gerenciamento de Produtos</h1>
                <p className="text-sm text-gray-600">
                  {user.name} ({user.role === 'RECEPTIONIST' ? 'Recepcionista' : 'Garçom'})
                </p>
              </div>
            </div>

            {user.role === 'RECEPTIONIST' && (
              <button
                onClick={handleCreateProduct}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                + Novo Produto
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Produto
              </label>
              <input
                type="text"
                placeholder="Digite o nome do produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | 'ALL')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Todas as Categorias</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Carregando produtos...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍔</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum produto cadastrado</h2>
            <p className="text-gray-600 mb-6">
              {user.role === 'RECEPTIONIST'
                ? 'Clique no botão "Novo Produto" para começar'
                : 'Aguarde o recepcionista adicionar produtos ao cardápio'}
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum produto encontrado</h2>
            <p className="text-gray-600">Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {categoryLabels[category as ProductCategory]} ({categoryProducts.length})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                    >
                      {/* Imagem */}
                      <div className="h-48 bg-gray-200 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-6xl">🍽️</span>
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {product.name}
                        </h3>

                        {product.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-bold text-green-600">
                            R$ {product.price.toFixed(2)}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {categoryLabels[product.category]}
                          </span>
                        </div>

                        {/* Ações (apenas recepcionista) */}
                        {user.role === 'RECEPTIONIST' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded transition"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded transition"
                            >
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Calculadora Flutuante */}
      <Calculator />
    </div>
  )
}
