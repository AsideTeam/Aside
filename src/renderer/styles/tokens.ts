/**
 * Tailwind CSS Tokens (v4)
 *
 * 목표: 하드코딩 제거 + 테마 시스템 구축
 * 원칙: CSS 변수 기반 → 테마 변경 용이
 *
 * 사용: className={cn(tokens.layout.sidebar.wrapper)}
 */

// ===== CSS 변수 기반 색상 토큰 =====
// theme.css의 CSS 변수를 활용하여 Tailwind 클래스로 변환
export const colorTokens = {
  // 백그라운드
  bg: {
    primary: 'bg-(--color-bg-primary)',
    secondary: 'bg-(--color-bg-secondary)',
    tertiary: 'bg-(--color-bg-tertiary)',
    hover: 'hover:bg-(--color-bg-hover)',
    input: 'bg-(--color-bg-input)',
  },

  // 텍스트
  text: {
    primary: 'text-(--color-text-primary)',
    secondary: 'text-(--color-text-secondary)',
    tertiary: 'text-(--color-text-tertiary)',
    muted: 'text-(--color-text-muted)',
  },

  // 보더
  border: {
    primary: 'border-(--color-border-primary)',
    light: 'border-(--color-border-light)',
  },

  // 액션
  button: {
    primary: 'bg-(--button-primary-bg) hover:bg-(--button-primary-bg-hover) text-(--button-primary-text)',
    secondary: 'bg-(--button-secondary-bg) hover:bg-(--button-secondary-bg-hover) text-(--button-secondary-text)',
    ghost: 'bg-(--button-ghost-bg) hover:bg-(--button-ghost-bg-hover) text-(--button-ghost-text) hover:text-(--button-ghost-text-hover)',
    danger: 'bg-(--color-danger) hover:bg-(--color-danger-hover) text-white',
  },

  // Accent
  accent: {
    default: 'text-(--color-accent)',
    bg: 'bg-(--color-accent)',
    hover: 'hover:bg-(--color-accent-hover)',
  },
};

// ===== 스페이싱 토큰 =====
export const spacingTokens = {
  xs: 'p-(--size-spacing-xs)',
  sm: 'p-(--size-spacing-sm)',
  md: 'p-(--size-spacing-md)',
  lg: 'p-(--size-spacing-lg)',
  xl: 'p-(--size-spacing-xl)',
};

// ===== 사이징 토큰 =====
export const sizingTokens = {
  sidebar: {
    width: 'w-(--size-sidebar-width)',
    collapsed: 'w-(--size-sidebar-collapsed)',
  },
};

// ===== 레이아웃 토큰 (CSS 클래스 조합) =====
export const layoutTokens = {
  sidebar: {
    wrapper: 'sidebar-wrapper w-[var(--size-sidebar-width)] flex-none flex',
    header: 'sidebar-header drag-region',
    title: 'sidebar-title',
    content: 'sidebar-content',
    actions: 'sidebar-actions',
    collapsed: 'sidebar-collapsed',
  },

  contentArea: {
    wrapper: 'content-area',
    placeholder: 'content-placeholder',
  },

  tab: {
    wrapper: 'tab-wrapper',
    active: 'tab-active',
    inactive: 'tab-inactive',
    closeBtn: 'tab-close-btn',
  },

  addressBar: {
    wrapper: 'address-bar',
    input: 'address-input',
  },

  settings: {
    container: 'settings-container',
    sidebar: 'settings-sidebar',
    content: 'settings-content',
    section: 'settings-section',
    sectionTitle: 'settings-section-title',
    row: 'settings-row',
  },
};

// ===== 통합: Tokens 객체 =====
export const tokens = {
  colors: colorTokens,
  spacing: spacingTokens,
  sizing: sizingTokens,
  layout: layoutTokens,
};

// ===== 편의 함수: 클래스 병합 =====
/**
 * 여러 클래스를 공백으로 구분하여 병합
 * - undefined, null, false 값 제거
 * - 조건부 클래스 적용 간편
 *
 * @example
 * cn('btn', isActive && 'btn-primary', className)
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// ===== 사용 예 =====
/*
import { tokens, cn } from '@renderer/styles/tokens'

// 1. CSS 변수 기반 직접 사용
<div className={tokens.layout.sidebar.wrapper}>...</div>

// 2. 조건부 병합 (테마 변경 시에도 자동 반영)
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

// 4. 동적 스타일링 (CSS 변수)
<div style={{ color: 'var(--color-text-primary)' }}>
  CSS 변수 기반 스타일
</div>
*/
