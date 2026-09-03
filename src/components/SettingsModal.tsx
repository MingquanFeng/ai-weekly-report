import { useState } from 'react'

interface Props {
  currentKey: string
  onSave: (key: string) => void
  onClose: () => void
}

export default function SettingsModal({ currentKey, onSave, onClose }: Props) {
  const [key, setKey] = useState(currentKey)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-text mb-4">⚙️ 设置</h2>

        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          DeepSeek API Key
        </label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-..."
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light mb-4"
        />
        <p className="text-xs text-text-secondary mb-4">
          Key 仅存储在浏览器本地，不会上传到任何服务器。
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-gray-50 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={() => onSave(key)}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors cursor-pointer"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
