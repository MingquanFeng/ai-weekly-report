'use client'
import { useState } from 'react'
import type { ProviderId, ReportType } from '@/types'
import { generateReport } from '@/services/ai'
import { updateReport } from '@/services/reports'

interface Props {
  content: string
  loading: boolean
  reportType: ReportType
  providerId: ProviderId
  apiKey: string
  reportId: number | null
  customSystemPrompt?: string
  onContentChange: (content: string) => void
  onRegenerate: () => void
}

export default function Preview({ content, loading, reportType, providerId, apiKey, reportId, customSystemPrompt, onContentChange, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [optimizing, setOptimizing] = useState(false)

  const handleCopy = async () => { await navigator.clipboard.writeText(editing ? editContent : content); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const handleEdit = () => {
    if (editing) {
      onContentChange(editContent)
      if (reportId) updateReport(reportId, { content: editContent })
      setEditing(false)
    } else {
      setEditContent(content)
      setEditing(true)
    }
  }
  const handleDownload = () => { const text = editing ? editContent : content; if (!text) return; const blob = new Blob([text], { type: 'text/markdown' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${(text.split('\n')[0] || 'report').replace(/^#+\s*/, '').replace(/[\/\\?%*:|"<>]/g, '-')}.md`; a.click(); URL.revokeObjectURL(url) }

  const handleOptimize = async () => {
    if (!apiKey || !content || optimizing) return
    setOptimizing(true)
    let optimized = ''
    try {
      await generateReport(providerId, apiKey, reportType, [{ text: content, type: '优化' }], '', '', '', new Date().toISOString().slice(0, 10), chunk => { optimized += chunk }, customSystemPrompt)
      if (optimized) {
        onContentChange(optimized)
        if (reportId) await updateReport(reportId, { content: optimized })
      }
    } catch (e) {
      alert(`优化失败: ${(e as Error).message}`)
    } finally {
      setOptimizing(false)
    }
  }

  const busy = loading || optimizing

  const rl = reportType === 'daily' ? '日报' : reportType === 'weekly' ? '周报' : '月报'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4 overflow-auto shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="text-lg">✨</span><span className="text-base font-bold text-gray-900">AI 报告预览</span></div>
        <div className="flex items-center gap-2">
          {[
            { icon: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>, label: copied ? '已复制' : '复制', onClick: handleCopy },
            { icon: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>, label: editing ? '完成' : '编辑', onClick: handleEdit },
            { icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>, label: '导出', onClick: handleDownload },
          ].map((btn, i) => (
            <button key={i} onClick={btn.onClick} disabled={!content}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-teal-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">{btn.icon}</svg>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[400px] border border-gray-100 rounded-xl p-6 overflow-auto bg-gray-50/50">
        {busy && !content && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="flex gap-1.5">{[0,150,300].map(d => <div key={d} className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
            <p className="text-sm text-gray-400">AI 正在生成{rl}…</p>
          </div>
        )}
        {!busy && !content && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <p className="text-sm text-gray-600 font-medium">在左侧填写工作内容</p>
            <p className="text-xs text-gray-400">点击「生成」后这里会实时显示 AI 生成的{rl}</p>
          </div>
        )}
        {content && editing && <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full h-full min-h-[350px] bg-transparent text-sm text-gray-900 font-mono resize-none outline-none leading-relaxed" />}
        {content && !editing && <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{renderReport(content)}</div>}
      </div>

      {content && (
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={handleOptimize} disabled={!apiKey || busy}
              className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg border border-teal-200 text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              {optimizing ? (
                <span className="flex gap-1">{[0,100,200].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              )}
              {optimizing ? 'AI 优化中…' : 'AI 优化表达'}
            </button>
            <button onClick={onRegenerate} disabled={!apiKey || busy}
              className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              重新生成
            </button>
          </div>
          <span className="text-xs text-gray-400">内容由 AI 生成，仅供参考</span>
        </div>
      )}
    </div>
  )
}

function renderReport(text: string) {
  const elements: React.ReactNode[] = []
  text.split('\n').forEach((line, i) => {
    const t = line.trim()
    if (!t) { elements.push(<div key={i} className="h-3" />); return }
    if (t.startsWith('# ')) { elements.push(<h1 key={i} className="text-xl font-bold text-gray-900 mt-2 mb-3">{t.slice(2)}</h1>); return }
    if (t.startsWith('## ')) { elements.push(<div key={i} className="flex items-center gap-2 mt-5 mb-2.5"><div className="w-1.5 h-4 rounded-full bg-teal-500"/><h2 className="text-base font-bold text-gray-900">{t.slice(3)}</h2></div>); return }
    if (t.startsWith('- ')) { elements.push(<div key={i} className="flex gap-2 ml-1 mb-1.5"><span className="text-teal-500 mt-0.5">•</span><span className="text-sm text-gray-900 leading-relaxed">{t.slice(2)}</span></div>); return }
    const numMatch = t.match(/^(\d+)\.\s+(.+)/)
    if (numMatch) { elements.push(<div key={i} className="flex gap-2.5 ml-1 mb-2"><span className="text-sm font-semibold text-teal-600 min-w-[18px]">{numMatch[1]}.</span><span className="text-sm font-medium text-gray-900">{numMatch[2]}</span></div>); return }
    elements.push(<p key={i} className="text-sm text-gray-900 leading-relaxed mb-1">{t}</p>)
  })
  return elements
}
