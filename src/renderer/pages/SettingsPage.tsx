import React, { useMemo, useState } from 'react'
import {
  Accessibility,
  Languages,
  Lock,
  Monitor,
  Paintbrush,
  RefreshCcw,
  Search,
  Settings,
  Sliders,
  Sparkles,
  Download,
  Puzzle,
  KeyRound,
  Zap,
} from 'lucide-react'

import type { SettingsSchema } from '@shared/types'
import { SettingsLayout } from '../layouts/SettingsLayout'
import { SettingRow } from '../components/Settings/SettingRow'
import { useAppSettings } from '../hooks/useAppSettings'
import { useAsideInfo } from '../hooks/useAsideInfo'
import { useDefaultBrowserStatus, useExtensionsStatus } from '../hooks'

type CategoryId =
  | 'autofill'
  | 'privacy'
  | 'performance'
  | 'appearance'
  | 'search'
  | 'startup'
  | 'language'
  | 'downloads'
  | 'accessibility'
  | 'system'
  | 'reset'
  | 'extensions'
  | 'defaultBrowser'
  | 'about'

type SettingsCategory = {
  id: CategoryId
  label: string
  icon: React.ReactNode
  keywords: string[]
}

type SettingItem = {
  categoryId: CategoryId
  label: string
  description?: string
  render: (args: {
    settings: SettingsSchema
    updateSetting: <K extends keyof SettingsSchema>(key: K, value: SettingsSchema[K]) => Promise<void>
    resetAll: () => Promise<void>
  }) => React.ReactNode
}

type AboutItem = {
  categoryId: 'about'
  label: string
  description?: string
  render: (args: { value: string | null; isLoading: boolean }) => React.ReactNode
}

const CATEGORIES: SettingsCategory[] = [
  {
    id: 'autofill',
    label: '자동 완성 및 비밀번호',
    icon: <KeyRound className="w-5 h-5" />, 
    keywords: ['비밀번호', '자동완성', '주소', '결제'],
  },
  {
    id: 'privacy',
    label: '개인정보 및 보안',
    icon: <Lock className="w-5 h-5" />,
    keywords: ['쿠키', '추적', 'DNT', '광고'],
  },
  {
    id: 'performance',
    label: '성능',
    icon: <Zap className="w-5 h-5" />,
    keywords: ['줌', '캐시', '속도'],
  },
  {
    id: 'appearance',
    label: '모양',
    icon: <Paintbrush className="w-5 h-5" />,
    keywords: ['테마', '글꼴', '북마크바', '홈 버튼'],
  },
  {
    id: 'search',
    label: '검색엔진',
    icon: <Search className="w-5 h-5" />,
    keywords: ['기본 검색', '네이버', '구글', '빙', '덕덕고'],
  },
  {
    id: 'startup',
    label: '시작 시 설정',
    icon: <Sliders className="w-5 h-5" />,
    keywords: ['홈페이지', '세션', '이어하기'],
  },
  {
    id: 'language',
    label: '언어',
    icon: <Languages className="w-5 h-5" />,
    keywords: ['한국어', '영어', '일본어'],
  },
  {
    id: 'downloads',
    label: '다운로드',
    icon: <Download className="w-5 h-5" />,
    keywords: ['경로', '저장', '자동 열기'],
  },
  {
    id: 'accessibility',
    label: '접근성',
    icon: <Accessibility className="w-5 h-5" />,
    keywords: ['대비', '스크린리더', '자막'],
  },
  {
    id: 'system',
    label: '시스템',
    icon: <Monitor className="w-5 h-5" />,
    keywords: ['하드웨어 가속', '프록시', '백그라운드'],
  },
  {
    id: 'reset',
    label: '설정 초기화',
    icon: <RefreshCcw className="w-5 h-5" />,
    keywords: ['초기화', '복원', '리셋'],
  },
  {
    id: 'extensions',
    label: '확장 프로그램',
    icon: <Puzzle className="w-5 h-5" />,
    keywords: ['크롬 확장', 'extensions'],
  },
  {
    id: 'defaultBrowser',
    label: '기본 브라우저',
    icon: <Sparkles className="w-5 h-5" />,
    keywords: ['기본', 'default'],
  },
  {
    id: 'about',
    label: 'Aside 정보',
    icon: <Settings className="w-5 h-5" />,
    keywords: ['버전', '정보', '라이선스'],
  },
]

const buildItems = (): SettingItem[] => [
  {
    categoryId: 'autofill',
    label: '비밀번호 저장',
    description: '웹사이트의 비밀번호 저장을 허용합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.savePasswords}
        onChange={(e) => void updateSetting('savePasswords', e.target.checked)}
        className="toggle-switch"
      />
    ),
  },
  {
    categoryId: 'autofill',
    label: '결제 수단 저장',
    description: '결제 정보 자동완성을 허용합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.savePaymentInfo}
        onChange={(e) => void updateSetting('savePaymentInfo', e.target.checked)}
        className="toggle-switch"
      />
    ),
  },
  {
    categoryId: 'autofill',
    label: '주소 저장',
    description: '주소 자동완성을 허용합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.saveAddresses}
        onChange={(e) => void updateSetting('saveAddresses', e.target.checked)}
        className="toggle-switch"
      />
    ),
  },
  {
    categoryId: 'privacy',
    label: '추적 방지(DNT) 요청',
    description: '웹사이트에 추적 금지 요청을 보냅니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.doNotTrack}
        onChange={(e) => void updateSetting('doNotTrack', e.target.checked)}
        className="toggle-switch"
      />
    ),
  },
  {
    categoryId: 'privacy',
    label: '타사 쿠키 차단',
    description: '타사 쿠키를 차단합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.blockThirdPartyCookies}
        onChange={(e) => void updateSetting('blockThirdPartyCookies', e.target.checked)}
        className="toggle-switch"
      />
    ),
  },
  {
    categoryId: 'privacy',
    label: '광고 차단',
    description: '기본 광고 차단 기능을 켭니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.blockAds}
        onChange={(e) => void updateSetting('blockAds', e.target.checked)}
        className="toggle-switch"
      />
    ),
  },
  {
    categoryId: 'performance',
    label: '페이지 줌',
    description: '기본 페이지 줌을 설정합니다.',
    render: ({ settings, updateSetting }) => (
      <select
        value={settings.pageZoom}
        onChange={(e) => void updateSetting('pageZoom', e.target.value)}
        className="input-base"
      >
        {['75', '90', '100', '110', '125', '150', '175', '200'].map((v) => (
          <option key={v} value={v}>
            {v}%
          </option>
        ))}
      </select>
    ),
  },
  {
    categoryId: 'appearance',
    label: '테마',
    description: '앱 테마를 선택합니다.',
    render: ({ settings, updateSetting }) => (
      <select
        value={settings.theme}
        onChange={(e) => void updateSetting('theme', e.target.value as SettingsSchema['theme'])}
        className="input-base"
      >
        <option value="system">시스템</option>
        <option value="dark">다크</option>
        <option value="light">라이트</option>
      </select>
    ),
  },
  {
    categoryId: 'appearance',
    label: '홈 버튼 표시',
    description: '상단 바에 홈 버튼을 표시합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.showHomeButton}
        onChange={(e) => void updateSetting('showHomeButton', e.target.checked)}
        className="toggle-switch"
      />
    ),
  },
  {
    categoryId: 'appearance',
    label: '북마크바 표시',
    description: '북마크바를 표시합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.showBookmarksBar}
        onChange={(e) => void updateSetting('showBookmarksBar', e.target.checked)}
        className="toggle-switch"
      />
    ),
  },
  {
    categoryId: 'appearance',
    label: '글꼴 크기',
    description: '기본 글꼴 크기를 선택합니다.',
    render: ({ settings, updateSetting }) => (
      <select
        value={settings.fontSize}
        onChange={(e) => void updateSetting('fontSize', e.target.value as SettingsSchema['fontSize'])}
        className="input-base"
      >
        <option value="small">작게</option>
        <option value="medium">보통</option>
        <option value="large">크게</option>
        <option value="xlarge">매우 크게</option>
      </select>
    ),
  },
  {
    categoryId: 'search',
    label: '기본 검색엔진',
    description: '주소창 검색에 사용할 검색엔진을 선택합니다.',
    render: ({ settings, updateSetting }) => (
      <select
        value={settings.searchEngine}
        onChange={(e) => void updateSetting('searchEngine', e.target.value as SettingsSchema['searchEngine'])}
        className="input-base"
      >
        <option value="google">Google</option>
        <option value="naver">Naver</option>
        <option value="bing">Bing</option>
        <option value="duckduckgo">DuckDuckGo</option>
      </select>
    ),
  },
  {
    categoryId: 'downloads',
    label: '다운로드 위치',
    description: '다운로드 파일이 저장될 기본 폴더를 설정합니다. 비우면 시스템 기본값을 사용합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="text"
        value={settings.downloadDirectory}
        onChange={(e) => void updateSetting('downloadDirectory', e.target.value)}
        className="input-base"
      />
    ),
  },
  {
    categoryId: 'downloads',
    label: '저장할 위치를 매번 확인',
    description: '다운로드할 때마다 저장 위치를 선택합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.downloadAskWhereToSave}
        onChange={(e) => void updateSetting('downloadAskWhereToSave', e.target.checked)}
        className="form-checkbox"
      />
    ),
  },
  {
    categoryId: 'downloads',
    label: '다운로드 후 자동 열기',
    description: '다운로드 완료 후 파일을 자동으로 열도록 시도합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.downloadOpenAfterSave}
        onChange={(e) => void updateSetting('downloadOpenAfterSave', e.target.checked)}
        className="form-checkbox"
      />
    ),
  },
  {
    categoryId: 'accessibility',
    label: '고대비 모드',
    description: 'UI 대비를 높여 가독성을 개선합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.accessibilityHighContrast}
        onChange={(e) => void updateSetting('accessibilityHighContrast', e.target.checked)}
        className="form-checkbox"
      />
    ),
  },
  {
    categoryId: 'accessibility',
    label: '동작 줄이기',
    description: '애니메이션/전환 효과를 최소화합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.accessibilityReduceMotion}
        onChange={(e) => void updateSetting('accessibilityReduceMotion', e.target.checked)}
        className="form-checkbox"
      />
    ),
  },
  {
    categoryId: 'system',
    label: '하드웨어 가속 사용',
    description: '성능 향상을 위해 GPU 가속을 사용합니다(적용에 재시작이 필요할 수 있음).',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.systemHardwareAcceleration}
        onChange={(e) => void updateSetting('systemHardwareAcceleration', e.target.checked)}
        className="form-checkbox"
      />
    ),
  },
  {
    categoryId: 'system',
    label: '백그라운드 앱 실행',
    description: '창을 닫은 후에도 백그라운드에서 일부 작업을 유지합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.systemBackgroundApps}
        onChange={(e) => void updateSetting('systemBackgroundApps', e.target.checked)}
        className="form-checkbox"
      />
    ),
  },
  {
    categoryId: 'startup',
    label: '홈페이지',
    description: '브라우저 시작 시 열릴 페이지를 설정합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="text"
        value={settings.homepage}
        onChange={(e) => void updateSetting('homepage', e.target.value)}
        className="input-base w-64"
      />
    ),
  },
  {
    categoryId: 'startup',
    label: '세션 이어하기',
    description: '다시 열 때 이전 세션을 복원합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.continueSession}
        onChange={(e) => void updateSetting('continueSession', e.target.checked)}
        className="toggle-switch"
      />
    ),
  },
  {
    categoryId: 'language',
    label: '언어',
    description: 'UI 언어를 선택합니다.',
    render: ({ settings, updateSetting }) => (
      <select
        value={settings.language}
        onChange={(e) => void updateSetting('language', e.target.value as SettingsSchema['language'])}
        className="input-base"
      >
        <option value="ko">한국어</option>
        <option value="en">English</option>
        <option value="ja">日本語</option>
      </select>
    ),
  },
  {
    categoryId: 'reset',
    label: '설정 초기화',
    description: '모든 설정을 기본값으로 되돌립니다.',
    render: ({ resetAll }) => (
      <button className="px-5 py-2 hover:bg-red-500/10 text-red-500 rounded-full text-sm font-medium transition-colors border border-red-500/20" onClick={() => void resetAll()}>
        초기화
      </button>
    ),
  },
  {
    categoryId: 'extensions',
    label: '확장 프로그램 사용',
    description: '확장 프로그램 로드를 허용합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.extensionsEnabled}
        onChange={(e) => void updateSetting('extensionsEnabled', e.target.checked)}
        className="toggle-switch"
      />
    ),
  },
  {
    categoryId: 'extensions',
    label: '확장 프로그램 폴더',
    description: '확장 프로그램을 로드할 디렉토리 경로입니다. 하위 폴더에 manifest.json이 있어야 합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="text"
        value={settings.extensionsDirectory}
        onChange={(e) => void updateSetting('extensionsDirectory', e.target.value)}
        className="input-base"
      />
    ),
  },
  {
    categoryId: 'defaultBrowser',
    label: '시작 시 기본 브라우저 안내',
    description: '시작할 때 기본 브라우저 여부를 안내합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.defaultBrowserPromptOnStartup}
        onChange={(e) => void updateSetting('defaultBrowserPromptOnStartup', e.target.checked)}
        className="toggle-switch"
      />
    ),
  },
]

const buildAboutItems = (): AboutItem[] => [
  {
    categoryId: 'about',
    label: '앱 이름',
    render: ({ value, isLoading }) => (
      <span className="text-sm">{isLoading ? '불러오는 중...' : (value ?? '-')}</span>
    ),
  },
  {
    categoryId: 'about',
    label: '버전',
    render: ({ value, isLoading }) => (
      <span className="text-sm">{isLoading ? '불러오는 중...' : (value ?? '-')}</span>
    ),
  },
  {
    categoryId: 'about',
    label: 'User Data 경로',
    description: '앱 데이터가 저장되는 디렉토리입니다.',
    render: ({ value, isLoading }) => (
      <span className="text-sm">{isLoading ? '불러오는 중...' : (value ?? '-')}</span>
    ),
  },
  {
    categoryId: 'about',
    label: '설정 파일 경로',
    description: 'electron-store 설정 파일 경로입니다.',
    render: ({ value, isLoading }) => (
      <span className="text-sm">{isLoading ? '불러오는 중...' : (value ?? '-')}</span>
    ),
  },
]

const SECTION_TITLES: Record<CategoryId, string> = {
  autofill: '자동 완성 및 비밀번호',
  privacy: '개인정보 및 보안',
  performance: '성능',
  appearance: '모양',
  search: '검색엔진',
  startup: '시작 시 설정',
  language: '언어',
  downloads: '다운로드',
  accessibility: '접근성',
  system: '시스템',
  reset: '설정 초기화',
  extensions: '확장 프로그램',
  defaultBrowser: '기본 브라우저',
  about: 'Aside 정보',
}

export const SettingsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('autofill')
  const [query, setQuery] = useState('')

  const { settings, isLoading, updateSetting, resetAll } = useAppSettings()
  const items = useMemo(() => buildItems(), [])
  const aboutItems = useMemo(() => buildAboutItems(), [])
  const { info: asideInfo, isLoading: isAsideInfoLoading } = useAsideInfo()
  const {
    status: extensionsStatus,
    isLoading: isExtensionsLoading,
    reload: reloadExtensions,
  } = useExtensionsStatus()
  const {
    status: defaultBrowserStatus,
    isLoading: isDefaultBrowserLoading,
    setDefault: setDefaultBrowser,
    openSystemSettings: openDefaultBrowserSystemSettings,
  } = useDefaultBrowserStatus()

  const visibleCategories = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CATEGORIES

    return CATEGORIES.filter((c) => {
      if (c.label.toLowerCase().includes(q)) return true
      return c.keywords.some((k) => k.toLowerCase().includes(q))
    })
  }, [query])

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !settings) return [] as Array<{ label: string; categoryId: CategoryId; description?: string }>

    return items
      .map((it) => ({
        label: it.label,
        description: it.description,
        categoryId: it.categoryId,
      }))
      .filter((it) => {
        if (it.label.toLowerCase().includes(q)) return true
        if (it.description?.toLowerCase().includes(q)) return true
        const cat = CATEGORIES.find((c) => c.id === it.categoryId)
        return cat ? cat.keywords.some((k) => k.toLowerCase().includes(q)) : false
      })
      .slice(0, 30)
  }, [query, items, settings])

  const categoryItems = useMemo(() => {
    return items.filter((it) => it.categoryId === activeCategory)
  }, [items, activeCategory])

  const aboutCategoryItems = useMemo(() => {
    return aboutItems
  }, [aboutItems])

  const renderActiveCategory = () => {
    if (!settings) {
      if (isLoading) {
        return <p className="settings-muted">설정을 불러오는 중...</p>
      }
      return <p className="settings-muted">설정을 불러오지 못했습니다.</p>
    }

    const title = SECTION_TITLES[activeCategory]

    if (activeCategory === 'extensions') {
      return (
        <div>
          <h2 className="settings-title">{title}</h2>
          <div className="settings-card">
            <div className="settings-card-inner">
              {categoryItems.map((it) => (
                <SettingRow key={it.label} label={it.label} description={it.description}>
                  {it.render({ settings, updateSetting, resetAll })}
                </SettingRow>
              ))}

              <SettingRow label="로드 상태" description="현재 로드된 확장 프로그램 상태입니다.">
                <span className="text-sm">
                  {isExtensionsLoading
                    ? '불러오는 중...'
                    : extensionsStatus
                      ? `${extensionsStatus.loaded.length}개 로드됨`
                      : '-'}
                </span>
              </SettingRow>

              <SettingRow label="확장 새로고침" description="폴더를 다시 스캔하고 확장을 로드합니다.">
                <button
                  className="px-5 py-2 hover:bg-white/5 rounded-full text-sm font-medium transition-colors border border-[#444746]"
                  onClick={() => void reloadExtensions()}
                >
                  새로고침
                </button>
              </SettingRow>
            </div>
          </div>

          {extensionsStatus?.loaded?.length ? (
            <div className="settings-card">
              <div className="settings-card-inner">
                {extensionsStatus.loaded.map((ext) => (
                  <div key={ext.id} className="settings-row">
                    <div className="flex-1 pr-4">
                      <h3 className="text-[15px] font-normal text-[#E3E3E3]">{ext.name}</h3>
                      <p className="text-[13px] mt-0.5 text-[#C4C7C5]">{ext.id}</p>
                    </div>
                    <div className="shrink-0">
                      <span className="text-sm">{ext.version}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )
    }

    if (activeCategory === 'defaultBrowser') {
      const isDefaultAll =
        (defaultBrowserStatus?.isDefaultHttp ?? false) && (defaultBrowserStatus?.isDefaultHttps ?? false)

      return (
        <div>
          <h2 className="settings-title">{title}</h2>
          <div className="settings-card">
            <div className="settings-card-inner">
              {categoryItems.map((it) => (
                <SettingRow key={it.label} label={it.label} description={it.description}>
                  {it.render({ settings, updateSetting, resetAll })}
                </SettingRow>
              ))}

              <SettingRow label="현재 상태" description="OS에서 Aside가 기본 브라우저로 설정되어 있는지 확인합니다.">
                <span className="text-sm">
                  {isDefaultBrowserLoading
                    ? '불러오는 중...'
                    : defaultBrowserStatus
                      ? `HTTP: ${defaultBrowserStatus.isDefaultHttp ? '기본' : '아님'} / HTTPS: ${defaultBrowserStatus.isDefaultHttps ? '기본' : '아님'}`
                      : '-'}
                </span>
              </SettingRow>

              <SettingRow label="기본 브라우저로 설정" description="OS에 기본 브라우저 설정을 요청합니다.">
                <button
                  className={`px-5 py-2 hover:bg-white/5 rounded-full text-sm font-medium transition-colors border border-[#444746] ${isDefaultAll ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => void setDefaultBrowser()}
                  disabled={isDefaultAll}
                >
                  설정
                </button>
              </SettingRow>

              <SettingRow label="시스템 설정 열기" description="기본 앱 설정 화면을 엽니다.">
                <button
                  className="px-5 py-2 hover:bg-white/5 rounded-full text-sm font-medium transition-colors border border-[#444746]"
                  onClick={() => void openDefaultBrowserSystemSettings()}
                >
                  열기
                </button>
              </SettingRow>
            </div>
          </div>
        </div>
      )
    }

    if (activeCategory === 'about') {
      return (
        <div>
          <h2 className="settings-title">{title}</h2>
          <div className="settings-card">
            <div className="settings-card-inner">
              {aboutCategoryItems.map((it) => {
                const value =
                  it.label === '앱 이름'
                    ? asideInfo?.name ?? null
                    : it.label === '버전'
                      ? asideInfo?.version ?? null
                      : it.label === 'User Data 경로'
                        ? asideInfo?.userDataDir ?? null
                        : it.label === '설정 파일 경로'
                          ? asideInfo?.settingsPath ?? null
                          : null

                return (
                  <SettingRow key={it.label} label={it.label} description={it.description}>
                    {it.render({ value, isLoading: isAsideInfoLoading })}
                  </SettingRow>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div>
        <h2 className="settings-title">{title}</h2>
        <div className="settings-card">
          <div className="settings-card-inner">
            {categoryItems.length === 0 ? (
              <div className="p-6">
                 <p className="settings-muted">표시할 설정이 없습니다.</p>
              </div>
            ) : (
              categoryItems.map((it) => (
                <SettingRow key={it.label} label={it.label} description={it.description}>
                  {it.render({ settings, updateSetting, resetAll })}
                </SettingRow>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderSearch = () => {
    if (!query.trim()) return null

    return (
      <div>
        <h2 className="settings-title">설정 검색</h2>
        <div className="settings-card">
          <div className="settings-card-inner">
            {searchResults.length === 0 ? (
              <div className="p-6">
                <p className="settings-muted">검색 결과가 없습니다.</p>
              </div>
            ) : (
              searchResults.map((r) => (
                <button
                  key={`${r.categoryId}:${r.label}`}
                  className="settings-result-btn"
                  onClick={() => {
                    setActiveCategory(r.categoryId)
                    setQuery('')
                  }}
                >
                  <div className="settings-result-title">{r.label}</div>
                  {r.description ? (
                    <div className="settings-result-desc">{r.description}</div>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <SettingsLayout
      categories={visibleCategories}
      activeCategory={activeCategory}
      onSelectCategory={(id) => {
        setActiveCategory(id as CategoryId)
        setQuery('')
      }}
    >
      <div className="settings-topbar">
        <div className="max-w-180 mx-auto">
          <div className="settings-search-shell group">
            <div className="settings-search-icon">
              <Search className="w-5 h-5 group-focus-within:text-[#A8C7FA] transition-colors" />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="설정 검색"
              className="settings-search-input"
            />
          </div>
        </div>
      </div>

      {query.trim() ? renderSearch() : renderActiveCategory()}
    </SettingsLayout>
  )
}
