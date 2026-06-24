import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { cuid } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, columnId, title, description, priority, assigneeId, dueDate } = await req.json()
  if (!projectId || !columnId || !title) return NextResponse.json({ error: 'Wymagane pola' }, { status: 400 })

  const [maxRow] = await sql`SELECT MAX(task_order) as m FROM tasks WHERE column_id = ${columnId}`
  const maxOrder = (maxRow?.m as number | null) ?? -1

  const taskId = cuid()
  await sql`
    INSERT INTO tasks (id, project_id, column_id, creator_id, assignee_id, title, description, priority, due_date, task_order)
    VALUES (${taskId}, ${projectId}, ${columnId}, ${session.id}, ${assigneeId ?? null}, ${title}, ${description ?? null}, ${priority ?? 'medium'}, ${dueDate ?? null}, ${maxOrder + 1})
  `

  const [task] = await sql`SELECT * FROM tasks WHERE id = ${taskId}`
  return NextResponse.json(task, { status: 201 })
}
