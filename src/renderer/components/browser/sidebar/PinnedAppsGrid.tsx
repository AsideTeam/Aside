/**
 * FaviconBar Component
 *
 * 사용자가 추가한 애플리케이션/웹사이트의 파비콘을 표시
 * 각 아이콘은 float 패턴으로 배치됨
 */

import React from 'react'

import { logger } from '@renderer/lib/logger'

interface FaviconItem {
  id: string
  label: string
  faviconUrl?: string
  url: string
}

const defaultFavicons: FaviconItem[] = [
  {
    id: 'gmail',
    label: 'Gmail',
    faviconUrl: 'https://www.google.com/favicon.ico',
    url: 'https://mail.google.com',
  },
  {
    id: 'github',
    label: 'GitHub',
    faviconUrl: 'https://github.com/favicon.ico',
    url: 'https://github.com',
  },
  {
    id: 'twitter',
    label: 'Twitter',
    faviconUrl: 'https://twitter.com/favicon.ico',
    url: 'https://twitter.com',
  },
]

interface FaviconBarProps {
  favicons?: FaviconItem[]
  onFaviconClick?: (item: FaviconItem) => void
}

export const PinnedAppsGrid: React.FC<FaviconBarProps> = ({
  favicons = defaultFavicons,
  onFaviconClick,
}) => {
  const handleClick = (item: FaviconItem) => {
    if (onFaviconClick) {
      onFaviconClick(item)
    } else {
      window.electronAPI
        .tab.create(item.url)
        .catch((err) => logger.error('[PinnedAppsGrid] Failed to open', err))
    }
  }

  return (
    <div className="sidebar-favicon-bar">
      {favicons.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item)}
          className="sidebar-favicon"
          title={item.label}
        >
          {item.faviconUrl ? (
            <img
              src={item.faviconUrl}
              alt={item.label}
              className="sidebar-favicon-img"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="sidebar-favicon-placeholder" />
          )}
        </button>
      ))}
    </div>
  )
}
