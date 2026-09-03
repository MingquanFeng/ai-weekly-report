import { NextRequest } from 'next/server'
import { PROVIDERS } from '@/services/providers'
import type { ProviderId } from '@/types'

const PROVIDER_ENDPOINTS: Record<string, string> = {}
Object.values(PROVIDERS).forEach(p => { PROVIDER_ENDPOINTS[p.id] = p.endpoint })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const targetBase = PROVIDER_ENDPOINTS[provider]
  if (!targetBase) {
    return Response.json({ error: `未知厂商: ${provider}` }, { status: 400 })
  }

  const apiKey = req.headers.get('x-api-key') || ''
  const providerConfig = PROVIDERS[provider as ProviderId]
  const useApiKeyHeader = providerConfig?.authHeader === 'api-key'

  const body = await req.json()

  try {
    const upstream = await fetch(`${targetBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(useApiKeyHeader
          ? { 'api-key': apiKey }
          : { Authorization: `Bearer ${apiKey}` }),
      },
      body: JSON.stringify(body),
    })

    if (!upstream.ok) {
      const err = await upstream.text()
      return Response.json({ error: `API错误 (${upstream.status}): ${err}` }, { status: upstream.status })
    }

    const contentType = upstream.headers.get('content-type') || 'text/event-stream'

    return new Response(upstream.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (e) {
    return Response.json({ error: `代理请求失败: ${(e as Error).message}` }, { status: 502 })
  }
}
