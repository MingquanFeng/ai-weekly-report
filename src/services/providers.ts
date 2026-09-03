import type { ProviderConfig, ProviderId } from '@/types'

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  deepseek: { id: 'deepseek', name: 'DeepSeek', icon: '🐋', endpoint: 'https://api.deepseek.com', model: 'deepseek-chat', placeholder: 'sk-...', authHeader: 'Authorization' },
  qwen: { id: 'qwen', name: '通义千问', icon: '🌤️', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode', model: 'qwen-plus', placeholder: 'sk-...', authHeader: 'Authorization' },
  zhipu: { id: 'zhipu', name: '智谱 AI', icon: '🧠', endpoint: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash', placeholder: '输入 API Key...', authHeader: 'Authorization' },
  moonshot: { id: 'moonshot', name: 'Moonshot', icon: '🌙', endpoint: 'https://api.moonshot.cn', model: 'moonshot-v1-8k', placeholder: 'sk-...', authHeader: 'Authorization' },
  spark: { id: 'spark', name: '讯飞星火', icon: '✨', endpoint: 'https://spark-api-open.xf-yun.com/v1', model: 'generalv3.5', placeholder: '输入 API Key...', authHeader: 'Authorization' },
  hunyuan: { id: 'hunyuan', name: '腾讯混元', icon: '🔮', endpoint: 'https://api.hunyuan.cloud.tencent.com/v1', model: 'hunyuan-turbos-latest', placeholder: '输入 SecretId:SecretKey', authHeader: 'Authorization' },
  ernie: { id: 'ernie', name: '文心一言', icon: '📝', endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop', model: 'ernie-speed-128k', placeholder: '输入 Access Token', authHeader: 'Authorization' },
  minimax: { id: 'minimax', name: 'MiniMax', icon: '🔷', endpoint: 'https://api.minimax.chat/v1', model: 'MiniMax-Text-01', placeholder: '输入 API Key...', authHeader: 'Authorization' },
  mimo: { id: 'mimo', name: '小米 MiMo', icon: '📱', endpoint: 'https://api.xiaomimimo.com/v1', model: 'mimo-v2.5', placeholder: 'sk-...', authHeader: 'api-key' },
}

export const PROVIDER_LIST = Object.values(PROVIDERS)
