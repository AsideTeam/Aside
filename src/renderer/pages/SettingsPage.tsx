import { useEffect, useMemo, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import {
  SettingRow,
  Section,
  ToggleSwitch,
  SelectBox,
  SegmentControl,
  SettingsSidebar,
  SettingsSearch,
} from '../components/Settings'
import { getActiveMenuItems } from '../constants/settingsMenu'
import type { SettingsMenuId } from '../constants/settingsMenu'
import type { SettingsSchema } from '@shared/types'

/**
 * SettingsPage - Settings UI
 *
 * 책임:
 * - 활성 메뉴 필터링 (priority 기반)
 * - 설정 상태 관리
 * - IPC 연동 (electronAPI.settings)
 *
 * priority 시스템:
 * - maxPriority=2: Appearance, Language만 표시
 * - maxPriority=5: +Performance, Search Engine, Autofill
 * - maxPriority=12: 모든 섹션
 */

export function SettingsPage() {
  const [activeMenuId, setActiveMenuId] = useState<SettingsMenuId>('appearance')
  const [searchQuery, setSearchQuery] = useState('')
  const [settings, setSettings] = useState<SettingsSchema | null>(null)

  // MVP: priority 1~2 (Appearance, Language)
  const activeMenuItems = useMemo(() => getActiveMenuItems(2), [])

  const fontSizeOptions = useMemo(
    () => [
      { value: 'small', label: '작게' },
      { value: 'medium', label: '보통' },
      { value: 'large', label: '크게' },
    ],
    []
  )

  const zoomOptions = useMemo(
    () => [
      { value: '75', label: '75%' },
      { value: '90', label: '90%' },
      { value: '100', label: '100%' },
      { value: '125', label: '125%' },
      { value: '150', label: '150%' },
    ],
    []
  )

  // Main에서 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await window.electronAPI?.settings?.getSettings?.()
        if (saved) setSettings(saved as SettingsSchema)
      } catch (error) {
        console.error('[SettingsPage] Failed to load settings:', error)
      }
    }

    loadSettings()
  }, [])

  // 설정값 업데이트
  const updateSetting = async <K extends keyof SettingsSchema>(
    key: K,
    value: SettingsSchema[K]
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
    try {
      await window.electronAPI?.settings?.updateSetting?.(key as string, value)
    } catch (error) {
      console.error('[SettingsPage] Failed to save setting:', { key, error })
    }
  }

  if (!settings) {
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
        onMenuChange={setActiveMenuId}
      />

      {/* 메인 콘텐츠 */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 64px',
          maxWidth: '1000px',
        }}
      >
        {/* 검색 바 */}
        <SettingsSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="설정 검색"
        />

        {/* ===== Appearance (Priority 1) ===== */}
        {activeMenuId === 'appearance' && (
          <>
            <Section
              title="모양"
              description="브라우저의 모양과 느낌을 커스터마이즈하세요"
            >
              {/* 테마 */}
              <SettingRow label="테마" description="선호하는 테마를 선택하세요">
                <SegmentControl
                  value={settings.theme}
                  onChange={(v) => updateSetting('theme', v as SettingsSchema['theme'])}
                  options={[
                    { value: 'light', label: '라이트', icon: <Sun size={14} /> },
                    { value: 'dark', label: '다크', icon: <Moon size={14} /> },
                    { value: 'system', label: '시스템', icon: <Monitor size={14} /> },
                  ]}
                />
              </SettingRow>

              {/* 홈 버튼 */}
              <SettingRow
                label="홈 버튼 표시"
                description="툴바에 홈 버튼을 표시합니다"
              >
                <ToggleSwitch
                  checked={settings.showHomeButton}
                  onChange={(v) => updateSetting('showHomeButton', v)}
                />
              </SettingRow>

              {/* 북마크 바 */}
              <SettingRow
                label="북마크 바 표시"
                description="북마크 바를 표시합니다"
              >
                <ToggleSwitch
                  checked={settings.showBookmarksBar}
                  onChange={(v) => updateSetting('showBookmarksBar', v)}
                />
              </SettingRow>

              {/* 폰트 크기 */}
              <SettingRow
                label="폰트 크기"
                description="웹페이지의 텍스트 크기를 조정하세요"
              >
                <SelectBox
                  value={settings.fontSize}
                  onChange={(v) => updateSetting('fontSize', v as SettingsSchema['fontSize'])}
                  options={fontSizeOptions}
                />
              </SettingRow>

              {/* 줌 레벨 */}
              <SettingRow label="페이지 줌" description="기본 줌 레벨을 설정하세요">
                <SelectBox
                  value={settings.pageZoom}
                  onChange={(v) => updateSetting('pageZoom', String(v) as SettingsSchema['pageZoom'])}
                  options={zoomOptions}
                />
              </SettingRow>
            </Section>
          </>
        )}

        {/* ===== Language (Priority 2) ===== */}
        {activeMenuId === 'language' && (
          <Section title="언어" description="UI 언어를 설정합니다">
            <SettingRow label="언어" description="앱 UI에 표시될 언어">
              <SelectBox
                value={settings.language}
                onChange={(v) => updateSetting('language', v as SettingsSchema['language'])}
                options={[
                  { value: 'ko', label: '한국어' },
                  { value: 'en', label: 'English' },
                  { value: 'ja', label: '日本語' },
                ]}
              />
            </SettingRow>
          </Section>
        )}
      </main>
    </div>
  )
}
