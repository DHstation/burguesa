// Componente de Card de Mesa (Bloquinho)
'use client'

import { Table, TableStatus } from '@/types'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TableCardProps {
  table: Table
  onClick: () => void
  canMerge: boolean
}

const statusColors: Record<TableStatus, string> = {
  EMPTY: 'bg-table-empty border-blue-600',
  ATTENDING: 'bg-table-attending border-yellow-600',
  FINISHED: 'bg-table-finished border-green-600',
}

const statusLabels: Record<TableStatus, string> = {
  EMPTY: 'Vazio',
  ATTENDING: 'Atendendo',
  FINISHED: 'Finalizado',
}

export default function TableCard({ table, onClick, canMerge }: TableCardProps) {
  const { attributes, listeners, setNodeRef: setDragRef, transform } = useDraggable({
    id: table.id,
    disabled: !canMerge || table.status === 'EMPTY',
  })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: table.id,
    disabled: !canMerge || table.status === 'EMPTY',
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const isMerged = !!table.mergedWithId

  return (
    <div
      ref={(node) => {
        setDragRef(node)
        setDropRef(node)
      }}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`
        relative p-6 rounded-lg shadow-lg cursor-pointer transition-all
        border-4 ${statusColors[table.status]}
        ${isOver ? 'ring-4 ring-purple-500 scale-105' : ''}
        ${isMerged ? 'ring-2 ring-purple-400' : ''}
        hover:scale-105 hover:shadow-xl
      `}
    >
      {/* Número da Mesa */}
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-white">
          Mesa {table.number}
        </h2>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="px-3 py-1 bg-white bg-opacity-90 rounded-full text-sm font-semibold">
          {statusLabels[table.status]}
        </span>
        {isMerged && (
          <span className="px-3 py-1 bg-purple-500 text-white rounded-full text-sm font-semibold">
            🔗 Unida
          </span>
        )}
      </div>

      {/* Informações */}
      <div className="text-white text-center space-y-2">
        {(table as any).tableWaiters && (table as any).tableWaiters.length > 0 ? (
          <div className="text-sm">
            <span className="font-semibold">
              {(table as any).tableWaiters.length > 1 ? 'Garçons:' : 'Garçom:'}
            </span>
            <div className="mt-1">
              {(table as any).tableWaiters.map((tw: any) => (
                <div key={tw.id}>{tw.waiter.name}</div>
              ))}
            </div>
          </div>
        ) : table.waiter && (
          <p className="text-sm">
            <span className="font-semibold">Garçom:</span> {table.waiter.name}
          </p>
        )}

        {table.currentTotal > 0 && (
          <p className="text-lg font-bold">
            R$ {table.currentTotal.toFixed(2)}
          </p>
        )}

        {table.startTime && (
          <p className="text-xs opacity-90">
            {formatDistanceToNow(new Date(table.startTime), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        )}
      </div>
    </div>
  )
}
