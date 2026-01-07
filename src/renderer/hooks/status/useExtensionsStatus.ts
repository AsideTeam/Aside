import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'

import { logger } from '@renderer/lib/logger'

type ExtensionInfo = {
  id: string
  name: string
  version: string
}

type ExtensionsStatus = {
  enabled: boolean
  directory: string
  loaded: ExtensionInfo[]
}

const PayloadZ = z.object({
  success: z.boolean(),
  status: z
    .object({
      enabled: z.boolean(),
      directory: z.string(),
      loaded: z.array(z.object({ id: z.string(), name: z.string(), version: z.string() })),
    })
    .optional(),
  error: z.string().optional(),
})

type UseExtensionsStatusResult = {
  status: ExtensionsStatus | null
  isLoading: boolean
  refresh: () => Promise<void>
  reload: () => Promise<boolean>
}

export function useExtensionsStatus(): UseExtensionsStatusResult {
  const [status, setStatus] = useState<ExtensionsStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const raw: unknown = await window.electronAPI?.invoke('extensions:get-status')
      const parsed = PayloadZ.safeParse(raw)
      if (!parsed.success || !parsed.data.success || !parsed.data.status) {
        logger.warn('[useExtensionsStatus] Invalid payload')
        setStatus(null)
        return
      }
      setStatus(parsed.data.status)
    } catch (error) {
      logger.error('[useExtensionsStatus] Failed to load status', error)
      setStatus(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reload = useCallback(
    async () => {
      try {
        const raw: unknown = await window.electronAPI?.invoke('extensions:reload')
        const ok = z.object({ success: z.boolean() }).safeParse(raw)
        await refresh()
        return ok.success ? ok.data.success : false
      } catch (error) {
        logger.error('[useExtensionsStatus] Failed to reload', error)
        await refresh()
        return false
      }
    },
    [refresh]
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { status, isLoading, refresh, reload }
}
