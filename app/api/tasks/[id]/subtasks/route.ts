import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { cuid } from '@/lib/utils'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { title } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Tytuł wymagany' }, { status: 400 })

  const [maxRow] = await sql`SELECT MAX(sub_order) as m FROM subtasks WHERE task_id = ${id}`
  const maxOrder = (maxRow?.m as number | null) ?? -1

  const subId = cuid()
  await sql`INSERT INTO subtasks (id, task_id, title, sub_order) VALUES (${subId}, ${id}, ${title.trim()}, ${maxOrder + 1})`

  const [sub] = await sql`SELECT * FROM subtasks WHERE id = ${subId}`
  return NextResponse.json(sub, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subtaskId, done } = await req.json()
  await sql`UPDATE subtasks SET done = ${done ? true : false} WHERE id = ${subtaskId}`
  return NextResponse.json({ success: true })
}
