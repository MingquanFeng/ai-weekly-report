import { useState } from 'react'

interface Props {
  content: string
  loading: boolean
}

export default function Preview({ content, loading }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!content) return
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // 从内容第一行提取文件名
    const firstLine = content.split('\n')[0] || 'report'
    const safeName = firstLine.replace(/^#+\s*/, '').replace(/[\/\\?%*:|"<>]/g, '-') || 'report'
    a.download = `${safeName}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3 overflow-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text">报告预览</h2>
        {content && (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {copied ? '✅ 已复制' : '📋 复制'}
            </button>
            <button
              onClick={handleDownload}
              className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-gray-50 transition-colors cursor-pointer"
            >
              📥 下载
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[300px] border border-border rounded-lg p-4 overflow-auto">
        {loading && !content && (
          <div className="text-text-secondary text-sm animate-pulse">AI 正在生成…</div>
        )}
        {!loading && !content && (
          <div className="text-text-secondary text-sm">
            在左侧填写工作内容，点击「生成」后这里会实时显示 AI 生成的报告。
          </div>
        )}
        {content && (
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-text m-0">
            {content}
          </pre>
        )}
      </div>
    </div>
  )
}
