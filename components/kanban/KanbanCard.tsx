'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, MessageSquare, CheckSquare } from 'lucide-react'
import { Task } from './KanbanBoard'
import { PriorityBadge, Avatar } from '../ui/Badge'
import { cn } from '@/lib/utils'

interface KanbanCardProps {
  task: Task
  onClick?: () => void
  isDragging?: boolean
}

export default function KanbanCard({ task, onClick, isDragging }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date()

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-pointer select-none',
        'hover:shadow-md hover:border-indigo-200 transition-all',
        (isSortDragging || isDragging) && 'opacity-50 rotate-2 shadow-lg'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{task.title}</p>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-gray-400">
          {task.due_date && (
            <span className={cn('flex items-center gap-1 text-xs', isOverdue ? 'text-red-500' : 'text-gray-400')}>
              <Calendar size={11} />
              {new Date(task.due_date).toLocaleDateString('pl')}
            </span>
          )}
        </div>
        {task.assignee_name && (
          <Avatar name={task.assignee_name} image={task.assignee_image} size="sm" />
        )}
      </div>
    </div>
  )
}
