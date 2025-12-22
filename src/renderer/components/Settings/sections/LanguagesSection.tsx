/**
 * Languages Section
 * SRP: 언어 설정만 담당
 */

import { SettingRow } from '../components/SettingRow'
import type { SettingsState } from '../hooks/useSettings'

interface LanguagesSectionProps {
  settings: SettingsState
  onUpdate: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => Promise<boolean>
}

export function LanguagesSection({ settings, onUpdate }: LanguagesSectionProps) {
  return (
    <div>
      <h1 className="text-3xl font-normal text-[#202124] mb-2">Languages</h1>
      <p className="text-sm text-[#5f6368] mb-8">
        Preferred languages for displaying content
      </p>

      <SettingRow
        label="Preferred language"
        description="Choose your preferred language for the browser interface"
      >
        <select
          value={settings.language}
          onChange={(e) => void onUpdate('language', e.target.value as 'ko' | 'en' | 'ja')}
          className="px-3 py-2 bg-white border border-[#dadce0] rounded text-sm text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] cursor-pointer min-w-40"
        >
          <option value="ko">한국어 (Korean)</option>
          <option value="en">English</option>
          <option value="ja">日本語 (Japanese)</option>
        </select>
      </SettingRow>

      <div className="mt-6 pt-6 border-t border-[#dadce0]">
        <p className="text-sm text-[#5f6368] leading-relaxed">
          The language setting will be applied to the browser interface. 
          Content language is determined by websites you visit.
        </p>
      </div>
    </div>
  )
}
