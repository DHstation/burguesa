// Store Zustand para autenticação
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isHydrated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,

      login: (user, token) => {
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }))
      },

      setHydrated: () => {
        set({ isHydrated: true })
      },
    }),
    {
      name: 'burguesa-auth',
      storage: createJSONStorage(() => {
        // Verifica se está no browser antes de usar localStorage
        if (typeof window !== 'undefined') {
          return localStorage
        }
        // Fallback para SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
      onRehydrateStorage: () => (state) => {
        // Marca como hidratado quando terminar de carregar do localStorage
        state?.setHydrated()
      },
    }
  )
)
