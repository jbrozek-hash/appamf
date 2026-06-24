import { cookies } from 'next/headers'
import { cache } from 'react'
import sql from './db'

export interface SessionUser {
  id: string
  name: string | null
  email: string
  image: string | null
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value
  if (!token) return null

  const rows = await sql`
    SELECT u.id, u.name, u.email, u.image
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > NOW()
  `

  return (rows[0] as SessionUser) ?? null
})

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  return session
}
