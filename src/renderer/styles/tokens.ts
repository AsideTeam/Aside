/**
 * Tailwind CSS Tokens
 * 
 * 목표: 하드코딩 제거 + 테마 시스템 구축
 * 사용: className={cn(tokens.layout.sidebar.wrapper)}
 */

// ===== 색상 토큰 =====
export const colorTokens = {
  // 백그라운드
  bg: {
    primary: 'bg-gray-950',
    secondary: 'bg-gray-900',
    tertiary: 'bg-gray-800',
    hover: 'hover:bg-gray-800',
  },
  
  // 텍스트
  text: {
    primary: 'text-white',
    secondary: 'text-gray-400',
    tertiary: 'text-gray-600',
  },

  // 보더
  border: {
    primary: 'border-gray-800',
    light: 'border-gray-700',
  },

  // 액션
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-200',
    ghost: 'hover:bg-gray-800 text-gray-400 hover:text-gray-200',
  },
};

// ===== 스페이싱 토큰 =====
export const spacingTokens = {
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

// ===== 레이아웃 토큰 =====
export const layoutTokens = {
  sidebar: {
    wrapper: 'w-64 flex-none flex flex-col bg-gradient-to-b from-gray-900/80 to-gray-950/80 backdrop-blur-md border-r border-gray-800 flex flex-col z-50',
    header: 'flex items-center justify-between p-4 border-b border-gray-800 drag-region',
    title: 'text-lg font-bold text-white',
    content: 'flex-1 overflow-y-auto scroll-smooth',
    actions: 'border-t border-gray-800 p-3 space-y-2',
  },

  contentArea: {
    wrapper: 'flex-1 relative bg-black overflow-hidden',
    placeholder: 'w-full h-full bg-transparent',
  },

  tab: {
    active: 'bg-blue-600 text-white',
    inactive: 'text-gray-400 hover:bg-gray-800 hover:text-gray-200',
    wrapper: 'group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors',
  },
};

// ===== 통합: Tokens 객체 =====
export const tokens = {
  colors: colorTokens,
  spacing: spacingTokens,
  layout: layoutTokens,
};

// ===== 편의 함수: 클래스 병합 =====
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// ===== 사용 예 =====
/*
import { tokens, cn } from '@renderer/styles/tokens'

// 1. 직접 사용
<div className={tokens.layout.sidebar.wrapper}>...</div>

// 2. 조건부 병합
<button className={cn(
  tokens.layout.tab.wrapper,
  isActive ? tokens.layout.tab.active : tokens.layout.tab.inactive
)}>
  Tab
</button>

// 3. 커스텀 클래스 추가
<div className={cn(tokens.layout.sidebar.wrapper, 'custom-shadow')}>
  ...
</div>
*/
