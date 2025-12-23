import { Sun, Moon, Monitor } from 'lucide-react'
import { SettingRow, Section, ToggleSwitch, SelectBox, SegmentControl } from './index'
import type { SettingsSchema } from '@shared/types'

interface AppearanceSectionProps {
  settings: SettingsSchema
  onUpdateSetting: <K extends keyof SettingsSchema>(
    key: K,
    value: SettingsSchema[K]
  ) => Promise<void>
}

export function AppearanceSection({ settings, onUpdateSetting }: AppearanceSectionProps) {
  const fontSizeOptions = [
    { value: 'small', label: '작게' },
    { value: 'medium', label: '보통' },
    { value: 'large', label: '크게' },
    { value: 'xlarge', label: '아주 크게' },
  ]

  const zoomOptions = [
    { value: '75', label: '75%' },
    { value: '90', label: '90%' },
    { value: '100', label: '100%' },
    { value: '125', label: '125%' },
    { value: '150', label: '150%' },
  ]

  return (
    <Section
      title="모양 설정"
      description="브라우저의 시각적 외관과 레이아웃을 커스터마이즈하세요"
    >
      {/* 테마 */}
      <SettingRow 
        label="테마 선택"
        description="라이트, 다크 또는 시스템 설정에 따라 자동 전환됩니다"
      >
        <SegmentControl
          value={settings.theme}
          onChange={(v) => void onUpdateSetting('theme', v as SettingsSchema['theme'])}
          options={[
            { value: 'light', label: '라이트', icon: <Sun size={14} /> },
            { value: 'dark', label: '다크', icon: <Moon size={14} /> },
            { value: 'system', label: '시스템', icon: <Monitor size={14} /> },
          ]}
        />
      </SettingRow>

      {/* 폰트 크기 */}
      <SettingRow
        label="텍스트 크기"
        description="웹페이지의 기본 텍스트 크기를 조정합니다"
      >
        <SelectBox
          value={settings.fontSize}
          onChange={(v) => void onUpdateSetting('fontSize', v as SettingsSchema['fontSize'])}
          options={fontSizeOptions}
        />
      </SettingRow>

      {/* 페이지 줌 */}
      <SettingRow
        label="페이지 확대"
        description="새로운 페이지를 열 때 기본 줌 레벨을 설정합니다"
      >
        <SelectBox
          value={settings.pageZoom}
          onChange={(v) => void onUpdateSetting('pageZoom', String(v) as SettingsSchema['pageZoom'])}
          options={zoomOptions}
        />
      </SettingRow>

      {/* 홈 버튼 */}
      <SettingRow
        label="홈 버튼 표시"
        description="주소 표시줄 왼쪽에 홈 버튼을 표시합니다"
      >
        <ToggleSwitch
          checked={settings.showHomeButton}
          onChange={(v) => void onUpdateSetting('showHomeButton', v)}
        />
      </SettingRow>

      {/* 북마크 바 */}
      <SettingRow
        label="북마크 바 표시"
        description="주소 표시줄 아래에 북마크 바를 표시합니다"
      >
        <ToggleSwitch
          checked={settings.showBookmarksBar}
          onChange={(v) => void onUpdateSetting('showBookmarksBar', v)}
        />
      </SettingRow>
    </Section>
  )
}
