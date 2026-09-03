import { useState } from 'react'
import type { ReportType } from '../types'

interface Props {
  content: string
  loading: boolean
  reportType: ReportType
  onRegenerate?: () => void
}

export default function Preview({ content, loading, reportType }: Props) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')

  const handleCopy = async () => {
    if (!content) return
    await navigator.clipboard.writeText(editing ? editContent : content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEdit = () => {
    if (editing) {
      setEditing(false)
    } else {
      setEditContent(content)
      setEditing(true)
    }
  }

  const handleDownload = () => {
    const text = editing ? editContent : content
    if (!text) return
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const firstLine = text.split('\n')[0] || 'report'
    const safeName = firstLine.replace(/^#+\s*/, '').replace(/[\/\\?%*:|"<>]/g, '-') || 'report'
    a.download = `${safeName}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const reportLabel = reportType === 'daily' ? '日报' : reportType === 'weekly' ? '周报' : '月报'

  return (
    <div className="bg-white rounded-2xl border border-border p-6 flex flex-col gap-4 overflow-auto shadow-sm">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <span className="text-base font-bold text-text">AI 报告预览</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!content}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-alt hover:border-primary-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copied ? '已复制' : '复制'}
          </button>
          <button
            onClick={handleEdit}
            disabled={!content}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-alt hover:border-primary-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {editing ? '完成' : '编辑'}
          </button>
          <button
            onClick={handleDownload}
            disabled={!content}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-alt hover:border-primary-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导出
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 min-h-[400px] border border-border-light rounded-xl p-6 overflow-auto bg-surface-alt/50">
        {loading && !content && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-sm text-text-muted">AI 正在生成{reportLabel}…</p>
          </div>
        )}
        {!loading && !content && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <p className="text-sm text-text-secondary font-medium">在左侧填写工作内容</p>
            <p className="text-xs text-text-muted">点击「生成」后这里会实时显示 AI 生成的{reportLabel}</p>
          </div>
        )}
        {content && editing && (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full h-full min-h-[350px] bg-transparent text-sm text-text font-mono resize-none outline-none leading-relaxed"
          />
        )}
        {content && !editing && (
          <div className="text-sm text-text leading-relaxed whitespace-pre-wrap font-[system-ui]">
            {renderReport(content)}
          </div>
        )}
      </div>

      {/* 底部操作 */}
      {content && !loading && (
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg border border-primary-200 text-primary hover:bg-primary-50 transition-colors cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              AI 优化表达
            </button>
            <button className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg border border-border text-text-secondary hover:bg-surface-alt transition-colors cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              重新生成
            </button>
          </div>
          <span className="text-xs text-text-muted">内容由 AI 生成，仅供参考</span>
        </div>
      )}
    </div>
  )
}

/** 简单的 Markdown 渲染（加粗、列表） */
function renderReport(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    if (!trimmed) {
      elements.push(<div key={i} className="h-3" />)
      return
    }

    // H1
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-xl font-bold text-text mt-2 mb-3">
          {renderInline(trimmed.slice(2))}
        </h1>
      )
      return
    }

    // H2
    if (trimmed.startsWith('## ')) {
      elements.push(
        <div key={i} className="flex items-center gap-2 mt-5 mb-2.5">
          <div className="w-1.5 h-4 rounded-full bg-primary" />
          <h2 className="text-base font-bold text-text">{renderInline(trimmed.slice(3))}</h2>
        </div>
      )
      return
    }

    // Bullet list
    if (trimmed.startsWith('- ')) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1 mb-1.5">
          <span className="text-primary mt-0.5">•</span>
          <span className="text-sm text-text leading-relaxed">{renderInline(trimmed.slice(2))}</span>
        </div>
      )
      return
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/)
    if (numMatch) {
      elements.push(
        <div key={i} className="flex gap-2.5 ml-1 mb-2">
          <span className="text-sm font-semibold text-primary min-w-[18px]">{numMatch[1]}.</span>
          <span className="text-sm font-medium text-text">{renderInline(numMatch[2])}</span>
        </div>
      )
      return
    }

    // Normal text
    elements.push(
      <p key={i} className="text-sm text-text leading-relaxed mb-1">{renderInline(trimmed)}</p>
    )
  })

  return elements
}

function renderInline(text: string) {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}
