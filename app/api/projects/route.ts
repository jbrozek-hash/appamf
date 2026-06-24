import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { cuid } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })

  const projects = await sql`
    SELECT p.* FROM projects p
    JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
    WHERE p.workspace_id = ${workspaceId} AND wm.user_id = ${session.id} AND p.status = 'active'
    ORDER BY p.created_at
  `

  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId, name, description, color } = await req.json()
  if (!workspaceId || !name) return NextResponse.json({ error: 'Wymagane pola' }, { status: 400 })

  const member = await sql`SELECT id FROM workspace_members WHERE workspace_id = ${workspaceId} AND user_id = ${session.id}`
  if (member.length === 0) return NextResponse.json({ error: 'Brak dostępu' }, { status: 403 })

  const projectId = cuid()
  await sql`INSERT INTO projects (id, workspace_id, name, description, color) VALUES (${projectId}, ${workspaceId}, ${name}, ${description ?? null}, ${color ?? '#6366f1'})`

  const cols = ['Do zrobienia', 'W toku', 'Przegląd', 'Zrobione']
  const colColors = ['#e5e7eb', '#fef3c7', '#dbeafe', '#dcfce7']
  for (let i = 0; i < cols.length; i++) {
    await sql`INSERT INTO columns (id, project_id, name, col_order, color) VALUES (${cuid()}, ${projectId}, ${cols[i]}, ${i}, ${colColors[i]})`
  }

  const [project] = await sql`SELECT * FROM projects WHERE id = ${projectId}`
  return NextResponse.json(project, { status: 201 })
}
