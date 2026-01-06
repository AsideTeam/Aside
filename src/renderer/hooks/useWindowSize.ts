/**
 * useWindowSize Hook
 *
 * 윈도우 창의 크기 변화를 감지하고,
 * 컴포넌트가 동적으로 크기에 반응하도록 함
 */

import { useState, useEffect } from 'react'

export interface WindowSize {
  width: number
  height: number
}

/**
 * 윈도우 크기를 감지하는 hook
 *
 * @returns {WindowSize} 현재 윈도우 크기 {width, height}
 *
 * 사용 예:
 *   const { width, height } = useWindowSize()
 *   console.log(`Window: ${width}x${height}`)
 */
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    // 초기값 설정
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // 초기 크기 설정
    handleResize()

    // resize 이벤트 리스너 추가
    window.addEventListener('resize', handleResize)

    // 정리
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return windowSize
}

/**
 * 반응형 breakpoint 검사 hook
 *
 * @returns {Object} 각 breakpoint 상태
 *
 * 사용 예:
 *   const { isSmall, isMedium, isLarge } = useResponsive()
 *   if (isSmall) { // 800px 이하 }
 */
export function useResponsive() {
  const { width } = useWindowSize()

  return {
    isSmall: width < 800,
    isMedium: width >= 800 && width < 1200,
    isLarge: width >= 1200,
    width,
  }
}
