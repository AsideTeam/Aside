import { useEffect } from 'react'

import { logger } from '@renderer/lib/logger'
import { useAppSettings } from './useAppSettings'
import type { SettingsSchema } from '@shared/types'

function mapFontSize(fontSize: SettingsSchema['fontSize']): number {
  switch (fontSize) {
    case 'small':
      return 13
    case 'medium':
      return 14
    case 'large':
      return 15
    case 'xlarge':
      return 16
    default:
      return 14
  }
}

export function useApplyAppSettingsEffects(): void {
  const { settings } = useAppSettings()

  useEffect(() => {
    if (!settings) {
      logger.debug('[useApplyAppSettingsEffects] Settings not yet loaded')
      return
    }

    logger.info('[useApplyAppSettingsEffects] Applying settings', {
      language: settings.language,
      theme: settings.theme,
      fontSize: settings.fontSize,
    })

    try {
      // Language
      document.documentElement.lang = settings.language

      // Theme
      if (settings.theme === 'system') {
        document.documentElement.removeAttribute('data-theme')
        logger.debug('[useApplyAppSettingsEffects] Theme set to system')
      } else {
        document.documentElement.setAttribute('data-theme', settings.theme)
        logger.debug('[useApplyAppSettingsEffects] Theme set to', { theme: settings.theme })
      }

      // UI font size (renderer UI only)
      const uiFontPx = mapFontSize(settings.fontSize)
      document.documentElement.style.setProperty('--aside-ui-font-size', `${uiFontPx}px`)
      logger.debug('[useApplyAppSettingsEffects] Font size set', { uiFontPx })
    } catch (error) {
      logger.error('[useApplyAppSettingsEffects] Failed to apply settings effects', error)
    }
  }, [settings])
}
