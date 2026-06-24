'use client'
import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, X, Check } from 'lucide-react'
import { Task, Column } from './KanbanBoard'
import KanbanCard from './KanbanCard'

interface KanbanColumnProps {
  column: Column
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onAddTask: (title: string, priority: string) => void
  addingOpen: boolean
  onAddOpen: () => void
  onAddClose: () => void
}

export default function KanbanColumn({ column, tasks, onTaskClick, onAddTask, addingOpen, onAddOpen, onAddClose }: KanbanColumnProps) {
  const [newTitle, setNewTitle] = useState('')
  const [priority, setPriority] = useState('medium')

  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const submit = () => {
    if (newTitle.trim()) {
      onAddTask(newTitle.trim(), priority)
      setNewTitle('')
      setPriority('medium')
    }
  }

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color !== '#e5e7eb' ? column.color : '#9ca3af' }} />
          <h3 className="text-sm font-semibold text-gray-700">{column.name}</h3>
          <span className="text-xs bg-gray-200 text-gray-500 rounded-full px-2 py-0.5">{tasks.length}</span>
        </div>
        <button onClick={onAddOpen} className="text-gray-400 hover:text-gray-600 transition-colors">
          <Plus size={16} />
        </button>
      </div>

      {/* Tasks */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2 min-h-[100px] p-2 rounded-xl transition-colors ${isOver ? 'bg-indigo-50 ring-2 ring-indigo-200' : 'bg-gray-100/60'}`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>

        {/* Add task inline */}
        {addingOpen && (
          <div className="bg-white rounded-lg p-3 shadow-sm border border-indigo-200">
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onAddClose() }}
              placeholder="Tytuł zadania..."
              className="w-full text-sm outline-none text-gray-800 placeholder-gray-400 mb-2"
            />
            <div className="flex items-center justify-between">
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="text-xs border border-gray-200 rounded px-1.5 py-0.5 text-gray-600"
              >
                <option value="low">Niski</option>
                <option value="medium">Średni</option>
                <option value="high">Wysoki</option>
                <option value="urgent">Pilny</option>
              </select>
              <div className="flex gap-1">
                <button onClick={submit} className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  <Check size={12} />
                </button>
                <button onClick={onAddClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                  <X size={12} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
