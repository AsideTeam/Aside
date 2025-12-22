import { TabBar } from '../components/TabBar'
import { AddressBar } from '../components/AddressBar'

/**
 * 메인 레이아웃: 탭바 + 주소창 (크롬 스타일)
 * 
 * 레이아웃 구조:
 * +------------------------+
 * | TabBar (40px)          |
 * +------------------------+
 * | AddressBar (48px)      |
 * +------------------------+
 * |                        |
 * | WebContentsView        |
 * | (Main Process에서 관리) |
 * |                        |
 * +------------------------+
 * 
 * 참고: ContentArea는 제거됨 - WebContentsView가 Main Process에서 직접 렌더링
 */
export function AppLayout() {
  return (
    <div className="app-layout flex flex-col h-[88px] w-screen bg-[#202124]">
      {/* 탭바 - macOS 신호등 버튼 영역 확보 */}
      <TabBar />

      {/* 주소창 + 네비게이션 버튼 */}
      <AddressBar />
    </div>
  )
}
