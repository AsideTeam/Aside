import type { OverlayHoverMetrics, OverlayState } from './types'

const DEFAULT_SIDEBAR_WIDTH = 288
const DEFAULT_HEADER_HEIGHT = 56

export function computeEdgeOverlayState({
  relativeX,
  relativeY,
  currentState,
  headerLatched,
  sidebarLatched,
  metrics,
  edgeThreshold,
}: {
  relativeX: number
  relativeY: number
  currentState: OverlayState
  headerLatched: boolean
  sidebarLatched: boolean
  metrics: OverlayHoverMetrics | null
  edgeThreshold: number
}): {
  nextState: OverlayState
  mouseInSidebar: boolean
  mouseInHeader: boolean
  dimensions: { sidebarWidth: number; headerHeight: number; edgeThreshold: number }
  triggers: {
    shouldOpenSidebar: boolean
    shouldCloseSidebar: boolean
    shouldOpenHeader: boolean
    shouldCloseHeader: boolean
  }
} {
  const sidebarWidth = metrics?.sidebarRightPx ?? DEFAULT_SIDEBAR_WIDTH
  const headerHeight = metrics?.headerBottomPx ?? DEFAULT_HEADER_HEIGHT

  let shouldOpenSidebar = false
  let shouldCloseSidebar = false

  if (!sidebarLatched) {
    if (relativeX <= edgeThreshold) {
      shouldOpenSidebar = true
    }

    if (currentState.sidebarOpen && relativeX > sidebarWidth) {
      shouldCloseSidebar = true
    }
  }

  let shouldOpenHeader = false
  let shouldCloseHeader = false

  if (!headerLatched) {
    if (relativeY <= edgeThreshold) {
      shouldOpenHeader = true
    }

    if (currentState.headerOpen && relativeY > headerHeight) {
      shouldCloseHeader = true
    }
  }

  // If both would open at top-left corner, prioritize header
  if (shouldOpenSidebar && shouldOpenHeader) {
    shouldOpenSidebar = false
  }

  const finalSidebarOpen =
    sidebarLatched || (shouldOpenSidebar || (currentState.sidebarOpen && !shouldCloseSidebar))
  const finalHeaderOpen =
    headerLatched || (shouldOpenHeader || (currentState.headerOpen && !shouldCloseHeader))

  const mouseInSidebar = finalSidebarOpen && relativeX <= sidebarWidth
  const mouseInHeader = finalHeaderOpen && relativeY <= headerHeight

  return {
    nextState: { headerOpen: finalHeaderOpen, sidebarOpen: finalSidebarOpen },
    mouseInSidebar,
    mouseInHeader,
    dimensions: { sidebarWidth, headerHeight, edgeThreshold },
    triggers: {
      shouldOpenSidebar,
      shouldCloseSidebar,
      shouldOpenHeader,
      shouldCloseHeader,
    },
  }
}
