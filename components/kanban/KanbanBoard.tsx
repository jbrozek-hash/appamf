'use client'
import { useState, useCallback } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  DragStartEvent, DragOverEvent, DragEndEvent, closestCorners
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import KanbanColumn from './KanbanColumn'
import KanbanCard from './KanbanCard'
import TaskModal from './TaskModal'

export interface Task {
  id: string
  column_id: string
  project_id: string
  title: string
  description?: string
  priority: string
  due_date?: string
  assignee_name?: string
  assignee_image?: string
  assignee_id?: string
  task_order: number
}

export interface Column {
  id: string
  name: string
  color: string
  col_order: number
}

export interface Subtask {
  id: string
  task_id: string
  title: string
  done: boolean
}

interface KanbanBoardProps {
  projectId: string
  initialColumns: Column[]
  initialTasks: Task[]
  initialSubtasks: Subtask[]
  members: { id: string; name: string; image?: string }[]
}

export default function KanbanBoard({ projectId, initialColumns, initialTasks, initialSubtasks, members }: KanbanBoardProps) {
  const [columns] = useState<Column[]>(initialColumns)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    const task = tasks.find(t => t.id === active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find(t => t.id === activeId)
    if (!activeTask) return

    const overTask = tasks.find(t => t.id === overId)
    const overColumnId = overTask ? overTask.column_id : overId

    if (activeTask.column_id !== overColumnId) {
      setTasks(prev => prev.map(t => t.id === activeId ? { ...t, column_id: overColumnId } : t))
    }
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveTask(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const task = tasks.find(t => t.id === activeId)
    if (!task) return

    const overTask = tasks.find(t => t.id === overId)
    const targetColumnId = overTask ? overTask.column_id : overId

    setTasks(prev => {
      const colTasks = prev.filter(t => t.column_id === targetColumnId)
      const oldIdx = colTasks.findIndex(t => t.id === activeId)
      const newIdx = overTask ? colTasks.findIndex(t => t.id === overId) : colTasks.length - 1

      if (oldIdx === -1) return prev

      const reordered = arrayMove(colTasks, oldIdx, newIdx)
      const others = prev.filter(t => t.column_id !== targetColumnId)
      return [...others, ...reordered.map((t, i) => ({ ...t, task_order: i }))]
    })

    await fetch(`/api/tasks/${activeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column_id: targetColumnId }),
    })
  }

  const addTask = async (columnId: string, title: string, priority: string) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, columnId, title, priority }),
    })
    if (res.ok) {
      const task = await res.json()
      setTasks(prev => [...prev, task])
    }
    setAddingToColumn(null)
  }

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== taskId))
    setSelectedTask(null)
  }

  const updateTask = (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    setSelectedTask(updated)
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners}
        onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 h-full overflow-x-auto pb-4">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.column_id === col.id).sort((a, b) => a.task_order - b.task_order)
            return (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={colTasks}
                onTaskClick={setSelectedTask}
                onAddTask={(title, priority) => addTask(col.id, title, priority)}
                addingOpen={addingToColumn === col.id}
                onAddOpen={() => setAddingToColumn(col.id)}
                onAddClose={() => setAddingToColumn(null)}
              />
            )
          })}
        </div>
        <DragOverlay>
          {activeTask && <KanbanCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          subtasks={initialSubtasks.filter(s => s.task_id === selectedTask.id)}
          members={members}
          onClose={() => setSelectedTask(null)}
          onDelete={() => deleteTask(selectedTask.id)}
          onUpdate={updateTask}
        />
      )}
    </>
  )
}
