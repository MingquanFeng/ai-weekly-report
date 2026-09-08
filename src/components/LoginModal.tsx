'use client'
import { useState } from 'react'

interface Props {
  onLogin: (userId: number, username: string) => void
}

export default function LoginModal({ onLogin }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const url = tab === 'login' ? '/api/auth/login' : '/api/auth/register'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      onLogin(data.id, data.username)
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-bold text-gray-900 text-center mb-5">👋 欢迎使用</h2>

        <div className="flex gap-1 mb-5 p-1 bg-gray-100 rounded-xl">
          {([['login', '登录'], ['register', '注册']] as const).map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${tab === k ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="2-20 个字符"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 mb-3 transition-colors" />

        <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={tab === 'register' ? '至少 4 个字符' : '输入密码'}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 mb-4 transition-colors" />

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <button onClick={handleSubmit} disabled={loading || !username || !password}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #5eead4 0%, #14b8a6 50%, #0d9488 100%)' }}>
          {loading ? '处理中…' : tab === 'login' ? '登录' : '注册'}
        </button>
      </div>
    </div>
  )
}
