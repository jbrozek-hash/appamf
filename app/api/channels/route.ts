import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { cuid } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })

  const channels = await sql`
    SELECT * FROM channels WHERE workspace_id = ${workspaceId}
    ORDER BY is_general DESC, name
  `
  return NextResponse.json(channels)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId, name } = await req.json()
  if (!workspaceId || !name) return NextResponse.json({ error: 'Wymagane pola' }, { status: 400 })

  const id = cuid()
  const slug = name.toLowerCase().replace(/\s+/g, '-')
  await sql`INSERT INTO channels (id, workspace_id, name) VALUES (${id}, ${workspaceId}, ${slug})`

  const [channel] = await sql`SELECT * FROM channels WHERE id = ${id}`
  return NextResponse.json(channel, { status: 201 })
}
