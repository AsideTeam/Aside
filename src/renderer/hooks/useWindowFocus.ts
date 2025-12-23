import { useEffect, useState } from 'react'

type WindowFocusChangedPayload = {
  focused?: boolean
}

const getFocused = (payload: unknown): boolean => {
  if (typeof payload === 'boolean') return payload
  if (!payload || typeof payload !== 'object') return true
  const maybe = payload as WindowFocusChangedPayload
  return Boolean(maybe.focused)
}

/**
 * Main -> Renderer로 전달되는 "창 포커스" 상태.
 * Electron은 blur 상태에서도 :hover가 동작할 수 있어서,
 * 렌더러에서 UI hover/인터랙션을 조건부로 차단하는 데 사용한다.
 */
export function useWindowFocus(): boolean {
  const [mainFocused, setMainFocused] = useState(true)
  const [localFocused, setLocalFocused] = useState(() => {
    try {
      return typeof document !== 'undefined' ? document.hasFocus() : true
    } catch {
      return true
    }
  })

  useEffect(() => {
    const onFocusChanged = (data: unknown) => {
      setMainFocused(getFocused(data))
    }

    const updateLocalFocus = () => {
      try {
        const visible = typeof document !== 'undefined' ? document.visibilityState !== 'hidden' : true
        const focused = typeof document !== 'undefined' ? document.hasFocus() : true
        setLocalFocused(Boolean(visible && focused))
      } catch {
        // ignore
      }
    }

    const onWindowFocus = () => setLocalFocused(true)
    const onWindowBlur = () => setLocalFocused(false)

    try {
      window.electronAPI?.on('window:focus-changed', onFocusChanged)
    } catch {
      // ignore
    }

    try {
      window.addEventListener('focus', onWindowFocus)
      window.addEventListener('blur', onWindowBlur)
      document.addEventListener('visibilitychange', updateLocalFocus)
    } catch {
      // ignore
    }

    // Fallback: some platform/window-manager combos miss blur events.
    // Polling `document.hasFocus()` is cheap and keeps state correct.
    const poll = setInterval(updateLocalFocus, 250)

    return () => {
      try {
        window.electronAPI?.off('window:focus-changed', onFocusChanged)
      } catch {
        // ignore
      }

      try {
        window.removeEventListener('focus', onWindowFocus)
        window.removeEventListener('blur', onWindowBlur)
        document.removeEventListener('visibilitychange', updateLocalFocus)
      } catch {
        // ignore
      }

      clearInterval(poll)
    }
  }, [])

  return mainFocused && localFocused
}
