import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [task] = await sql`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN users c ON c.id = t.creator_id
    WHERE t.id = ${id}
  `
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const subtasks = await sql`SELECT * FROM subtasks WHERE task_id = ${id} ORDER BY sub_order`
  const comments = await sql`
    SELECT cm.*, u.name as author_name, u.image as author_image
    FROM comments cm JOIN users u ON u.id = cm.author_id
    WHERE cm.task_id = ${id} ORDER BY cm.created_at
  `

  return NextResponse.json({ task, subtasks, comments })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const allowed = ['title', 'description', 'priority', 'column_id', 'assignee_id', 'due_date', 'task_order']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 })

  await sql`UPDATE tasks SET ${sql(updates)}, updated_at = NOW() WHERE id = ${id}`
  const [task] = await sql`SELECT * FROM tasks WHERE id = ${id}`
  return NextResponse.json(task)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM tasks WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
