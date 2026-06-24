import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import sql from '@/lib/db'
import { cuid, slugify } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, workspaceName } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Uzupełnij wszystkie pola' }, { status: 400 })
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email już istnieje' }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 10)
    const userId = cuid()
    await sql`INSERT INTO users (id, name, email, password) VALUES (${userId}, ${name}, ${email}, ${hash})`

    const wsName = workspaceName || `${name}'s Workspace`
    const wsId = cuid()
    let slug = slugify(wsName)
    const existingSlug = await sql`SELECT id FROM workspaces WHERE slug = ${slug}`
    if (existingSlug.length > 0) slug = slug + '-' + Date.now()

    await sql`INSERT INTO workspaces (id, name, slug) VALUES (${wsId}, ${wsName}, ${slug})`
    await sql`INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES (${cuid()}, ${wsId}, ${userId}, 'owner')`

    const channelId = cuid()
    await sql`INSERT INTO channels (id, workspace_id, name, is_general) VALUES (${channelId}, ${wsId}, 'general', TRUE)`

    const projectId = cuid()
    await sql`INSERT INTO projects (id, workspace_id, name, description, color) VALUES (${projectId}, ${wsId}, 'Pierwszy Projekt', 'Mój pierwszy projekt', '#6366f1')`

    const cols = [
      { name: 'Do zrobienia', color: '#e5e7eb' },
      { name: 'W toku', color: '#fef3c7' },
      { name: 'Przegląd', color: '#dbeafe' },
      { name: 'Zrobione', color: '#dcfce7' },
    ]
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i]
      await sql`INSERT INTO columns (id, project_id, name, col_order, color) VALUES (${cuid()}, ${projectId}, ${col.name}, ${i}, ${col.color})`
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
