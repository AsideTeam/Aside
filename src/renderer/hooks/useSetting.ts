import { useState, useCallback } from 'react';
import { logger } from '../lib/logger';

interface Settings {
  homepage?: string;
  theme?: string;
  searchEngine?: string;
  blockAds?: boolean;
  blockTrackers?: boolean;
  [key: string]: unknown;
}

export const useSetting = (initialSettings: Settings = {}) => {
  const [settings, setSettings] = useState<Settings>(initialSettings);

  const updateSetting = useCallback((key: string, value: unknown) => {
    logger.info('useSetting - Update setting', { key, value });
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    logger.info('useSetting - Update multiple settings', newSettings);
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  }, []);

  const getSetting = useCallback((key: string, defaultValue?: unknown) => {
    return settings[key] ?? defaultValue;
  }, [settings]);

  const resetSettings = useCallback((defaultSettings: Settings) => {
    logger.info('useSetting - Reset settings', defaultSettings);
    setSettings(defaultSettings);
  }, []);

  return {
    settings,
    updateSetting,
    updateSettings,
    getSetting,
    resetSettings,
  };
};
