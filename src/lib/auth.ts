// Utilitários de autenticação e autorização
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserRole } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
}

/**
 * Gera hash de senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * Verifica se a senha corresponde ao hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Gera token JWT
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  })
}

/**
 * Verifica e decodifica token JWT
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Verifica se o usuário tem permissão para acessar um recurso
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  if (userRole === 'RECEPTIONIST') return true // Recepcionista tem acesso total
  return userRole === requiredRole
}

/**
 * Middleware para verificar autenticação em rotas da API
 */
export function requireAuth(handler: Function, requiredRole?: UserRole) {
  return async (req: Request) => {
    try {
      const authHeader = req.headers.get('authorization')

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Token não fornecido' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const token = authHeader.substring(7)
      const payload = verifyToken(token)

      if (!payload) {
        return new Response(
          JSON.stringify({ error: 'Token inválido ou expirado' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Verifica permissões se necessário
      if (requiredRole && !hasPermission(payload.role, requiredRole)) {
        return new Response(
          JSON.stringify({ error: 'Permissão negada' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Adiciona o payload à requisição para uso posterior
      // @ts-ignore
      req.user = payload

      return handler(req, payload)
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Erro na autenticação' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}
