import { useEffect, useMemo, useState } from 'react'
import {
  SettingsSidebar,
  SettingsSearch,
  AppearanceSection,
  LanguageSection,
  AutofillSection,
  PrivacySection,
} from '../components/Settings'
import { getActiveMenuItems } from '../constants/settingsMenu'
import type { SettingsMenuId } from '../constants/settingsMenu'
import type { SettingsSchema } from '@shared/types'

/**
 * SettingsPage - 설정 페이지
 *
 * 책임:
 * - 상태 관리 (settings, activeMenuId)
 * - IPC 통신 (settings load/update)
 * - 섹션 라우팅
 *
 * 각 섹션은 별도 컴포넌트에서 관리:
 * - AppearanceSection
 * - LanguageSection
 */

export function SettingsPage() {
  const [activeMenuId, setActiveMenuId] = useState<SettingsMenuId>('appearance')
  const [searchQuery, setSearchQuery] = useState('')
  const [settings, setSettings] = useState<SettingsSchema | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const activeMenuItems = useMemo(() => getActiveMenuItems(4), [])

  // Main에서 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await window.electronAPI?.settings?.getSettings?.()
        if (saved) {
          const settings = saved as SettingsSchema
          setSettings(settings)
          
          // 모든 설정 초기 적용
          applyTheme(settings.theme)
          applyFontSize(settings.fontSize)
          applyPageZoom(settings.pageZoom)
          applyShowBookmarksBar(settings.showBookmarksBar)
          applyShowHomeButton(settings.showHomeButton)
        }
      } catch (error) {
        console.error('[SettingsPage] Failed to load settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadSettings()
  }, [])

  // 테마 적용
  const applyTheme = (theme: SettingsSchema['theme']) => {
    const root = document.documentElement
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', isDark ? 'dark' : 'light')
    } else {
      root.setAttribute('data-theme', theme)
    }
  }

  // 텍스트 크기 적용
  const applyFontSize = (sizeValue: string) => {
    const sizes: Record<string, string> = {
      small: '12px',
      normal: '14px',
      large: '16px',
      'x-large': '18px',
    }
    const fontSize = sizes[sizeValue] || '14px'
    document.documentElement.style.fontSize = fontSize
  }

  // 페이지 줌 적용
  const applyPageZoom = (zoomValue: string) => {
    const zooms: Record<string, number> = {
      '75': 0.75,
      '90': 0.9,
      '100': 1,
      '125': 1.25,
      '150': 1.5,
    }
    const zoom = zooms[zoomValue] || 1
    document.body.style.zoom = `${zoom * 100}%`
  }

  // 북마크 바 표시 제어
  const applyShowBookmarksBar = (show: boolean) => {
    const bookmarksBar = document.querySelector('[data-element="bookmarks-bar"]')
    if (bookmarksBar) {
      ;(bookmarksBar as HTMLElement).style.display = show ? 'block' : 'none'
    }
  }

  // 홈 버튼 표시 제어
  const applyShowHomeButton = (show: boolean) => {
    const homeButton = document.querySelector('[data-element="home-button"]')
    if (homeButton) {
      ;(homeButton as HTMLElement).style.display = show ? 'block' : 'none'
    }
  }

  // 설정값 업데이트
  const updateSetting = async <K extends keyof SettingsSchema>(
    key: K,
    value: SettingsSchema[K]
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
    
    // 즉시 UI에 적용
    if (key === 'theme') {
      applyTheme(value as SettingsSchema['theme'])
    } else if (key === 'fontSize') {
      applyFontSize(value as string)
    } else if (key === 'pageZoom') {
      applyPageZoom(value as string)
    } else if (key === 'showBookmarksBar') {
      applyShowBookmarksBar(value as boolean)
    } else if (key === 'showHomeButton') {
      applyShowHomeButton(value as boolean)
    }
    
    try {
      await window.electronAPI?.settings?.updateSetting?.(key as string, value)
      console.log('[SettingsPage] Setting saved:', { key, value })
    } catch (error) {
      console.error('[SettingsPage] Failed to save setting:', { key, error })
    }
  }

  if (isLoading || !settings) {
    return (
      <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>
        설정을 불러오는 중…
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: 'var(--bg-main)',
      }}
    >
      {/* 왼쪽 사이드바 */}
      <SettingsSidebar
        items={activeMenuItems}
        activeMenuId={activeMenuId}
        onMenuChange={(menuId) => setActiveMenuId(menuId as SettingsMenuId)}
      />

      {/* 메인 콘텐츠 */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '40px 64px',
          maxWidth: '1100px',
        }}
      >
        {/* 검색 바 */}
        <div style={{ marginBottom: '48px' }}>
          <SettingsSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="설정 검색"
          />
        </div>

        {/* Appearance 섹션 */}
        {activeMenuId === 'appearance' && (
          <AppearanceSection
            settings={settings}
            onUpdateSetting={updateSetting}
          />
        )}

        {/* Language 섹션 */}
        {activeMenuId === 'language' && (
          <LanguageSection
            settings={settings}
            onUpdateSetting={updateSetting}
          />
        )}

        {/* Autofill 섹션 */}
        {activeMenuId === 'autofill' && (
          <AutofillSection
            settings={settings}
            onUpdateSetting={updateSetting}
          />
        )}

        {/* Privacy 섹션 */}
        {activeMenuId === 'privacy' && (
          <PrivacySection
            settings={settings}
            onUpdateSetting={updateSetting}
          />
        )}
      </main>
    </div>
  )
}
