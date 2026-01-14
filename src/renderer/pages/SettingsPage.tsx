import React, { useMemo, useState } from 'react'
import {
  Cpu,
  Info,
  LayoutGrid,
  Monitor,
  Puzzle,
  Search,
  Shield,
} from 'lucide-react'

import type { SettingsSchema } from '@shared/types'
import { SettingsLayout } from '../layouts/SettingsLayout'
import { useAppSettings } from '../hooks/settings/useAppSettings'
import { useI18n } from '../hooks/settings/useI18n'
import { useAsideInfo } from '@renderer/hooks'
import { useExtensionsStatus } from '../hooks'

// --- Types ---
type SubCategoryId =
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

type MainCategoryId = 'general' | 'appearance' | 'search' | 'privacy' | 'system' | 'extensions' | 'about'

interface MainCategoryDef {
  id: MainCategoryId
  label: string
  icon: React.ReactNode
}

interface SubCategoryDef {
  id: SubCategoryId
  parentId: MainCategoryId
  label: string
  keywords: string[]
}

type SettingItem = {
  subCategoryId: SubCategoryId
  label: string
  description?: string
  render: (args: {
    settings: SettingsSchema
    updateSetting: <K extends keyof SettingsSchema>(key: K, value: SettingsSchema[K]) => Promise<void>
    resetAll: () => Promise<void>
  }) => React.ReactNode
}

// --- Components ---

const ZenSettingRow: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => {
  return (
    <div className="zen-setting-row">
      <div className="zen-row-info">
        <span className="zen-row-label">{label}</span>
        {description && <span className="zen-row-desc">{description}</span>}
      </div>
      <div className="zen-row-control">
        {children}
      </div>
    </div>
  )
}

// --- Item Builders ---
const buildItems = (t: ReturnType<typeof useI18n>['t']): SettingItem[] => [
  // Startup
  {
    subCategoryId: 'startup',
    label: t('item.continueSession.label'),
    description: t('item.continueSession.desc'),
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.continueSession}
        onChange={(e) => void updateSetting('continueSession', e.target.checked)}
        className="zen-checkbox"
      />
    ),
  },
  {
    subCategoryId: 'startup',
    label: t('item.defaultBrowserPromptOnStartup.label'),
    description: t('item.defaultBrowserPromptOnStartup.desc'),
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.defaultBrowserPromptOnStartup}
        onChange={(e) => void updateSetting('defaultBrowserPromptOnStartup', e.target.checked)}
        className="zen-checkbox"
      />
    ),
  },
  
  // Language
  {
    subCategoryId: 'language',
    label: t('item.uiLanguage.label'),
    description: t('item.uiLanguage.desc'),
    render: ({ settings, updateSetting }) => (
      <select
        value={settings.language}
        onChange={(e) => void updateSetting('language', e.target.value as SettingsSchema['language'])}
        className="zen-select"
      >
        <option value="ko">{t('language.ko')}</option>
        <option value="en">{t('language.en')}</option>
        <option value="ja">{t('language.ja')}</option>
      </select>
    ),
  },

  // Appearance (Visual Cards)
  {
    subCategoryId: 'appearance',
    label: t('category.appearance'), // "Website Appearance" replaced with Category name usage or specific key if available. Using general Appearance for now or key 'item.theme.desc'?? Let's use 'item.theme.label'
    description: t('item.theme.desc'),
    render: ({ settings, updateSetting }) => (
      <div className="theme-preview-grid mt-4">
         <div 
           className={`theme-card ${settings.theme === 'system' ? 'active' : ''}`}
           onClick={() => void updateSetting('theme', 'system')}
         >
            <div className="theme-card-preview" ></div>
            <div className="text-center text-sm font-medium">{t('theme.system')}</div>
         </div>
         <div 
           className={`theme-card ${settings.theme === 'light' ? 'active' : ''}`}
           onClick={() => void updateSetting('theme', 'light')}
         >
            <div className="theme-card-preview theme-preview-light"></div>
            <div className="text-center text-sm font-medium">{t('theme.light')}</div>
         </div>
         <div 
           className={`theme-card ${settings.theme === 'dark' ? 'active' : ''}`}
           onClick={() => void updateSetting('theme', 'dark')}
         >
            <div className="theme-card-preview theme-preview-dark"></div>
            <div className="text-center text-sm font-medium">{t('theme.dark')}</div>
         </div>
      </div>
    ),
  },
  {
    subCategoryId: 'appearance',
    label: 'Layout Mode', // TODO: Add i18n
    description: 'Choose your preferred layout style',
    render: ({ settings, updateSetting }) => (
      <div className="theme-preview-grid mt-4">
         <div 
           className={`theme-card ${settings.layoutMode === 'zen' ? 'active' : ''}`}
           onClick={() => void updateSetting('layoutMode', 'zen')}
         >
            <div className="theme-card-preview flex items-end justify-start p-2 gap-1 overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
                {/* Visual approximation of Zen Mode */}
                <div className="w-1/4 h-full rounded bg-(--color-bg-tertiary) opacity-50"></div>
                <div className="w-3/4 h-full rounded bg-(--color-bg-primary) border border-white/10"></div>
            </div>
            <div className="text-center text-sm font-medium">Zen Mode</div>
         </div>
         <div 
           className={`theme-card ${settings.layoutMode === 'chrome' ? 'active' : ''}`}
           onClick={() => void updateSetting('layoutMode', 'chrome')}
         >
            <div className="theme-card-preview flex flex-col items-center justify-start p-2 gap-1 overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
                {/* Visual approximation of Chrome Mode */}
                <div className="w-full h-1/4 rounded bg-(--color-bg-tertiary) opacity-50 mb-1"></div>
                <div className="w-full h-3/4 rounded bg-(--color-bg-primary) border border-white/10"></div>
            </div>
            <div className="text-center text-sm font-medium">Chrome Mode</div>
         </div>
      </div>
    ),
  },
  {
     subCategoryId: 'appearance',
     label: t('item.showHomeButton.label'),
     description: t('item.showHomeButton.desc'),
     render: ({ settings, updateSetting }) => (
        <input
           type="checkbox"
           checked={settings.showHomeButton}
           onChange={(e) => void updateSetting('showHomeButton', e.target.checked)}
           className="zen-checkbox"
        />
     )
  },
  {
     subCategoryId: 'appearance',
     label: t('item.showBookmarksBar.label'),
     description: t('item.showBookmarksBar.desc'),
     render: ({ settings, updateSetting }) => (
        <input
           type="checkbox"
           checked={settings.showBookmarksBar}
           onChange={(e) => void updateSetting('showBookmarksBar', e.target.checked)}
           className="zen-checkbox"
        />
     )
  },

  // Search
  {
    subCategoryId: 'search',
    label: t('item.searchEngine.label'),
    description: t('item.searchEngine.desc'),
    render: ({ settings, updateSetting }) => (
      <select
        value={settings.searchEngine}
        onChange={(e) => void updateSetting('searchEngine', e.target.value as SettingsSchema['searchEngine'])}
        className="zen-select"
      >
        <option value="google">Google</option>
        <option value="naver">Naver</option>
        <option value="bing">Bing</option>
        <option value="duckduckgo">DuckDuckGo</option>
      </select>
    ),
  },

  // Downloads
  {
    subCategoryId: 'downloads',
    label: t('item.downloadDirectory.label'),
    description: t('item.downloadDirectory.desc'),
    render: ({ settings }) => (
       <div className="flex gap-2">
          {/* Read-only presentation for now */}
          <input 
             type="text" 
             value={settings.downloadDirectory} 
             readOnly 
             className="zen-select w-64 opacity-50 cursor-not-allowed"
          />
          <button className="zen-btn">{t('action.open')}</button>
       </div>
    )
  },
  {
    subCategoryId: 'downloads',
    label: t('item.downloadAskWhereToSave.label'),
    description: t('item.downloadAskWhereToSave.desc'),
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.downloadAskWhereToSave}
        onChange={(e) => void updateSetting('downloadAskWhereToSave', e.target.checked)}
        className="zen-checkbox"
      />
    ),
  },

  // Privacy
  {
    subCategoryId: 'privacy',
    label: t('item.doNotTrack.label'),
    description: t('item.doNotTrack.desc'),
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.doNotTrack}
        onChange={(e) => void updateSetting('doNotTrack', e.target.checked)}
        className="zen-checkbox"
      />
    ),
  },
  {
    subCategoryId: 'privacy',
    label: t('item.blockThirdPartyCookies.label'),
    description: t('item.blockThirdPartyCookies.desc'),
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.blockThirdPartyCookies}
        onChange={(e) => void updateSetting('blockThirdPartyCookies', e.target.checked)}
        className="zen-checkbox"
      />
    ),
  },
  
  // Autofill
  {
    subCategoryId: 'autofill',
    label: t('item.savePasswords.label'),
    description: t('item.savePasswords.desc'),
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.savePasswords}
        onChange={(e) => void updateSetting('savePasswords', e.target.checked)}
        className="zen-checkbox"
      />
    ),
  },
  {
    subCategoryId: 'autofill',
    label: t('item.saveAddresses.label'),
    description: t('item.saveAddresses.desc'),
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.saveAddresses}
        onChange={(e) => void updateSetting('saveAddresses', e.target.checked)}
        className="zen-checkbox"
      />
    ),
  },

  // Performance
  {
    subCategoryId: 'performance',
    label: t('item.systemHardwareAcceleration.label'),
    description: t('item.systemHardwareAcceleration.desc'),
    render: ({ settings, updateSetting }) => (
      <input
        type="checkbox"
        checked={settings.systemHardwareAcceleration}
        onChange={(e) => void updateSetting('systemHardwareAcceleration', e.target.checked)}
        className="zen-checkbox"
      />
    ),
  },
]

export const SettingsPage: React.FC = () => {
  const [activeMainCategory, setActiveMainCategory] = useState<MainCategoryId>('general')
  const [query, setQuery] = useState('')

  const { settings, isLoading, updateSetting, resetAll } = useAppSettings()
  const { t } = useI18n()
  const items = useMemo(() => buildItems(t), [t])

  // Extensions & About Data
  const { status: extensionsStatus, reload: reloadExtensions } = useExtensionsStatus()
  const { info: asideInfo } = useAsideInfo()

  // --- Definitions (using t) ---
  const MAIN_CATEGORIES: MainCategoryDef[] = useMemo(() => [
    { id: 'general', label: t('category.general'), icon: <LayoutGrid className="w-5 h-5" /> }, 
    { id: 'appearance', label: t('category.appearance'), icon: <Monitor className="w-5 h-5" /> }, // New Main Category
    { id: 'search', label: t('category.search'), icon: <Search className="w-5 h-5" /> }, // New Main Category
    { id: 'privacy', label: t('category.privacy'), icon: <Shield className="w-5 h-5" /> },
    { id: 'system', label: t('category.system'), icon: <Cpu className="w-5 h-5" /> },
    { id: 'extensions', label: t('category.extensions'), icon: <Puzzle className="w-5 h-5" /> },
    { id: 'about', label: t('category.about'), icon: <Info className="w-5 h-5" /> },
  ], [t])

  const SUB_CATEGORIES: SubCategoryDef[] = useMemo(() => [
    { id: 'startup', parentId: 'general', label: t('category.startup'), keywords: ['homepage', 'session'] },
    { id: 'language', parentId: 'general', label: t('category.language'), keywords: ['language'] }, // Moved Language here
    { id: 'downloads', parentId: 'general', label: t('category.downloads'), keywords: ['download', 'save'] },
    
    // Appearance Group
    { id: 'appearance', parentId: 'appearance', label: t('category.appearance'), keywords: ['theme', 'font'] },
    
    // Search Group
    { id: 'search', parentId: 'search', label: t('category.search'), keywords: ['engine', 'google'] },
    
    { id: 'privacy', parentId: 'privacy', label: t('category.privacy'), keywords: ['cookie', 'tracking'] },
    { id: 'autofill', parentId: 'privacy', label: t('category.autofill'), keywords: ['password', 'card'] },
    
    { id: 'performance', parentId: 'system', label: t('category.performance'), keywords: ['hardware', 'acceleration'] },
    { id: 'accessibility', parentId: 'system', label: t('category.accessibility'), keywords: ['contrast'] },
    
    { id: 'extensions', parentId: 'extensions', label: t('category.extensions'), keywords: [] },
    { id: 'about', parentId: 'about', label: t('category.about'), keywords: [] },
  ], [t])

  // --- Renderers ---

  const renderSubCategoryGroup = (subCat: SubCategoryDef) => {
    const groupItems = items.filter(it => it.subCategoryId === subCat.id)
    
    // Special Render for Theme Cards to take full width
    if (subCat.id === 'appearance') {
       const themeItem = groupItems.find(it => it.label === t('category.appearance') || it.label.includes(t('item.theme.label'))) 
       const layoutItem = groupItems.find(it => it.label === 'Layout Mode')

       const otherItems = groupItems.filter(it => it !== themeItem && it !== layoutItem)
       
       return (
         <div key={subCat.id} className="mb-10">
           <h3 className="zen-subsection-title">{subCat.label}</h3>
           <div className="zen-card">
              {/* Theme Preview Section */}
              {themeItem && (
                 <div className="p-5 border-b border-white/5">
                    <span className="zen-row-label mb-2 block">{themeItem.label}</span>
                    <span className="zen-row-desc block">{themeItem.description}</span>
                    {settings && themeItem.render({ settings, updateSetting, resetAll })}
                 </div>
              )}
              {/* Layout Preview Section */}
              {layoutItem && (
                 <div className="p-5 border-b border-white/5">
                    <span className="zen-row-label mb-2 block">{layoutItem.label}</span>
                    <span className="zen-row-desc block">{layoutItem.description}</span>
                    {settings && layoutItem.render({ settings, updateSetting, resetAll })}
                 </div>
              )}
              {/* Other Items */}
              {otherItems.map(it => (
                 <ZenSettingRow key={it.label} label={it.label} description={it.description}>
                    {settings && it.render({ settings, updateSetting, resetAll })}
                 </ZenSettingRow>
              ))}
           </div>
         </div>
       )
    }

    if (groupItems.length === 0) return null

    return (
      <div key={subCat.id} className="mb-10">
        <h3 className="zen-subsection-title">{subCat.label}</h3>
        <div className="zen-card">
          {groupItems.map(it => (
            <ZenSettingRow key={it.label} label={it.label} description={it.description}>
              {settings && it.render({ settings, updateSetting, resetAll })}
            </ZenSettingRow>
          ))}
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (isLoading || !settings)
      return <div className="text-center pt-20 text-(--color-text-tertiary)">{t('settings.loading')}</div>

    // If Search Query Exists
    if (query.trim()) {
       // Simple search filtering
       const q = query.toLowerCase()
       const matchedItems = items.filter(it => 
          it.label.toLowerCase().includes(q) || it.description?.toLowerCase().includes(q)
       )
       
       return (
          <div>
             <h2 className="zen-section-title">{t('settings.search.title')}</h2>
             <div className="zen-card">
                {matchedItems.length > 0 ? matchedItems.map((it, idx) => (
                   <ZenSettingRow key={idx} label={it.label} description={it.description}>
                      {it.render({ settings, updateSetting, resetAll })}
                   </ZenSettingRow>
                )) : (
                   <div className="p-6 text-center text-(--color-text-tertiary)">{t('settings.search.noResults')}</div>
                )}
             </div>
          </div>
       )
    }

    // Active Category Content
    if (activeMainCategory === 'extensions') {
       return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
             <div className="flex items-center justify-between mb-6">
                <h2 className="zen-section-title mb-0">{t('category.extensions')}</h2>
                <button className="zen-btn" onClick={() => void reloadExtensions()}>{t('action.refresh')}</button>
             </div>
             
             <div className="zen-card">
               {extensionsStatus?.loaded && extensionsStatus.loaded.length > 0 ? (
                 extensionsStatus.loaded.map(ext => (
                   <ZenSettingRow 
                     key={ext.id} 
                     label={ext.name} 
                     description={`${ext.id} • v${ext.version}`}
                   >
                     <div className="flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-(--color-accent)/10 text-(--color-accent) font-medium">
                          Active
                        </span>
                     </div>
                   </ZenSettingRow>
                 ))
               ) : (
                 <div className="p-12 text-center">
                   <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-(--color-bg-tertiary) text-(--color-text-tertiary) mb-4">
                     <Puzzle size={24} />
                   </div>
                   <p className="text-sm text-(--color-text-secondary) mb-1">{t('extensions.noneInstalled')}</p>
                   <p className="text-xs text-(--color-text-tertiary)">Manage your browser extensions here.</p>
                 </div>
               )}
             </div>
          </div>
       )
    }

    if (activeMainCategory === 'about') {
       return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
             <h2 className="zen-section-title">{t('category.about')}</h2>
             <div className="zen-card">
                <div className="p-10 flex flex-col items-center justify-center text-center">
                   <div className="w-20 h-20 bg-contain bg-center bg-no-repeat mb-4" style={{ backgroundImage: 'url(/assets/icon.png)' }} />
                   <h1 className="text-2xl font-bold mb-2">Aside Browser</h1>
                   <p className="text-[#8F8F9D] mb-6">Version {asideInfo?.version || '0.1.0'}</p>
                   
                   <div className="flex gap-4">
                      <button className="zen-btn">Check for Updates</button>
                      <button className="zen-btn bg-transparent border border-[#5B5B66]">Help</button>
                   </div>
                   
                   <p className="mt-8 text-xs text-[#5B5B66]">
                      © 2024 Aside Project. All rights reserved.
                   </p>
                </div>
             </div>
          </div>
       )
    }

    return (
       <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          <h2 className="zen-section-title">{MAIN_CATEGORIES.find(c => c.id === activeMainCategory)?.label}</h2>
          {SUB_CATEGORIES.filter(sc => sc.parentId === activeMainCategory).map(sc => renderSubCategoryGroup(sc))}
       </div>
    )
  }

  return (
    <SettingsLayout
      categories={MAIN_CATEGORIES}
      activeCategory={activeMainCategory}
      onSelectCategory={(id) => { setActiveMainCategory(id as MainCategoryId); setQuery(''); }}
      searchQuery={query}
      onSearchChange={setQuery}
    >
      {renderContent()}
    </SettingsLayout>
  )
}
