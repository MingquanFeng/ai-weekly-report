import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getDb()
  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(id)
  if (!row) return Response.json({ error: '不存在' }, { status: 404 })
  return Response.json(row)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getDb()
  const existing = db.prepare('SELECT * FROM reports WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) return Response.json({ error: '不存在' }, { status: 404 })

  const body = await req.json()
  const { title, content, items, plan, issues, summary } = body

  db.prepare(`
    UPDATE reports SET title=?, content=?, items=?, plan=?, issues=?, summary=?,
    updated_at=datetime('now','localtime') WHERE id=?
  `).run(
    title ?? existing.title,
    content ?? existing.content,
    JSON.stringify(items ?? JSON.parse(existing.items as string)),
    plan ?? existing.plan,
    issues ?? existing.issues,
    summary ?? existing.summary,
    id
  )

  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(id)
  return Response.json(row)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getDb()
  const existing = db.prepare('SELECT * FROM reports WHERE id = ?').get(id)
  if (!existing) return Response.json({ error: '不存在' }, { status: 404 })
  db.prepare('DELETE FROM reports WHERE id = ?').run(id)
  return Response.json({ success: true })
}
