import { useState, useEffect, useRef } from 'react'

export interface WindowSize {
  width: number
  height: number
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<WindowSize>(windowSize)

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return
      if (rafRef.current != null) return

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null

        const next: WindowSize = {
          width: window.innerWidth,
          height: window.innerHeight,
        }

        const last = lastRef.current
        if (last.width === next.width && last.height === next.height) return

        lastRef.current = next
        setWindowSize(next)
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    lastRef.current = windowSize
  }, [windowSize])

  return windowSize
}

export function useResponsive() {
  const { width } = useWindowSize()

  return {
    isSmall: width < 800,
    isMedium: width >= 800 && width < 1200,
    isLarge: width >= 1200,
    width,
  }
}
