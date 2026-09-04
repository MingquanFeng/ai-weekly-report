import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const q = searchParams.get('q')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const page = Number(searchParams.get('page') || '1')
  const pageSize = Number(searchParams.get('pageSize') || '50')
  const offset = (page - 1) * pageSize

  const db = getDb()
  let sql = 'SELECT * FROM reports'
  let countSql = 'SELECT COUNT(*) as total FROM reports'
  const conditions: string[] = []
  const params: string[] = []
  const countParams: string[] = []

  if (type) { conditions.push('type = ?'); params.push(type); countParams.push(type) }
  if (q) { conditions.push('(title LIKE ? OR content LIKE ?)'); const like = `%${q}%`; params.push(like, like); countParams.push(like, like) }
  if (startDate) { conditions.push('created_at >= ?'); params.push(startDate); countParams.push(startDate) }
  if (endDate) { conditions.push('created_at <= ?'); params.push(endDate + ' 23:59:59'); countParams.push(endDate + ' 23:59:59') }

  if (conditions.length > 0) {
    const where = ' WHERE ' + conditions.join(' AND ')
    sql += where
    countSql += where
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(String(pageSize), String(offset))

  const data = db.prepare(sql).all(...params)
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
