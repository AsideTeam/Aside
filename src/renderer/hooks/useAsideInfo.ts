import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'

import { logger } from '@renderer/lib/logger'

type AsideInfo = {
  name: string
  version: string
  userDataDir: string
  settingsPath: string
}

const AppInfoPayloadZ = z.object({
  success: z.boolean(),
  info: z
    .object({
      name: z.string(),
      version: z.string(),
      userDataDir: z.string(),
    })
    .optional(),
  error: z.string().optional(),
})

const SettingsPathPayloadZ = z.object({
  success: z.boolean(),
  path: z.string().optional(),
  error: z.string().optional(),
})

type UseAsideInfoResult = {
  info: AsideInfo | null
  isLoading: boolean
  refresh: () => Promise<void>
}

export function useAsideInfo(): UseAsideInfoResult {
  const [info, setInfo] = useState<AsideInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const [appRaw, pathRaw] = await Promise.all([
        window.electronAPI?.invoke('app:get-info'),
        window.electronAPI?.invoke('settings:get-path'),
      ])

      const appParsed = AppInfoPayloadZ.safeParse(appRaw)
      const pathParsed = SettingsPathPayloadZ.safeParse(pathRaw)

      if (!appParsed.success || !appParsed.data.success || !appParsed.data.info) {
        logger.warn('[useAsideInfo] Invalid app info payload')
        setInfo(null)
        return
      }

      if (!pathParsed.success || !pathParsed.data.success || !pathParsed.data.path) {
        logger.warn('[useAsideInfo] Invalid settings path payload')
        setInfo(null)
        return
      }

      setInfo({
        name: appParsed.data.info.name,
        version: appParsed.data.info.version,
        userDataDir: appParsed.data.info.userDataDir,
        settingsPath: pathParsed.data.path,
      })
    } catch (error) {
      logger.error('[useAsideInfo] Failed to load Aside info', error)
      setInfo(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { info, isLoading, refresh }
}
