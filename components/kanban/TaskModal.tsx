'use client'
import { useState, useEffect } from 'react'
import { Trash2, Plus, Check, MessageSquare, Calendar, Flag, User } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { PriorityBadge, Avatar } from '../ui/Badge'
import { Task, Subtask } from './KanbanBoard'

interface Comment {
  id: string
  content: string
  author_name: string
  author_image?: string
  created_at: string
}

interface TaskModalProps {
  task: Task
  subtasks: Subtask[]
  members: { id: string; name: string; image?: string }[]
  onClose: () => void
  onDelete: () => void
  onUpdate: (task: Task) => void
}

export default function TaskModal({ task, subtasks: initialSubtasks, members, onClose, onDelete, onUpdate }: TaskModalProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks)
  const [comments, setComments] = useState<Comment[]>([])
  const [newSubtask, setNewSubtask] = useState('')
  const [newComment, setNewComment] = useState('')
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority] = useState(task.priority)
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '')
  const [assigneeId, setAssigneeId] = useState(task.assignee_id ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/tasks/${task.id}`).then(r => r.json()).then(data => {
      if (data.comments) setComments(data.comments)
      if (data.subtasks) setSubtasks(data.subtasks)
    })
  }, [task.id])

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, priority, due_date: dueDate || null, assignee_id: assigneeId || null }),
    })
    if (res.ok) {
      const updated = await res.json()
      onUpdate({ ...task, ...updated })
      setEditing(false)
    }
    setSaving(false)
  }

  const addSubtask = async () => {
    if (!newSubtask.trim()) return
    const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newSubtask.trim() }),
    })
    if (res.ok) {
      const sub = await res.json()
      setSubtasks(prev => [...prev, sub])
      setNewSubtask('')
    }
  }

  const toggleSubtask = async (subId: string, done: boolean) => {
    await fetch(`/api/tasks/${task.id}/subtasks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtaskId: subId, done }),
    })
    setSubtasks(prev => prev.map(s => s.id === subId ? { ...s, done } : s))
  }

  const addComment = async () => {
    if (!newComment.trim()) return
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment.trim() }),
    })
    if (res.ok) {
      const comment = await res.json()
      setComments(prev => [...prev, comment])
      setNewComment('')
    }
  }

  const done = subtasks.filter(s => s.done).length
  const progress = subtasks.length > 0 ? Math.round((done / subtasks.length) * 100) : 0

  return (
    <Modal open onClose={onClose} size="xl">
      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full text-xl font-bold text-gray-900 border-b-2 border-indigo-400 outline-none pb-1 mb-3" />
          ) : (
            <h2 className="text-xl font-bold text-gray-900 mb-1 cursor-pointer hover:text-indigo-700" onClick={() => setEditing(true)}>{title}</h2>
          )}

          {/* Description */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Opis</p>
            {editing ? (
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            ) : (
              <p className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 min-h-[40px]"
                onClick={() => setEditing(true)}>
                {description || <span className="text-gray-400">Dodaj opis...</span>}
              </p>
            )}
          </div>

          {/* Subtasks */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">Podzadania {subtasks.length > 0 && `(${done}/${subtasks.length})`}</p>
            </div>
            {subtasks.length > 0 && (
              <div className="mb-2">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              {subtasks.map(s => (
                <div key={s.id} className="flex items-center gap-2">
                  <button onClick={() => toggleSubtask(s.id, !s.done)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${s.done ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 hover:border-indigo-400'}`}>
                    {s.done && <Check size={10} />}
                  </button>
                  <span className={`text-sm ${s.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{s.title}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSubtask()}
                placeholder="Dodaj podzadanie..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400" />
              <button onClick={addSubtask} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Comments */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
              <MessageSquare size={12} /> Komentarze ({comments.length})
            </p>
            <div className="space-y-3 mb-3">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar name={c.author_name} image={c.author_image} size="sm" />
                  <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-700">{c.author_name}</span>
                      <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString('pl')}</span>
                    </div>
                    <p className="text-sm text-gray-700">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newComment} onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addComment()}
                placeholder="Napisz komentarz..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400" />
              <Button size="sm" onClick={addComment}>Wyślij</Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-52 flex-shrink-0 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1"><Flag size={12} /> Priorytet</p>
            {editing ? (
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="low">Niski</option>
                <option value="medium">Średni</option>
                <option value="high">Wysoki</option>
                <option value="urgent">Pilny</option>
              </select>
            ) : (
              <div onClick={() => setEditing(true)} className="cursor-pointer">
                <PriorityBadge priority={priority} />
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1"><Calendar size={12} /> Termin</p>
            {editing ? (
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400" />
            ) : (
              <p className="text-xs text-gray-700 cursor-pointer hover:text-indigo-600" onClick={() => setEditing(true)}>
                {dueDate ? new Date(dueDate).toLocaleDateString('pl') : <span className="text-gray-400">Brak terminu</span>}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1"><User size={12} /> Przypisany</p>
            {editing ? (
              <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="">Nikt</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            ) : (
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEditing(true)}>
                {task.assignee_name ? (
                  <>
                    <Avatar name={task.assignee_name} image={task.assignee_image} size="sm" />
                    <span className="text-xs text-gray-700">{task.assignee_name}</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">Nieprzypisany</span>
                )}
              </div>
            )}
          </div>

          {editing && (
            <div className="flex flex-col gap-2 pt-2">
              <Button size="sm" onClick={save} loading={saving}>Zapisz</Button>
              <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Anuluj</Button>
            </div>
          )}

          <div className="pt-4 border-t">
            <button onClick={onDelete}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors">
              <Trash2 size={13} /> Usuń zadanie
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
