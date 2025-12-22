/**
 * System Section
 * SRP: 시스템 설정만 담당
 */

import { SettingRow } from '../components/SettingRow'
import { ToggleSwitch } from '../components/ToggleSwitch'
import type { SettingsSchema } from '@shared/types'

interface SystemSectionProps {
  settings: SettingsSchema
  onUpdate: <K extends keyof SettingsSchema>(key: K, value: SettingsSchema[K]) => Promise<boolean>
}

export function SystemSection({ settings, onUpdate }: SystemSectionProps) {
  return (
    <div>
      <h1 className="text-3xl font-normal text-[#202124] mb-2">System</h1>
      <p className="text-sm text-[#5f6368] mb-8">System and performance settings</p>

      <SettingRow label="Continue running background apps when browser is closed">
        <ToggleSwitch
          checked={settings.continueSession}
          onChange={(checked) => void onUpdate('continueSession', checked)}
        />
      </SettingRow>
    </div>
  )
}
