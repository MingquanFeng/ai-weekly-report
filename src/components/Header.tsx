interface Props {
  onSettingsClick: () => void
  hasApiKey: boolean
}

export default function Header({ onSettingsClick, hasApiKey }: Props) {
  return (
    <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-text flex items-center gap-2">
        📝 AI 工作报告生成器
      </h1>
      <button
        onClick={onSettingsClick}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-gray-50 transition-colors cursor-pointer"
      >
        ⚙️ 设置
        {!hasApiKey && (
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
        )}
      </button>
    </header>
  )
}
