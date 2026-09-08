import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { createHash } from 'crypto'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return Response.json({ error: '用户名和密码不能为空' }, { status: 400 })
  }
  if (username.length < 2 || username.length > 20) {
    return Response.json({ error: '用户名长度 2-20 个字符' }, { status: 400 })
  }
  if (password.length < 4) {
    return Response.json({ error: '密码至少 4 个字符' }, { status: 400 })
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    return Response.json({ error: '用户名已存在' }, { status: 409 })
  }

  const hash = createHash('sha256').update(password).digest('hex')
  const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hash)

  return Response.json({ id: result.lastInsertRowid, username }, { status: 201 })
}
