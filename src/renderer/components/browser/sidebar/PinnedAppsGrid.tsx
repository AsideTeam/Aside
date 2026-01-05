/**
 * PinnedAppsGrid Component
 *
 * 자주 사용하는 웹 앱을 아이콘 형태로 2행 3열 그리드로 표시
 */

import React from 'react'
import { cn } from '@renderer/styles'
import { Mail, Cloud, Zap, Sparkles, Code2, BookOpen } from 'lucide-react'

interface PinnedApp {
  id: string
  label: string
  icon: React.ReactNode
  url: string
  color?: string
}

const defaultPinnedApps: PinnedApp[] = [
  {
    id: 'gmail',
    label: 'Gmail',
    icon: <Mail size={20} />,
    url: 'https://mail.google.com',
    color: 'text-red-400',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    icon: <Cloud size={20} />,
    url: 'https://drive.google.com',
    color: 'text-blue-400',
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: <Code2 size={20} />,
    url: 'https://github.com',
    color: 'text-gray-300',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    icon: <Sparkles size={20} />,
    url: 'https://gemini.google.com',
    color: 'text-blue-400',
  },
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    icon: <Zap size={20} />,
    url: 'https://chat.openai.com',
    color: 'text-green-400',
  },
  {
    id: 'docs',
    label: 'Docs',
    icon: <BookOpen size={20} />,
    url: 'https://docs.google.com',
    color: 'text-blue-300',
  },
]

interface PinnedAppsGridProps {
  apps?: PinnedApp[]
  onAppClick?: (app: PinnedApp) => void
}

export const PinnedAppsGrid: React.FC<PinnedAppsGridProps> = ({
  apps = defaultPinnedApps,
  onAppClick,
}) => {
  const handleClick = (app: PinnedApp) => {
    if (onAppClick) {
      onAppClick(app)
    } else {
      // 기본 동작: 새 탭에서 열기
      window.electronAPI
        .tab.create(app.url)
        .catch((err) => console.error('[PinnedAppsGrid] Failed to open app:', err))
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {apps.map((app) => (
        <button
          key={app.id}
          onClick={() => handleClick(app)}
          className={cn(
            'flex flex-col items-center justify-center',
            'w-full aspect-square',
            'rounded-lg',
            'bg-white/8 hover:bg-white/12',
            'border border-white/5 hover:border-white/10',
            'transition-all duration-200',
            'group',
            'text-gray-400 hover:text-gray-200',
            'p-2'
          )}
          title={app.label}
        >
          <div className={cn('group-hover:scale-110 transition-transform', app.color)}>
            {app.icon}
          </div>
          <span className="text-[10px] text-gray-500 group-hover:text-gray-400 mt-1.5 text-center truncate w-full">
            {app.label}
          </span>
        </button>
      ))}
    </div>
  )
}
