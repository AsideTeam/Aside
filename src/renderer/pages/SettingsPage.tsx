import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor, ChevronRight } from 'lucide-react'
import {
  SettingRow,
  Section,
  ToggleSwitch,
  SelectBox,
  SegmentControl,
  SettingsSidebar,
  SettingsSearch,
} from '../components/Settings'
import {
  THEME_OPTIONS,
  SEARCH_ENGINE_OPTIONS,
  FONT_SIZE_OPTIONS,
  ZOOM_LEVEL_OPTIONS,
  type Theme,
  type SearchEngine,
} from '@shared/constants/settings'

/**
 * SettingsPage - 메인 설정 페이지
 *
 * 책임: 전체 설정 UI 조합 + 상태 관리 + IPC 연동
 * 특징:
 * - 부모 역할: 각 컴포넌트에 상태와 콜백 전달
 * - Electron IPC: Main process의 설정 저장/로드
 * - 메뉴 기반: 왼쪽 사이드바에서 메뉴 선택 시 내용 변경
 *
 * SRP 준수:
 * - 자신은 상태 관리와 조합만 담당
 * - 렌더링은 각 컴포넌트에 위임
 */

interface Settings {
  theme: Theme
  searchEngine: SearchEngine
  fontSize: string
  zoomLevel: number
  showHomeButton: boolean
  showBookmarksBar: boolean
}

export function SettingsPage() {
  // 메뉴 상태
  const [activeMenuId, setActiveMenuId] = useState('appearance')
  const [searchQuery, setSearchQuery] = useState('')

  // 설정 상태
  const [settings, setSettings] = useState<Settings>({
    theme: 'system',
    searchEngine: 'Google',
    fontSize: 'medium',
    zoomLevel: 100,
    showHomeButton: true,
    showBookmarksBar: false,
  })

  console.log('[SettingsPage] Rendering', { activeMenuId, settings })

  // 마운트 시 Main process에서 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (window.electronAPI?.invoke) {
          const savedSettings = await window.electronAPI.invoke(
            'settings:get-all'
          )
          console.log('[SettingsPage] Loaded settings from Main:', savedSettings)
          if (savedSettings) {
            setSettings((prev) => ({ ...prev, ...savedSettings }))
          }
        }
      } catch (error) {
        console.error('[SettingsPage] Failed to load settings:', error)
      }
    }

    loadSettings()
  }, [])

  // 설정 변경 + Main process에 저장
  const updateSetting = async <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    console.log(`[SettingsPage] Updating ${key}:`, value)

    // 로컬 상태 업데이트
    setSettings((prev) => ({ ...prev, [key]: value }))

    // Main process에 저장
    try {
      if (window.electronAPI?.invoke) {
        await window.electronAPI.invoke('settings:update', {
          [key]: value,
        })
        console.log(`[SettingsPage] Setting saved to Main: ${key}`)
      }
    } catch (error) {
      console.error(`[SettingsPage] Failed to save setting ${key}:`, error)
    }
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

        {/* Appearance 섹션 */}
        {activeMenuId === 'appearance' && (
          <>
            <Section
              title="모양"
              description="브라우저의 모양과 느낌을 커스터마이즈하세요"
            >
              {/* 테마 선택 */}
              <SettingRow label="테마" description="선호하는 테마를 선택하세요">
                <SegmentControl
                  value={settings.theme}
                  onChange={(v) => updateSetting('theme', v as Theme)}
                  options={[
                    { value: 'light', label: 'Light', icon: <Sun size={14} /> },
                    { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
                    {
                      value: 'system',
                      label: 'System',
                      icon: <Monitor size={14} />,
                    },
                  ]}
                />
              </SettingRow>

              {/* 홈 버튼 표시 */}
              <SettingRow
                label="홈 버튼 표시"
                description="툴바에 홈 버튼을 표시합니다"
              >
                <ToggleSwitch
                  checked={settings.showHomeButton}
                  onChange={(v) => updateSetting('showHomeButton', v)}
                />
              </SettingRow>

              {/* 북마크 바 표시 */}
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
                  onChange={(v) => updateSetting('fontSize', v as string)}
                  options={FONT_SIZE_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                />
              </SettingRow>

              {/* 줌 레벨 */}
              <SettingRow label="페이지 줌" description="기본 줌 레벨을 설정하세요">
                <SelectBox
                  value={settings.zoomLevel}
                  onChange={(v) => updateSetting('zoomLevel', v as number)}
                  options={ZOOM_LEVEL_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                />
              </SettingRow>
            </Section>
          </>
        )}

        {/* Search Engine 섹션 */}
        {activeMenuId === 'search-engine' && (
          <Section title="검색 엔진" description="기본 검색 엔진을 설정하세요">
            <SettingRow
              label="주소창에서 사용할 검색 엔진"
              description="새로운 탭에서 검색할 때 사용될 엔진을 선택하세요"
            >
              <SelectBox
                value={settings.searchEngine}
                onChange={(v) => updateSetting('searchEngine', v as SearchEngine)}
                options={SEARCH_ENGINE_OPTIONS.map((engine) => ({
                  value: engine,
                  label: engine,
                }))}
              />
            </SettingRow>

            {/* 검색 엔진 관리 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                cursor: 'pointer',
                borderTop: '1px solid var(--border-color)',
                marginTop: '12px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-input)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                검색 엔진 및 사이트 검색 관리
              </span>
              <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>
          </Section>
        )}

        {/* 다른 섹션들 (스텁) */}
        {activeMenuId === 'you-and-google' && (
          <Section title="나와 Google">
            <SettingRow label="계정 정보">
              <div style={{ color: 'var(--text-secondary)' }}>
                계정 설정은 준비 중입니다
              </div>
            </SettingRow>
          </Section>
        )}

        {activeMenuId === 'autofill' && (
          <Section title="자동 완성">
            <SettingRow label="비밀번호">
              <div style={{ color: 'var(--text-secondary)' }}>
                비밀번호 설정은 준비 중입니다
              </div>
            </SettingRow>
          </Section>
        )}

        {activeMenuId === 'privacy' && (
          <Section title="개인정보 보호 및 보안">
            <SettingRow label="쿠키 및 기타 사이트 데이터">
              <div style={{ color: 'var(--text-secondary)' }}>
                개인정보 설정은 준비 중입니다
              </div>
            </SettingRow>
          </Section>
        )}

        {activeMenuId === 'languages' && (
          <Section title="언어">
            <SettingRow label="언어">
              <div style={{ color: 'var(--text-secondary)' }}>
                언어 설정은 준비 중입니다
              </div>
            </SettingRow>
          </Section>
        )}

        {activeMenuId === 'downloads' && (
          <Section title="다운로드">
            <SettingRow label="다운로드 위치">
              <div style={{ color: 'var(--text-secondary)' }}>
                다운로드 설정은 준비 중입니다
              </div>
            </SettingRow>
          </Section>
        )}

        {activeMenuId === 'about' && (
          <Section title="정보">
            <SettingRow label="버전">
              <div style={{ color: 'var(--text-secondary)' }}>
                Aside v0.1.0
              </div>
            </SettingRow>
          </Section>
        )}
      </main>
    </div>
  )
}
