/**
 * Search Engine Section
 * SRP: 검색 엔진 설정만 담당
 */

import { ChevronRight } from 'lucide-react'
import { SettingRow } from '../components/SettingRow'
import type { SettingsSchema } from '@shared/types'

interface SearchSectionProps {
  settings: SettingsSchema
  onUpdate: <K extends keyof SettingsSchema>(key: K, value: SettingsSchema[K]) => Promise<boolean>
}

export function SearchSection({ settings, onUpdate }: SearchSectionProps) {
  return (
    <div>
      <h1 className="text-3xl font-normal text-[#202124] mb-2">Search Engine</h1>
      <p className="text-sm text-[#5f6368] mb-8">Manage search engines used in the address bar</p>

      <SettingRow label="Search engine used in the address bar">
        <select
          value={settings.searchEngine}
          onChange={(e) =>
            void onUpdate(
              'searchEngine',
              e.target.value as 'google' | 'bing' | 'duckduckgo' | 'naver'
            )
          }
          className="px-3 py-2 bg-white border border-[#dadce0] rounded text-sm text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] cursor-pointer min-w-40"
        >
          <option value="google">Google</option>
          <option value="bing">Bing</option>
          <option value="duckduckgo">DuckDuckGo</option>
          <option value="naver">Naver</option>
        </select>
      </SettingRow>

      <div className="mt-6 pt-6 border-t border-[#dadce0]">
        <button className="flex items-center gap-2 text-sm text-[#1a73e8] hover:bg-[#f1f3f4] px-4 py-2 rounded transition-colors">
          Manage search engines and site search
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
