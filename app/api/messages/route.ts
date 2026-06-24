import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { cuid } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const channelId = req.nextUrl.searchParams.get('channelId')
  if (!channelId) return NextResponse.json({ error: 'channelId required' }, { status: 400 })

  const messages = await sql`
    SELECT m.*, u.name as author_name, u.image as author_image
    FROM messages m JOIN users u ON u.id = m.author_id
    WHERE m.channel_id = ${channelId}
    ORDER BY m.created_at DESC
    LIMIT 100
  `

  return NextResponse.json(messages.reverse())
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channelId, content } = await req.json()
  if (!channelId || !content?.trim()) return NextResponse.json({ error: 'Wymagane pola' }, { status: 400 })

  const msgId = cuid()
  await sql`INSERT INTO messages (id, channel_id, author_id, content) VALUES (${msgId}, ${channelId}, ${session.id}, ${content.trim()})`

  const [message] = await sql`
    SELECT m.*, u.name as author_name, u.image as author_image
    FROM messages m JOIN users u ON u.id = m.author_id
    WHERE m.id = ${msgId}
  `
  return NextResponse.json(message, { status: 201 })
}
