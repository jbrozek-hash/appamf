import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { notFound } from 'next/navigation'
import KanbanBoard from '@/components/kanban/KanbanBoard'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return null

  const { id } = await params

  const [project] = await sql`
    SELECT p.* FROM projects p
    JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
    WHERE p.id = ${id} AND wm.user_id = ${session.id}
  ` as any[]

  if (!project) notFound()

  const columns = await sql`SELECT * FROM columns WHERE project_id = ${id} ORDER BY col_order`
  const tasks = await sql`
    SELECT t.*, u.name as assignee_name, u.image as assignee_image
    FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
    WHERE t.project_id = ${id} ORDER BY t.task_order
  `
  const subtasks = await sql`
    SELECT s.* FROM subtasks s JOIN tasks t ON t.id = s.task_id WHERE t.project_id = ${id}
  `
  const members = await sql`
    SELECT u.id, u.name, u.image FROM users u
    JOIN workspace_members wm ON wm.user_id = u.id
    WHERE wm.workspace_id = ${project.workspace_id}
  `

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-4 px-6 py-4 border-b bg-white">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: project.color }}>
            {project.name[0]}
          </div>
          <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
          {project.description && <p className="text-sm text-gray-500">— {project.description}</p>}
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
          <span>{tasks.length} zadań</span>
          <span>·</span>
          <span>{members.length} członków</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <KanbanBoard
          projectId={id}
          initialColumns={columns as any[]}
          initialTasks={tasks as any[]}
          initialSubtasks={subtasks as any[]}
          members={members as any[]}
        />
      </div>
    </div>
  )
}
