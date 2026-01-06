/**
 * IPC Validation Schemas (Runtime)
 *
 * 책임: Main Process가 받는 모든 데이터를 런타임에 검증
 * - 타입 안전성 (TypeScript는 컴파일하면 사라짐)
 * - 보안 (XSS, 악성 데이터 차단)
 * - 데이터 무결성
 *
 * 사용 예:
 *   const url = TabCreateSchema.parse(input.url)  // 자동 검증
 *   const url = TabCreateSchema.safeParse(input.url)  // 에러 전달
 */

import { z } from 'zod'

/**
 * App IPC 검증
 */

export const AppQuitSchema = z.object({})

export const AppRestartSchema = z.object({})

export const AppStateSchema = z.object({})

/**
 * Window IPC 검증
 */

export const WindowMinimizeSchema = z.object({})

export const WindowMaximizeSchema = z.object({})

export const WindowCloseSchema = z.object({})

/**
 * Overlay Events (Main  Renderer)
 *
 * Note: these are outbound payload shapes too (for contract stability).
 */

export const OverlayFocusChangedEventSchema = z.boolean()

export const OverlayOpenCloseEventSchema = z.object({
  timestamp: z.number(),
})

export const OverlayLatchChangedEventSchema = z.object({
  latched: z.boolean(),
  timestamp: z.number(),
})

export const OverlayEdgeHoverEventSchema = z.object({
  zone: z.enum(['header', 'sidebar']),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  timestamp: z.number(),
})

export const OverlayContentPointerEventSchema = z.object({
  kind: z.enum(['mouseDown', 'mouseUp']),
  timestamp: z.number(),
})

/**
 * Overlay hover metrics (Renderer → Main)
 * - DOM 실측 기반으로 hit-test를 안정화하기 위한 값들
 * - 좌표계: Renderer viewport 기준(px/CSSpx). Main에서는 window bounds 기준 relativeX/Y와 직접 비교.
 */
export const OverlayHoverMetricsSchema = z.object({
  sidebarRightPx: z.number().finite().optional(),
  headerBottomPx: z.number().finite().optional(),
  titlebarHeightPx: z.number().finite().optional(),
  dpr: z.number().positive().finite(),
  timestamp: z.number(),
})

/**
 * View Events (Main → Renderer)
 */

export const ViewLoadedEventSchema = z.object({
  url: z.string().min(1),
  timestamp: z.number(),
})

export const ViewNavigatedEventSchema = z.object({
  url: z.string().min(1),
  canGoBack: z.boolean(),
  canGoForward: z.boolean(),
  timestamp: z.number(),
})

/**
 * View IPC (Renderer → Main)
 */

export const ViewResizeSchema = z.object({
  left: z.number().int().nonnegative(),
  top: z.number().int().nonnegative(),
})

export const ViewNavigateSchema = z.object({
  url: z
    .string()
    .min(1, 'URL cannot be empty')
    .max(2048, 'URL exceeds maximum length')
    .refine(
      (url) => {
        try {
          const parsed = new URL(url)
          const allowedProtocols = ['http:', 'https:', 'about:']
          return allowedProtocols.includes(parsed.protocol)
        } catch {
          return false
        }
      },
      {
        message: 'Invalid URL format or unsupported protocol',
      }
    ),
})

/**
 * Tab IPC 검증 (가장 중요 - 외부 입력)
 */

// ✅ URL 검증: 프로토콜 체크, 길이 제한
export const TabCreateSchema = z.object({
  url: z
    .string()
    .min(1, 'URL cannot be empty')
    .max(2048, 'URL exceeds maximum length')
    .refine(
      (url) => {
        try {
          const parsed = new URL(url)
          // ✅ 허용된 프로토콜만
          const allowedProtocols = ['http:', 'https:', 'about:']
          return allowedProtocols.includes(parsed.protocol)
        } catch {
          // URL 파싱 실패 = 유효하지 않은 URL
          return false
        }
      },
      {
        message: 'Invalid URL format or unsupported protocol',
      }
    ),
})

export type TabCreateInput = z.infer<typeof TabCreateSchema>

export const TabCloseSchema = z.object({
  tabId: z
    .string()
    .min(1, 'Tab ID cannot be empty')
    .max(64, 'Tab ID too long')
    .regex(/^tab-[a-zA-Z0-9-]+$/, 'Invalid Tab ID format'),
})

export type TabCloseInput = z.infer<typeof TabCloseSchema>

export const TabSwitchSchema = z.object({
  tabId: z
    .string()
    .min(1, 'Tab ID cannot be empty')
    .max(64, 'Tab ID too long')
    .regex(/^tab-[a-zA-Z0-9-]+$/, 'Invalid Tab ID format'),
})

export type TabSwitchInput = z.infer<typeof TabSwitchSchema>

export const TabListSchema = z.object({})

export const TabActiveSchema = z.object({})

// New tab operations
export const TabDuplicateSchema = z.object({
  tabId: z
    .string()
    .min(1, 'Tab ID cannot be empty')
    .max(64, 'Tab ID too long')
    .regex(/^tab-[a-zA-Z0-9-]+$/, 'Invalid Tab ID format'),
})

export type TabDuplicateInput = z.infer<typeof TabDuplicateSchema>

export const TabPinSchema = z.object({
  tabId: z
    .string()
    .min(1, 'Tab ID cannot be empty')
    .max(64, 'Tab ID too long')
    .regex(/^tab-[a-zA-Z0-9-]+$/, 'Invalid Tab ID format'),
  pinned: z.boolean(),
})

export type TabPinInput = z.infer<typeof TabPinSchema>

export const TabReorderSchema = z.object({
  tabId: z
    .string()
    .min(1, 'Tab ID cannot be empty')
    .max(64, 'Tab ID too long')
    .regex(/^tab-[a-zA-Z0-9-]+$/, 'Invalid Tab ID format'),
  newIndex: z.number().int().nonnegative(),
})

export type TabReorderInput = z.infer<typeof TabReorderSchema>

export const TabCloseOthersSchema = z.object({
  tabId: z
    .string()
    .min(1, 'Tab ID cannot be empty')
    .max(64, 'Tab ID too long')
    .regex(/^tab-[a-zA-Z0-9-]+$/, 'Invalid Tab ID format'),
})

export type TabCloseOthersInput = z.infer<typeof TabCloseOthersSchema>

export const TabCloseAllSchema = z.object({})

export const TabRestoreSchema = z.object({})


/**
 * 검증 오류 처리 헬퍼
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`)
  }

  return result.data
}

export function validateOrNull<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data)
  return result.success ? result.data : null
}
