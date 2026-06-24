'use client'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { PriorityBadge } from '@/components/ui/Badge'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  due_date: string
  priority: string
  project_name: string
  project_color: string
  project_id: string
}

const DAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie']
const MONTHS = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [current, setCurrent] = useState(new Date())
  const [selected, setSelected] = useState<Date | null>(null)

  useEffect(() => {
    fetch('/api/workspaces').then(r => r.json()).then(ws => {
      if (!ws.length) return
      fetch(`/api/projects?workspaceId=${ws[0].id}`).then(r => r.json()).then(async (projects) => {
        const allTasks: Task[] = []
        for (const p of projects) {
          const data = await fetch(`/api/projects/${p.id}`).then(r => r.json())
          if (data.tasks) {
            allTasks.push(...data.tasks.filter((t: any) => t.due_date).map((t: any) => ({
              ...t, project_name: p.name, project_color: p.color, project_id: p.id
            })))
          }
        }
        setTasks(allTasks)
      })
    })
  }, [])

  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = (firstDay.getDay() + 6) % 7
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7

  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const day = i - startPad + 1
    return day < 1 || day > lastDay.getDate() ? null : new Date(year, month, day)
  })

  const tasksForDate = (date: Date) => tasks.filter(t => {
    const d = new Date(t.due_date)
    return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate()
  })

  const selectedTasks = selected ? tasksForDate(selected) : []
  const today = new Date()

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <CalendarIcon size={22} className="text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Kalendarz</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrent(new Date(year, month - 1))} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">{MONTHS[month]} {year}</h2>
            <button onClick={() => setCurrent(new Date(year, month + 1))} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-xs font-medium text-gray-400 text-center py-1">{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <div key={i} className="aspect-square" />
              const dayTasks = tasksForDate(date)
              const isToday = date.toDateString() === today.toDateString()
              const isSelected = selected?.toDateString() === date.toDateString()
              const hasOverdue = dayTasks.some(t => new Date(t.due_date) < today)
              return (
                <button key={i} onClick={() => setSelected(date)}
                  className={`aspect-square flex flex-col items-center justify-start p-1 rounded-lg transition-all ${isSelected ? 'bg-indigo-600 text-white' : isToday ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}>
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : ''}`}>{date.getDate()}</span>
                  {dayTasks.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayTasks.slice(0, 3).map((t, j) => (
                        <span key={j} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : ''}`}
                          style={{ backgroundColor: isSelected ? undefined : t.project_color }} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected day tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            {selected ? selected.toLocaleDateString('pl', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Wybierz dzień'}
          </h3>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {selected ? 'Brak zadań w tym dniu' : 'Kliknij na dzień aby zobaczyć zadania'}
            </p>
          ) : (
            <div className="space-y-3">
              {selectedTasks.map(t => (
                <Link key={t.id} href={`/projects/${t.project_id}`}
                  className="block p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{t.title}</p>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.project_color }} />
                    <span className="text-xs text-gray-500">{t.project_name}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Upcoming */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Nadchodzące (7 dni)</h4>
            {tasks
              .filter(t => {
                const d = new Date(t.due_date)
                const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                return diff >= 0 && diff <= 7
              })
              .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
              .slice(0, 5)
              .map(t => (
                <div key={t.id} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                  <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: t.project_color }} />
                  <div>
                    <p className="text-xs font-medium text-gray-800">{t.title}</p>
                    <p className="text-xs text-gray-400">{new Date(t.due_date).toLocaleDateString('pl')}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
