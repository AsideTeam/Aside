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
import { cn } from '@renderer/styles'

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

const CATEGORIES: SettingsCategory[] = [
  {
    id: 'autofill',
    label: '자동 완성 및 비밀번호',
    icon: <KeyRound className="w-4 h-4" />, 
    keywords: ['비밀번호', '자동완성', '주소', '결제'],
  },
  {
    id: 'privacy',
    label: '개인정보 및 보안',
    icon: <Lock className="w-4 h-4" />,
    keywords: ['쿠키', '추적', 'DNT', '광고'],
  },
  {
    id: 'performance',
    label: '성능',
    icon: <Zap className="w-4 h-4" />,
    keywords: ['줌', '캐시', '속도'],
  },
  {
    id: 'appearance',
    label: '모양',
    icon: <Paintbrush className="w-4 h-4" />,
    keywords: ['테마', '글꼴', '북마크바', '홈 버튼'],
  },
  {
    id: 'search',
    label: '검색엔진',
    icon: <Search className="w-4 h-4" />,
    keywords: ['기본 검색', '네이버', '구글', '빙', '덕덕고'],
  },
  {
    id: 'startup',
    label: '시작 시 설정',
    icon: <Sliders className="w-4 h-4" />,
    keywords: ['홈페이지', '세션', '이어하기'],
  },
  {
    id: 'language',
    label: '언어',
    icon: <Languages className="w-4 h-4" />,
    keywords: ['한국어', '영어', '일본어'],
  },
  {
    id: 'downloads',
    label: '다운로드',
    icon: <Download className="w-4 h-4" />,
    keywords: ['경로', '저장', '자동 열기'],
  },
  {
    id: 'accessibility',
    label: '접근성',
    icon: <Accessibility className="w-4 h-4" />,
    keywords: ['대비', '스크린리더', '자막'],
  },
  {
    id: 'system',
    label: '시스템',
    icon: <Monitor className="w-4 h-4" />,
    keywords: ['하드웨어 가속', '프록시', '백그라운드'],
  },
  {
    id: 'reset',
    label: '설정 초기화',
    icon: <RefreshCcw className="w-4 h-4" />,
    keywords: ['초기화', '복원', '리셋'],
  },
  {
    id: 'extensions',
    label: '확장 프로그램',
    icon: <Puzzle className="w-4 h-4" />,
    keywords: ['크롬 확장', 'extensions'],
  },
  {
    id: 'defaultBrowser',
    label: '기본 브라우저',
    icon: <Sparkles className="w-4 h-4" />,
    keywords: ['기본', 'default'],
  },
  {
    id: 'about',
    label: 'Aside 정보',
    icon: <Settings className="w-4 h-4" />,
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
        className="form-checkbox"
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
        className="form-checkbox"
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
        className="form-checkbox"
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
        className="form-checkbox"
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
        className="form-checkbox"
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
        className="form-checkbox"
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
        className="form-checkbox"
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
        className="form-checkbox"
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
    categoryId: 'startup',
    label: '홈페이지',
    description: '브라우저 시작 시 열릴 페이지를 설정합니다.',
    render: ({ settings, updateSetting }) => (
      <input
        type="text"
        value={settings.homepage}
        onChange={(e) => void updateSetting('homepage', e.target.value)}
        className="input-base"
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
        className="form-checkbox"
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
      <button className={cn('btn btn-danger btn-sm')} onClick={() => void resetAll()}>
        초기화
      </button>
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

  const renderPlaceholder = (title: string) => (
    <div>
      <h2 className="settings-title">{title}</h2>
      <p className="settings-muted">이 섹션은 준비 중입니다.</p>
    </div>
  )

  const renderActiveCategory = () => {
    if (!settings) {
      if (isLoading) {
        return <p className="settings-muted">설정을 불러오는 중...</p>
      }
      return <p className="settings-muted">설정을 불러오지 못했습니다.</p>
    }

    const title = SECTION_TITLES[activeCategory]

    // Categories without wired SettingsSchema values yet.
    if (['downloads', 'accessibility', 'system', 'extensions', 'defaultBrowser', 'about'].includes(activeCategory)) {
      return renderPlaceholder(title)
    }

    return (
      <div>
        <h2 className="settings-title">{title}</h2>
        <div className="settings-card">
          <div className="settings-card-inner">
            {categoryItems.length === 0 ? (
              <p className="settings-muted">표시할 설정이 없습니다.</p>
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
              <p className="settings-muted">검색 결과가 없습니다.</p>
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
        <div className="max-w-3xl mx-auto">
          <div className="settings-search-shell">
            <div className="settings-search-icon">
              <Search className="w-4 h-4" />
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
