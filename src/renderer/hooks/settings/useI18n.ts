import { useMemo } from 'react'

import type { Language } from '@shared/types'
import { createTranslator, type Translator } from '@renderer/lib/i18n'
import { useAppSettings } from './useAppSettings'

export function useI18n(): { language: Language; t: Translator } {
  const { settings } = useAppSettings()

  const language = (settings?.language ?? 'ko') as Language

  const t = useMemo(() => createTranslator(language), [language])

  return { language, t }
}
