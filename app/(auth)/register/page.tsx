'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, workspaceName }),
    })
    const data = await res.json()
    if (res.ok) {
      // auto-login
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (loginRes.ok) router.push('/dashboard')
    } else {
      setError(data.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-2xl font-bold mb-4 shadow-lg">T</div>
        <h1 className="text-2xl font-bold text-gray-900">Stwórz konto</h1>
        <p className="text-gray-500 mt-1">Zacznij zarządzać projektami już dziś</p>
      </div>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Imię i nazwisko" value={name} onChange={e => setName(e.target.value)} placeholder="Jan Kowalski" required autoFocus />
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jan@firma.pl" required />
          <Input label="Hasło" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 znaków" required minLength={8} />
          <Input label="Nazwa workspace (opcjonalnie)" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} placeholder="np. Moja Firma" />
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>Utwórz konto</Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Masz już konto?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">Zaloguj się</Link>
        </p>
      </div>
    </div>
  )
}
