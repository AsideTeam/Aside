/**
 * Icon Components
 *
 * Lucide React 아이콘 래퍼
 * - 일관된 스타일
 * - 쉬운 관리
 */

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Loader2,
  Menu,
  Plus,
  X,
  Bookmark,
  Settings,
  Home,
  Search,
  History,
  Download,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  FolderClosed,
  Globe,
  type LucideProps,
} from 'lucide-react';

export type IconName =
  | 'arrow-back'
  | 'arrow-forward'
  | 'reload'
  | 'loading'
  | 'menu'
  | 'plus'
  | 'close'
  | 'bookmark'
  | 'settings'
  | 'home'
  | 'search'
  | 'history'
  | 'download'
  | 'check'
  | 'error'
  | 'warning'
  | 'info'
  | 'folder'
  | 'globe';

const iconMap: Record<IconName, React.ComponentType<LucideProps>> = {
  'arrow-back': ChevronLeft,
  'arrow-forward': ChevronRight,
  reload: RotateCw,
  loading: Loader2,
  menu: Menu,
  plus: Plus,
  close: X,
  bookmark: Bookmark,
  settings: Settings,
  home: Home,
  search: Search,
  history: History,
  download: Download,
  check: Check,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  folder: FolderClosed,
  globe: Globe,
};

interface IconProps extends LucideProps {
  name: IconName;
}

export const Icon: React.FC<IconProps> = ({ name, size = 18, ...props }) => {
  const IconComponent = iconMap[name];
  if (!IconComponent) return null;
  return <IconComponent size={size} {...props} />;
};

// 개별 아이콘 export (편의용)
export {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Loader2,
  Menu,
  Plus,
  X,
  Bookmark,
  Settings,
  Home,
  Search,
  History,
  Download,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  FolderClosed,
  Globe,
};
