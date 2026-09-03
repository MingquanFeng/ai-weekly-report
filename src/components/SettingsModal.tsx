import { useState } from 'react'
import type { ProviderId, Settings } from '../types'
import { PROVIDER_LIST } from '../services/providers'

interface Props {
  currentSettings: Settings
  onSave: (settings: Settings) => void
  onClose: () => void
}

export default function SettingsModal({ currentSettings, onSave, onClose }: Props) {
  const [provider, setProvider] = useState<ProviderId>(currentSettings.provider)
  const [apiKey, setApiKey] = useState(currentSettings.apiKey)

  const currentProvider = PROVIDER_LIST.find((p) => p.id === provider)!

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-lg">⚙️</span>
          <h2 className="text-lg font-bold text-text">设置</h2>
        </div>

        {/* 厂商选择 */}
        <label className="block text-sm font-medium text-text mb-1.5">
          AI 模型厂商
        </label>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {PROVIDER_LIST.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                provider === p.id
                  ? 'bg-primary-50 border-primary text-primary shadow-sm'
                  : 'bg-surface-alt border-border-light text-text-secondary hover:border-primary-200 hover:bg-primary-50'
              }`}
            >
              <span className="text-lg">{p.icon}</span>
              <span className="leading-tight">{p.name}</span>
            </button>
          ))}
        </div>

        {/* API Key */}
        <label className="block text-sm font-medium text-text mb-1.5">
          {currentProvider.name} API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={currentProvider.placeholder}
          className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-primary/10 mb-2 transition-colors"
        />

        {/* 模型信息 */}
        <div className="flex items-center gap-2 mb-4 px-1">
          <span className="text-xs text-text-muted">
            模型：{currentProvider.model}
          </span>
        </div>

        <p className="text-xs text-text-muted mb-5">
          🔒 Key 仅存储在浏览器本地，不会上传到任何服务器。
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium rounded-xl border border-border text-text-secondary hover:bg-surface-alt transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={() => onSave({ provider, apiKey })}
            className="px-5 py-2.5 text-sm font-medium rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors cursor-pointer"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
