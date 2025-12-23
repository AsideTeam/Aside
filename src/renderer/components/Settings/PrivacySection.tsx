import { SettingRow, Section, ToggleSwitch } from './index'
import type { SettingsSchema } from '@shared/types'

interface Props {
  settings: SettingsSchema | null
  onUpdateSetting: <K extends keyof SettingsSchema>(
    key: K,
    value: SettingsSchema[K]
  ) => void
}

export function PrivacySection({ settings, onUpdateSetting }: Props) {
  if (!settings) return null

  return (
    <Section title="개인정보보호" description="개인정보 보호 및 추적 설정">
      <SettingRow label="추적 방지" description="'추적 안 함' 요청을 전송합니다">
        <ToggleSwitch
          checked={settings.doNotTrack}
          onChange={(checked) => onUpdateSetting('doNotTrack', checked)}
        />
      </SettingRow>
      <SettingRow label="타사 쿠키 차단" description="타사 웹사이트의 추적 쿠키 차단">
        <ToggleSwitch
          checked={settings.blockThirdPartyCookies}
          onChange={(checked) => onUpdateSetting('blockThirdPartyCookies', checked)}
        />
      </SettingRow>
      <SettingRow label="광고 차단" description="광고 표시 차단">
        <ToggleSwitch
          checked={settings.blockAds}
          onChange={(checked) => onUpdateSetting('blockAds', checked)}
        />
      </SettingRow>
    </Section>
  )
}
