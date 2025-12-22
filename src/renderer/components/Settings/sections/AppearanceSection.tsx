/**
 * Appearance Section
 * SRP: Appearance 설정만 담당
 */

import { SettingRow } from '../components/SettingRow'
import { ToggleSwitch } from '../components/ToggleSwitch'
import type { SettingsSchema } from '@shared/types'

interface AppearanceSectionProps {
  settings: SettingsSchema
  onUpdate: <K extends keyof SettingsSchema>(key: K, value: SettingsSchema[K]) => Promise<boolean>
}

export function AppearanceSection({ settings, onUpdate }: AppearanceSectionProps) {
  return (
    <div>
      <h1 className="text-3xl font-normal text-[#202124] mb-2">Appearance</h1>
      <p className="text-sm text-[#5f6368] mb-8">Customize the look and feel of your browser</p>

      {/* Mode */}
      <div className="mb-8">
        <h2 className="text-base font-medium text-[#202124] mb-4">Mode</h2>
        <div className="text-sm text-[#5f6368] mb-3">Choose your preferred theme</div>
        <div className="flex gap-3">
          {(['light', 'dark', 'system'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => void onUpdate('theme', mode)}
              className={`
                px-6 py-2.5 rounded-full text-sm font-medium transition-all border
                ${
                  settings.theme === mode
                    ? 'bg-[#1a73e8] text-white border-[#1a73e8]'
                    : 'bg-white text-[#5f6368] border-[#dadce0] hover:bg-[#f1f3f4]'
                }
              `}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Show home button */}
      <SettingRow
        label="Show home button"
        description="Displays the home button in the toolbar"
      >
        <ToggleSwitch
          checked={settings.showHomeButton}
          onChange={(checked) => void onUpdate('showHomeButton', checked)}
        />
      </SettingRow>

      {/* Show bookmarks bar */}
      <SettingRow label="Show bookmarks bar">
        <ToggleSwitch
          checked={settings.showBookmarksBar}
          onChange={(checked) => void onUpdate('showBookmarksBar', checked)}
        />
      </SettingRow>

      {/* Font size */}
      <SettingRow label="Font size">
        <select
          value={settings.fontSize}
          onChange={(e) => void onUpdate('fontSize', e.target.value as 'small' | 'medium' | 'large')}
          className="px-3 py-2 bg-white border border-[#dadce0] rounded text-sm text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] cursor-pointer min-w-[200px]"
        >
          <option value="small">Small</option>
          <option value="medium">Medium (Recommended)</option>
          <option value="large">Large</option>
        </select>
      </SettingRow>

      {/* Page zoom */}
      <SettingRow label="Page zoom">
        <select
          value={settings.pageZoom}
          onChange={(e) => void onUpdate('pageZoom', e.target.value)}
          className="px-3 py-2 bg-white border border-[#dadce0] rounded text-sm text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] cursor-pointer min-w-[100px]"
        >
          <option value="75">75%</option>
          <option value="80">80%</option>
          <option value="90">90%</option>
          <option value="100">100%</option>
          <option value="110">110%</option>
          <option value="125">125%</option>
          <option value="150">150%</option>
        </select>
      </SettingRow>
    </div>
  )
}
