import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Palette,
  Search,
  Lock,
  Zap,
  Info,
  ChevronRight,
} from 'lucide-react'

interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  searchEngine: 'google' | 'bing' | 'duckduckgo' | 'naver'
  homepage: string
  showHomeButton: boolean
  showBookmarksBar: boolean
  fontSize: 'small' | 'medium' | 'large'
  pageZoom: string
  blockThirdPartyCookies: boolean
  continueSession: boolean
}

type SectionType = 'general' | 'appearance' | 'search' | 'privacy' | 'startup' | 'about'

/**
 * Settings 페이지 - Google Chrome 스타일
 * 좌측 사이드바 메뉴 + 우측 콘텐츠 영역
 */
export function Settings() {
  const [currentSection, setCurrentSection] = useState<SectionType>('general')
  const [settings, setSettings] = useState<SettingsState>({
    theme: 'dark',
    searchEngine: 'google',
    homepage: 'https://www.google.com',
    showHomeButton: true,
    showBookmarksBar: false,
    fontSize: 'medium',
    pageZoom: '100',
    blockThirdPartyCookies: true,
    continueSession: true,
  })
  const [loading, setLoading] = useState(true)

  // 페이지 로드 시 설정값 가져오기
  useEffect(() => {
    loadSettings()
  }, [])

  /**
   * 저장된 설정값 로드
   */
  async function loadSettings() {
    try {
      if (window.electronAPI?.settings?.getSettings) {
        const loadedSettings = await window.electronAPI.settings.getSettings()
        setSettings(prev => ({
          ...prev,
          ...loadedSettings,
        }))
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 설정값 업데이트
   */
  async function updateSetting<K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) {
    try {
      if (window.electronAPI?.settings?.updateSetting) {
        await window.electronAPI.settings.updateSetting(key, value)
        setSettings(prev => ({
          ...prev,
          [key]: value,
        }))
      }
    } catch (error) {
      console.error(`Failed to update setting ${key}:`, error)
    }
  }

  const sidebarItems: Array<{
    id: SectionType
    label: string
    icon: React.ReactNode
  }> = [
    { id: 'general', label: 'General', icon: <SettingsIcon size={20} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
    { id: 'search', label: 'Search Engine', icon: <Search size={20} /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <Lock size={20} /> },
    { id: 'startup', label: 'On Startup', icon: <Zap size={20} /> },
    { id: 'about', label: 'About', icon: <Info size={20} /> },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-[#202124]">
        <div className="text-[#9aa0a6]">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#202124] text-[#e8eaed]">
      {/* 좌측 사이드바 */}
      <aside className="w-48 bg-[#1a1b1e] border-r border-[#35363a] flex flex-col overflow-y-auto scrollbar-hide">
        <div className="p-6 border-b border-[#35363a]">
          <h1 className="text-xl font-medium">Settings</h1>
        </div>

        <nav className="flex-1 py-4">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentSection(item.id)}
              className={`
                w-full px-6 py-3 flex items-center gap-4 transition-colors text-sm
                border-l-4 border-transparent
                ${
                  currentSection === item.id
                    ? 'bg-[#35363a] text-[#8ab4f8] border-l-[#8ab4f8]'
                    : 'text-[#9aa0a6] hover:bg-[#292a2d] hover:text-[#e8eaed]'
                }
              `}
            >
              <span className="flex items-center justify-center">{item.icon}</span>
              <span className="flex-1 text-left font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* 우측 콘텐츠 영역 */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {/* General */}
        {currentSection === 'general' && (
          <SettingsSection title="General" description="Customize your browser settings">
            <SettingsGroup title="Startup">
              <SettingItem
                label="Home page"
                description="Set your default homepage"
              >
                <input
                  type="text"
                  value={settings.homepage}
                  onChange={e => updateSetting('homepage', e.target.value)}
                  placeholder="https://www.google.com"
                  className="w-48 px-3 py-2 bg-[#35363a] border border-[#5f6368] rounded text-[#e8eaed] text-sm focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]"
                />
              </SettingItem>
            </SettingsGroup>
          </SettingsSection>
        )}

        {/* Appearance */}
        {currentSection === 'appearance' && (
          <SettingsSection title="Appearance" description="Customize the look and feel">
            <SettingsGroup title="Mode">
              <SettingItem label="Choose your preferred theme">
                <div className="flex gap-2">
                  {(['light', 'dark', 'system'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => updateSetting('theme', mode)}
                      className={`
                        px-4 py-2 rounded text-sm font-medium transition-colors
                        ${
                          settings.theme === mode
                            ? 'bg-[#8ab4f8] text-[#202124]'
                            : 'bg-[#35363a] text-[#9aa0a6] hover:bg-[#5f6368]'
                        }
                      `}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </SettingItem>
            </SettingsGroup>

            <SettingsGroup title="Display">
              <SettingItem label="Font size">
                <select
                  value={settings.fontSize}
                  onChange={e =>
                    updateSetting('fontSize', e.target.value as 'small' | 'medium' | 'large')
                  }
                  className="px-3 py-2 bg-[#35363a] border border-[#5f6368] rounded text-[#e8eaed] text-sm focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium (Recommended)</option>
                  <option value="large">Large</option>
                </select>
              </SettingItem>

              <SettingItem label="Page zoom">
                <select
                  value={settings.pageZoom}
                  onChange={e => updateSetting('pageZoom', e.target.value)}
                  className="px-3 py-2 bg-[#35363a] border border-[#5f6368] rounded text-[#e8eaed] text-sm focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]"
                >
                  <option value="90">90%</option>
                  <option value="100">100%</option>
                  <option value="110">110%</option>
                  <option value="125">125%</option>
                </select>
              </SettingItem>
            </SettingsGroup>

            <SettingsGroup title="Toolbar">
              <SettingItem label="Show home button" description="Display the home button in the toolbar">
                <ToggleSwitch
                  checked={settings.showHomeButton}
                  onChange={checked => updateSetting('showHomeButton', checked)}
                />
              </SettingItem>

              <SettingItem label="Show bookmarks bar" description="Display bookmarks below the address bar">
                <ToggleSwitch
                  checked={settings.showBookmarksBar}
                  onChange={checked => updateSetting('showBookmarksBar', checked)}
                />
              </SettingItem>
            </SettingsGroup>
          </SettingsSection>
        )}

        {/* Search Engine */}
        {currentSection === 'search' && (
          <SettingsSection title="Search Engine" description="Choose your default search engine">
            <SettingsGroup title="Search engine used in the address bar">
              <SettingItem label="Default search engine">
                <select
                  value={settings.searchEngine}
                  onChange={e =>
                    updateSetting(
                      'searchEngine',
                      e.target.value as 'google' | 'bing' | 'duckduckgo' | 'naver'
                    )
                  }
                  className="px-3 py-2 bg-[#35363a] border border-[#5f6368] rounded text-[#e8eaed] text-sm focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]"
                >
                  <option value="google">Google</option>
                  <option value="bing">Bing</option>
                  <option value="duckduckgo">DuckDuckGo</option>
                  <option value="naver">Naver</option>
                </select>
              </SettingItem>
            </SettingsGroup>
          </SettingsSection>
        )}

        {/* Privacy & Security */}
        {currentSection === 'privacy' && (
          <SettingsSection title="Privacy & Security" description="Manage your privacy settings">
            <SettingsGroup title="Cookies and other site data">
              <SettingItem
                label="Block third-party cookies"
                description="Helps improve your privacy"
              >
                <ToggleSwitch
                  checked={settings.blockThirdPartyCookies}
                  onChange={checked => updateSetting('blockThirdPartyCookies', checked)}
                />
              </SettingItem>
            </SettingsGroup>
          </SettingsSection>
        )}

        {/* On Startup */}
        {currentSection === 'startup' && (
          <SettingsSection title="On Startup" description="Choose what happens when you start the browser">
            <SettingsGroup>
              <SettingItem label="Continue where you left off">
                <ToggleSwitch
                  checked={settings.continueSession}
                  onChange={checked => updateSetting('continueSession', checked)}
                />
              </SettingItem>
            </SettingsGroup>
          </SettingsSection>
        )}

        {/* About */}
        {currentSection === 'about' && (
          <SettingsSection title="About Aside" description="Version information">
            <SettingsGroup>
              <SettingItem label="Aside Browser" description="Version 1.0.0" />
            </SettingsGroup>
          </SettingsSection>
        )}
      </main>
    </div>
  )
}

/**
 * 설정 섹션 헤더
 */
function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-normal mb-2">{title}</h1>
        {description && <p className="text-[#9aa0a6] text-sm">{description}</p>}
      </div>
      {children}
    </div>
  )
}

/**
 * 설정 그룹 (섹션 내의 카테고리)
 */
function SettingsGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      {title && <h3 className="text-base font-medium text-[#e8eaed] mb-4 pb-3 border-b border-[#35363a]">{title}</h3>}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

/**
 * 개별 설정 항목
 */
function SettingItem({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded hover:bg-[#292a2d] transition-colors">
      <div className="flex-1">
        <div className="text-sm font-medium text-[#e8eaed]">{label}</div>
        {description && <div className="text-xs text-[#9aa0a6] mt-1">{description}</div>}
      </div>
      {children && <div className="ml-4">{children}</div>}
    </div>
  )
}

/**
 * 토글 스위치 컴포넌트
 */
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`
        relative w-12 h-7 rounded-full transition-colors
        ${checked ? 'bg-[#8ab4f8]' : 'bg-[#5f6368]'}
      `}
    >
      <div
        className={`
          absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  )
}
