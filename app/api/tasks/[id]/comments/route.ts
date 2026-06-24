import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { cuid } from '@/lib/utils'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Treść wymagana' }, { status: 400 })

  const commentId = cuid()
  await sql`INSERT INTO comments (id, task_id, author_id, content) VALUES (${commentId}, ${id}, ${session.id}, ${content.trim()})`

  const [comment] = await sql`
    SELECT cm.*, u.name as author_name, u.image as author_image
    FROM comments cm JOIN users u ON u.id = cm.author_id
    WHERE cm.id = ${commentId}
  `
  return NextResponse.json(comment, { status: 201 })
}
