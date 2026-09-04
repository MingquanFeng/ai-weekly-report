'use client'
import { useState } from 'react'
import type { ProviderId, ReportType, Settings } from '@/types'
import { PROVIDER_LIST } from '@/services/providers'
import { SYSTEM_PROMPTS } from '@/services/ai'

const TABS: { type: ReportType; label: string }[] = [
  { type: 'daily', label: '日报' },
  { type: 'weekly', label: '周报' },
  { type: 'monthly', label: '月报' },
]

export default function SettingsModal({ current, onSave, onClose }: { current: Settings; onSave: (s: Settings) => void; onClose: () => void }) {
  const [provider, setProvider] = useState<ProviderId>(current.provider)
  const [apiKeys, setApiKeys] = useState<Partial<Record<ProviderId, string>>>(current.apiKeys || {})
  const [customPrompts, setCustomPrompts] = useState<Partial<Record<ReportType, string>>>(current.customPrompts || {})
  const [activeTab, setActiveTab] = useState<'provider' | 'template'>('provider')
  const [templateType, setTemplateType] = useState<ReportType>('daily')

  const currentKey = apiKeys[provider] || ''
  const cp = PROVIDER_LIST.find(p => p.id === provider)!
  const currentPrompt = customPrompts[templateType] || SYSTEM_PROMPTS[templateType]

  const setKey = (key: string) => setApiKeys(prev => ({ ...prev, [provider]: key }))

  const handleSave = () => {
    onSave({ provider, apiKey: apiKeys[provider] || '', apiKeys, customPrompts })
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
        <h2 className="text-lg font-bold text-gray-900 mb-4">⚙️ 设置</h2>

        <div className="flex gap-1 mb-5 p-1 bg-gray-100 rounded-xl">
          {[{ key: 'provider' as const, label: '厂商配置' }, { key: 'template' as const, label: '自定义模板' }].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${activeTab === tab.key ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          {activeTab === 'provider' && (
            <>
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
              <input type="password" value={currentKey} onChange={e => setKey(e.target.value)} placeholder={cp.placeholder}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 mb-2 transition-colors" />
              <p className="text-xs text-gray-400 mb-1">模型：{cp.model}</p>
              <p className="text-xs text-gray-400">🔒 Key 仅存储在浏览器本地</p>
            </>
          )}

          {activeTab === 'template' && (
            <>
              <p className="text-xs text-gray-400 mb-3">自定义 AI 生成报告的系统提示词，留空则使用默认模板</p>
              <div className="flex gap-1.5 mb-3">
                {TABS.map(tab => (
                  <button key={tab.type} onClick={() => setTemplateType(tab.type)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${templateType === tab.type ? 'bg-violet-100 text-violet-600 font-medium' : 'text-gray-400 hover:text-gray-600 bg-gray-50'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <textarea
                value={customPrompts[templateType] || ''}
                onChange={e => setCustomPrompts(prev => ({ ...prev, [templateType]: e.target.value }))}
                placeholder={SYSTEM_PROMPTS[templateType]}
                className="w-full h-52 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 resize-none bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors leading-relaxed"
              />
              {customPrompts[templateType] && (
                <button onClick={() => setCustomPrompts(prev => { const n = { ...prev }; delete n[templateType]; return n })}
                  className="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                  恢复默认模板
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">取消</button>
          <button onClick={handleSave} className="px-5 py-2.5 text-sm font-medium rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer">保存</button>
        </div>
      </div>
    </div>
  )
}
