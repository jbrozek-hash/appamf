'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, FolderKanban, MessageSquare, Calendar,
  Plus, LogOut, ChevronDown, ChevronRight, Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from './ui/Badge'

interface Workspace {
  id: string
  name: string
  slug: string
}

interface Project {
  id: string
  name: string
  color: string
}

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsOpen, setProjectsOpen] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(u => {
      if (u) {
        setUser(u)
        fetch('/api/workspaces').then(r => r.json()).then(ws => {
          if (ws.length > 0) {
            setWorkspace(ws[0])
            fetch(`/api/projects?workspaceId=${ws[0].id}`).then(r => r.json()).then(setProjects)
          }
        })
      }
    })
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/chat', icon: MessageSquare, label: 'Czat' },
    { href: '/calendar', icon: Calendar, label: 'Kalendarz' },
  ]

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Workspace header */}
      <div className="px-4 py-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-sm font-bold">
            {workspace?.name?.[0] ?? 'W'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{workspace?.name ?? 'Wczytywanie...'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname.startsWith(href) ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}>
            <Icon size={18} />
            {label}
          </Link>
        ))}

        {/* Projects */}
        <div className="pt-4">
          <button
            onClick={() => setProjectsOpen(!projectsOpen)}
            className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200"
          >
            <span>Projekty</span>
            {projectsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {projectsOpen && (
            <div className="mt-1 space-y-0.5">
              {projects.map(p => (
                <Link key={p.id} href={`/projects/${p.id}`}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                    pathname === `/projects/${p.id}` ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="truncate">{p.name}</span>
                </Link>
              ))}
              <Link href="/projects/new"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                <Plus size={16} />
                Nowy projekt
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-800 cursor-pointer">
          <Avatar name={user?.name} image={user?.image} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name ?? 'Użytkownik'}</p>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-white transition-colors" title="Wyloguj">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
