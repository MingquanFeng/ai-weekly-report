import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const page = Number(searchParams.get('page') || '1')
  const pageSize = Number(searchParams.get('pageSize') || '50')
  const offset = (page - 1) * pageSize

  const db = getDb()
  let sql = 'SELECT * FROM reports'
  const params: string[] = []

  if (type) {
    sql += ' WHERE type = ?'
    params.push(type)
  }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(String(pageSize), String(offset))

  const data = db.prepare(sql).all(...params)

  let countSql = 'SELECT COUNT(*) as total FROM reports'
  const countParams: string[] = []
  if (type) { countSql += ' WHERE type = ?'; countParams.push(type) }
  const { total } = db.prepare(countSql).get(...countParams) as { total: number }

  return Response.json({ data, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, title, content, items, plan, issues, summary, provider } = body

  const db = getDb()
  const result = db.prepare(`
    INSERT INTO reports (type, title, content, items, plan, issues, summary, provider)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    type || 'daily', title || '', content || '',
    JSON.stringify(items || []), plan || '', issues || '',
    summary || '', provider || 'deepseek'
  )

  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid)
  return Response.json(row, { status: 201 })
}
