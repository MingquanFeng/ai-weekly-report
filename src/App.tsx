import { useState } from 'react'
import type { ReportType, Settings } from './types'
import Header from './components/Header'
import Workbench from './components/Workbench'
import Preview from './components/Preview'
import SettingsModal from './components/SettingsModal'

const TAB_CONFIG: { type: ReportType; icon: string; label: string }[] = [
  { type: 'daily', icon: '📅', label: '日报' },
  { type: 'weekly', icon: '📁', label: '周报' },
  { type: 'monthly', icon: '📊', label: '月报' },
]

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem('settings')
    return raw ? JSON.parse(raw) : { apiKey: '' }
  } catch {
    return { apiKey: '' }
  }
}

function saveSettings(s: Settings) {
  localStorage.setItem('settings', JSON.stringify(s))
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [reportType, setReportType] = useState<ReportType>('daily')
  const [generated, setGenerated] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSaveSettings = (key: string) => {
    const next = { apiKey: key }
    setSettings(next)
    saveSettings(next)
    setShowSettings(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onSettingsClick={() => setShowSettings(true)}
        hasApiKey={!!settings.apiKey}
      />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-5 flex flex-col gap-5">
        {/* 报告类型切换 */}
        <div className="flex gap-3">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.type}
              onClick={() => setReportType(tab.type)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                reportType === tab.type
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-white text-text-secondary hover:bg-primary-50 border border-border'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 工作台 + 预览 */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-0">
          <Workbench
            reportType={reportType}
            apiKey={settings.apiKey}
            onGenerateStart={() => {
              setLoading(true)
              setGenerated('')
            }}
            onChunk={setGenerated}
            onGenerateEnd={() => setLoading(false)}
            onNeedApiKey={() => setShowSettings(true)}
          />
          <Preview
            content={generated}
            loading={loading}
            reportType={reportType}
            onRegenerate={() => {
              // 触发重新生成的信号
            }}
          />
        </div>
      </main>

      {showSettings && (
        <SettingsModal
          currentKey={settings.apiKey}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
