'use client'
import type { ProviderId, ReportType } from '@/types'
import { PROVIDERS } from './providers'

const SYSTEM_PROMPTS: Record<ReportType, string> = {
  daily: `你是一个专业的日报撰写助手。根据用户提供的零散工作记录，生成一份结构清晰、措辞专业的日报。
输出格式要求：1. 保持 Markdown 格式 2. 标题格式：# 日报 — YYYY-MM-DD（周X）3. 按以下段落组织：## 今日完成、## 进行中、## 明日计划、## 遇到的问题（可省略）4. 语言专业但不生硬 5. 从零散输入中提取关键信息 6. 每个条目用列表形式呈现`,
  weekly: `你是一个专业的周报撰写助手。根据用户提供的零散工作记录，生成一份结构清晰、措辞专业的周报。
输出格式要求：1. 保持 Markdown 格式 2. 标题格式：# 周报 — YYYY年第XX周 3. 按以下段落组织：## 本周完成、## 进行中、## 下周计划、## 风险与问题（可省略）4. 语言专业但不生硬 5. 从零散输入中提取关键信息 6. 每个条目用列表形式呈现`,
  monthly: `你是一个专业的月报撰写助手。根据用户提供的零散工作记录，生成一份结构清晰、措辞专业的月报。
输出格式要求：1. 保持 Markdown 格式 2. 标题格式：# 月报 — YYYY年M月 3. 按以下段落组织：## 本月成果、## 重点项目进展、## 下月计划、## 风险与问题（可省略）、## 本月总结（可选）4. 语言专业但不生硬 5. 从零散输入中提取关键信息 6. 每个条目用列表形式呈现`,
}

function buildUserMessage(items: { text: string; type: string }[], plan: string, issues: string, summary: string, reportType: ReportType, dateStr: string): string {
  const lines: string[] = [`日期：${dateStr}`, '', '工作记录：']
  items.forEach(i => lines.push(`- [${i.type}] ${i.text}`))
  if (plan) { lines.push('', reportType === 'daily' ? '明日计划：' : reportType === 'weekly' ? '下周计划：' : '下月计划：', plan) }
  if (issues) { lines.push('', '遇到的问题：', issues) }
  if (summary && reportType === 'monthly') { lines.push('', '本月个人总结：', summary) }
  return lines.join('\n')
}

function extractContent(line: string): string | null {
  for (const prefix of ['data: ', 'data:']) {
    if (line.startsWith(prefix)) {
      const data = line.slice(prefix.length).trim()
      if (data === '[DONE]') return null
      try { return JSON.parse(data).choices?.[0]?.delta?.content ?? null } catch { return null }
    }
  }
  if (line.startsWith('{')) {
    try { return JSON.parse(line).choices?.[0]?.delta?.content ?? null } catch { return null }
  }
  return null
}

export async function generateReport(
  providerId: ProviderId, apiKey: string, reportType: ReportType,
  items: { text: string; type: string }[], plan: string, issues: string,
  summary: string, dateStr: string, onChunk: (text: string) => void
): Promise<void> {
  const provider = PROVIDERS[providerId]
  const userMessage = buildUserMessage(items, plan, issues, summary, reportType, dateStr)

  const res = await fetch(`/api/ai/${providerId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS[reportType] },
        { role: 'user', content: userMessage },
      ],
      stream: true,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API 请求失败 (${res.status}): ${err}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const raw of lines) {
      const line = raw.trim()
      if (!line) continue
      const content = extractContent(line)
      if (content === null) { if (line.includes('[DONE]')) return; continue }
      onChunk(content)
    }
  }
  if (buffer.trim()) { const c = extractContent(buffer.trim()); if (c) onChunk(c) }
}
