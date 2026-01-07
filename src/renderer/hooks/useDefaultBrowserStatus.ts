import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'

import { logger } from '@renderer/lib/logger'

type DefaultBrowserStatus = {
  isDefaultHttp: boolean
  isDefaultHttps: boolean
}

const StatusPayloadZ = z.object({
  success: z.boolean(),
  status: z
    .object({
      isDefaultHttp: z.boolean(),
      isDefaultHttps: z.boolean(),
    })
    .optional(),
  error: z.string().optional(),
})

type UseDefaultBrowserStatusResult = {
  status: DefaultBrowserStatus | null
  isLoading: boolean
  refresh: () => Promise<void>
  setDefault: () => Promise<boolean>
  openSystemSettings: () => Promise<boolean>
}

export function useDefaultBrowserStatus(): UseDefaultBrowserStatusResult {
  const [status, setStatus] = useState<DefaultBrowserStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const raw: unknown = await window.electronAPI?.invoke('default-browser:get-status')
      const parsed = StatusPayloadZ.safeParse(raw)
      if (!parsed.success || !parsed.data.success || !parsed.data.status) {
        logger.warn('[useDefaultBrowserStatus] Invalid payload')
        setStatus(null)
        return
      }
      setStatus(parsed.data.status)
    } catch (error) {
      logger.error('[useDefaultBrowserStatus] Failed to load status', error)
      setStatus(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setDefault = useCallback(async () => {
    try {
      const raw: unknown = await window.electronAPI?.invoke('default-browser:set-default')
      const ok = z.object({ success: z.boolean() }).safeParse(raw)
      await refresh()
      return ok.success ? ok.data.success : false
    } catch (error) {
      logger.error('[useDefaultBrowserStatus] Failed to set default', error)
      await refresh()
      return false
    }
  }, [refresh])

  const openSystemSettings = useCallback(async () => {
    try {
      const raw: unknown = await window.electronAPI?.invoke('default-browser:open-system-settings')
      const ok = z.object({ success: z.boolean() }).safeParse(raw)
      return ok.success ? ok.data.success : false
    } catch (error) {
      logger.error('[useDefaultBrowserStatus] Failed to open system settings', error)
      return false
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { status, isLoading, refresh, setDefault, openSystemSettings }
}
