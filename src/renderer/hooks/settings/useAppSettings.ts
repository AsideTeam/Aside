import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

import type { SettingsSchema } from '@shared/types'
import { SettingsSchemaZ } from '@shared/validation/settings'
import { logger } from '@renderer/lib/logger'

type UpdateResult = { success?: boolean; error?: string }

type UseAppSettingsResult = {
  settings: SettingsSchema | null
  isLoading: boolean
  refresh: () => Promise<void>
  updateSetting: <K extends keyof SettingsSchema>(key: K, value: SettingsSchema[K]) => Promise<void>
  resetAll: () => Promise<void>
}

const AppSettingsContext = React.createContext<UseAppSettingsResult | null>(null)

type AppSettingsProviderProps = {
  children: React.ReactNode
}

export function AppSettingsProvider({ children }: AppSettingsProviderProps) {
  const [settings, setSettings] = useState<SettingsSchema | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const raw: unknown = await window.electronAPI?.invoke('settings:get-all')
      const parsed = SettingsSchemaZ.safeParse(raw)
      if (!parsed.success) {
        logger.warn('[AppSettingsProvider] Invalid settings payload from main')
        return
      }
      setSettings(parsed.data)
    } catch (error) {
      logger.error('[AppSettingsProvider] Failed to load settings', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const updateSetting = useCallback(
    async <K extends keyof SettingsSchema>(key: K, value: SettingsSchema[K]) => {
      try {
        const result: unknown = await window.electronAPI?.invoke('settings:update', { key, value })
        const parsed = z.object({ success: z.boolean().optional(), error: z.string().optional() }).safeParse(result)
        const ok = (parsed.success ? parsed.data.success : (result as UpdateResult | null)?.success) ?? false

        if (!ok) {
          const err = parsed.success ? parsed.data.error : undefined
          logger.warn('[AppSettingsProvider] Update rejected', { key, error: err })
          return
        }

        // Immediately update local state for optimistic UI
        setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
        
        // Refresh from main to ensure consistency
        try {
          const raw: unknown = await window.electronAPI?.invoke('settings:get-all')
          const refreshParsed = SettingsSchemaZ.safeParse(raw)
          if (refreshParsed.success) {
            setSettings(refreshParsed.data)
            logger.debug('[AppSettingsProvider] Settings refreshed after update', { key } as unknown as Record<string, unknown>)
          }
        } catch (refreshError) {
          logger.warn('[AppSettingsProvider] Failed to refresh settings after update', refreshError as unknown as Record<string, unknown>)
        }
      } catch (error) {
        logger.error('[AppSettingsProvider] Failed to update setting', error)
      }
    },
    []
  )

  const resetAll = useCallback(async () => {
    try {
      await window.electronAPI?.invoke('settings:reset')
    } catch (error) {
      logger.error('[AppSettingsProvider] Failed to reset settings', error)
    } finally {
      await refresh()
    }
  }, [refresh])

  const value = useMemo<UseAppSettingsResult>(
    () => ({ settings, isLoading, refresh, updateSetting, resetAll }),
    [settings, isLoading, refresh, updateSetting, resetAll]
  )

  return React.createElement(AppSettingsContext.Provider, { value }, children)
}

export function useAppSettings(): UseAppSettingsResult {
  const ctx = useContext(AppSettingsContext)
  if (ctx) return ctx

  // Fallback: keep working even if provider was not mounted.
  logger.warn('[useAppSettings] AppSettingsProvider is missing; falling back to local state')
  const [settings, setSettings] = useState<SettingsSchema | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const raw: unknown = await window.electronAPI?.invoke('settings:get-all')
      const parsed = SettingsSchemaZ.safeParse(raw)
      if (!parsed.success) {
        logger.warn('[useAppSettings] Invalid settings payload from main')
        return
      }
      setSettings(parsed.data)
    } catch (error) {
      logger.error('[useAppSettings] Failed to load settings', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const updateSetting = useCallback(
    async <K extends keyof SettingsSchema>(key: K, value: SettingsSchema[K]) => {
      try {
        const result: unknown = await window.electronAPI?.invoke('settings:update', { key, value })
        const parsed = z.object({ success: z.boolean().optional(), error: z.string().optional() }).safeParse(result)
        const ok = (parsed.success ? parsed.data.success : (result as UpdateResult | null)?.success) ?? false

        if (!ok) {
          const err = parsed.success ? parsed.data.error : undefined
          logger.warn('[useAppSettings] Update rejected', { key, error: err })
          return
        }

        // Immediately update local state for optimistic UI
        setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
        
        // Refresh from main to ensure consistency
        try {
          const raw: unknown = await window.electronAPI?.invoke('settings:get-all')
          const refreshParsed = SettingsSchemaZ.safeParse(raw)
          if (refreshParsed.success) {
            setSettings(refreshParsed.data)
            logger.debug('[useAppSettings] Settings refreshed after update', { key } as unknown as Record<string, unknown>)
          }
        } catch (refreshError) {
          logger.warn('[useAppSettings] Failed to refresh settings after update', refreshError as unknown as Record<string, unknown>)
        }
      } catch (error) {
        logger.error('[useAppSettings] Failed to update setting', error)
      }
    },
    []
  )

  const resetAll = useCallback(async () => {
    try {
      await window.electronAPI?.invoke('settings:reset')
    } catch (error) {
      logger.error('[useAppSettings] Failed to reset settings', error)
    } finally {
      await refresh()
    }
  }, [refresh])

  return { settings, isLoading, refresh, updateSetting, resetAll }
}
