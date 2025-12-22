/**
 * Settings Main Component
 * SRP: 레이아웃과 네비게이션만 담당
 */

import { useState } from 'react'
import { User, Palette, Search, Lock, Globe, Info } from 'lucide-react'
import { useSettings } from './hooks/useSettings'
import { AppearanceSection } from './sections/AppearanceSection'
import { SearchSection } from './sections/SearchSection'
import { LanguagesSection } from './sections/LanguagesSection'
import { PrivacySection } from './sections/PrivacySection'
import { SystemSection } from './sections/SystemSection'

type SectionType =
  | 'you-and-google'
  | 'autofill'
  | 'privacy'
  | 'appearance'
  | 'search'
  | 'languages'
  | 'downloads'
  | 'about'

export function Settings() {
  const [currentSection, setCurrentSection] = useState<SectionType>('appearance')
  const [searchQuery, setSearchQuery] = useState('')
  const { settings, loading, error, updateSetting } = useSettings()

  const sidebarItems: Array<{
    id: SectionType
    label: string
    icon: React.ReactNode
  }> = [
    { id: 'you-and-google', label: 'You and Google', icon: <User size={20} /> },
    {
      id: 'autofill',
      label: 'Autofill',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    { id: 'privacy', label: 'Privacy and security', icon: <Lock size={20} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
    { id: 'search', label: 'Search engine', icon: <Search size={20} /> },
    { id: 'languages', label: 'Languages', icon: <Globe size={20} /> },
    {
      id: 'downloads',
      label: 'Downloads',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
    },
    { id: 'about', label: 'About', icon: <Info size={20} /> },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white">
        <div className="text-sm text-[#5f6368]">Loading settings...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white">
        <div className="text-center">
          <div className="text-sm text-red-600 mb-2">Error loading settings</div>
          <div className="text-xs text-[#5f6368]">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-white text-[#202124] overflow-hidden">
      {/* 좌측 사이드바 */}
      <aside className="w-64 bg-white border-r border-[#dadce0] flex flex-col overflow-y-auto">
        {/* Settings 헤더 */}
        <div className="p-6 border-b border-[#dadce0] flex-shrink-0">
          <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="#1a73e8" />
              <circle cx="12" cy="12" r="10" stroke="#1a73e8" strokeWidth="2" fill="none" />
            </svg>
            <h1 className="text-xl font-normal text-[#202124]">Settings</h1>
          </div>
        </div>

        {/* 검색창 */}
        <div className="p-4 border-b border-[#dadce0] flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368]" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings"
              className="w-full pl-10 pr-4 py-2 bg-[#f1f3f4] border-0 rounded-lg text-sm text-[#202124] placeholder-[#5f6368] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
            />
          </div>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentSection(item.id)}
              className={`
                w-full px-6 py-3 flex items-center gap-4 transition-all text-sm
                ${
                  currentSection === item.id
                    ? 'bg-[#e8f0fe] text-[#1967d2] font-medium'
                    : 'text-[#5f6368] hover:bg-[#f1f3f4]'
                }
              `}
            >
              <span className="flex items-center justify-center">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* 우측 콘텐츠 영역 */}
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-3xl mx-auto py-8 px-12">
          {currentSection === 'appearance' && (
            <AppearanceSection settings={settings} onUpdate={updateSetting} />
          )}

          {currentSection === 'search' && (
            <SearchSection settings={settings} onUpdate={updateSetting} />
          )}

          {currentSection === 'languages' && (
            <LanguagesSection settings={settings} onUpdate={updateSetting} />
          )}

          {currentSection === 'privacy' && (
            <PrivacySection settings={settings} onUpdate={updateSetting} />
          )}

          {currentSection === 'downloads' && (
            <SystemSection settings={settings} onUpdate={updateSetting} />
          )}

          {currentSection === 'you-and-google' && (
            <div>
              <h1 className="text-3xl font-normal text-[#202124] mb-2">You and Google</h1>
              <p className="text-sm text-[#5f6368] mb-8">Sync and Google services</p>
              <div className="bg-white rounded-lg border border-[#dadce0] p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#1a73e8] to-[#185abc] flex items-center justify-center text-white text-2xl font-medium">
                    J
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-[#202124]">Jane Doe</h3>
                    <p className="text-sm text-[#5f6368]">jane.doe@example.com</p>
                    <div className="flex items-center gap-1 mt-1">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="#1e8e3e">
                        <path d="M10.6,3.4l-5.3,5.3L2.4,5.8l0.7-0.7l2.2,2.2l4.6-4.6L10.6,3.4z" />
                      </svg>
                      <span className="text-xs text-[#1e8e3e]">Sync is on</span>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-sm text-[#1a73e8] font-medium hover:bg-[#f1f3f4] rounded">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentSection === 'autofill' && (
            <div>
              <h1 className="text-3xl font-normal text-[#202124] mb-2">Autofill</h1>
              <p className="text-sm text-[#5f6368] mb-8">Manage addresses and payment methods</p>
              <div className="bg-white rounded-lg border border-[#dadce0] p-6">
                <p className="text-sm text-[#5f6368]">Autofill features coming soon...</p>
              </div>
            </div>
          )}

          {currentSection === 'about' && (
            <div>
              <h1 className="text-3xl font-normal text-[#202124] mb-2">About Aside</h1>
              <p className="text-sm text-[#5f6368] mb-8">Version and update information</p>
              <div className="bg-white rounded-lg border border-[#dadce0] p-6">
                <div className="flex items-center gap-4 mb-4">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#1a73e8" strokeWidth="2" />
                    <circle cx="12" cy="12" r="4" fill="#1a73e8" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-medium text-[#202124]">Aside Browser</h3>
                    <p className="text-sm text-[#5f6368]">Version 0.1.0</p>
                  </div>
                </div>
                <p className="text-sm text-[#5f6368] leading-relaxed">
                  Aside is a lightweight, Zen-style browser built with Electron. It focuses on
                  simplicity, performance, and privacy.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
