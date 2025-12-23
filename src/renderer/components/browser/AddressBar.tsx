import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { logger } from '../../lib/logger';
import { tokens } from '@renderer/styles';

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
    <div className={tokens.layout.addressBar.wrapper}>
      {/* Navigation Buttons */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onGoBack}
        disabled={!canGoBack}
        className="disabled:opacity-50"
        title="Go back"
      >
        ←
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onGoForward}
        disabled={!canGoForward}
        className="disabled:opacity-50"
        title="Go forward"
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
        title="Reload page"
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
        className={tokens.layout.addressBar.input}
      />

      {/* Navigate Button */}
      <Button variant="primary" size="sm" onClick={handleNavigateClick}>
        Go
      </Button>
    </div>
  );
};
