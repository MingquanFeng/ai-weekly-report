'use client'
import { useState } from 'react'
import type { ReportType, Settings } from '@/types'
import Header from '@/components/Header'
import Workbench from '@/components/Workbench'
import Preview from '@/components/Preview'
import SettingsModal from '@/components/SettingsModal'
import HistoryList from '@/components/HistoryList'

const TABS: { type: ReportType; icon: string; label: string }[] = [
  { type: 'daily', icon: '📅', label: '日报' },
  { type: 'weekly', icon: '📁', label: '周报' },
  { type: 'monthly', icon: '📊', label: '月报' },
]

const DEFAULT: Settings = { provider: 'deepseek', apiKey: '' }

function loadSettings(): Settings {
  try { const r = localStorage.getItem('settings'); return r ? { ...DEFAULT, ...JSON.parse(r) } : DEFAULT } catch { return DEFAULT }
}

export default function Home() {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [reportType, setReportType] = useState<ReportType>('daily')
  const [generated, setGenerated] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = (s: Settings) => { setSettings(s); localStorage.setItem('settings', JSON.stringify(s)); setShowSettings(false) }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f7ff]">
      <Header onSettingsClick={() => setShowSettings(true)} hasApiKey={!!settings.apiKey} />
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-5 flex flex-col gap-5">
        <div className="flex gap-3">
          {TABS.map(tab => (
            <button key={tab.type} onClick={() => setReportType(tab.type)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${reportType === tab.type ? 'bg-violet-600 text-white shadow-md shadow-violet-200' : 'bg-white text-gray-500 hover:bg-violet-50 border border-gray-200'}`}>
              <span className="text-base">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-0">
          <Workbench reportType={reportType} providerId={settings.provider} apiKey={settings.apiKey}
            onGenerateStart={() => { setLoading(true); setGenerated('') }}
            onChunk={chunk => setGenerated(prev => prev + chunk)}
            onGenerateEnd={() => setLoading(false)}
            onNeedApiKey={() => setShowSettings(true)} />
          <Preview content={generated} loading={loading} reportType={reportType} />
        </div>

        <HistoryList onLoad={c => { setGenerated(c); setLoading(false) }} />
      </main>

      {showSettings && <SettingsModal current={settings} onSave={handleSave} onClose={() => setShowSettings(false)} />}
    </div>
  )
}
