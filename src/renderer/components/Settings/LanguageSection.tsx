import { SettingRow, Section, SelectBox } from './index'
import type { SettingsSchema } from '@shared/types'

interface LanguageSectionProps {
  settings: SettingsSchema
  onUpdateSetting: <K extends keyof SettingsSchema>(
    key: K,
    value: SettingsSchema[K]
  ) => Promise<void>
}

export function LanguageSection({ settings, onUpdateSetting }: LanguageSectionProps) {
  return (
    <Section
      title="언어 설정"
      description="애플리케이션 UI의 언어를 선택하세요"
    >
      <SettingRow
        label="UI 언어"
        description="모든 메뉴와 설정 화면이 선택한 언어로 표시됩니다"
      >
        <SelectBox
          value={settings.language}
          onChange={(v) => void onUpdateSetting('language', v as SettingsSchema['language'])}
          options={[
            { value: 'ko', label: '한국어' },
            { value: 'en', label: 'English' },
            { value: 'ja', label: '日本語' },
          ]}
        />
      </SettingRow>
    </Section>
  )
}
