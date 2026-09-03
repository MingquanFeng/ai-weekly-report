'use client'
import { useState, useEffect } from 'react'
import type { Report } from '@/types'
import { listReports, deleteReport } from '@/services/reports'

export default function HistoryList({ onLoad }: { onLoad: (content: string) => void }) {
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await listReports(filter || undefined)
    setReports(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条报告？')) return
    await deleteReport(id)
    setReports(prev => prev.filter(r => r.id !== id))
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
              <button onClick={() => onLoad(r.content)} className="opacity-0 group-hover:opacity-100 text-xs text-violet-500 hover:text-violet-700 transition-all cursor-pointer">查看</button>
              <button onClick={() => handleDelete(r.id)} className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-red-500 transition-all cursor-pointer">删除</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
