import { useEffect, useMemo, useState } from 'react'
import {
  SettingsSidebar,
  SettingsSearch,
  AppearanceSection,
  LanguageSection,
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

  const activeMenuItems = useMemo(() => getActiveMenuItems(2), [])

  // Main에서 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await window.electronAPI?.settings?.getSettings?.()
        if (saved) setSettings(saved as SettingsSchema)
      } catch (error) {
        console.error('[SettingsPage] Failed to load settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadSettings()
  }, [])

  // 설정값 업데이트
  const updateSetting = async <K extends keyof SettingsSchema>(
    key: K,
    value: SettingsSchema[K]
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
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
      </main>
    </div>
  )
}
