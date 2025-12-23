import React from 'react';
import { tokens, cn } from '@renderer/styles';

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

export const SettingRow: React.FC<SettingRowProps> = ({ label, description, children }) => {
  return (
    <div className={cn('flex items-center justify-between py-4 last:border-b-0', tokens.layout.settings.row)}>
      <div className="flex-1">
        <h3 className={cn('font-medium', tokens.colors.text.primary)}>{label}</h3>
        {description && <p className={cn('text-sm mt-1', tokens.colors.text.secondary)}>{description}</p>}
      </div>
      <div className="ml-4">{children}</div>
    </div>
  );
};
