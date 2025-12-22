import React from 'react'
import { AppLayout } from './AppLayout'

/**
 * 최상위 App 컴포넌트
 * - 레이아웃 래핑
 * - 전역 에러 바운더리 (향후)
 */
export function App() {
  return (
    <div className="app">
      <AppLayout />
    </div>
  )
}
