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

const SECTION_CONFIG = {
  daily: { label: '今日工作', desc: '记录你今天完成的工作事项', planLabel: '明日计划', planDesc: '明天打算做什么' },
  weekly: { label: '本周工作', desc: '记录你本周完成的工作事项', planLabel: '下周计划', planDesc: '下周打算做什么' },
  monthly: { label: '本月工作', desc: '记录你本月完成的工作事项', planLabel: '下月计划', planDesc: '下月打算做什么' },
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

  const config = SECTION_CONFIG[reportType]

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
        new Date().toISOString().slice(0, 10),
        onChunk
      )
    } catch (e) {
      onChunk(`\n\n⚠️ 生成失败: ${(e as Error).message}`)
    } finally {
      onGenerateEnd()
    }
  }

  const reportLabel = reportType === 'daily' ? '日报' : reportType === 'weekly' ? '周报' : '月报'
  const hasContent = items.some((it) => it.text.trim())

  return (
    <div className="bg-white rounded-2xl border border-border p-6 flex flex-col gap-0 overflow-auto shadow-sm">
      {/* 今日工作区域 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span className="text-base font-bold text-text">{config.label}</span>
          </div>
          <button
            onClick={addItem}
            className="flex items-center gap-1 text-sm text-primary font-medium px-3 py-1.5 rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            添加工作事项
          </button>
        </div>
        <p className="text-xs text-text-muted mb-4">{config.desc}</p>

        {/* 工作项列表 */}
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-2 py-2.5 px-3 bg-surface-alt rounded-xl border border-border-light group hover:border-primary-200 transition-colors"
            >
              {/* 拖拽手柄 */}
              <div className="drag-handle">
                <div className="drag-handle-dot"><span /><span /></div>
                <div className="drag-handle-dot"><span /><span /></div>
                <div className="drag-handle-dot"><span /><span /></div>
              </div>

              {/* 序号 */}
              <div className="item-number">{index + 1}</div>

              {/* 输入 */}
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateItem(item.id, { text: e.target.value })}
                placeholder="做了什么…"
                className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
              />

              {/* 类型标签 */}
              <select
                value={item.type}
                onChange={(e) =>
                  updateItem(item.id, { type: e.target.value as WorkItemType })
                }
                className="text-xs text-text-secondary bg-white border border-border-light rounded-md px-2 py-1 cursor-pointer outline-none"
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* 删除 */}
              <button
                onClick={() => removeItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-500 transition-all p-1 cursor-pointer"
                title="删除"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <button
            onClick={addItem}
            className="w-full py-8 border-2 border-dashed border-border rounded-xl text-sm text-text-muted hover:border-primary-200 hover:text-primary hover:bg-primary-50 transition-colors cursor-pointer"
          >
            + 点击添加第一个工作事项
          </button>
        )}
      </div>

      <hr className="section-divider my-5" />

      {/* 明日计划 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">📌</span>
          <span className="text-base font-bold text-text">{config.planLabel}</span>
        </div>
        <p className="text-xs text-text-muted mb-3">{config.planDesc}</p>
        <div className="relative">
          <textarea
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            placeholder="继续进行用户模块测试，准备提测；跟进产品需求文档。"
            maxLength={500}
            rows={3}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm text-text resize-none bg-surface-alt placeholder:text-text-muted transition-colors"
          />
          <span className="absolute bottom-2 right-3 text-xs text-text-muted">
            {plan.length}/500
          </span>
        </div>
      </div>

      <hr className="section-divider my-5" />

      {/* 遇到的问题 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">❓</span>
          <span className="text-base font-bold text-text">遇到的问题（可选）</span>
        </div>
        <p className="text-xs text-text-muted mb-3">遇到的困难或需要帮助的地方</p>
        <div className="relative">
          <textarea
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
            placeholder="暂无"
            maxLength={500}
            rows={3}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm text-text resize-none bg-surface-alt placeholder:text-text-muted transition-colors"
          />
          <span className="absolute bottom-2 right-3 text-xs text-text-muted">
            {issues.length}/500
          </span>
        </div>
      </div>

      {/* 月报专属：本月总结 */}
      {reportType === 'monthly' && (
        <>
          <hr className="section-divider my-5" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📝</span>
              <span className="text-base font-bold text-text">本月总结（可选）</span>
            </div>
            <p className="text-xs text-text-muted mb-3">个人成长、流程改进建议</p>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="本月在技术能力和团队协作方面有哪些收获…"
              rows={3}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm text-text resize-none bg-surface-alt placeholder:text-text-muted transition-colors"
            />
          </div>
        </>
      )}

      {/* 生成按钮 */}
      <div className="mt-6">
        <button
          onClick={handleGenerate}
          disabled={!hasContent}
          className="btn-gradient w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          AI 生成{reportLabel}
        </button>
        <p className="text-center text-xs text-text-muted mt-2.5">
          AI 会自动整理工作内容，提炼成果并优化表达
        </p>
      </div>
    </div>
  )
}
