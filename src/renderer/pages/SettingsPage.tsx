import React, { useState, useEffect } from 'react';
import { SettingsLayout } from '../layouts/SettingsLayout';
import { SettingRow } from '../components/settings/SettingRow';
import { useSetting } from '../hooks/useSetting';
import { logger } from '../lib/logger';

interface SettingsCategory {
  id: string;
  label: string;
  icon: string;
}

const SETTINGS_CATEGORIES: SettingsCategory[] = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'appearance', label: 'Appearance', icon: '🎨' },
  { id: 'privacy', label: 'Privacy & Security', icon: '🔒' },
  { id: 'advanced', label: 'Advanced', icon: '⚡' },
];

export const SettingsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const { settings, updateSetting } = useSetting({
    homepage: 'https://www.google.com',
    theme: 'light',
    searchEngine: 'google',
    blockAds: true,
    blockTrackers: true,
  });

  useEffect(() => {
    logger.info('SettingsPage - category changed', { activeCategory, settings });
  }, [activeCategory, settings]);

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'general':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">General Settings</h2>
            <SettingRow
              label="Homepage"
              description="Set your browser's homepage"
            >
              <input
                type="text"
                value={typeof settings.homepage === 'string' ? settings.homepage : ''}
                onChange={(e) => updateSetting('homepage', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </SettingRow>
            <SettingRow
              label="Search Engine"
              description="Choose your default search engine"
            >
              <select
                value={typeof settings.searchEngine === 'string' ? settings.searchEngine : 'google'}
                onChange={(e) => updateSetting('searchEngine', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="google">Google</option>
                <option value="bing">Bing</option>
                <option value="duckduckgo">DuckDuckGo</option>
              </select>
            </SettingRow>
          </div>
        );

      case 'appearance':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Appearance Settings</h2>
            <SettingRow
              label="Theme"
              description="Choose your preferred theme"
            >
              <select
                value={typeof settings.theme === 'string' ? settings.theme : 'light'}
                onChange={(e) => updateSetting('theme', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </SettingRow>
          </div>
        );

      case 'privacy':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy & Security</h2>
            <SettingRow
              label="Block Ads"
              description="Enable ad blocking"
            >
              <input
                type="checkbox"
                checked={typeof settings.blockAds === 'boolean' ? settings.blockAds : false}
                onChange={(e) => updateSetting('blockAds', e.target.checked)}
                className="w-5 h-5 rounded"
              />
            </SettingRow>
            <SettingRow
              label="Block Trackers"
              description="Prevent tracking scripts"
            >
              <input
                type="checkbox"
                checked={typeof settings.blockTrackers === 'boolean' ? settings.blockTrackers : false}
                onChange={(e) => updateSetting('blockTrackers', e.target.checked)}
                className="w-5 h-5 rounded"
              />
            </SettingRow>
          </div>
        );

      case 'advanced':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Advanced Settings</h2>
            <p className="text-gray-600">No advanced settings available yet.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SettingsLayout
      categories={SETTINGS_CATEGORIES}
      activeCategory={activeCategory}
      onSelectCategory={setActiveCategory}
    >
      {renderCategoryContent()}
    </SettingsLayout>
  );
};
