import { useState } from 'react'

interface Props {
  currentKey: string
  onSave: (key: string) => void
  onClose: () => void
}

export default function SettingsModal({ currentKey, onSave, onClose }: Props) {
  const [key, setKey] = useState(currentKey)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-lg">⚙️</span>
          <h2 className="text-lg font-bold text-text">设置</h2>
        </div>

        <label className="block text-sm font-medium text-text mb-1.5">
          DeepSeek API Key
        </label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-..."
          className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-primary/10 mb-3 transition-colors"
        />
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
            onClick={() => onSave(key)}
            className="px-5 py-2.5 text-sm font-medium rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors cursor-pointer"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
