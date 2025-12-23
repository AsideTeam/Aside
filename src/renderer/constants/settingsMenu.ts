import type { LucideIcon } from 'lucide-react'
import {
  Palette,
  Languages,
  Lock,
  Shield,
  Zap,
  Search,
  Home,
  Play,
  Download,
  Eye,
  Settings,
  RotateCcw,
} from 'lucide-react'

export type SettingsMenuId =
  | 'appearance'
  | 'autofill'
  | 'privacy'
  | 'performance'
  | 'search-engine'
  | 'default-browser'
  | 'startup'
  | 'language'
  | 'downloads'
  | 'accessibility'
  | 'system'
  | 'reset'

export interface SettingsMenuItem {
  id: SettingsMenuId
  label: string
  icon: LucideIcon
  priority: number // 1~2: 지금 활성, 3+: 향후
  description?: string
}

/**
 * Settings 섹션 전체 카탈로그
 *
 * priority:
 * - 1: Appearance (모양) - MVP
 * - 2: Language (언어) - MVP
 * - 3~: 향후 추가할 기능들
 */
export const SETTINGS_MENU_ITEMS_FULL: SettingsMenuItem[] = [
  {
    id: 'appearance',
    label: '모양',
    icon: Palette,
    priority: 1,
    description: '테마, 폰트, 줌 설정',
  },
  {
    id: 'language',
    label: '언어',
    icon: Languages,
    priority: 2,
    description: 'UI 언어 선택',
  },
  {
    id: 'autofill',
    label: '자동 완성 및 비밀번호',
    icon: Lock,
    priority: 3,
    description: '저장된 비밀번호 관리',
  },
  {
    id: 'privacy',
    label: '개인정보 보호 및 보안',
    icon: Shield,
    priority: 4,
    description: '쿠키, 캐시, 추적 설정',
  },
  {
    id: 'performance',
    label: '성능',
    icon: Zap,
    priority: 5,
    description: '메모리, 캐시 최적화',
  },
  {
    id: 'search-engine',
    label: '검색 엔진',
    icon: Search,
    priority: 6,
    description: '기본 검색 엔진 변경',
  },
  {
    id: 'default-browser',
    label: '기본 브라우저',
    icon: Home,
    priority: 7,
    description: '시스템 기본 브라우저 설정',
  },
  {
    id: 'startup',
    label: '시작 시 설정',
    icon: Play,
    priority: 8,
    description: '시작 시 복원할 탭 선택',
  },
  {
    id: 'downloads',
    label: '다운로드',
    icon: Download,
    priority: 9,
    description: '다운로드 폴더 설정',
  },
  {
    id: 'accessibility',
    label: '접근성',
    icon: Eye,
    priority: 10,
    description: '화면 읽기, 단축키 설정',
  },
  {
    id: 'system',
    label: '시스템',
    icon: Settings,
    priority: 11,
    description: '시스템 통합 설정',
  },
  {
    id: 'reset',
    label: '설정 초기화',
    icon: RotateCcw,
    priority: 12,
    description: '모든 설정을 기본값으로 복원',
  },
]

/**
 * Priority 필터링된 활성 메뉴 (현재는 1~4: Appearance, Language, Autofill, Privacy)
 */
export function getActiveMenuItems(maxPriority = 4): SettingsMenuItem[] {
  return SETTINGS_MENU_ITEMS_FULL.filter((item) => item.priority <= maxPriority)
}
