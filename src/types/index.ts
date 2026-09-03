export type ReportType = 'daily' | 'weekly' | 'monthly'

export type WorkItemType = '开发' | '会议' | '文档' | '其他'

export type ProviderId =
  | 'deepseek'
  | 'qwen'
  | 'zhipu'
  | 'moonshot'
  | 'spark'
  | 'hunyuan'
  | 'ernie'
  | 'minimax'

export interface ProviderConfig {
  id: ProviderId
  name: string
  icon: string
  endpoint: string
  model: string
  placeholder: string
}

export interface WorkItem {
  id: string
  text: string
  type: WorkItemType
}

export interface ReportInput {
  type: ReportType
  date: string
  items: WorkItem[]
  plan: string
  issues: string
  summary: string
}

export interface Settings {
  provider: ProviderId
  apiKey: string
}
