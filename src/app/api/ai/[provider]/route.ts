import { NextRequest } from 'next/server'
import { PROVIDERS } from '@/services/providers'
import type { ProviderId } from '@/types'

const ENDPOINTS: Record<string, string> = {}
Object.values(PROVIDERS).forEach(p => { ENDPOINTS[p.id] = p.endpoint })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const base = ENDPOINTS[provider]
  if (!base) return Response.json({ error: '未知厂商' }, { status: 400 })

  const apiKey = req.headers.get('x-api-key') || ''
  const cfg = PROVIDERS[provider as ProviderId]
  const useApiKey = cfg?.authHeader === 'api-key'

  const body = await req.json()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120_000) // 2 分钟超时

  let upstream: Response
  try {
    upstream = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(useApiKey ? { 'api-key': apiKey } : { Authorization: `Bearer ${apiKey}` }),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err: unknown) {
    clearTimeout(timeout)
    if (err instanceof DOMException && err.name === 'AbortError') {
      return Response.json({ error: '上游 AI 厂商响应超时' }, { status: 504 })
    }
    return Response.json({ error: String(err) }, { status: 502 })
  }

  if (!upstream.ok) {
    clearTimeout(timeout)
    const err = await upstream.text()
    return Response.json({ error: err }, { status: upstream.status })
  }

  // 拿到响应头即清除超时，后续由流本身控制生命周期
  clearTimeout(timeout)

  // 真流式：直接透传上游的 ReadableStream
  const stream = upstream.body
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
