/**
 * Global App State Management (Zustand + Zod)
 *
 * 책임: 전체 앱 상태 중앙 관리
 * - 타브 상태, 활성 탭, 앱 상태
 * - Zod로 타입 안전성 보장
 * - Zustand로 구독 기반 업데이트
 *
 * 사용 예:
 *   const activeTab = useAppStore((state) => state.activeTabId)
 *   useAppStore.setState({ activeTabId: 'tab-2' })
 *
 * 아키텍처:
 * - Main 프로세스: AppState (인메모리)
 * - Renderer 프로세스: Zustand 스토어 (IPC 동기화)
 */

import { create } from 'zustand'
import { z } from 'zod'

/**
 * 탭 정보 스키마
 */
export const TabSchema = z.object({
  id: z.string().regex(/^tab-[a-zA-Z0-9]+$/),
  url: z.string().url(),
  title: z.string(),
  isActive: z.boolean(),
})

export type Tab = z.infer<typeof TabSchema>

/**
 * 앱 상태 스키마
 */
export const AppStateSchema = z.object({
  tabs: z.array(TabSchema),
  activeTabId: z.string().nullable(),
  isWindowMinimized: z.boolean(),
  isWindowMaximized: z.boolean(),
  isTrayMode: z.boolean(),
})

export type AppStateType = z.infer<typeof AppStateSchema>

/**
 * Zustand 스토어 (Renderer 프로세스용)
 *
 * 구독 기반 업데이트:
 * 1. Renderer에서 상태 변경 요청 (IPC)
 * 2. Main에서 처리 후 응답
 * 3. Renderer 스토어 자동 동기화
 */
interface AppStore extends AppStateType {
  // Actions
  setTabs: (tabs: Tab[]) => void
  setActiveTabId: (tabId: string | null) => void
  setWindowMinimized: (value: boolean) => void
  setWindowMaximized: (value: boolean) => void
  setTrayMode: (value: boolean) => void

  // Utility
  getTabById: (id: string) => Tab | undefined
  addTab: (tab: Tab) => void
  removeTab: (tabId: string) => void
  updateTab: (tabId: string, partial: Partial<Tab>) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  tabs: [],
  activeTabId: null,
  isWindowMinimized: false,
  isWindowMaximized: false,
  isTrayMode: false,

  // State setters
  setTabs: (tabs) => {
    // ✅ Zod 검증
    const validated = z.array(TabSchema).parse(tabs)
    set({ tabs: validated })
  },

  setActiveTabId: (tabId) => {
    set({ activeTabId: tabId })
  },

  setWindowMinimized: (value) => {
    set({ isWindowMinimized: value })
  },

  setWindowMaximized: (value) => {
    set({ isWindowMaximized: value })
  },

  setTrayMode: (value) => {
    set({ isTrayMode: value })
  },

  // Utility methods
  getTabById: (id) => {
    return get().tabs.find((tab) => tab.id === id)
  },

  addTab: (tab) => {
    // ✅ Zod 검증
    const validated = TabSchema.parse(tab)
    set({ tabs: [...get().tabs, validated] })
  },

  removeTab: (tabId) => {
    set({ tabs: get().tabs.filter((tab) => tab.id !== tabId) })
  },

  updateTab: (tabId, partial) => {
    set({
      tabs: get().tabs.map((tab) =>
        tab.id === tabId ? { ...tab, ...partial } : tab
      ),
    })
  },
}))

/**
 * 상태 업데이트 (Main에서 Renderer로)
 *
 * 사용 예 (Main → Renderer IPC):
 *   webContents.send('store:update', {
 *     tabs: [...],
 *     activeTabId: 'tab-1'
 *   })
 */
export function updateAppStore(partial: Partial<AppStateType>): void {
  // ✅ Partial 검증
  const schema = AppStateSchema.partial()
  const validated = schema.parse(partial)

  useAppStore.setState(validated)
}

/**
 * 상태 일괄 동기화 (Main → Renderer)
 *
 * 사용 예:
 *   syncAppStore(mainAppState)
 */
export function syncAppStore(state: AppStateType): void {
  const validated = AppStateSchema.parse(state)
  useAppStore.setState(validated)
}
