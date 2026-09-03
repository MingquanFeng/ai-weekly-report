'use client'
import type { Report } from '@/types'

const BASE = '/api/reports'

export async function listReports(type?: string) {
  const url = type ? `${BASE}?type=${type}` : BASE
  const res = await fetch(url)
  return res.json() as Promise<{ data: Report[]; total: number }>
}

export async function createReport(data: Partial<Report>) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json() as Promise<Report>
}

export async function deleteReport(id: number) {
  await fetch(`${BASE}/${id}`, { method: 'DELETE' })
}
