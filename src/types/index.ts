// Tipos TypeScript para o Sistema Burguesa

export type UserRole = 'RECEPTIONIST' | 'WAITER'
export type TableStatus = 'EMPTY' | 'ATTENDING' | 'FINISHED'
export type ProductCategory = 'DRINKS' | 'SNACKS' | 'DESSERTS' | 'MEALS' | 'APPETIZERS' | 'OTHER'
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Table {
  id: string
  number: number
  status: TableStatus
  currentTotal: number
  startTime?: Date
  endTime?: Date
  waiterId?: string
  waiter?: User
  mergedWithId?: string
  mergedWith?: Table
  mergedTables?: Table[]
  orders: Order[]
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category: ProductCategory
  imageUrl?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string
  tableId: string
  table?: Table
  waiterId: string
  waiter?: User
  status: OrderStatus
  total: number
  serviceCharge: number
  finalTotal: number
  printed: boolean
  items: OrderItem[]
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  product?: Product
  quantity: number
  price: number
  observations?: string
  cancelled: boolean
  cancelReason?: string
  createdAt: Date
}

export interface PrinterConfig {
  id: string
  name: string
  type: 'kitchen' | 'reception'
  vendorId: string
  productId: string
  connected: boolean
  lastUsed?: Date
  printCount: number
  settings: Record<string, any>
}

export interface ActivityLog {
  id: string
  userId: string
  user?: User
  action: string
  description: string
  metadata?: Record<string, any>
  createdAt: Date
}

export interface TableSession {
  id: string
  tableId: string
  table?: Table
  waiterId: string
  waiter?: User
  startTime: Date
  endTime?: Date
  totalAmount: number
}

// Tipos para WebSocket
export interface SocketEvent {
  type: 'table_update' | 'order_update' | 'printer_status' | 'user_action'
  data: any
}

// Tipos para resposta da API
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Tipos para filtros e paginação
export interface PaginationParams {
  page: number
  limit: number
}

export interface TableFilters {
  status?: TableStatus
  waiterId?: string
}

export interface ProductFilters {
  category?: ProductCategory
  active?: boolean
  search?: string
}

export interface OrderFilters {
  tableId?: string
  waiterId?: string
  status?: OrderStatus
  startDate?: Date
  endDate?: Date
}

// Tipo para estatísticas do dashboard
export interface DashboardStats {
  totalTables: number
  emptyTables: number
  attendingTables: number
  finishedTables: number
  todayRevenue: number
  todayOrders: number
  activeWaiters: number
}

// Tipo para histórico do garçom
export interface WaiterHistory {
  waiterId: string
  waiterName: string
  tablesAttended: number
  totalOrders: number
  totalRevenue: number
  averageTicket: number
  period: {
    start: Date
    end: Date
  }
  orders: Order[]
}
