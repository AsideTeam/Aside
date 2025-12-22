/**
 * Privacy and Security Section
 * SRP: 프라이버시 설정만 담당
 */

import { SettingRow } from '../components/SettingRow'
import { ToggleSwitch } from '../components/ToggleSwitch'
import type { SettingsSchema } from '@shared/types'

interface PrivacySectionProps {
  settings: SettingsSchema
  onUpdate: <K extends keyof SettingsSchema>(key: K, value: SettingsSchema[K]) => Promise<boolean>
}

export function PrivacySection({ settings, onUpdate }: PrivacySectionProps) {
  return (
    <div>
      <h1 className="text-3xl font-normal text-[#202124] mb-2">Privacy and security</h1>
      <p className="text-sm text-[#5f6368] mb-8">Manage your privacy and security settings</p>

      <div className="mb-6">
        <h2 className="text-base font-medium text-[#202124] mb-4">
          Cookies and other site data
        </h2>
        <SettingRow
          label="Block third-party cookies"
          description="Helps improve your privacy"
        >
          <ToggleSwitch
            checked={settings.blockThirdPartyCookies}
            onChange={(checked) => void onUpdate('blockThirdPartyCookies', checked)}
          />
        </SettingRow>
      </div>
    </div>
  )
}
