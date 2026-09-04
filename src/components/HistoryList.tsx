'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Report } from '@/types'
import { listReports, deleteReport } from '@/services/reports'

const PAGE_SIZE = 7

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  daily: {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    color: 'text-teal-600',
  },
  weekly: {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    color: 'text-blue-500',
  },
  monthly: {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    color: 'text-amber-500',
  },
}

export default function HistoryList({ refreshKey, onLoad }: { refreshKey: number; onLoad: (content: string, reportId: number) => void }) {
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = useCallback(async (p: number, q?: string) => {
    setLoading(true)
    const res = await listReports(filter || undefined, p, PAGE_SIZE, undefined, undefined, q || undefined)
    setReports(res.data)
    setTotal(res.total)
    setLoading(false)
  }, [filter])

  useEffect(() => { setPage(1); load(1) }, [filter, refreshKey, load])

  const handleSearch = (value: string) => {
    setSearch(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setPage(1); load(1, value) }, 300)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条报告？')) return
    await deleteReport(id)
    const nextTotal = total - 1
    const nextPage = Math.max(1, Math.min(page, Math.ceil(nextTotal / PAGE_SIZE)))
    setTotal(nextTotal)
    if (nextPage !== page) { setPage(nextPage); load(nextPage, search) }
    else setReports(prev => prev.filter(r => r.id !== id))
  }


  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900">📚 历史报告</h2>
        <div className="flex gap-1.5">
          {[{ v: '', l: '全部' }, { v: 'daily', l: '日报' }, { v: 'weekly', l: '周报' }, { v: 'monthly', l: '月报' }].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${filter === f.v ? 'bg-teal-100 text-teal-600 font-medium' : 'text-gray-400 hover:text-gray-600'}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" value={search} onChange={e => handleSearch(e.target.value)} placeholder="搜索报告标题或内容…"
          className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors" />
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">加载中…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">{search ? '未找到匹配的报告' : '暂无历史报告'}</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[400px] overflow-auto">
          {reports.map(r => {
            const cfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.daily
            return (
              <div key={r.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-teal-50/60 group transition-colors">
                <span className={cfg.color}>{cfg.icon}</span>
                <span className="flex-1 text-xs text-gray-600 truncate">{(r.content || '').replace(/[#*\n]/g, ' ').slice(0, 60) || '无内容'}</span>
                <button onClick={() => onLoad(r.content, r.id)} className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors cursor-pointer shrink-0">查看</button>
                <button onClick={() => handleDelete(r.id)} className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-red-500 transition-all cursor-pointer shrink-0">删除</button>
              </div>
            )
          })}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">共 {total} 条</span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p, search) }}
              className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">上一页</button>
            <span className="text-xs text-gray-400 px-2">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => { const p = page + 1; setPage(p); load(p, search) }}
              className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">下一页</button>
          </div>
        </div>
      )}
    </div>
  )
}
