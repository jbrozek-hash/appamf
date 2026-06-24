import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value
  if (token) {
    await sql`DELETE FROM sessions WHERE token = ${token}`
  }
  const response = NextResponse.json({ success: true })
  response.cookies.delete('session_token')
  return response
}
