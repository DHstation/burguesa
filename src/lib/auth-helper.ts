import { UserRole } from '@/types'

/**
 * Verifica se um usuário tem permissão para acessar determinada rota
 */
export function checkAccess(userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole)
}

/**
 * Retorna a rota home baseada no role do usuário
 */
export function getHomeRoute(userRole: UserRole): string {
  switch (userRole) {
    case 'RECEPTIONIST':
      return '/dashboard'
    case 'WAITER':
      return '/waiter'
    case 'DRINKS':
      return '/drinks'
    default:
      return '/login'
  }
}

/**
 * Rotas e permissões de acesso
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard': ['RECEPTIONIST'],
  '/tables': ['RECEPTIONIST'],
  '/products': ['RECEPTIONIST'],
  '/users': ['RECEPTIONIST'],
  '/printers': ['RECEPTIONIST'],
  '/orders': ['RECEPTIONIST'],
  '/history': ['RECEPTIONIST'],
  '/waiters': ['RECEPTIONIST'],
  '/waiter': ['WAITER'],
  '/drinks': ['DRINKS'],
}

/**
 * Verifica se a rota requer autenticação
 */
export function requiresAuth(pathname: string): boolean {
  const publicRoutes = ['/login', '/']
  return !publicRoutes.includes(pathname)
}
