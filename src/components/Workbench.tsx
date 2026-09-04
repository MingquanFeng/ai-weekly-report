'use client'
import { useState, forwardRef, useImperativeHandle } from 'react'
import type { ProviderId, ReportType, WorkItem, WorkItemType } from '@/types'
import { generateReport, AGGREGATION_PROMPTS } from '@/services/ai'
import { createReport, listReports } from '@/services/reports'

export interface WorkbenchHandle { regenerate: () => void; hasItems: () => boolean }

interface Props {
  reportType: ReportType
  providerId: ProviderId
  apiKey: string
  customSystemPrompt?: string
  onGenerateStart: () => void
  onChunk: (text: string) => void
  onGenerateEnd: (content: string, reportId?: number) => void
  onNeedApiKey: () => void
}

const ITEM_TYPES: WorkItemType[] = ['开发', '会议', '文档', '其他']
const CFG = {
  daily: { label: '今日工作', desc: '记录你今天完成的工作事项', planLabel: '明日计划', planDesc: '明天打算做什么' },
  weekly: { label: '本周工作', desc: '记录你本周完成的工作事项', planLabel: '下周计划', planDesc: '下周打算做什么' },
  monthly: { label: '本月工作', desc: '记录你本月完成的工作事项', planLabel: '下月计划', planDesc: '下月打算做什么' },
}

const Workbench = forwardRef<WorkbenchHandle, Props>(function Workbench({ reportType, providerId, apiKey, customSystemPrompt, onGenerateStart, onChunk, onGenerateEnd, onNeedApiKey }, ref) {
  const [items, setItems] = useState<WorkItem[]>([])
  const [plan, setPlan] = useState('')
  const [issues, setIssues] = useState('')
  const [summary, setSummary] = useState('')
  const cfg = CFG[reportType]

  useImperativeHandle(ref, () => ({
    regenerate: handleGenerate,
    hasItems: () => items.some(it => it.text.trim()),
  }))

  const addItem = () => setItems(prev => [...prev, { id: crypto.randomUUID(), text: '', type: '开发' }])
  const updateItem = (id: string, patch: Partial<WorkItem>) => setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))
  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id))

  const handleGenerate = async () => {
    if (!apiKey) { onNeedApiKey(); return }
    const filled = items.filter(it => it.text.trim())
    if (filled.length === 0) return

    onGenerateStart()
    let generated = ''
    let reportId: number | undefined
    try {
      const dateStr = new Date().toISOString().slice(0, 10)
      await generateReport(providerId, apiKey, reportType, filled.map(it => ({ text: it.text, type: it.type })), plan, issues, summary, dateStr, chunk => {
        generated += chunk
        onChunk(chunk)
      }, customSystemPrompt)

      const reportLabel = reportType === 'daily' ? '日报' : reportType === 'weekly' ? '周报' : '月报'
      const saved = await createReport({
        type: reportType,
        title: `${reportLabel} · ${dateStr}`,
        content: generated,
        items: JSON.stringify(filled),
        plan, issues, summary,
        provider: providerId,
      })
      reportId = saved.id
    } catch (e) {
      onChunk(`\n\n⚠️ 生成失败: ${(e as Error).message}`)
    } finally {
      onGenerateEnd(generated, reportId)
    }
  }

  const handleAggregate = async () => {
    if (!apiKey) { onNeedApiKey(); return }

    const today = new Date()
    const start = new Date(today)
    if (reportType === 'weekly') start.setDate(today.getDate() - 7)
    else start.setDate(today.getDate() - 30)

    const startDate = start.toISOString().slice(0, 10)
    const endDate = today.toISOString().slice(0, 10)

    onGenerateStart()
    let generated = ''
    let reportId: number | undefined
    try {
      const res = await listReports('daily', 1, 100, startDate, endDate)
      if (res.data.length === 0) {
        onChunk('⚠️ 最近没有日报记录，请先生成日报')
        onGenerateEnd('', undefined)
        return
      }

      const dailyReports = res.data.reverse().map(r => {
        const date = r.created_at?.slice(0, 10) || '未知日期'
        return `### ${date}\n${r.content || '(无内容)'}`
      }).join('\n\n')

      const prompt = customSystemPrompt || AGGREGATION_PROMPTS[reportType]
      const dateStr = today.toISOString().slice(0, 10)

      await generateReport(providerId, apiKey, reportType,
        [{ text: dailyReports, type: '历史日报汇总' }], '', '', '',
        dateStr, chunk => { generated += chunk; onChunk(chunk) }, prompt)

      const saved = await createReport({
        type: reportType,
        title: `${reportLabel} · ${dateStr}`,
        content: generated,
        items: JSON.stringify([{ id: 'agg', text: `从 ${res.data.length} 篇日报汇总`, type: '汇总' }]),
        plan, issues, summary,
        provider: providerId,
      })
      reportId = saved.id
    } catch (e) {
      onChunk(`\n\n⚠️ 汇总失败: ${(e as Error).message}`)
    } finally {
      onGenerateEnd(generated, reportId)
    }
  }

  const reportLabel = reportType === 'daily' ? '日报' : reportType === 'weekly' ? '周报' : '月报'
  const hasContent = items.some(it => it.text.trim())

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-0 overflow-auto shadow-sm">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span className="text-base font-bold text-gray-900">{cfg.label}</span>
          </div>
          <button onClick={addItem} className="flex items-center gap-1 text-sm text-teal-600 font-medium px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            添加工作事项
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">{cfg.desc}</p>

        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 py-2.5 px-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-teal-200 transition-colors">
              <div className="flex flex-col gap-0.5 cursor-grab opacity-30 px-1">
                {[0,1,2].map(i => <div key={i} className="flex gap-0.5"><span className="w-[3px] h-[3px] rounded-full bg-gray-400"/><span className="w-[3px] h-[3px] rounded-full bg-gray-400"/></div>)}
              </div>
              <div className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">{index + 1}</div>
              <input type="text" value={item.text} onChange={e => updateItem(item.id, { text: e.target.value })} placeholder="做了什么…"
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400" />
              <select value={item.type} onChange={e => updateItem(item.id, { type: e.target.value as WorkItemType })}
                className="text-xs text-gray-500 bg-white border border-gray-200 rounded-md px-2 py-1 cursor-pointer outline-none">
                {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 cursor-pointer" title="删除">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          ))}
        </div>
        {items.length === 0 && (
          <button onClick={addItem} className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-teal-200 hover:text-teal-500 hover:bg-teal-50 transition-colors cursor-pointer">
            + 点击添加第一个工作事项
          </button>
        )}
      </div>

      <hr className="border-gray-100 my-5" />

      <div>
        <div className="flex items-center gap-2 mb-1"><span className="text-lg">📌</span><span className="text-base font-bold text-gray-900">{cfg.planLabel}</span></div>
        <p className="text-xs text-gray-400 mb-3">{cfg.planDesc}</p>
        <div className="relative">
          <textarea value={plan} onChange={e => setPlan(e.target.value)} placeholder="继续进行用户模块测试，准备提测；跟进产品需求文档。" maxLength={500} rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 resize-none bg-gray-50 placeholder:text-gray-400 transition-colors focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
          <span className="absolute bottom-2 right-3 text-xs text-gray-400">{plan.length}/500</span>
        </div>
      </div>

      <hr className="border-gray-100 my-5" />

      <div>
        <div className="flex items-center gap-2 mb-1"><span className="text-lg">❓</span><span className="text-base font-bold text-gray-900">遇到的问题（可选）</span></div>
        <p className="text-xs text-gray-400 mb-3">遇到的困难或需要帮助的地方</p>
        <div className="relative">
          <textarea value={issues} onChange={e => setIssues(e.target.value)} placeholder="暂无" maxLength={500} rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 resize-none bg-gray-50 placeholder:text-gray-400 transition-colors focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
          <span className="absolute bottom-2 right-3 text-xs text-gray-400">{issues.length}/500</span>
        </div>
      </div>

      {reportType === 'monthly' && (
        <>
          <hr className="border-gray-100 my-5" />
          <div>
            <div className="flex items-center gap-2 mb-1"><span className="text-lg">📝</span><span className="text-base font-bold text-gray-900">本月总结（可选）</span></div>
            <p className="text-xs text-gray-400 mb-3">个人成长、流程改进建议</p>
            <textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="本月在技术能力和团队协作方面有哪些收获…" rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 resize-none bg-gray-50 placeholder:text-gray-400 transition-colors focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
          </div>
        </>
      )}

      <div className="mt-6 flex flex-col gap-2">
        <button onClick={handleGenerate} disabled={!hasContent}
          className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #5eead4 0%, #14b8a6 50%, #0d9488 100%)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          AI 生成{reportLabel}
        </button>
        {reportType !== 'daily' && (
          <button onClick={handleAggregate}
            className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 text-teal-600 border border-teal-200 hover:bg-teal-50 transition-colors cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="10"/></svg>
            从近{reportType === 'weekly' ? '7天' : '30天'}日报汇总
          </button>
        )}
        <p className="text-center text-xs text-gray-400">AI 会自动整理工作内容，提炼成果并优化表达</p>
      </div>
    </div>
  )
})

export default Workbench
