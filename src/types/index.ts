export type ReportType = 'daily' | 'weekly' | 'monthly'
export type WorkItemType = '开发' | '会议' | '文档' | '其他'

export type ProviderId =
  | 'deepseek' | 'qwen' | 'zhipu' | 'moonshot'
  | 'spark' | 'hunyuan' | 'ernie' | 'minimax' | 'mimo'

export interface ProviderConfig {
  id: ProviderId
  name: string
  icon: string
  endpoint: string
  model: string
  placeholder: string
  authHeader: string
}

export interface WorkItem {
  id: string
  text: string
  type: WorkItemType
}

export interface Settings {
  provider: ProviderId
  apiKey: string
  apiKeys: Partial<Record<ProviderId, string>>
}

export interface Report {
  id: number
  type: ReportType
  title: string
  content: string
  items: string
  plan: string
  issues: string
  summary: string
  provider: string
  created_at: string
  updated_at: string
}
