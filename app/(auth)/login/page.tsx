'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (res.ok) {
      router.push('/dashboard')
    } else {
      setError(data.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-2xl font-bold mb-4 shadow-lg">T</div>
        <h1 className="text-2xl font-bold text-gray-900">Witaj z powrotem</h1>
        <p className="text-gray-500 mt-1">Zaloguj się do swojego konta</p>
      </div>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jan@firma.pl" required autoFocus />
          <Input label="Hasło" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>Zaloguj się</Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Nie masz konta?{' '}
          <Link href="/register" className="text-indigo-600 hover:text-indigo-800 font-medium">Zarejestruj się</Link>
        </p>
      </div>
    </div>
  )
}
