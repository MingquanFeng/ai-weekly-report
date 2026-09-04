'use client'
import { useState, useEffect } from 'react'
import type { Report } from '@/types'
import { listReports, deleteReport } from '@/services/reports'

const PAGE_SIZE = 7

export default function HistoryList({ refreshKey, onLoad }: { refreshKey: number; onLoad: (content: string, reportId: number) => void }) {
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = async (p = page) => {
    setLoading(true)
    const res = await listReports(filter || undefined, p, PAGE_SIZE)
    setReports(res.data)
    setTotal(res.total)
    setLoading(false)
  }

  useEffect(() => { setPage(1); load(1) }, [filter, refreshKey])

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条报告？')) return
    await deleteReport(id)
    const nextTotal = total - 1
    const nextPage = Math.max(1, Math.min(page, Math.ceil(nextTotal / PAGE_SIZE)))
    setTotal(nextTotal)
    if (nextPage !== page) { setPage(nextPage); load(nextPage) }
    else setReports(prev => prev.filter(r => r.id !== id))
  }

  const typeLabel = (t: string) => t === 'daily' ? '📅 日报' : t === 'weekly' ? '📋 周报' : '📊 月报'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">📚 历史报告</h2>
        <div className="flex gap-1.5">
          {[{ v: '', l: '全部' }, { v: 'daily', l: '日报' }, { v: 'weekly', l: '周报' }, { v: 'monthly', l: '月报' }].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${filter === f.v ? 'bg-violet-100 text-violet-600 font-medium' : 'text-gray-400 hover:text-gray-600'}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">加载中…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">暂无历史报告</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[400px] overflow-auto">
          {reports.map(r => (
            <div key={r.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 group transition-colors">
              <span className="text-sm">{typeLabel(r.type)}</span>
              <span className="flex-1 text-sm text-gray-700 truncate">{r.title || '未命名'}</span>
              <span className="text-xs text-gray-400 shrink-0">{r.created_at?.slice(0, 10)}</span>
              <button onClick={() => onLoad(r.content, r.id)} className="text-xs text-violet-500 hover:text-violet-700 transition-colors cursor-pointer shrink-0">查看</button>
              <button onClick={() => handleDelete(r.id)} className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-red-500 transition-all cursor-pointer shrink-0">删除</button>
            </div>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">共 {total} 条</span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p) }}
              className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">上一页</button>
            <span className="text-xs text-gray-400 px-2">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => { const p = page + 1; setPage(p); load(p) }}
              className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">下一页</button>
          </div>
        </div>
      )}
    </div>
  )
}
