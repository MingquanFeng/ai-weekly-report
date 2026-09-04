'use client'
import type { Report } from '@/types'

const BASE = '/api/reports'

export async function listReports(type?: string, page = 1, pageSize = 20) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (type) params.set('type', type)
  const res = await fetch(`${BASE}?${params}`)
  return res.json() as Promise<{ data: Report[]; total: number; page: number; pageSize: number }>
}

export async function createReport(data: Partial<Report>) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json() as Promise<Report>
}

export async function updateReport(id: number, data: Partial<Report>) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json() as Promise<Report>
}

export async function deleteReport(id: number) {
  await fetch(`${BASE}/${id}`, { method: 'DELETE' })
}
