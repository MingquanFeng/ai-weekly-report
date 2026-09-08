import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const q = searchParams.get('q')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const userId = searchParams.get('userId')
  const page = Number(searchParams.get('page') || '1')
  const pageSize = Number(searchParams.get('pageSize') || '50')
  const offset = (page - 1) * pageSize

  const db = getDb()
  let sql = 'SELECT * FROM reports'
  let countSql = 'SELECT COUNT(*) as total FROM reports'
  const conditions: string[] = []
  const params: string[] = []
  const countParams: string[] = []

  if (userId) { conditions.push('user_id = ?'); params.push(userId); countParams.push(userId) }
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
  const { type, title, content, items, plan, issues, summary, provider, userId } = body

  const db = getDb()
  const reportType = type || 'daily'

  // 查找同类型同周期的已有报告（覆盖写入）
  let periodCondition = ''
  if (reportType === 'daily') {
    periodCondition = "date(created_at) = date('now', 'localtime')"
  } else if (reportType === 'weekly') {
    periodCondition = "strftime('%Y-W%W', created_at) = strftime('%Y-W%W', 'now', 'localtime')"
  } else if (reportType === 'monthly') {
    periodCondition = "strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')"
  }

  const existing = db.prepare(
    `SELECT id FROM reports WHERE type = ? AND ${periodCondition} ${userId ? 'AND user_id = ?' : 'AND user_id IS NULL'}`
  ).get(...[reportType, ...(userId ? [userId] : [])]) as { id: number } | undefined

  if (existing) {
    db.prepare(`
      UPDATE reports SET title=?, content=?, items=?, plan=?, issues=?, summary=?, provider=?,
      updated_at=datetime('now','localtime') WHERE id=?
    `).run(
      title || '', content || '', JSON.stringify(items || []),
      plan || '', issues || '', summary || '', provider || 'deepseek',
      existing.id
    )
    const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(existing.id)
    return Response.json(row)
  }

  const result = db.prepare(`
    INSERT INTO reports (user_id, type, title, content, items, plan, issues, summary, provider)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId || null, reportType, title || '', content || '',
    JSON.stringify(items || []), plan || '', issues || '',
    summary || '', provider || 'deepseek'
  )

  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid)
  return Response.json(row, { status: 201 })
}
