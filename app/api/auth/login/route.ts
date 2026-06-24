import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import sql from '@/lib/db'
import { cuid } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Nieprawidłowy email lub hasło' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Nieprawidłowy email lub hasło' }, { status: 401 })
    }

    const token = cuid() + cuid()
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await sql`INSERT INTO sessions (id, user_id, token, expires_at) VALUES (${cuid()}, ${user.id}, ${token}, ${expires})`

    const response = NextResponse.json({ success: true })
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
    return response
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
