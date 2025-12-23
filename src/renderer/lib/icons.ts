/**
 * Icon Constants
 *
 * 이모지 대신 아이콘 상수 사용
 * - 추후 Lucide React나 다른 아이콘 라이브러리로 교체 가능
 * - 한 곳에서 관리
 */

export const Icons = {
  // Navigation
  ArrowBack: 'chevron-left',
  ArrowForward: 'chevron-right',
  Reload: 'rotate-cw',
  Loading: 'loader',

  // Tab & Sidebar
  Menu: 'menu',
  Plus: 'plus',
  Close: 'x',
  Bookmark: 'bookmark',
  Settings: 'settings',

  // Browser
  Home: 'home',
  Search: 'search',
  History: 'history',
  Download: 'download',

  // Common
  Check: 'check',
  Error: 'alert-circle',
  Warning: 'alert-triangle',
  Info: 'info',
};

/**
 * 아이콘 렌더링 헬퍼
 *
 * 추후 Lucide React로 교체할 때:
 * import { ChevronLeft, ChevronRight, ... } from 'lucide-react'
 * 
 * export const renderIcon = (name: string, size = 24) => {
 *   const icons = {
 *     'chevron-left': <ChevronLeft size={size} />,
 *     'chevron-right': <ChevronRight size={size} />,
 *     ...
 *   }
 *   return icons[name as keyof typeof icons] || null
 * }
 */
