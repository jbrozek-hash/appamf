import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import Link from 'next/link'
import { FolderKanban, CheckSquare, Clock, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  const workspaces = await sql`
    SELECT w.* FROM workspaces w
    JOIN workspace_members wm ON wm.workspace_id = w.id
    WHERE wm.user_id = ${session.id}
  `

  const wsId = (workspaces[0] as any)?.id

  const stats = wsId ? {
    projects: Number(((await sql`SELECT COUNT(*) as c FROM projects WHERE workspace_id = ${wsId} AND status = 'active'`)[0] as any)?.c ?? 0),
    tasks: Number(((await sql`
      SELECT COUNT(*) as c FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE p.workspace_id = ${wsId} AND t.creator_id = ${session.id}
    `)[0] as any)?.c ?? 0),
    myTasks: Number(((await sql`
      SELECT COUNT(*) as c FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE p.workspace_id = ${wsId} AND t.assignee_id = ${session.id}
    `)[0] as any)?.c ?? 0),
    overdue: Number(((await sql`
      SELECT COUNT(*) as c FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE p.workspace_id = ${wsId}
        AND t.due_date IS NOT NULL
        AND t.due_date < NOW()::text
        AND t.column_id NOT IN (
          SELECT id FROM columns WHERE name = 'Zrobione'
        )
    `)[0] as any)?.c ?? 0),
  } : { projects: 0, tasks: 0, myTasks: 0, overdue: 0 }

  const recentTasks = wsId ? await sql`
    SELECT t.*, p.name as project_name, p.color as project_color, c.name as column_name
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    JOIN columns c ON c.id = t.column_id
    WHERE p.workspace_id = ${wsId} AND (t.creator_id = ${session.id} OR t.assignee_id = ${session.id})
    ORDER BY t.updated_at DESC
    LIMIT 8
  ` : []

  const projects = wsId ? await sql`
    SELECT p.*, COUNT(t.id) as task_count
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    WHERE p.workspace_id = ${wsId} AND p.status = 'active'
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT 4
  ` : []

  const statCards = [
    { label: 'Projekty', value: stats.projects, icon: FolderKanban, color: 'bg-indigo-500' },
    { label: 'Moje zadania', value: stats.myTasks, icon: CheckSquare, color: 'bg-emerald-500' },
    { label: 'Przeterminowane', value: stats.overdue, icon: Clock, color: 'bg-red-500' },
    { label: 'Wszystkie zadania', value: stats.tasks, icon: TrendingUp, color: 'bg-blue-500' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Witaj, {session.name ?? 'Użytkowniku'} 👋</h1>
        <p className="text-gray-500 mt-1">Masz przegląd całego workspace&apos;a poniżej.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`${color} p-3 rounded-xl`}>
                <Icon className="text-white" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent tasks */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Ostatnia aktywność</h2>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Brak zadań</p>
          ) : (
            <div className="space-y-3">
              {(recentTasks as any[]).map((t: any) => (
                <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <span className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: t.project_color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                    <p className="text-xs text-gray-400">{t.project_name} · {t.column_name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    t.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    t.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {t.priority === 'urgent' ? 'Pilny' : t.priority === 'high' ? 'Wysoki' : t.priority === 'medium' ? 'Średni' : 'Niski'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Projekty</h2>
            <Link href="/projects/new" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ Nowy</Link>
          </div>
          {projects.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Brak projektów</p>
          ) : (
            <div className="space-y-3">
              {(projects as any[]).map((p: any) => (
                <Link key={p.id} href={`/projects/${p.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: p.color }}>
                    {p.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{Number(p.task_count)} zadań</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
