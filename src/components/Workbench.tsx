import { useState } from 'react'
import type { ReportType, WorkItem, WorkItemType } from '../types'
import { generateReport } from '../services/deepseek'

interface Props {
  reportType: ReportType
  apiKey: string
  onGenerateStart: () => void
  onChunk: (text: string) => void
  onGenerateEnd: () => void
  onNeedApiKey: () => void
}

const ITEM_TYPES: WorkItemType[] = ['开发', '会议', '文档', '其他']

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function Workbench({
  reportType,
  apiKey,
  onGenerateStart,
  onChunk,
  onGenerateEnd,
  onNeedApiKey,
}: Props) {
  const [items, setItems] = useState<WorkItem[]>([])
  const [plan, setPlan] = useState('')
  const [issues, setIssues] = useState('')
  const [summary, setSummary] = useState('')

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: '', type: '开发' },
    ])
  }

  const updateItem = (id: string, patch: Partial<WorkItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    )
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const handleGenerate = async () => {
    if (!apiKey) {
      onNeedApiKey()
      return
    }
    const filled = items.filter((it) => it.text.trim())
    if (filled.length === 0) return

    onGenerateStart()
    try {
      await generateReport(
        apiKey,
        reportType,
        filled.map((it) => ({ text: it.text, type: it.type })),
        plan,
        issues,
        summary,
        todayStr(),
        onChunk
      )
    } catch (e) {
      onChunk(`\n\n⚠️ 生成失败: ${(e as Error).message}`)
    } finally {
      onGenerateEnd()
    }
  }

  const planLabel =
    reportType === 'daily'
      ? '明日计划'
      : reportType === 'weekly'
        ? '下周计划'
        : '下月计划'

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-4 overflow-auto">
      <h2 className="text-base font-semibold text-text">
        {reportType === 'daily' ? '📅 日报' : reportType === 'weekly' ? '📋 周报' : '📊 月报'} — 工作台
      </h2>

      {/* 工作条目 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-secondary">工作内容</label>
        {items.map((item) => (
          <div key={item.id} className="flex gap-2 items-start">
            <select
              value={item.type}
              onChange={(e) =>
                updateItem(item.id, { type: e.target.value as WorkItemType })
              }
              className="text-xs border border-border rounded-lg px-2 py-2 bg-surface-alt text-text shrink-0 cursor-pointer"
            >
              {ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <textarea
              value={item.text}
              onChange={(e) => updateItem(item.id, { text: e.target.value })}
              placeholder="做了什么…"
              rows={2}
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-light"
            />
            <button
              onClick={() => removeItem(item.id)}
              className="text-text-secondary hover:text-red-500 text-lg leading-none px-1 cursor-pointer"
              title="删除"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addItem}
          className="self-start text-sm text-primary hover:text-primary-dark transition-colors cursor-pointer"
        >
          + 添加工作项
        </button>
      </div>

      {/* 计划 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">{planLabel}</label>
        <textarea
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          placeholder={`接下来打算做什么…`}
          rows={3}
          className="border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
      </div>

      {/* 问题 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">遇到的问题（可选）</label>
        <textarea
          value={issues}
          onChange={(e) => setIssues(e.target.value)}
          placeholder="有什么卡住的、需要帮助的…"
          rows={2}
          className="border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
      </div>

      {/* 月报专属：本月总结 */}
      {reportType === 'monthly' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">本月总结（可选）</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="个人成长、流程改进建议…"
            rows={2}
            className="border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-light"
          />
        </div>
      )}

      {/* 生成按钮 */}
      <button
        onClick={handleGenerate}
        disabled={items.filter((it) => it.text.trim()).length === 0}
        className="bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white font-medium py-2.5 px-6 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        ✨ 生成{reportType === 'daily' ? '日报' : reportType === 'weekly' ? '周报' : '月报'}
      </button>
    </div>
  )
}
