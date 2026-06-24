'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const COLORS = ['#6366f1', '#ec4899', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ef4444']

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [workspaceId, setWorkspaceId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/workspaces').then(r => r.json()).then(ws => {
      if (ws.length > 0) setWorkspaceId(ws[0].id)
    })
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, name: name.trim(), description, color }),
    })
    const data = await res.json()
    if (res.ok) {
      router.push(`/projects/${data.id}`)
    } else {
      setError(data.error)
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nowy projekt</h1>
      </div>
      <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <Input label="Nazwa projektu *" value={name} onChange={e => setName(e.target.value)} placeholder="np. Marketing Q4" required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Opis (opcjonalnie)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            rows={3} placeholder="Krótki opis projektu..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kolor</label>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading} className="flex-1">Utwórz projekt</Button>
          <Link href="/dashboard">
            <Button type="button" variant="secondary">Anuluj</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
