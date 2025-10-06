// Store Zustand para gerenciamento de mesas
import { create } from 'zustand'
import { Table } from '@/types'

interface TableState {
  tables: Table[]
  selectedTable: Table | null
  setTables: (tables: Table[]) => void
  addTable: (table: Table) => void
  updateTable: (id: string, data: Partial<Table>) => void
  removeTable: (id: string) => void
  selectTable: (table: Table | null) => void
  mergeTables: (sourceId: string, targetId: string) => void
}

export const useTableStore = create<TableState>((set) => ({
  tables: [],
  selectedTable: null,

  setTables: (tables) => set({ tables }),

  addTable: (table) =>
    set((state) => ({ tables: [...state.tables, table] })),

  updateTable: (id, data) =>
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === id ? { ...table, ...data } : table
      ),
    })),

  removeTable: (id) =>
    set((state) => ({
      tables: state.tables.filter((table) => table.id !== id),
    })),

  selectTable: (table) => set({ selectedTable: table }),

  mergeTables: (sourceId, targetId) =>
    set((state) => ({
      tables: state.tables.map((table) => {
        if (table.id === sourceId) {
          return { ...table, mergedWithId: targetId }
        }
        return table
      }),
    })),
}))
