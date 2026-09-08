'use client'
import type { Report } from '@/types'

const BASE = '/api/reports'

function getHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  try {
    const s = localStorage.getItem('settings')
    if (s) { const { userId } = JSON.parse(s); if (userId) h['x-user-id'] = String(userId) }
  } catch {}
  return h
}

function getUserParams(): Record<string, string> {
  try {
    const s = localStorage.getItem('settings')
    if (s) { const { userId } = JSON.parse(s); if (userId) return { userId: String(userId) } }
  } catch {}
  return {}
}

export async function listReports(type?: string, page = 1, pageSize = 20, startDate?: string, endDate?: string, q?: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), ...getUserParams() })
  if (type) params.set('type', type)
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)
  if (q) params.set('q', q)
  const res = await fetch(`${BASE}?${params}`)
  return res.json() as Promise<{ data: Report[]; total: number; page: number; pageSize: number }>
}

export async function createReport(data: Partial<Report>) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ ...data, userId: getUserParams().userId }),
  })
  return res.json() as Promise<Report>
}

export async function updateReport(id: number, data: Partial<Report>) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  return res.json() as Promise<Report>
}

export async function deleteReport(id: number) {
  await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: getHeaders() })
}
