import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { logger } from '../../lib/logger';

interface AddressBarProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
  onReload: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  isLoading?: boolean;
}

export const AddressBar: React.FC<AddressBarProps> = ({
  currentUrl,
  onNavigate,
  onReload,
  onGoBack,
  onGoForward,
  canGoBack = false,
  canGoForward = false,
  isLoading = false,
}) => {
  const [inputValue, setInputValue] = useState(currentUrl);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      logger.info('AddressBar - Navigate', { url: inputValue });
      onNavigate(inputValue);
    }
  };

  const handleNavigateClick = () => {
    logger.info('AddressBar - Navigate button clicked', { url: inputValue });
    onNavigate(inputValue);
  };

  return (
    <div className="flex items-center gap-2 bg-white border-b border-gray-200 px-4 py-3">
      {/* Navigation Buttons */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onGoBack}
        disabled={!canGoBack}
        className="disabled:opacity-50"
      >
        ←
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onGoForward}
        disabled={!canGoForward}
        className="disabled:opacity-50"
      >
        →
      </Button>

      {/* Reload Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onReload}
        disabled={isLoading}
        className="disabled:opacity-50"
      >
        {isLoading ? '⟳' : '🔄'}
      </Button>

      {/* Address Input */}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder="Enter URL..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
      />

      {/* Navigate Button */}
      <Button variant="primary" size="sm" onClick={handleNavigateClick}>
        Go
      </Button>
    </div>
  );
};
