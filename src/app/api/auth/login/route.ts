import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { createHash } from 'crypto'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return Response.json({ error: '用户名和密码不能为空' }, { status: 400 })
  }

  const db = getDb()
  const hash = createHash('sha256').update(password).digest('hex')
  const user = db.prepare('SELECT id, username FROM users WHERE username = ? AND password = ?').get(username, hash) as { id: number; username: string } | undefined

  if (!user) {
    return Response.json({ error: '用户名或密码错误' }, { status: 401 })
  }

  return Response.json({ id: user.id, username: user.username })
}
