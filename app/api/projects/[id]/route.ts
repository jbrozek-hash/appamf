import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [project] = await sql`
    SELECT p.* FROM projects p
    JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
    WHERE p.id = ${id} AND wm.user_id = ${session.id}
  `
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const columns = await sql`SELECT * FROM columns WHERE project_id = ${id} ORDER BY col_order`
  const tasks = await sql`
    SELECT t.*, u.name as assignee_name, u.image as assignee_image
    FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
    WHERE t.project_id = ${id} ORDER BY t.task_order
  `
  const subtasks = await sql`
    SELECT s.* FROM subtasks s JOIN tasks t ON t.id = s.task_id WHERE t.project_id = ${id}
  `

  return NextResponse.json({ project, columns, tasks, subtasks })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await sql`UPDATE projects SET status = 'archived' WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
