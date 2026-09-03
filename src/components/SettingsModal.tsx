'use client'
import { useState } from 'react'
import type { ProviderId, Settings } from '@/types'
import { PROVIDER_LIST } from '@/services/providers'

export default function SettingsModal({ current, onSave, onClose }: { current: Settings; onSave: (s: Settings) => void; onClose: () => void }) {
  const [provider, setProvider] = useState<ProviderId>(current.provider)
  const [apiKey, setApiKey] = useState(current.apiKey)
  const cp = PROVIDER_LIST.find(p => p.id === provider)!

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-bold text-gray-900 mb-5">⚙️ 设置</h2>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">AI 模型厂商</label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {PROVIDER_LIST.map(p => (
            <button key={p.id} onClick={() => setProvider(p.id)}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${provider === p.id ? 'bg-violet-50 border-violet-400 text-violet-600 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-violet-200'}`}>
              <span className="text-lg">{p.icon}</span>
              <span className="leading-tight">{p.name}</span>
            </button>
          ))}
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{cp.name} API Key</label>
        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={cp.placeholder}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 mb-2 transition-colors" />
        <p className="text-xs text-gray-400 mb-1">模型：{cp.model}</p>
        <p className="text-xs text-gray-400 mb-5">🔒 Key 仅存储在浏览器本地</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">取消</button>
          <button onClick={() => onSave({ provider, apiKey })} className="px-5 py-2.5 text-sm font-medium rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer">保存</button>
        </div>
      </div>
    </div>
  )
}
