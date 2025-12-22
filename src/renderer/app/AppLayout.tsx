import React from 'react'
import { TitleBar } from '../components/TitleBar'
import { TabBar } from '../components/TabBar'
import { AddressBar } from '../components/AddressBar'
import { ContentArea } from '../components/ContentArea'

/**
 * 메인 레이아웃: 타이틀바 + 탭 + 주소창 + 콘텐츠
 * 
 * 레이아웃 구조:
 * +------------------------+
 * | TitleBar (고정높이)     |
 * +------------------------+
 * | TabBar (고정높이)       |
 * +------------------------+
 * | AddressBar (고정높이)   |
 * +------------------------+
 * |                        |
 * | ContentArea (유연높이) |
 * |  (WebContentsView)     |
 * |                        |
 * +------------------------+
 */
export function AppLayout() {
  return (
    <div className="app-layout grid grid-rows-[60px_40px_48px_1fr] h-screen w-screen bg-gray-900">
      {/* 커스텀 OS 타이틀바 */}
      <TitleBar />

      {/* 탭 표시 */}
      <TabBar />

      {/* 주소창 + 네비게이션 버튼 */}
      <AddressBar />

      {/* 메인 콘텐츠 (WebContentsView 플레이스홀더) */}
      <ContentArea />
    </div>
  )
}
