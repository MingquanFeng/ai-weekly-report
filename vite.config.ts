import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// 所有 AI 厂商的代理配置
const providers = [
  { id: 'deepseek', target: 'https://api.deepseek.com' },
  { id: 'qwen', target: 'https://dashscope.aliyuncs.com/compatible-mode' },
  { id: 'zhipu', target: 'https://open.bigmodel.cn/api/paas/v4' },
  { id: 'moonshot', target: 'https://api.moonshot.cn' },
  { id: 'spark', target: 'https://spark-api-open.xf-yun.com/v1' },
  { id: 'hunyuan', target: 'https://api.hunyuan.cloud.tencent.com/v1' },
  { id: 'ernie', target: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop' },
  { id: 'minimax', target: 'https://api.minimax.chat/v1' },
  { id: 'mimo', target: 'https://api.xiaomimimo.com/v1' },
]

const proxy: Record<string, object> = {}
providers.forEach(({ id, target }) => {
  proxy[`/api/${id}`] = {
    target,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(new RegExp(`^/api/${id}`), ''),
  }
})

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy },
})
