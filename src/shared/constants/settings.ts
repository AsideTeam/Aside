/**
 * 설정 페이지 상수 정의
 *
 * 책임: Settings UI에 필요한 모든 상수 (섹션, 항목, 옵션)
 * 특징: Settings 메뉴 구조를 한 곳에서 관리
 */

import {
  User,
  Key,
  Shield,
  Palette,
  Search,
  Globe,
  Download,
  Info,
  LucideIcon,
} from 'lucide-react'

/** 설정 페이지 메뉴 항목 */
export interface SettingsMenuItem {
  id: string
  label: string
  icon: LucideIcon
  description?: string
}

/** 설정 메뉴 항목 목록 */
export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  {
    id: 'you-and-google',
    label: 'You and Google',
    icon: User,
    description: 'Account settings',
  },
  {
    id: 'autofill',
    label: 'Autofill',
    icon: Key,
    description: 'Passwords and payment methods',
  },
  {
    id: 'privacy',
    label: 'Privacy and security',
    icon: Shield,
    description: 'Browsing data and cookies',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    description: 'Theme and display settings',
  },
  {
    id: 'search-engine',
    label: 'Search engine',
    icon: Search,
    description: 'Default search provider',
  },
  {
    id: 'languages',
    label: 'Languages',
    icon: Globe,
    description: 'Language and translation',
  },
  {
    id: 'downloads',
    label: 'Downloads',
    icon: Download,
    description: 'Download location',
  },
  {
    id: 'about',
    label: 'About',
    icon: Info,
    description: 'App information and updates',
  },
]

/** 테마 옵션 */
export const THEME_OPTIONS = ['light', 'dark', 'system'] as const
export type Theme = typeof THEME_OPTIONS[number]

/** 검색 엔진 옵션 */
export const SEARCH_ENGINE_OPTIONS = ['Google', 'Bing', 'DuckDuckGo', 'Naver'] as const
export type SearchEngine = typeof SEARCH_ENGINE_OPTIONS[number]

/** 폰트 크기 옵션 */
export const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium (Recommended)' },
  { value: 'large', label: 'Large' },
] as const

/** 줌 레벨 옵션 */
export const ZOOM_LEVEL_OPTIONS = [
  { value: 75, label: '75%' },
  { value: 90, label: '90%' },
  { value: 100, label: '100%' },
  { value: 125, label: '125%' },
  { value: 150, label: '150%' },
] as const
