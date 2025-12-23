import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { logger } from '../../lib/logger';
import { tokens } from '@renderer/styles';
import { ArrowLeft, ArrowRight, RotateCw, ArrowRightCircle } from 'lucide-react';

interface AddressBarProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
  onReload: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  isLoading?: boolean;
  wrapperClassName?: string;
  inputClassName?: string;
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
  wrapperClassName,
  inputClassName,
}) => {
  const [inputValue, setInputValue] = useState(currentUrl);

  useEffect(() => {
    setInputValue(currentUrl);
  }, [currentUrl]);

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
    <div className={wrapperClassName ?? tokens.layout.addressBar.wrapper}>
      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onGoBack}
        disabled={!canGoBack}
        className="disabled:opacity-50"
        title="Go back"
      >
        <ArrowLeft size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onGoForward}
        disabled={!canGoForward}
        className="disabled:opacity-50"
        title="Go forward"
      >
        <ArrowRight size={16} />
      </Button>

      {/* Reload Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onReload}
        disabled={isLoading}
        className="disabled:opacity-50"
        title="Reload page"
      >
        <RotateCw size={16} />
      </Button>

      {/* Address Input */}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder="Enter URL..."
        className={inputClassName ?? tokens.layout.addressBar.input}
      />

      {/* Navigate Button */}
      <Button variant="primary" size="sm" onClick={handleNavigateClick}>
        <ArrowRightCircle size={16} />
      </Button>
    </div>
  );
};
