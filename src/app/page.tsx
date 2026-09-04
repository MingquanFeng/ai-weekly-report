'use client'
import { useState, useRef } from 'react'
import type { ReportType, Settings } from '@/types'
import Header from '@/components/Header'
import Workbench from '@/components/Workbench'
import type { WorkbenchHandle } from '@/components/Workbench'
import Preview from '@/components/Preview'
import SettingsModal from '@/components/SettingsModal'
import HistoryList from '@/components/HistoryList'
import { generateReport } from '@/services/ai'
import { updateReport } from '@/services/reports'

const TABS: { type: ReportType; icon: string; label: string }[] = [
  { type: 'daily', icon: '📅', label: '日报' },
  { type: 'weekly', icon: '📁', label: '周报' },
  { type: 'monthly', icon: '📊', label: '月报' },
]

const DEFAULT: Settings = { provider: 'deepseek', apiKey: '', apiKeys: {}, customPrompts: {} }

function loadSettings(): Settings {
  try { const r = localStorage.getItem('settings'); return r ? { ...DEFAULT, ...JSON.parse(r) } : DEFAULT } catch { return DEFAULT }
}

function getApiKey(s: Settings): string {
  return s.apiKeys[s.provider] || s.apiKey || ''
}

export default function Home() {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [reportType, setReportType] = useState<ReportType>('daily')
  const [generated, setGenerated] = useState('')
  const [reportId, setReportId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const workbenchRef = useRef<WorkbenchHandle>(null)

  const handleSave = (s: Settings) => { setSettings(s); localStorage.setItem('settings', JSON.stringify(s)); setShowSettings(false) }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f7ff]">
      <Header onSettingsClick={() => setShowSettings(true)} hasApiKey={!!getApiKey(settings)} />
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
          <Workbench ref={workbenchRef} reportType={reportType} providerId={settings.provider} apiKey={getApiKey(settings)}
            customSystemPrompt={settings.customPrompts[reportType]}
            onGenerateStart={() => { setLoading(true); setGenerated('') }}
            onChunk={chunk => setGenerated(prev => prev + chunk)}
            onGenerateEnd={(content, id) => {
              if (content) setGenerated(content)
              if (id) setReportId(id)
              setLoading(false)
              setRefreshKey(k => k + 1)
            }}
            onNeedApiKey={() => setShowSettings(true)} />
          <Preview content={generated} loading={loading} reportType={reportType}
            providerId={settings.provider} apiKey={getApiKey(settings)}
            reportId={reportId} customSystemPrompt={settings.customPrompts[reportType]}
            onContentChange={setGenerated}
            onRegenerate={async () => {
              if (workbenchRef.current?.hasItems()) {
                workbenchRef.current.regenerate()
                return
              }
              if (!generated) return
              setLoading(true)
              let result = ''
              try {
                await generateReport(settings.provider, getApiKey(settings), reportType,
                  [{ text: generated, type: '重新生成' }], '', '', '',
                  new Date().toISOString().slice(0, 10), chunk => { result += chunk; setGenerated(result) },
                  settings.customPrompts[reportType])
                if (result && reportId) await updateReport(reportId, { content: result })
              } catch (e) {
                alert(`重新生成失败: ${(e as Error).message}`)
              } finally {
                setLoading(false)
                if (result) setRefreshKey(k => k + 1)
              }
            }} />
        </div>

        <HistoryList refreshKey={refreshKey} onLoad={(content, id) => { setGenerated(content); setReportId(id); setLoading(false) }} />
      </main>

      {showSettings && <SettingsModal current={settings} onSave={handleSave} onClose={() => setShowSettings(false)} />}
    </div>
  )
}
