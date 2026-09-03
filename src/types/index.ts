export type ReportType = 'daily' | 'weekly' | 'monthly'

export type WorkItemType = '开发' | '会议' | '文档' | '其他'

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
  summary: string // 仅月报
}

export interface Settings {
  apiKey: string
}
