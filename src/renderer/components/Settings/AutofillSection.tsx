import { SettingRow, Section, ToggleSwitch } from './index'
import type { SettingsSchema } from '@shared/types'

interface Props {
  settings: SettingsSchema | null
  onUpdateSetting: <K extends keyof SettingsSchema>(
    key: K,
    value: SettingsSchema[K]
  ) => void
}

export function AutofillSection({ settings, onUpdateSetting }: Props) {
  if (!settings) return null

  return (
    <Section title="자동 완성" description="양식 자동 완성 설정">
      <SettingRow label="비밀번호 저장" description="로그인할 때 비밀번호를 저장하겠습니까?">
        <ToggleSwitch
          checked={settings.savePasswords}
          onChange={(checked) => onUpdateSetting('savePasswords', checked)}
        />
      </SettingRow>
      <SettingRow label="결제 정보 저장" description="결제 정보를 저장하겠습니까?">
        <ToggleSwitch
          checked={settings.savePaymentInfo}
          onChange={(checked) => onUpdateSetting('savePaymentInfo', checked)}
        />
      </SettingRow>
      <SettingRow label="주소 정보 저장" description="배송 주소를 저장하겠습니까?">
        <ToggleSwitch
          checked={settings.saveAddresses}
          onChange={(checked) => onUpdateSetting('saveAddresses', checked)}
        />
      </SettingRow>
    </Section>
  )
}
