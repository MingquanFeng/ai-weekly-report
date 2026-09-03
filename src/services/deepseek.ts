import type { ProviderConfig, ProviderId, ReportType } from '../types'
import { PROVIDERS } from './providers'

const SYSTEM_PROMPTS: Record<ReportType, string> = {
  daily: `你是一个专业的日报撰写助手。根据用户提供的零散工作记录，生成一份结构清晰、措辞专业的日报。

输出格式要求：
1. 保持 Markdown 格式
2. 标题格式：# 日报 — YYYY-MM-DD（周X）
3. 按以下段落组织：
   - ## 今日完成
   - ## 进行中
   - ## 明日计划
   - ## 遇到的问题（如果没有可省略）
4. 语言专业但不生硬，简洁有力
5. 从零散输入中提取关键信息并合理组织
6. 每个条目用列表形式呈现`,

  weekly: `你是一个专业的周报撰写助手。根据用户提供的零散工作记录，生成一份结构清晰、措辞专业的周报。

输出格式要求：
1. 保持 Markdown 格式
2. 标题格式：# 周报 — YYYY年第XX周
3. 按以下段落组织：
   - ## 本周完成
   - ## 进行中
   - ## 下周计划
   - ## 风险与问题（如果没有可省略）
4. 语言专业但不生硬
5. 从零散输入中提取关键信息并合理组织
6. 每个条目用列表形式呈现`,

  monthly: `你是一个专业的月报撰写助手。根据用户提供的零散工作记录，生成一份结构清晰、措辞专业的月报。

输出格式要求：
1. 保持 Markdown 格式
2. 标题格式：# 月报 — YYYY年M月
3. 按以下段落组织：
   - ## 本月成果
   - ## 重点项目进展
   - ## 下月计划
   - ## 风险与问题（如果没有可省略）
   - ## 本月总结（如果用户有提供）
4. 语言专业但不生硬，突出关键成果和里程碑
5. 从零散输入中提取关键信息并合理组织
6. 每个条目用列表形式呈现`,
}

function buildUserMessage(
  items: { text: string; type: string }[],
  plan: string,
  issues: string,
  summary: string,
  reportType: ReportType,
  dateStr: string
): string {
  const lines: string[] = [`日期：${dateStr}`, '']

  lines.push('工作记录：')
  items.forEach((item) => {
    lines.push(`- [${item.type}] ${item.text}`)
  })

  if (plan) {
    lines.push('', reportType === 'daily' ? '明日计划：' : reportType === 'weekly' ? '下周计划：' : '下月计划：')
    lines.push(plan)
  }

  if (issues) {
    lines.push('', '遇到的问题：')
    lines.push(issues)
  }

  if (summary && reportType === 'monthly') {
    lines.push('', '本月个人总结：')
    lines.push(summary)
  }

  return lines.join('\n')
}

function getApiUrl(provider: ProviderConfig): string {
  const base = import.meta.env.DEV
    ? `/api/${provider.id}`
    : provider.endpoint
  return `${base}/chat/completions`
}

function getModel(provider: ProviderConfig): string {
  return provider.model
}

/** 从 SSE 行中提取 content，兼容多种格式 */
function extractContent(line: string): string | null {
  // 标准 SSE: "data: {...}"
  if (line.startsWith('data: ')) {
    const data = line.slice(6).trim()
    if (data === '[DONE]') return null // signal done
    try {
      const json = JSON.parse(data)
      return json.choices?.[0]?.delta?.content ?? null
    } catch {
      return null
    }
  }

  // 无空格: "data:{...}"
  if (line.startsWith('data:')) {
    const data = line.slice(5).trim()
    if (data === '[DONE]') return null
    try {
      const json = JSON.parse(data)
      return json.choices?.[0]?.delta?.content ?? null
    } catch {
      return null
    }
  }

  // 裸 JSON 行（部分厂商不带 data: 前缀）
  if (line.startsWith('{')) {
    try {
      const json = JSON.parse(line)
      return json.choices?.[0]?.delta?.content ?? null
    } catch {
      return null
    }
  }

  return null
}

export async function generateReport(
  providerId: ProviderId,
  apiKey: string,
  reportType: ReportType,
  items: { text: string; type: string }[],
  plan: string,
  issues: string,
  summary: string,
  dateStr: string,
  onChunk: (text: string) => void
): Promise<void> {
  const provider = PROVIDERS[providerId]
  const url = getApiUrl(provider)
  const userMessage = buildUserMessage(items, plan, issues, summary, reportType, dateStr)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(providerId === 'mimo'
      ? { 'api-key': apiKey }
      : { Authorization: `Bearer ${apiKey}` }),
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: getModel(provider),
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[reportType] },
          { role: 'user', content: userMessage },
        ],
        stream: true,
      }),
    })
  } catch (e) {
    throw new Error(`网络请求失败: ${(e as Error).message}。请检查网络或 API 设置。`)
  }

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API 请求失败 (${response.status}): ${err}`)
  }

  const contentType = response.headers.get('content-type') || ''

  // 如果不是 SSE 流，按非流式处理
  if (!contentType.includes('text/event-stream') && !contentType.includes('application/json')) {
    const text = await response.text()
    try {
      const json = JSON.parse(text)
      const content = json.choices?.[0]?.message?.content
      if (content) {
        onChunk(content)
        return
      }
    } catch {
      // not JSON, show raw
    }
    onChunk(text)
    return
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue

      const content = extractContent(line)
      if (content === null) {
        // 可能是 [DONE]
        if (line.includes('[DONE]')) return
        continue
      }
      onChunk(content)
    }
  }

  // 处理 buffer 中残留的内容
  if (buffer.trim()) {
    const content = extractContent(buffer.trim())
    if (content) onChunk(content)
  }
}
